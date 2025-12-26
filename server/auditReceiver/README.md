Audit Receiver (Express) — quick start

1. Install deps:

```bash
cd server/auditReceiver
npm install express morgan
```

2. Run:

```bash
AUDIT_PORT=7242 node server.js
```

3. Configure client: set `VITE_AUDIT_ENDPOINT` or `AUDIT_ENDPOINT` to `http://localhost:7242/ingest/audit`

Logs are appended as NDJSON to `server/auditReceiver/audit.log`.


