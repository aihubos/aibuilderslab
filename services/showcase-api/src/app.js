import { mkdirSync } from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { openDatabase, totalUploadBytes, countHits, addHit, purgeHits, likeCount } from "./db.js";
import { RequestError } from "./errors.js";
import { processImage, writeNamed, removeStored, removeEntryDir } from "./files.js";
import { resolveLimits } from "./limits.js";
import {
  clientIp,
  createId,
  createSecret,
  hashIp,
  hashSecret,
  loadRateSalt,
  readAdminToken,
  safeEqual,
  verifySecret,
} from "./security.js";
import { assertFile, cleanBlock, cleanLine, parseCohort, parseContact, parseLinks } from "./validate.js";

const COHORTS = Object.freeze(["1", "2"]);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;

export async function buildApp(options = {}) {
  const limits = resolveLimits(options.limits);
  const dataDir = options.dataDir;
  const uploadDir = options.uploadDir;
  if (!dataDir || !uploadDir) throw new Error("dataDir and uploadDir are required");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(uploadDir, { recursive: true });

  const db = openDatabase(path.join(dataDir, "showcase.db"));
  const rateSalt = loadRateSalt(dataDir, options.rateSalt);
  const adminTokenFile = options.adminTokenFile || "";
  const turnstileSecret = options.turnstileSecret ?? process.env.TURNSTILE_SECRET_KEY ?? "";
  const turnstileSiteKey = options.turnstileSiteKey ?? process.env.TURNSTILE_SITE_KEY ?? "";
  const verifyTurnstile = options.verifyTurnstile || defaultVerifyTurnstile;

  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: limits.maxTotalBytes + 1024 * 1024,
    trustProxy: false,
  });

  await app.register(multipart, {
    limits: {
      fileSize: limits.maxFileBytes,
      files: limits.maxImages + limits.maxFiles,
      fields: 40,
      fieldSize: 64 * 1024,
      parts: 48,
    },
  });

  app.decorate("ctx", { db, uploadDir, limits });
  app.addHook("onClose", async () => db.close());

  app.setErrorHandler((error, request, reply) => {
    if (error?.code === "FST_REQ_FILE_TOO_LARGE" || error?.code === "FST_FILES_LIMIT") {
      return reply.code(413).send({ error: "파일이 너무 큽니다. 이미지는 5MB, 첨부 파일은 20MB, 한 번에 25MB까지 올릴 수 있습니다." });
    }
    const status = error instanceof RequestError ? error.statusCode : error.statusCode;
    if (error instanceof RequestError || (status && status < 500)) {
      if (error.retryAfter) reply.header("Retry-After", String(error.retryAfter));
      const message = error instanceof RequestError ? error.message : "요청을 처리할 수 없습니다.";
      return reply.code(status || 400).send({ error: message });
    }
    request.log.error({ err: error }, "request failed");
    return reply.code(500).send({ error: "잠시 후 다시 시도해 주세요." });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: "요청한 주소를 찾을 수 없습니다." });
  });

  const ipHashOf = (request) => hashIp(clientIp(request), rateSalt);

  function enforceRate(action, ipHash, hourLimit, dayLimit) {
    const now = Date.now();
    purgeHits(db, now);
    const hourCount = countHits(db, action, ipHash, now - HOUR);
    if (hourCount >= hourLimit) {
      throw new RequestError(429, "요청 횟수가 한 시간 제한을 넘었습니다. 잠시 뒤에 다시 시도해 주세요.", { retryAfter: 3600 });
    }
    if (dayLimit != null) {
      const dayCount = countHits(db, action, ipHash, now - DAY);
      if (dayCount >= dayLimit) {
        throw new RequestError(429, "요청 횟수가 하루 제한을 넘었습니다. 내일 다시 시도해 주세요.", { retryAfter: 86400 });
      }
    }
    return now;
  }

  function record(action, ipHash, now = Date.now()) {
    addHit(db, action, ipHash, now);
  }

  function requireAdmin(request) {
    const expected = readAdminToken(adminTokenFile);
    const provided = String(request.headers["x-admin-token"] || "").trim();
    if (!expected || !provided || !safeEqual(provided, expected)) {
      const ipHash = ipHashOf(request);
      const now = enforceRate("admin-fail", ipHash, limits.adminFailHour, null);
      record("admin-fail", ipHash, now);
      throw new RequestError(401, "관리 권한이 없습니다.");
    }
  }

  function requireSecret(row, request, fields = {}) {
    const provided = String(request.headers["x-edit-secret"] || fields.editSecret || "");
    if (!provided || !verifySecret(provided, row.secret_salt, row.secret_hash)) {
      const ipHash = ipHashOf(request);
      const now = enforceRate("secret-fail", ipHash, limits.secretFailHour, null);
      record("secret-fail", ipHash, now);
      throw new RequestError(403, "수정 코드가 맞지 않습니다.");
    }
  }

  app.get("/health", async () => ({ ok: true }));

  app.get("/config", async () => ({
    turnstileSiteKey: turnstileSiteKey || null,
    limits: {
      maxImageBytes: limits.maxImageBytes,
      maxFileBytes: limits.maxFileBytes,
      maxImages: limits.maxImages,
      maxFiles: limits.maxFiles,
      maxTotalBytes: limits.maxTotalBytes,
      rateHour: limits.rateHour,
      rateDay: limits.rateDay,
    },
  }));

  app.get("/entries", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const cohort = parseCohort(request.query?.cohort);
    const rows = db.prepare(
      "SELECT * FROM entries WHERE hidden = 0 AND cohort = ? ORDER BY created_at DESC LIMIT 200",
    ).all(cohort);
    return { entries: rows.map((row) => present(db, row, false)) };
  });

  /* 기수별 공개 결과물 수 (숨김 제외). 목록의 200개 제한과 상관없이 정확한 수를 줍니다. */
  app.get("/stats", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=60");
    const counts = new Map(
      db.prepare("SELECT cohort, COUNT(*) AS n FROM entries WHERE hidden = 0 GROUP BY cohort").all()
        .map((row) => [row.cohort, Number(row.n)]),
    );
    return {
      cohorts: COHORTS.map((cohort) => ({
        cohort,
        cohortLabel: `${cohort}기`,
        entries: counts.get(cohort) || 0,
      })),
    };
  });

  /* 좋아요: IP 해시 기준 결과물당 1회. 반복 요청은 기존 rate-limit 패턴으로 제한합니다. */
  app.post("/entries/:id/like", async (request, reply) => {
    const row = loadVisible(db, request.params.id);
    const ipHash = ipHashOf(request);
    let inserted = false;
    db.transaction(() => {
      const now = enforceRate("like", ipHash, limits.likeHour, limits.likeDay);
      inserted = db.prepare(
        "INSERT OR IGNORE INTO likes (entry_id, ip_hash, created_at) VALUES (?, ?, ?)",
      ).run(row.id, ipHash, new Date().toISOString()).changes === 1;
      record("like", ipHash, now);
    })();
    reply.header("Cache-Control", "no-store");
    return reply.code(inserted ? 201 : 200).send({ likes: likeCount(db, row.id), liked: true, already: !inserted });
  });

  app.get("/entries/:id", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const row = loadVisible(db, request.params.id);
    return { entry: present(db, row, false) };
  });

  app.post("/entries", async (request, reply) => {
    const form = await readForm(request, limits);
    if (honeypotFilled(form.fields)) {
      const ipHash = ipHashOf(request);
      const now = enforceRate("write", ipHash, limits.rateHour, limits.rateDay);
      record("write", ipHash, now);
      return reply.code(201).send({ ok: true });
    }
    const parsed = parseSubmission(form.fields, limits);
    await assertTurnstile(turnstileSecret, form.fields.turnstileToken, clientIp(request), verifyTurnstile);
    const prepared = await prepareAssets(form, limits);
    const secret = createSecret();
    const secretParts = hashSecret(secret);
    const id = createId();
    const nowIso = new Date().toISOString();
    const ipHash = ipHashOf(request);
    const adding = byteSizeOf(prepared);
    try {
      db.transaction(() => {
        const now = enforceRate("write", ipHash, limits.rateHour, limits.rateDay);
        const used = totalUploadBytes(db);
        if (used + adding > limits.uploadCapBytes) {
          throw new RequestError(413, "저장 공간이 가득 찼습니다. 새 파일은 잠시 올릴 수 없습니다.");
        }
        db.prepare(
          `INSERT INTO entries
            (id, name, cohort, title, summary, links_json, tools, prompt, contact, secret_salt, secret_hash, hidden, created_at, updated_at)
           VALUES (@id, @name, @cohort, @title, @summary, @links_json, @tools, @prompt, @contact, @secret_salt, @secret_hash, 0, @created_at, @updated_at)`,
        ).run({
          id,
          ...parsed,
          links_json: JSON.stringify(parsed.links),
          secret_salt: secretParts.salt,
          secret_hash: secretParts.hash,
          created_at: nowIso,
          updated_at: nowIso,
        });
        record("write", ipHash, now);
      })();
      await persistAssets(uploadDir, db, id, prepared, nowIso);
    } catch (error) {
      await removeEntryDir(uploadDir, id);
      db.prepare("DELETE FROM entries WHERE id = ?").run(id);
      throw error;
    }
    reply.header("Cache-Control", "no-store");
    const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
    return reply.code(201).send({ entry: present(db, row, false), editSecret: secret });
  });

  app.patch("/entries/:id", async (request, reply) => {
    const row = loadOwned(db, request.params.id);
    const form = await readForm(request, limits);
    requireSecret(row, request, form.fields);
    const parsed = parseSubmission(form.fields, limits, row);
    await assertTurnstile(turnstileSecret, form.fields.turnstileToken, clientIp(request), verifyTurnstile);
    const prepared = await prepareAssets(form, limits);
    const replacing = [];
    if (prepared.images.length || form.fields.clearImages === "1") replacing.push("image");
    if (prepared.files.length || form.fields.clearFiles === "1") replacing.push("file");
    const oldAssets = replacing.length
      ? db.prepare(`SELECT * FROM assets WHERE entry_id = ? AND kind IN (${replacing.map(() => "?").join(",")})`).all(row.id, ...replacing)
      : [];
    const adding = byteSizeOf(prepared);
    const removing = oldAssets.reduce((sum, asset) => sum + Number(asset.byte_size), 0);
    const ipHash = ipHashOf(request);
    const nowIso = new Date().toISOString();
    try {
      await writePreparedFiles(uploadDir, row.id, prepared);
      db.transaction(() => {
        const now = enforceRate("write", ipHash, limits.rateHour, limits.rateDay);
        if (totalUploadBytes(db) - removing + adding > limits.uploadCapBytes) {
          throw new RequestError(413, "저장 공간이 가득 찼습니다. 새 파일은 잠시 올릴 수 없습니다.");
        }
        db.prepare(
          `UPDATE entries
           SET name = @name, cohort = @cohort, title = @title, summary = @summary, links_json = @links_json,
               tools = @tools, prompt = @prompt, contact = @contact, updated_at = @updated_at
           WHERE id = @id`,
        ).run({
          id: row.id,
          ...parsed,
          links_json: JSON.stringify(parsed.links),
          updated_at: nowIso,
        });
        if (replacing.length) {
          db.prepare(`DELETE FROM assets WHERE entry_id = ? AND kind IN (${replacing.map(() => "?").join(",")})`).run(row.id, ...replacing);
        }
        insertPrepared(db, row.id, prepared, nowIso);
        record("write", ipHash, now);
      })();
    } catch (error) {
      await cleanupPrepared(uploadDir, row.id, prepared);
      throw error;
    }
    await removeStored(uploadDir, row.id, oldAssets.flatMap((asset) => [asset.stored_name, asset.thumb_name]));
    reply.header("Cache-Control", "no-store");
    const updated = db.prepare("SELECT * FROM entries WHERE id = ?").get(row.id);
    return { entry: present(db, updated, false) };
  });

  app.delete("/entries/:id", async (request, reply) => {
    const row = loadOwned(db, request.params.id);
    requireSecret(row, request);
    const ipHash = ipHashOf(request);
    db.transaction(() => {
      const now = enforceRate("write", ipHash, limits.rateHour, limits.rateDay);
      db.prepare("DELETE FROM entries WHERE id = ?").run(row.id);
      record("write", ipHash, now);
    })();
    await removeEntryDir(uploadDir, row.id);
    reply.header("Cache-Control", "no-store");
    return { ok: true };
  });

  app.post("/entries/:id/report", async (request, reply) => {
    const row = loadVisible(db, request.params.id);
    const reason = cleanLine(request.body?.reason, limits.maxReason, "신고 이유", { required: true });
    const ipHash = ipHashOf(request);
    const now = enforceRate("report", ipHash, limits.reportHour, null);
    db.prepare("INSERT INTO reports (id, entry_id, reason, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
      createId(),
      row.id,
      reason,
      ipHash,
      new Date().toISOString(),
    );
    record("report", ipHash, now);
    reply.header("Cache-Control", "no-store");
    return reply.code(201).send({ ok: true });
  });

  app.get("/admin/entries", async (request, reply) => {
    requireAdmin(request);
    reply.header("Cache-Control", "no-store");
    const cohort = request.query?.cohort ? parseCohort(request.query.cohort) : null;
    const rows = cohort
      ? db.prepare("SELECT * FROM entries WHERE cohort = ? ORDER BY created_at DESC LIMIT 200").all(cohort)
      : db.prepare("SELECT * FROM entries ORDER BY created_at DESC LIMIT 200").all();
    return { entries: rows.map((row) => present(db, row, true)) };
  });

  app.get("/admin/entries/:id", async (request, reply) => {
    requireAdmin(request);
    reply.header("Cache-Control", "no-store");
    const row = loadAny(db, request.params.id);
    return { entry: present(db, row, true) };
  });

  app.post("/admin/entries/:id/hide", async (request, reply) => {
    requireAdmin(request);
    const row = loadAny(db, request.params.id);
    const hidden = request.body?.hidden === false ? 0 : 1;
    db.prepare("UPDATE entries SET hidden = ?, updated_at = ? WHERE id = ?").run(hidden, new Date().toISOString(), row.id);
    reply.header("Cache-Control", "no-store");
    const updated = db.prepare("SELECT * FROM entries WHERE id = ?").get(row.id);
    return { entry: present(db, updated, true) };
  });

  app.delete("/admin/entries/:id", async (request, reply) => {
    requireAdmin(request);
    const row = loadAny(db, request.params.id);
    db.prepare("DELETE FROM entries WHERE id = ?").run(row.id);
    await removeEntryDir(uploadDir, row.id);
    reply.header("Cache-Control", "no-store");
    return { ok: true };
  });

  return app;
}

