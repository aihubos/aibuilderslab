import { inflateRawSync } from "node:zlib";
import { RequestError } from "./errors.js";

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const EOCD = 0x06054b50;

function findEocd(buffer) {
  if (buffer.length < 22) return null;
  const min = Math.max(0, buffer.length - 22 - 65535);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== EOCD) continue;
    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength !== buffer.length) continue;
    const cdSize = buffer.readUInt32LE(offset + 12);
    const cdOffset = buffer.readUInt32LE(offset + 16);
    if (cdOffset === 0xffffffff || cdSize === 0xffffffff) return null;
    if (cdOffset + cdSize > buffer.length) return null;
    return { cdOffset, cdSize };
  }
  return null;
}

export function isZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) return false;
  const signature = buffer.readUInt32LE(0);
  if (signature !== LOCAL && signature !== EOCD) return false;
  return findEocd(buffer) != null;
}

export function readZipEntry(buffer, wantedName, { maxUncompressed = 1024 * 1024, maxEntries = 200 } = {}) {
  const eocd = findEocd(buffer);
  if (!eocd) return null;
  let offset = eocd.cdOffset;
  const end = Math.min(buffer.length, eocd.cdOffset + eocd.cdSize);
  const target = String(wantedName).replace(/\\/g, "/");

  for (let seen = 0; seen < maxEntries && offset + 46 <= end; seen += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL) return null;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    if (nameStart + nameLength > buffer.length) return null;
    const name = buffer.toString("utf8", nameStart, nameStart + nameLength).replace(/\\/g, "/");
    if (name === target) {
      if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
        throw new RequestError(400, "이 압축 형식은 지원하지 않습니다.");
      }
      if (uncompressedSize > maxUncompressed || compressedSize > maxUncompressed) {
        throw new RequestError(400, "압축 파일 안의 내용이 너무 큽니다.");
      }
      if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL) return null;
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      if (dataStart + compressedSize > buffer.length) return null;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      try {
        if (method === 0) return compressed.toString("utf8");
        if (method === 8) {
          return inflateRawSync(compressed, { maxOutputLength: maxUncompressed }).toString("utf8");
        }
      } catch {
        throw new RequestError(400, "압축 파일을 확인할 수 없습니다.");
      }
      return null;
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}
