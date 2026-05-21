import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

export { randomUUID as uuid };

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "glowstudio.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gs_phantom (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_roster (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      role       TEXT NOT NULL,
      score      INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_ticker (
      id         TEXT PRIMARY KEY,
      staff_id   TEXT NOT NULL REFERENCES gs_roster(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      type       TEXT NOT NULL,
      weight     INTEGER NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_ledger (
      id         TEXT PRIMARY KEY,
      staff_id   TEXT NOT NULL REFERENCES gs_roster(id) ON DELETE CASCADE,
      action     TEXT NOT NULL,
      old_role   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_cluster (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_items (
      id          TEXT PRIMARY KEY,
      server_id   TEXT NOT NULL REFERENCES gs_cluster(id) ON DELETE CASCADE,
      text        TEXT NOT NULL,
      description TEXT,
      priority    TEXT DEFAULT 'medium',
      due_date    TEXT,
      assigned_to TEXT,
      done        INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_forge (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      plugin_name TEXT NOT NULL,
      description TEXT,
      author      TEXT,
      price       REAL DEFAULT 0,
      state       TEXT DEFAULT 'not_started',
      licensed    INTEGER DEFAULT 0,
      obfuscated  INTEGER DEFAULT 0,
      status      TEXT DEFAULT 'not_ready',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_access (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      salon      TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (username, salon)
    );

    CREATE TABLE IF NOT EXISTS gs_tickets (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      subject    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gs_ticket_messages (
      id         TEXT PRIMARY KEY,
      ticket_id  TEXT NOT NULL REFERENCES gs_tickets(id) ON DELETE CASCADE,
      sender     TEXT NOT NULL,
      message    TEXT NOT NULL,
      is_admin   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getStaffWithRelations(id: string) {
  const db = getDb();
  const member = db.prepare("SELECT * FROM gs_roster WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!member) return null;
  const notes   = db.prepare("SELECT * FROM gs_ticker WHERE staff_id = ? ORDER BY created_at DESC").all(id);
  const ledger  = db.prepare("SELECT * FROM gs_ledger WHERE staff_id = ? ORDER BY created_at DESC").all(id);
  return { ...member, gs_ticker: notes, gs_ledger: ledger };
}

export function getAllStaff() {
  const db = getDb();
  const members = db.prepare("SELECT * FROM gs_roster ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return members.map((m) => {
    const notes  = db.prepare("SELECT * FROM gs_ticker WHERE staff_id = ? ORDER BY created_at DESC").all(m.id as string);
    const ledger = db.prepare("SELECT * FROM gs_ledger WHERE staff_id = ? ORDER BY created_at DESC").all(m.id as string);
    return { ...m, gs_ticker: notes, gs_ledger: ledger };
  });
}

export function getServerWithItems(id: string) {
  const db = getDb();
  const server = db.prepare("SELECT * FROM gs_cluster WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!server) return null;
  const items = db.prepare("SELECT * FROM gs_items WHERE server_id = ? ORDER BY created_at ASC").all(id);
  return { ...server, gs_items: items };
}

export function getAllServers() {
  const db = getDb();
  const servers = db.prepare("SELECT * FROM gs_cluster ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return servers.map((s) => {
    const items = db.prepare("SELECT * FROM gs_items WHERE server_id = ? ORDER BY created_at ASC").all(s.id as string);
    return { ...s, gs_items: items };
  });
}

export function normalizePlugin(p: Record<string, unknown>) {
  return {
    ...p,
    pluginName: p.plugin_name,
    licensed:   Boolean(p.licensed),
    obfuscated: Boolean(p.obfuscated),
  };
}