function honeypotFilled(fields) {
  return String(fields.company_website || "").trim() !== "";
}

function fieldList(fields, name) {
  if (!Object.prototype.hasOwnProperty.call(fields, name)) return null;
  const value = fields[name];
  if (Array.isArray(value)) return value;
  return [value];
}

function parseSubmission(fields, limits, previous) {
  const links = fieldList(fields, "link");
  return {
    name: cleanLine(fields.name ?? previous?.name, limits.maxName, "이름", { required: true }),
    cohort: fields.cohort == null && previous ? previous.cohort : parseCohort(fields.cohort ?? previous?.cohort),
    title: cleanLine(fields.title ?? previous?.title, limits.maxTitle, "제목", { required: true }),
    summary: cleanLine(fields.summary ?? previous?.summary, limits.maxSummary, "한 줄 설명", { required: true }),
    tools: cleanLine(fields.tools ?? previous?.tools ?? "", limits.maxTools, "사용한 도구", { allowMarkup: true }),
    prompt: cleanBlock(fields.prompt ?? previous?.prompt ?? "", limits.maxPrompt, "프롬프트"),
    contact: fields.contact == null && previous ? previous.contact || "" : parseContact(fields.contact ?? "", limits),
    links: links == null && previous ? JSON.parse(previous.links_json) : parseLinks(links || [], limits),
  };
}

