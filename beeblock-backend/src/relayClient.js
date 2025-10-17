'use strict';
// Lightweight relay client using nostr-tools' relay pool
const { SimplePool, getEventHash, validateEvent } = require('nostr-tools');

function createRelayPool(relaysCsv) {
  const pool = new SimplePool();
  const relays = (relaysCsv || '').split(',').map(s => s.trim()).filter(Boolean);
  return { pool, relays };
}

module.exports = { createRelayPool };
