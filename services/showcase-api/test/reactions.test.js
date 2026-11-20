import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import Database from "better-sqlite3";
import { buildApp } from "../src/app.js";
import { DEFAULT_LIMITS } from "../src/limits.js";
import { parseContact } from "../src/validate.js";

function multipart(fields) {
  const boundary = "----reaction-test";
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${item}\r\n`));
    }
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(chunks), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

async function setup(limits = {}, root) {
  const base = root || await mkdtemp(path.join(tmpdir(), "showcase-react-"));
  const adminTokenFile = path.join(base, "admin-token");
  await writeFile(adminTokenFile, "test-admin-token\n");
  const app = await buildApp({
    dataDir: path.join(base, "data"),
    uploadDir: path.join(base, "uploads"),
    adminTokenFile,
    limits: { rateHour: 100, rateDay: 100, ...limits },
    rateSalt: "test-salt",
    logger: false,
  });
  return { app, async close() { await app.close(); await rm(base, { recursive: true, force: true }); } };
}

async function create(app, fields = {}, ip = "203.0.113.1") {
  const body = multipart({ name: "김빌더", cohort: "1", title: "결과물", summary: "한 줄 설명", ...fields });
  return app.inject({ method: "POST", url: "/entries", payload: body.payload, headers: { ...body.headers, "cf-connecting-ip": ip } });
}

const like = (app, id, ip) => app.inject({ method: "POST", url: `/entries/${id}/like`, headers: { "cf-connecting-ip": ip } });

test("likes count once per IP hash and appear in the list", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const { entry } = (await create(ctx.app)).json();
  assert.equal(entry.likes, 0);

  const first = await like(ctx.app, entry.id, "198.51.100.1");
  assert.equal(first.statusCode, 201);
  assert.deepEqual(first.json(), { likes: 1, liked: true, already: false });

  const again = await like(ctx.app, entry.id, "198.51.100.1");
  assert.equal(again.statusCode, 200);
  assert.deepEqual(again.json(), { likes: 1, liked: true, already: true });

  const other = await like(ctx.app, entry.id, "198.51.100.2");
  assert.equal(other.json().likes, 2);

  const list = (await ctx.app.inject({ method: "GET", url: "/entries?cohort=1" })).json();
  assert.equal(list.entries[0].likes, 2);
  const single = (await ctx.app.inject({ method: "GET", url: `/entries/${entry.id}` })).json();
  assert.equal(single.entry.likes, 2);
});

test("likes reject hidden or unknown entries and follow the rate limit", async (t) => {
  const ctx = await setup({ likeHour: 2 });
  t.after(() => ctx.close());
  const a = (await create(ctx.app, { title: "A" })).json().entry;
  const b = (await create(ctx.app, { title: "B" })).json().entry;
  const c = (await create(ctx.app, { title: "C" })).json().entry;

  assert.equal((await like(ctx.app, "AAAAAAAAAAAAAAAA", "198.51.100.9")).statusCode, 404);
  assert.equal((await like(ctx.app, a.id, "198.51.100.3")).statusCode, 201);
  assert.equal((await like(ctx.app, b.id, "198.51.100.3")).statusCode, 201);
  const limited = await like(ctx.app, c.id, "198.51.100.3");
  assert.equal(limited.statusCode, 429);
  assert.ok(limited.headers["retry-after"]);

  await ctx.app.inject({
    method: "POST",
    url: `/admin/entries/${c.id}/hide`,
    headers: { "x-admin-token": "test-admin-token", "content-type": "application/json" },
    payload: JSON.stringify({ hidden: true }),
  });
  assert.equal((await like(ctx.app, c.id, "198.51.100.4")).statusCode, 404);
});

test("deleting an entry removes its likes", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const created = (await create(ctx.app)).json();
  await like(ctx.app, created.entry.id, "198.51.100.5");
  const removed = await ctx.app.inject({ method: "DELETE", url: `/entries/${created.entry.id}`, headers: { "x-edit-secret": created.editSecret } });
  assert.equal(removed.statusCode, 200);
  assert.equal((await like(ctx.app, created.entry.id, "198.51.100.5")).statusCode, 404);
});

test("contact links accept https and email only", () => {
  const limits = DEFAULT_LIMITS;
  assert.equal(parseContact("", limits), "");
  assert.equal(parseContact("https://open.kakao.com/o/abcdef", limits), "https://open.kakao.com/o/abcdef");
  assert.equal(parseContact("https://www.instagram.com/builder/", limits), "https://www.instagram.com/builder/");
  assert.equal(parseContact("builder@example.com", limits), "mailto:builder@example.com");
  assert.equal(parseContact("mailto:builder@example.com", limits), "mailto:builder@example.com");
  assert.throws(() => parseContact("http://example.com", limits), /https/);
  assert.throws(() => parseContact("javascript:alert(1)", limits), /https/);
  assert.throws(() => parseContact("data:text/html,hi", limits), /https/);
  assert.throws(() => parseContact("mailto:a@example.com?subject=hi", limits), /이메일/);
  assert.throws(() => parseContact("mailto:a@example.com,b@example.com", limits), /이메일/);
  assert.throws(() => parseContact("https://user:pw@example.com", limits), /아이디/);
  assert.throws(() => parseContact("https://example.com/\"onmouseover", limits), /문자/);
  assert.throws(() => parseContact(`https://example.com/${"a".repeat(400)}`, limits), /300자/);
});

