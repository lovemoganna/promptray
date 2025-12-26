export const getAuditEndpoint = (): string | null => {
  try {
    // Prefer explicit env var, fallback to localStorage setting (for dev)
    // Vite users can set VITE_AUDIT_ENDPOINT at build time; process.env also supported in some setups
    const env = (process.env.VITE_AUDIT_ENDPOINT || process.env.AUDIT_ENDPOINT || '') as string;
    if (env && env.trim().length > 0) return env.trim();
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('prompt_audit_endpoint') || null) : null;
    return stored;
  } catch {
    return null;
  }
};

export const sendAuditEvent = async (payload: Record<string, any>) => {
  try {
    const endpoint = getAuditEndpoint();
    if (!endpoint) return;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ts: Date.now() }),
    });
  } catch (e) {
    // swallow network errors (audit should not block UX)
    try { console.warn('Audit send failed', e); } catch {}
  }
};


