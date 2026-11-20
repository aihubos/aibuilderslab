import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { DEFAULT_LIMITS } from "../src/limits.js";
import { uploadResponseHeaders, resolveInside } from "../src/upload-headers.js";
import { assertFile, assertImage, imageKind, parseLinks, youtubeIdFromUrl } from "../src/validate.js";
import { officeZip, zipFiles } from "./support/zip-fixture.js";

const limits = DEFAULT_LIMITS;

test("image magic bytes accept jpg, png, webp, and gif only", async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "blue" } }).jpeg().toBuffer();
  const webp = await sharp({ create: { width: 2, height: 2, channels: 3, background: "green" } }).webp().toBuffer();
  const gif = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).gif().toBuffer();
  assert.equal(imageKind(png), "png");
  assert.equal(imageKind(jpeg), "jpeg");
  assert.equal(imageKind(webp), "webp");
  assert.equal(imageKind(gif), "gif");
  assert.equal(assertImage(png, "photo.png", limits).kind, "png");
  assert.equal(assertImage(jpeg, "photo.jpg", limits).kind, "jpeg");
  assert.equal(assertImage(webp, "photo.webp", limits).kind, "webp");
  assert.equal(assertImage(gif, "photo.gif", limits).kind, "gif");
});

test("rejects svg, html, exe, and mismatched image types", () => {
  const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
  const html = Buffer.from("<html><script>alert(1)</script></html>");
  const exe = Buffer.from([0x4d, 0x5a, 0x00, 0x00]);
  assert.throws(() => assertImage(svg, "icon.svg", limits), /jpg, png, webp, gif/);
  assert.throws(() => assertImage(svg, "icon.png", limits), /jpg, png, webp, gif/);
  assert.throws(() => assertFile(html, "page.html", limits), /pdf, zip, pptx/);
  assert.throws(() => assertFile(html, "notes.txt", limits), /html, svg, js/);
  assert.throws(() => assertFile(exe, "run.exe", limits), /pdf, zip, pptx/);
  assert.throws(() => assertFile(exe, "notes.txt", limits), /텍스트 파일/);
  assert.throws(() => assertFile(Buffer.from("%PDF-1.7\n"), "notes.pdf.exe", limits), /pdf, zip, pptx/);
});

test("enforces 5MB image and 20MB file limits", () => {
  const bigImage = Buffer.alloc(limits.maxImageBytes + 1);
  bigImage[0] = 0xff;
  bigImage[1] = 0xd8;
  bigImage[2] = 0xff;
  assert.throws(() => assertImage(bigImage, "big.jpg", limits), /5MB/);
  const bigFile = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(limits.maxFileBytes)]);
  assert.ok(bigFile.length > limits.maxFileBytes);
  assert.throws(() => assertFile(bigFile, "big.pdf", limits), /20MB/);
});

test("accepts pdf, zip, office files, txt, and md when the bytes match", () => {
  assert.equal(assertFile(Buffer.from("%PDF-1.7\n1 0 obj\n"), "deck.pdf", limits).ext, "pdf");
  assert.equal(assertFile(zipFiles([{ name: "readme.txt", data: "hello" }]), "bundle.zip", limits).ext, "zip");
  assert.equal(assertFile(officeZip("pptx"), "slides.pptx", limits).ext, "pptx");
  assert.equal(assertFile(officeZip("docx"), "notes.docx", limits).ext, "docx");
  assert.equal(assertFile(officeZip("xlsx"), "sheet.xlsx", limits).ext, "xlsx");
  assert.equal(assertFile(Buffer.from("회의 메모"), "memo.txt", limits).ext, "txt");
  assert.equal(assertFile(Buffer.from("# 제목\n내용"), "prompt.md", limits).ext, "md");
  assert.throws(() => assertFile(officeZip("docx"), "slides.pptx", limits), /확장자/);
  assert.throws(() => assertFile(Buffer.from("not a pdf"), "notes.pdf", limits), /PDF/);
});

test("links allow http and https, extract YouTube ids, and reject other schemes", () => {
  const links = parseLinks(
    [
      "https://example.com/builder",
      "https://www.youtube.com/watch?v=abcdefghijk",
      "https://youtu.be/ZYXWVUTSRQP",
      "https://www.youtube.com/shorts/aaaabbbbccc",
    ],
    limits,
  );
  assert.equal(links[0].youtubeId, null);
  assert.equal(links[1].youtubeId, "abcdefghijk");
  assert.equal(links[2].youtubeId, "ZYXWVUTSRQP");
  assert.equal(links[3].youtubeId, "aaaabbbbccc");
  assert.equal(youtubeIdFromUrl(new URL("https://www.youtube.com/embed/12345678901")), "12345678901");
  assert.throws(() => parseLinks(["javascript:alert(1)"], limits), /http 또는 https/);
  assert.throws(() => parseLinks(["file:///etc/passwd"], limits), /http 또는 https/);
  assert.throws(() => parseLinks(["notaurl"], limits), /http 또는 https/);
});

test("non-image uploads are marked as attachments", () => {
  assert.equal(uploadResponseHeaders("img.webp")["Content-Disposition"], "inline");
  assert.equal(uploadResponseHeaders("file.pdf")["Content-Disposition"], "attachment");
  assert.equal(uploadResponseHeaders("file.pdf")["Content-Security-Policy"], "default-src 'none'");
  assert.equal(uploadResponseHeaders("file.pdf")["X-Content-Type-Options"], "nosniff");
  assert.equal(resolveInside("/tmp/uploads", "../secrets"), null);
  assert.equal(resolveInside("/tmp/uploads", "entry/file.pdf"), "/tmp/uploads/entry/file.pdf");
});
