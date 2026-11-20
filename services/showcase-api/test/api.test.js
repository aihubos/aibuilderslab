import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { buildApp } from "../src/app.js";
import { officeZip } from "./support/zip-fixture.js";

async function pngBuffer() {
  return sharp({
    create: { width: 12, height: 8, channels: 3, background: { r: 20, g: 80, b: 200 } },
  }).png().toBuffer();
}

function multipart(fields, files = []) {
  const boundary = "----showcase-test";
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${item}\r\n`));
    }
  }
  for (const file of files) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ));
    chunks.push(file.buffer);
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(chunks),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  };
}

async function setup(limits = {}, extra = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "showcase-"));
  const dataDir = path.join(root, "data");
  const uploadDir = path.join(root, "uploads");
  const adminTokenFile = path.join(root, "admin-token");
  await writeFile(adminTokenFile, "test-admin-token\n");
  const app = await buildApp({ dataDir, uploadDir, adminTokenFile, limits, rateSalt: "test-salt", logger: false, ...extra });
  return {
    app,
    root,
    uploadDir,
    adminTokenFile,
    async close() {
      await app.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

async function createEntry(app, fields = {}, files = [], headers = {}) {
  const body = multipart({
    name: "김빌더",
    cohort: "1기",
    title: "첫 결과물",
    summary: "한 줄로 정리한 결과입니다.",
    tools: "ChatGPT",
    prompt: "짧은 프롬프트",
    link: "https://example.com/work",
    ...fields,
  }, files);
  return app.inject({ method: "POST", url: "/entries", payload: body.payload, headers: { ...body.headers, ...headers } });
}

test("creates an entry and keeps the edit secret off later reads", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const image = await pngBuffer();
  const created = await createEntry(ctx.app, {
    link: ["https://www.youtube.com/watch?v=abcdefghijk", "https://example.com/work"],
    prompt: "프롬프트 원문",
  }, [
    { field: "image", filename: "cover.png", buffer: image },
    { field: "file", filename: "notes.md", buffer: Buffer.from("# 메모") },
  ], { "cf-connecting-ip": "203.0.113.10" });
  assert.equal(created.statusCode, 201);
  const body = created.json();
  assert.equal(body.entry.cohortLabel, "1기");
  assert.equal(body.entry.links[0].youtubeId, "abcdefghijk");
  assert.equal(body.entry.images.length, 1);
  assert.equal(body.entry.files[0].name, "notes.md");
  assert.ok(body.editSecret);
  assert.equal(JSON.stringify(body).includes("secret_hash"), false);

  const listed = await ctx.app.inject({ method: "GET", url: "/entries?cohort=1" });
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json().entries.length, 1);
  assert.equal(JSON.stringify(listed.json()).includes(body.editSecret), false);
  const other = await ctx.app.inject({ method: "GET", url: "/entries?cohort=2" });
  assert.equal(other.json().entries.length, 0);

  const stored = await readFile(path.join(ctx.uploadDir, body.entry.id, `img_${body.entry.images[0].id}.webp`));
  assert.equal(stored.includes(Buffer.from("secret-photographer")), false);
  assert.equal(stored.subarray(0, 4).toString("ascii"), "RIFF");
});

test("strips image metadata while keeping a viewable webp", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const jpeg = await sharp({
    create: { width: 16, height: 10, channels: 3, background: "red" },
  }).jpeg().withMetadata({ exif: { IFD0: { ImageDescription: "secret-photographer" } } }).toBuffer();
  assert.equal(jpeg.includes(Buffer.from("secret-photographer")), true);
  const created = await createEntry(ctx.app, {}, [
    { field: "image", filename: "camera.jpg", buffer: jpeg },
  ], { "cf-connecting-ip": "203.0.113.11" });
  assert.equal(created.statusCode, 201, created.body);
  const entry = created.json().entry;
  const stored = await readFile(path.join(ctx.uploadDir, entry.id, `img_${entry.images[0].id}.webp`));
  assert.equal(stored.includes(Buffer.from("secret-photographer")), false);
});

test("rejects bad types, scripts, and oversize uploads", async (t) => {
  const ctx = await setup({ maxImageBytes: 40, maxFileBytes: 400, maxTotalBytes: 800 });
  t.after(() => ctx.close());
  const html = await createEntry(ctx.app, {}, [
    { field: "file", filename: "page.html", buffer: Buffer.from("<html></html>") },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(html.statusCode, 400);
  const svg = await createEntry(ctx.app, {}, [
    { field: "image", filename: "icon.svg", buffer: Buffer.from("<svg></svg>") },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(svg.statusCode, 400);
  const scriptText = await createEntry(ctx.app, {}, [
    { field: "file", filename: "notes.txt", buffer: Buffer.from("<script>alert(1)</script>") },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(scriptText.statusCode, 400);
  const exe = await createEntry(ctx.app, {}, [
    { field: "file", filename: "run.exe", buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]) },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(exe.statusCode, 400);
  const big = await createEntry(ctx.app, {}, [
    { field: "file", filename: "notes.pdf", buffer: Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(500)]) },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(big.statusCode, 413);
  const jsLink = await createEntry(ctx.app, { link: "javascript:alert(1)" }, [], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(jsLink.statusCode, 400);
  const office = await createEntry(ctx.app, {}, [
    { field: "file", filename: "slides.pptx", buffer: officeZip("pptx") },
  ], { "cf-connecting-ip": "203.0.113.12" });
  assert.equal(office.statusCode, 201, office.body);
});

test("rate limits writes to 5 per hour and 20 per day for one IP", async (t) => {
  const ctx = await setup({ rateHour: 5, rateDay: 20 });
  t.after(() => ctx.close());
  const headers = { "cf-connecting-ip": "198.51.100.8" };
  for (let index = 0; index < 5; index += 1) {
    const response = await createEntry(ctx.app, { title: `결과 ${index}` }, [], headers);
    assert.equal(response.statusCode, 201, response.body);
  }
  const blocked = await createEntry(ctx.app, { title: "여섯 번째" }, [], headers);
  assert.equal(blocked.statusCode, 429);
  const otherIp = await createEntry(ctx.app, { title: "다른 사람" }, [], { "cf-connecting-ip": "198.51.100.9" });
  assert.equal(otherIp.statusCode, 201);

  const daily = await setup({ rateHour: 100, rateDay: 2 });
  t.after(() => daily.close());
  const dailyHeaders = { "cf-connecting-ip": "198.51.100.20" };
  assert.equal((await createEntry(daily.app, { title: "하루 1" }, [], dailyHeaders)).statusCode, 201);
  assert.equal((await createEntry(daily.app, { title: "하루 2" }, [], dailyHeaders)).statusCode, 201);
  assert.equal((await createEntry(daily.app, { title: "하루 3" }, [], dailyHeaders)).statusCode, 429);
});

test("edit and delete require the one-time secret", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const created = await createEntry(ctx.app, {}, [], { "cf-connecting-ip": "203.0.113.40" });
  const { entry, editSecret } = created.json();
  const wrong = multipart({
    name: entry.name,
    cohort: "1",
    title: "바뀐 제목",
    summary: entry.summary,
  });
  const denied = await ctx.app.inject({
    method: "PATCH",
    url: `/entries/${entry.id}`,
    payload: wrong.payload,
    headers: { ...wrong.headers, "x-edit-secret": "not-the-secret", "cf-connecting-ip": "203.0.113.40" },
  });
  assert.equal(denied.statusCode, 403);
  const updated = await ctx.app.inject({
    method: "PATCH",
    url: `/entries/${entry.id}`,
    payload: wrong.payload,
    headers: { ...wrong.headers, "x-edit-secret": editSecret, "cf-connecting-ip": "203.0.113.41" },
  });
  assert.equal(updated.statusCode, 200, updated.body);
  assert.equal(updated.json().entry.title, "바뀐 제목");
  assert.equal(updated.json().editSecret, undefined);
  const removed = await ctx.app.inject({
    method: "DELETE",
    url: `/entries/${entry.id}`,
    headers: { "x-edit-secret": editSecret, "cf-connecting-ip": "203.0.113.42" },
  });
  assert.equal(removed.statusCode, 200);
  const missing = await ctx.app.inject({ method: "GET", url: `/entries/${entry.id}` });
  assert.equal(missing.statusCode, 404);
});

test("admin token can hide and delete, and a missing token cannot", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const created = await createEntry(ctx.app, { cohort: "2기", title: "숨길 결과" }, [], { "cf-connecting-ip": "203.0.113.50" });
  const entry = created.json().entry;
  const noToken = await ctx.app.inject({ method: "POST", url: `/admin/entries/${entry.id}/hide`, payload: { hidden: true } });
  assert.equal(noToken.statusCode, 401);
  const wrong = await ctx.app.inject({
    method: "POST",
    url: `/admin/entries/${entry.id}/hide`,
    headers: { "x-admin-token": "nope" },
    payload: { hidden: true },
  });
  assert.equal(wrong.statusCode, 401);
  const hidden = await ctx.app.inject({
    method: "POST",
    url: `/admin/entries/${entry.id}/hide`,
    headers: { "x-admin-token": "test-admin-token", "content-type": "application/json" },
    payload: { hidden: true },
  });
  assert.equal(hidden.statusCode, 200, hidden.body);
  assert.equal(hidden.json().entry.hidden, true);
  const publicList = await ctx.app.inject({ method: "GET", url: "/entries?cohort=2" });
  assert.equal(publicList.json().entries.length, 0);
  const adminList = await ctx.app.inject({
    method: "GET",
    url: "/admin/entries?cohort=2",
    headers: { "x-admin-token": "test-admin-token" },
  });
  assert.equal(adminList.json().entries.length, 1);
  const report = await ctx.app.inject({
    method: "POST",
    url: `/entries/${entry.id}/report`,
    headers: { "content-type": "application/json" },
    payload: { reason: "개인정보가 포함되어 있습니다." },
  });
  assert.equal(report.statusCode, 404);
  const removed = await ctx.app.inject({
    method: "DELETE",
    url: `/admin/entries/${entry.id}`,
    headers: { "x-admin-token": "test-admin-token" },
  });
  assert.equal(removed.statusCode, 200);
});

test("rejects new uploads once the storage cap is reached", async (t) => {
  const ctx = await setup({ uploadCapBytes: 30 });
  t.after(() => ctx.close());
  const first = await createEntry(ctx.app, {}, [
    { field: "file", filename: "memo.txt", buffer: Buffer.from("12345678901234567890") },
  ], { "cf-connecting-ip": "203.0.113.70" });
  assert.equal(first.statusCode, 201, first.body);
  const second = await createEntry(ctx.app, { title: "두 번째" }, [
    { field: "file", filename: "more.txt", buffer: Buffer.from("12345678901234567890") },
  ], { "cf-connecting-ip": "203.0.113.71" });
  assert.equal(second.statusCode, 413, second.body);
});

test("honeypot submissions are not stored", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const response = await createEntry(ctx.app, { company_website: "https://spam.example" }, [], { "cf-connecting-ip": "203.0.113.80" });
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().entry, undefined);
  const listed = await ctx.app.inject({ method: "GET", url: "/entries?cohort=1" });
  assert.equal(listed.json().entries.length, 0);
});

test("public reports are stored for an admin and turnstile can be required", async (t) => {
  const ctx = await setup({}, {
    turnstileSecret: "secret",
    turnstileSiteKey: "site-key",
    verifyTurnstile: async (_secret, token) => token === "ok-token",
  });
  t.after(() => ctx.close());
  const blocked = await createEntry(ctx.app, {}, [], { "cf-connecting-ip": "203.0.113.90" });
  assert.equal(blocked.statusCode, 400);
  const created = await createEntry(ctx.app, { turnstileToken: "ok-token" }, [], { "cf-connecting-ip": "203.0.113.90" });
  assert.equal(created.statusCode, 201, created.body);
  const entry = created.json().entry;
  const report = await ctx.app.inject({
    method: "POST",
    url: `/entries/${entry.id}/report`,
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.91" },
    payload: { reason: "광고 글입니다." },
  });
  assert.equal(report.statusCode, 201);
  const admin = await ctx.app.inject({
    method: "GET",
    url: `/admin/entries/${entry.id}`,
    headers: { "x-admin-token": "test-admin-token" },
  });
  assert.equal(admin.json().entry.reportCount, 1);
  assert.equal(admin.json().entry.reports[0].reason, "광고 글입니다.");
  const config = await ctx.app.inject({ method: "GET", url: "/config" });
  assert.equal(config.json().turnstileSiteKey, "site-key");
  assert.equal(JSON.stringify(config.json()).includes("secret"), false);
});
