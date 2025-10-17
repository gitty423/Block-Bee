'use strict';
const { createRelayPool } = require('./relayClient');
const { validateEvent } = require('nostr-tools');

async function startIndexer(dbObj) {
  const relaysCsv = process.env.RELAYS || 'wss://relay.damus.io';
  const { pool, relays } = createRelayPool(relaysCsv);

  // subscribe to kinds we care about: kind 4 (DM), group manifests (>=30000) and receipts/typing(20000..)
  const filter = {
    kinds: [4, 3], // 4 = direct messages; 3 is metadata (e.g., profile). Extend as needed.
    since: Math.floor(Date.now()/1000) - 60 * 60 * 24 * 7 // last 7 days by default
  };

  // open connections and subscribe
  const sub = pool.sub(relays, [filter]);
  console.log('Indexer subscribed to relays:', relays);

  sub.on('event', (event, relay) => {
    try {
      // basic event validation
      const ok = validateEvent(event);
      if (!ok) {
        console.warn('Invalid event received, skipping:', event.id);
        return;
      }
    } catch (err) {
      console.warn('Event validation error:', err);
      return;
    }

    const now = Math.floor(Date.now()/1000);
    // insert into DB (raw_content stored so indexer doesn't touch encrypted payload)
    const insert = dbObj.insertEvent;
    insert.run({
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      created_at: event.created_at || now,
      raw_content: JSON.stringify(event),
      content: typeof event.content === 'string' ? event.content : JSON.stringify(event.content),
      sig: event.sig || null,
      relay: relay || null,
      received_at: now
    });
  });

  sub.on('eose', (relay) => {
    // end of stored events for this subscription
    console.log('EOSE from relay', relay);
  });

  sub.on('error', (err, relay) => {
    console.error('Subscription error from relay', relay, err);
  });

  // also periodically update relays table
  setInterval(() => {
    const now = Math.floor(Date.now()/1000);
    relays.forEach(url => dbObj.upsertRelay.run(url, now));
  }, 60_000);
}

module.exports = { startIndexer };