async function assertTurnstile(secret, token, ip, verify) {
  if (!secret) return;
  const ok = await verify(secret, String(token || ""), ip);
  if (!ok) throw new RequestError(400, "자동 입력 확인에 실패했습니다. 다시 시도해 주세요.");
}

async function defaultVerifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!response.ok) return false;
  const data = await response.json();
  return data.success === true;
}

async function readForm(request, limits) {
  if (!String(request.headers["content-type"] || "").includes("multipart/form-data")) {
    throw new RequestError(400, "결과물은 폼으로 올려 주세요.");
  }
  const fields = {};
  const images = [];
  const files = [];
  let total = 0;
  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      total += buffer.length;
      if (total > limits.maxTotalBytes) {
        throw new RequestError(413, "한 번에 올릴 수 있는 용량은 25MB입니다. 파일 수를 줄이거나 나눠 올려 주세요.");
      }
      const item = { filename: part.filename || "file", buffer };
      if (part.fieldname === "image") images.push(item);
      else if (part.fieldname === "file") files.push(item);
      else throw new RequestError(400, "첨부 칸이 올바르지 않습니다.");
      if (images.length > limits.maxImages) throw new RequestError(400, "이미지는 4장까지 올릴 수 있습니다.");
      if (files.length > limits.maxFiles) throw new RequestError(400, "첨부 파일은 4개까지 올릴 수 있습니다.");
    } else if (Object.prototype.hasOwnProperty.call(fields, part.fieldname)) {
      const current = fields[part.fieldname];
      fields[part.fieldname] = Array.isArray(current) ? [...current, part.value] : [current, part.value];
    } else {
      fields[part.fieldname] = part.value;
    }
  }
  return { fields, images, files };
}

