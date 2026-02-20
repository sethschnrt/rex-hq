// Rex Status API — Cloudflare Worker + KV
// GET /  → returns {"status":"idle|typing|working"}
// PUT /  → sets status from JSON body {"status":"typing"}
// Typing/working auto-expires to idle after 30s unless refreshed

export interface Env {
  STATUS_KV: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store',
};

const TTL_MS = 30_000; // typing/working expires after 30s

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method === 'PUT') {
      try {
        const body = await request.json() as { status?: string };
        const status = body.status || 'idle';
        const value = JSON.stringify({ status, ts: Date.now() });
        await env.STATUS_KV.put('current', value);
        return new Response(JSON.stringify({ status }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'bad request' }), {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET — check TTL for non-idle statuses
    const raw = await env.STATUS_KV.get('current');
    let status = 'idle';
    if (raw) {
      try {
        const data = JSON.parse(raw);
        status = data.status || 'idle';
        // Auto-expire typing/working after TTL
        if (status !== 'idle' && data.ts && Date.now() - data.ts > TTL_MS) {
          status = 'idle';
        }
      } catch {
        // Legacy format (plain string) — treat as-is, no TTL
        status = raw;
      }
    }
    return new Response(JSON.stringify({ status }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
