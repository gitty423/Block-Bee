'use strict';
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function initDb(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);

  // Create tables (simple, versioned)
  db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    pubkey TEXT NOT NULL,
    kind INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    raw_content TEXT,
    content TEXT,
    sig TEXT,
    relay TEXT,
    received_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey);
  CREATE INDEX IF NOT EXISTS idx_events_kind_created ON events(kind, created_at);
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    creator_pubkey TEXT,
    name TEXT,
    avatar_cid TEXT,
    manifest_json TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,
    pubkey TEXT,
    status TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS relays (
    url TEXT PRIMARY KEY,
    last_seen INTEGER
  );
  `);

  // Prepared statements
  const insertEvent = db.prepare(`INSERT OR IGNORE INTO events
    (id, pubkey, kind, created_at, raw_content, content, sig, relay, received_at)
    VALUES (@id,@pubkey,@kind,@created_at,@raw_content,@content,@sig,@relay,@received_at)`);

  const upsertRelay = db.prepare(`INSERT INTO relays(url, last_seen) VALUES (?, ?)
    ON CONFLICT(url) DO UPDATE SET last_seen=excluded.last_seen;`);

  return {
    db,
    insertEvent,
    upsertRelay,
    prepare: stmt => db.prepare(stmt)
  };
}

module.exports = { initDb };
