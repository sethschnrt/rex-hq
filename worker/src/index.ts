// Rex Status API — Cloudflare Worker + KV
// GET /  → returns {"status":"idle|typing|working"}
// PUT /  → sets status from JSON body {"status":"typing"}

export interface Env {
  STATUS_KV: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method === 'PUT') {
      try {
        const body = await request.json() as { status?: string };
        const status = body.status || 'idle';
        await env.STATUS_KV.put('current', status);
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

    // GET
    const status = (await env.STATUS_KV.get('current')) || 'idle';
    return new Response(JSON.stringify({ status }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
