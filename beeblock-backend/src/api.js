'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');

function api(dbObj) {
  const router = express.Router();

  // Health
  router.get('/health', (req, res) => res.json({ ok: true }));

  // fetch chat history between two pubkeys (returns raw events encrypted payloads)
  router.get('/chat/:a/:b', (req, res) => {
    const { a, b } = req.params;
    const stmt = dbObj.prepare(`
      SELECT * FROM events
      WHERE kind = 4 AND
        ((pubkey = ? AND json_extract(raw_content, '$.tags') LIKE '%' || ? || '%')
         OR (pubkey = ? AND json_extract(raw_content, '$.tags') LIKE '%' || ? || '%'))
      ORDER BY created_at ASC
      LIMIT 1000
    `);
    try {
      const rows = stmt.all(a, b, b, a);
      res.json({ ok: true, count: rows.length, events: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: 'db_error' });
    }
  });

  // basic search (very simple substring search on content)
  router.get('/search', (req, res) => {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.status(400).json({ ok: false, error: 'query_too_short' });
    const stmt = dbObj.prepare(\`SELECT id, pubkey, kind, created_at, content FROM events
      WHERE content LIKE '%' || ? || '%'
      ORDER BY created_at DESC LIMIT 200\`);
    const rows = stmt.all(q);
    res.json({ ok: true, count: rows.length, results: rows });
  });

  // group manifest CRUD (admin-like; for real apps add auth)
  router.post('/groups', (req, res) => {
    const { id, creator_pubkey, name, avatar_cid, manifest_json } = req.body;
    const created_at = Math.floor(Date.now()/1000);
    try {
      const stmt = dbObj.prepare(\`INSERT INTO groups(id, creator_pubkey, name, avatar_cid, manifest_json, created_at)
        VALUES(?,?,?,?,?,?)\`);
      stmt.run(id || uuidv4(), creator_pubkey, name || null, avatar_cid || null, JSON.stringify(manifest_json || {}), created_at);
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'db_error' });
    }
  });

  router.get('/groups/:id', (req, res) => {
    const id = req.params.id;
    const stmt = dbObj.prepare('SELECT * FROM groups WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, group: row });
  });

  // Relay list
  router.get('/relays', (req, res) => {
    const stmt = dbObj.prepare('SELECT url, last_seen FROM relays ORDER BY last_seen DESC');
    const rows = stmt.all();
    res.json({ ok: true, relays: rows });
  });

  // Push notification stub (POST /api/push). Replace with your provider logic.
  router.post('/push', (req, res) => {
    // expected: { pubkey, title, body, data }
    console.log('Push webhook received (stub):', req.body);
    res.json({ ok: true, queued: false });
  });

  return router;
}

module.exports = api;
