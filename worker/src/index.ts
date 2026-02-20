// Rex Status API — Cloudflare Worker
// GET /  → returns {"status":"idle|typing|working"}
// PUT /  → sets status from JSON body {"status":"typing"}
// In-memory state (resets on cold start to "idle" which is fine)

let currentStatus = 'idle';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store',
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method === 'PUT') {
      try {
        const body = await request.json() as { status?: string };
        currentStatus = body.status || 'idle';
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ status: currentStatus }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
