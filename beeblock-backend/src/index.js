'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { startIndexer } = require('./indexer');
const { initDb } = require('./db');
const api = require('./api');

const PORT = process.env.PORT || 3000;

// Initialize DB
const db = initDb(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'beeblock.db'));

// Start indexer (non-blocking)
startIndexer(db).catch(err => {
  console.error('Indexer failed to start:', err);
  process.exit(1);
});

// Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// mount API with DB injected
app.use('/api', api(db));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'beeblock-backend' });
});

app.listen(PORT, () => {
  console.log(`BeeBlock backend listening on port ${PORT}`);
});