async function prepareAssets(form, limits) {
  const images = [];
  for (const image of form.images) {
    images.push({ ...(await processImage(image.buffer, image.filename, limits)), id: createId() });
  }
  const files = form.files.map((file) => ({ ...assertFile(file.buffer, file.filename, limits), buffer: file.buffer, id: createId() }));
  return { images, files };
}

function byteSizeOf(prepared) {
  const images = prepared.images.reduce((sum, image) => sum + image.main.length + image.thumb.length, 0);
  const files = prepared.files.reduce((sum, file) => sum + file.buffer.length, 0);
  return images + files;
}

function storedNames(prepared) {
  return {
    images: prepared.images.map((image) => ({
      image,
      storedName: `img_${image.id}.webp`,
      thumbName: `img_${image.id}-thumb.webp`,
    })),
    files: prepared.files.map((file) => ({
      file,
      storedName: `file_${file.id}.${file.ext}`,
    })),
  };
}

async function writePreparedFiles(uploadDir, entryId, prepared) {
  const names = storedNames(prepared);
  for (const item of names.images) {
    await writeNamed(uploadDir, entryId, item.storedName, item.image.main);
    await writeNamed(uploadDir, entryId, item.thumbName, item.image.thumb);
  }
  for (const item of names.files) {
    await writeNamed(uploadDir, entryId, item.storedName, item.file.buffer);
  }
}

