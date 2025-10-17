# BeeBlock Backend

**What this repo contains**
- Nostr relay subscriber/indexer (Node.js) that listens to relays and stores events in SQLite.
- REST API for search, chat history, group manifests, and simple moderation endpoints.
- Push-notification webhook stub (replace with your provider).
- Carefully commented, minimal dependencies, ready to pair with BeeBlock frontend.

**Design notes**
- This backend *does not* hold user private keys or perform E2EE. All encryption/decryption occurs on the client.
- The indexer stores raw Nostr events (encrypted content). It helps with search, push notifications and message persistence.
- The project uses `better-sqlite3` for a zero-ops local DB. For production swap to Postgres/Turso and update `src/db.js`.

## Quick start

1. Copy `.env.example` to `.env` and edit relays list.
2. `npm install`
3. `npm run start`

The project is packaged as a zip file. After unzipping, run the commands above.

## Files of interest
- `src/index.js` — app bootstrap (Express API + indexer start).
- `src/indexer.js` — subscribes to relays and writes events to DB.
- `src/api.js` — REST endpoints (search, fetch chat history, group manifests).
- `src/db.js` — DB initialization and helpers.
- `src/relayClient.js` — lightweight nostr relay websocket client using `nostr-tools`.
- `.env.example` — environment variables.
