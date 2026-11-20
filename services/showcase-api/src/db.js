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

/*
 * 마이그레이션: 기존 데이터를 지우지 않고 필요한 것만 더합니다.
 * - v2: entries.contact 열 추가 (ALTER TABLE ADD COLUMN, 기존 행은 빈 문자열)
 *       likes 새 테이블 (결과물당 IP 해시 1회, 결과물 삭제 시 함께 삭제)
 * 여러 번 실행해도 결과가 같습니다.
 */
const SCHEMA_VERSION = 2;

function columnNames(db, table) {
  return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
}

export function migrate(db) {
  db.transaction(() => {
    if (!columnNames(db, "entries").has("contact")) {
      db.exec("ALTER TABLE entries ADD COLUMN contact TEXT NOT NULL DEFAULT ''");
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS likes (
        entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
        ip_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (entry_id, ip_hash)
      );
    `);
    if (Number(db.pragma("user_version", { simple: true })) < SCHEMA_VERSION) {
      db.pragma(`user_version = ${SCHEMA_VERSION}`);
    }
  })();
}

export function openDatabase(file) {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

export function likeCount(db, entryId) {
  return Number(db.prepare("SELECT COUNT(*) AS n FROM likes WHERE entry_id = ?").get(entryId).n);
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