function insertPrepared(db, entryId, prepared, nowIso) {
  const insert = db.prepare(
    `INSERT INTO assets
      (id, entry_id, kind, original_name, stored_name, mime, byte_size, width, height, thumb_name, created_at)
     VALUES (@id, @entry_id, @kind, @original_name, @stored_name, @mime, @byte_size, @width, @height, @thumb_name, @created_at)`,
  );
  const names = storedNames(prepared);
  for (const item of names.images) {
    insert.run({
      id: item.image.id,
      entry_id: entryId,
      kind: "image",
      original_name: item.image.originalName,
      stored_name: item.storedName,
      mime: item.image.mime,
      byte_size: item.image.main.length + item.image.thumb.length,
      width: item.image.width,
      height: item.image.height,
      thumb_name: item.thumbName,
      created_at: nowIso,
    });
  }
  for (const item of names.files) {
    insert.run({
      id: item.file.id,
      entry_id: entryId,
      kind: "file",
      original_name: item.file.originalName,
      stored_name: item.storedName,
      mime: item.file.mime,
      byte_size: item.file.buffer.length,
      width: null,
      height: null,
      thumb_name: null,
      created_at: nowIso,
    });
  }
}

async function persistAssets(uploadDir, db, entryId, prepared, nowIso) {
  await writePreparedFiles(uploadDir, entryId, prepared);
  insertPrepared(db, entryId, prepared, nowIso);
}

