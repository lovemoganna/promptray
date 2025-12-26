const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const PORT = process.env.AUDIT_PORT || process.env.PORT || 7242;
const INGEST_PATH = process.env.AUDIT_INGEST_PATH || '/ingest/audit';
const OUT_LOG = process.env.AUDIT_LOG_PATH || path.join(__dirname, 'audit.log');

// Ensure directory exists
try {
  fs.mkdirSync(path.dirname(OUT_LOG), { recursive: true });
} catch (e) {}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));

app.post(INGEST_PATH, (req, res) => {
  try {
    const payload = {
      receivedAt: Date.now(),
      ip: req.ip,
      headers: {
        'user-agent': req.get('user-agent') || '',
      },
      body: req.body,
    };
    // append as NDJSON
    fs.appendFile(OUT_LOG, JSON.stringify(payload) + '\n', (err) => {
      if (err) {
        console.error('Failed to write audit log', err);
      }
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Ingest error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/', (req, res) => {
  res.send(`Audit Receiver running. POST to ${INGEST_PATH}`);
});

app.listen(PORT, () => {
  console.log(`Audit Receiver listening on port ${PORT}, ingest path: ${INGEST_PATH}, log: ${OUT_LOG}`);
});


