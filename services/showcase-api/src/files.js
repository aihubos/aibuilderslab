import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { RequestError } from "./errors.js";
import { assertImage } from "./validate.js";

sharp.cache(false);
sharp.concurrency(1);

const ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const STORED_PATTERN = /^[A-Za-z0-9._-]{8,80}$/;

export async function processImage(buffer, filename, limits) {
  const checked = assertImage(buffer, filename, limits);
  let meta;
  try {
    meta = await sharp(buffer, { animated: false, limitInputPixels: limits.maxImagePixels, sequentialRead: true }).metadata();
    if (!meta.width || !meta.height) throw new Error("missing size");
    const main = await sharp(buffer, { animated: true, limitInputPixels: limits.maxImagePixels, sequentialRead: true })
      .rotate()
      .webp({ quality: 80, effort: 3 })
      .toBuffer();
    const thumb = await sharp(buffer, { animated: false, limitInputPixels: limits.maxImagePixels, sequentialRead: true })
      .rotate()
      .resize({ width: limits.thumbEdge, height: limits.thumbEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 3 })
      .toBuffer();
    return { ...checked, main, thumb, width: meta.width, height: meta.height, mime: "image/webp" };
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "이미지를 열 수 없습니다. jpg, png, webp, gif 파일로 다시 올려 주세요.");
  }
}

export async function writeNamed(uploadDir, entryId, storedName, buffer) {
  if (!ID_PATTERN.test(entryId) || !STORED_PATTERN.test(storedName)) {
    throw new RequestError(500, "잠시 후 다시 시도해 주세요.");
  }
  const dir = path.join(uploadDir, entryId);
  const target = path.join(dir, storedName);
  if (!target.startsWith(`${dir}${path.sep}`)) throw new RequestError(500, "잠시 후 다시 시도해 주세요.");
  await mkdir(dir, { recursive: true });
  await writeFile(target, buffer, { flag: "wx" });
  return target;
}

export async function removeStored(uploadDir, entryId, names) {
  if (!ID_PATTERN.test(entryId)) return;
  const dir = path.join(uploadDir, entryId);
  await Promise.all(
    names.filter(Boolean).map(async (name) => {
      if (!STORED_PATTERN.test(name)) return;
      const target = path.join(dir, name);
      if (!target.startsWith(`${dir}${path.sep}`)) return;
      await rm(target, { force: true });
    }),
  );
}

export async function removeEntryDir(uploadDir, entryId) {
  if (!ID_PATTERN.test(entryId)) return;
  await rm(path.join(uploadDir, entryId), { recursive: true, force: true });
}