async function cleanupPrepared(uploadDir, entryId, prepared) {
  const names = [
    ...prepared.images.flatMap((image) => [`img_${image.id}.webp`, `img_${image.id}-thumb.webp`]),
    ...prepared.files.map((file) => `file_${file.id}.${file.ext}`),
  ];
  await removeStored(uploadDir, entryId, names);
}

function loadAny(db, id) {
  if (!ID_PATTERN.test(String(id || ""))) throw new RequestError(404, "결과물을 찾을 수 없습니다.");
  const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  if (!row) throw new RequestError(404, "결과물을 찾을 수 없습니다.");
  return row;
}

function loadVisible(db, id) {
  const row = loadAny(db, id);
  if (row.hidden) throw new RequestError(404, "결과물을 찾을 수 없습니다.");
  return row;
}

function loadOwned(db, id) {
  return loadAny(db, id);
}

function present(db, row, admin) {
  const assets = db.prepare("SELECT * FROM assets WHERE entry_id = ? ORDER BY created_at ASC").all(row.id);
  const entry = {
    id: row.id,
    name: row.name,
    cohort: row.cohort,
    cohortLabel: row.cohort === "1" ? "1기" : "2기",
    title: row.title,
    summary: row.summary,
    links: JSON.parse(row.links_json),
    tools: row.tools,
    prompt: row.prompt,
    contact: row.contact || null,
    likes: likeCount(db, row.id),
    images: assets.filter((asset) => asset.kind === "image").map((asset) => ({
      id: asset.id,
      name: asset.original_name,
      url: `/lounge/uploads/${row.id}/${asset.stored_name}`,
      thumbUrl: `/lounge/uploads/${row.id}/${asset.thumb_name}`,
      width: asset.width,
      height: asset.height,
    })),
    files: assets.filter((asset) => asset.kind === "file").map((asset) => ({
      id: asset.id,
      name: asset.original_name,
      url: `/lounge/uploads/${row.id}/${asset.stored_name}`,
      size: asset.byte_size,
      mime: asset.mime,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (!admin) return entry;
  const reports = db.prepare("SELECT reason, created_at FROM reports WHERE entry_id = ? ORDER BY created_at DESC LIMIT 20").all(row.id);
  return {
    ...entry,
    hidden: Boolean(row.hidden),
    reportCount: reports.length === 20
      ? Number(db.prepare("SELECT COUNT(*) AS n FROM reports WHERE entry_id = ?").get(row.id).n)
      : reports.length,
    reports: reports.map((report) => ({ reason: report.reason, createdAt: report.created_at })),
  };
}
