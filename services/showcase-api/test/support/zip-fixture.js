import { deflateRawSync, crc32 } from "node:zlib";

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

export function zipFiles(files, { deflate = false } = {}) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const raw = Buffer.from(file.data);
    const method = deflate ? 8 : 0;
    const data = deflate ? deflateRawSync(raw) : raw;
    const checksum = crc32(raw);
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(method),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(raw.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(method),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(raw.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...locals, centralDirectory, eocd]);
}

export function officeZip(kind) {
  const marker = {
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation+xml",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
  }[kind];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Types><Override ContentType="${marker}"/></Types>`;
  return zipFiles([{ name: "[Content_Types].xml", data: xml }], { deflate: true });
}
