import path from "node:path";
import { RequestError } from "./errors.js";
import { isZip, readZipEntry } from "./zip.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IMAGE_EXT = Object.freeze({ jpg: "jpeg", jpeg: "jpeg", png: "png", gif: "gif", webp: "webp" });
const FILE_EXT = new Set(["pdf", "zip", "pptx", "docx", "xlsx", "txt", "md"]);
const OFFICE_MARKER = Object.freeze({
  pptx: "presentationml.presentation",
  docx: "wordprocessingml.document",
  xlsx: "spreadsheetml.sheet",
});
const FILE_MIME = Object.freeze({
  pdf: "application/pdf",
  zip: "application/zip",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
});

export function extensionOf(filename) {
  const base = path.basename(String(filename || "")).replaceAll("\0", "");
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function imageKind(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) return "png";
  const head = buffer.subarray(0, 6).toString("ascii");
  if (head === "GIF87a" || head === "GIF89a") return "gif";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  return null;
}

export function safeDisplayName(filename) {
  const base = path.basename(String(filename || "file")).replace(/[\u0000-\u001F\u007F]/g, "");
  const cleaned = base.replace(/[\\/]/g, "").trim() || "file";
  return [...cleaned].slice(0, 80).join("");
}

function assertNoControls(text, label, allowNewlines) {
  const pattern = allowNewlines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/ : /[\u0000-\u001F\u007F]/;
  if (pattern.test(text)) throw new RequestError(400, `${label}에 사용할 수 없는 문자가 있습니다.`);
}

export function cleanLine(value, max, label, { required = false, allowMarkup = false } = {}) {
  const text = String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
  if (!text) {
    if (required) throw new RequestError(400, `${label}을(를) 입력해 주세요.`);
    return "";
  }
  if ([...text].length > max) throw new RequestError(400, `${label}은(는) ${max}자 이내로 적어 주세요.`);
  assertNoControls(text, label, false);
  if (!allowMarkup && /[<>]/.test(text)) throw new RequestError(400, `${label}에 사용할 수 없는 문자가 있습니다.`);
  return text;
}

export function cleanBlock(value, max, label) {
  const text = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if ([...text].length > max) throw new RequestError(400, `${label}은(는) ${max}자 이내로 적어 주세요.`);
  assertNoControls(text, label, true);
  return text;
}

export function parseCohort(value) {
  const text = String(value ?? "").trim();
  if (text === "1" || text === "1기") return "1";
  if (text === "2" || text === "2기") return "2";
  throw new RequestError(400, "기수는 1기 또는 2기 중에서 선택해 주세요.");
}

export function youtubeIdFromUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id = "";
  if (host === "youtu.be") id = parts[0] || "";
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
    else if (["embed", "shorts", "live", "v"].includes(parts[0])) id = parts[1] || "";
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function parseLinks(values, limits) {
  const links = [];
  for (const raw of values) {
    const text = String(raw ?? "").trim();
    if (!text) continue;
    if (text.length > limits.maxLinkLength) throw new RequestError(400, "링크는 500자 이내로 적어 주세요.");
    let url;
    try {
      url = new URL(text);
    } catch {
      throw new RequestError(400, "링크 주소를 다시 확인해 주세요. http 또는 https만 사용할 수 있습니다.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new RequestError(400, "링크는 http 또는 https만 사용할 수 있습니다.");
    }
    if (url.username || url.password) throw new RequestError(400, "링크에 아이디나 비밀번호를 넣지 말아 주세요.");
    links.push({ url: url.toString(), youtubeId: youtubeIdFromUrl(url) });
  }
  if (links.length > limits.maxLinks) throw new RequestError(400, "링크는 8개까지 넣을 수 있습니다.");
  return links;
}

export function assertImage(buffer, filename, limits) {
  if (buffer.length === 0) throw new RequestError(400, "빈 이미지는 올릴 수 없습니다.");
  if (buffer.length > limits.maxImageBytes) throw new RequestError(400, "이미지는 한 장에 5MB까지 올릴 수 있습니다.");
  const ext = extensionOf(filename);
  const expected = IMAGE_EXT[ext];
  const kind = imageKind(buffer);
  if (!expected || expected !== kind) {
    throw new RequestError(400, "이미지는 jpg, png, webp, gif만 올릴 수 있습니다.");
  }
  return { kind, originalName: safeDisplayName(filename) };
}

function assertText(buffer) {
  if (buffer.includes(0)) throw new RequestError(400, "텍스트 파일만 올릴 수 있습니다. html, svg, js, exe는 올릴 수 없습니다.");
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new RequestError(400, "텍스트 파일은 UTF-8만 올릴 수 있습니다.");
  }
  const head = text.slice(0, 800).trimStart().toLowerCase();
  if (/^(?:<!doctype|<html|<script|<svg|<\?php|<xml)/.test(head) || text.toLowerCase().includes("<script") || text.toLowerCase().includes("<svg")) {
    throw new RequestError(400, "html, svg, js 파일은 올릴 수 없습니다.");
  }
}

export function assertFile(buffer, filename, limits) {
  if (buffer.length === 0) throw new RequestError(400, "빈 파일은 올릴 수 없습니다.");
  if (buffer.length > limits.maxFileBytes) throw new RequestError(400, "첨부 파일은 하나당 20MB까지 올릴 수 있습니다.");
  const ext = extensionOf(filename);
  if (!FILE_EXT.has(ext)) {
    throw new RequestError(400, "첨부 파일은 pdf, zip, pptx, docx, xlsx, txt, md만 올릴 수 있습니다.");
  }
  if (ext === "pdf" && buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new RequestError(400, "PDF 파일 형식을 확인해 주세요.");
  }
  if (ext === "zip" || OFFICE_MARKER[ext]) {
    if (!isZip(buffer)) throw new RequestError(400, "압축 파일 형식을 확인해 주세요.");
    if (OFFICE_MARKER[ext]) {
      const xml = readZipEntry(buffer, "[Content_Types].xml");
      if (!xml || !xml.includes(OFFICE_MARKER[ext])) {
        throw new RequestError(400, "파일 내용이 확장자와 맞지 않습니다.");
      }
    }
  }
  if (ext === "txt" || ext === "md") assertText(buffer);
  return { ext, mime: FILE_MIME[ext], originalName: safeDisplayName(filename) };
}
