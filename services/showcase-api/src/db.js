import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cohort TEXT NOT NULL CHECK (cohort IN ('1', '2')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  links_json TEXT NOT NULL,
  tools TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  secret_salt TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'file')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  thumb_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_list ON entries(cohort, hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_entry ON assets(entry_id, kind);
CREATE INDEX IF NOT EXISTS idx_reports_entry ON reports(entry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_hits ON rate_hits(action, ip_hash, created_at);
`;

export function openDatabase(file) {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA);
  return db;
}

export function totalUploadBytes(db) {
  return Number(db.prepare("SELECT COALESCE(SUM(byte_size), 0) AS n FROM assets").get().n);
}

export function countHits(db, action, ipHash, since) {
  return Number(
    db.prepare("SELECT COUNT(*) AS n FROM rate_hits WHERE action = ? AND ip_hash = ? AND created_at > ?").get(action, ipHash, since).n,
  );
}

export function addHit(db, action, ipHash, now) {
  db.prepare("INSERT INTO rate_hits (ip_hash, action, created_at) VALUES (?, ?, ?)").run(ipHash, action, now);
}

export function purgeHits(db, now) {
  db.prepare("DELETE FROM rate_hits WHERE created_at < ?").run(now - 3 * 24 * 60 * 60 * 1000);
}