test("contact is stored, returned, kept on edit without the field, and cleared on request", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  const bad = await create(ctx.app, { contact: "http://insecure.example.com" });
  assert.equal(bad.statusCode, 400);

  const created = (await create(ctx.app, { contact: "builder@example.com" })).json();
  assert.equal(created.entry.contact, "mailto:builder@example.com");

  const edit = multipart({ title: "바뀐 제목" });
  const patched = await ctx.app.inject({
    method: "PATCH",
    url: `/entries/${created.entry.id}`,
    payload: edit.payload,
    headers: { ...edit.headers, "x-edit-secret": created.editSecret },
  });
  assert.equal(patched.statusCode, 200);
  assert.equal(patched.json().entry.contact, "mailto:builder@example.com");

  const clear = multipart({ contact: "" });
  const cleared = await ctx.app.inject({
    method: "PATCH",
    url: `/entries/${created.entry.id}`,
    payload: clear.payload,
    headers: { ...clear.headers, "x-edit-secret": created.editSecret },
  });
  assert.equal(cleared.json().entry.contact, null);

  const plain = (await create(ctx.app)).json();
  assert.equal(plain.entry.contact, null);
});

test("stats count visible entries per cohort", async (t) => {
  const ctx = await setup();
  t.after(() => ctx.close());
  assert.deepEqual((await ctx.app.inject({ method: "GET", url: "/stats" })).json(), {
    cohorts: [
      { cohort: "1", cohortLabel: "1기", entries: 0 },
      { cohort: "2", cohortLabel: "2기", entries: 0 },
    ],
  });
  await create(ctx.app, { cohort: "1" });
  await create(ctx.app, { cohort: "2" });
  const hidden = (await create(ctx.app, { cohort: "2" })).json().entry;
  await ctx.app.inject({
    method: "POST",
    url: `/admin/entries/${hidden.id}/hide`,
    headers: { "x-admin-token": "test-admin-token", "content-type": "application/json" },
    payload: JSON.stringify({ hidden: true }),
  });
  const stats = await ctx.app.inject({ method: "GET", url: "/stats" });
  assert.equal(stats.headers["cache-control"], "public, max-age=60");
  assert.deepEqual(stats.json().cohorts.map((row) => row.entries), [1, 1]);
});

test("migration keeps rows from the previous schema", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "showcase-migrate-"));
  const dataDir = path.join(root, "data");
  await mkdir(dataDir, { recursive: true });
  const old = new Database(path.join(dataDir, "showcase.db"));
  old.exec(`
    CREATE TABLE entries (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, cohort TEXT NOT NULL CHECK (cohort IN ('1', '2')),
      title TEXT NOT NULL, summary TEXT NOT NULL, links_json TEXT NOT NULL,
      tools TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL DEFAULT '',
      secret_salt TEXT NOT NULL, secret_hash TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  old.prepare(`INSERT INTO entries VALUES ('OldEntry12345678', '옛 빌더', '1', '옛 결과물', '기존 행', '[]', '', '', 's', 'h', 0, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')`).run();
  old.close();

  const ctx = await setup({}, root);
  t.after(() => ctx.close());
  const list = (await ctx.app.inject({ method: "GET", url: "/entries?cohort=1" })).json();
  assert.equal(list.entries.length, 1);
  assert.equal(list.entries[0].title, "옛 결과물");
  assert.equal(list.entries[0].contact, null);
  assert.equal(list.entries[0].likes, 0);
  assert.equal((await like(ctx.app, "OldEntry12345678", "198.51.100.7")).json().likes, 1);

  const check = new Database(path.join(dataDir, "showcase.db"), { readonly: true });
  t.after(() => check.close());
  assert.equal(check.pragma("user_version", { simple: true }), 2);
  assert.ok(check.prepare("PRAGMA table_info(entries)").all().some((column) => column.name === "contact"));
});
