// Rex Status Server — Deno Deploy
// GET: returns current status
// PUT: updates status (JSON body: {"status":"typing"})

const kv = await Deno.openKv();

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-cache, no-store",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const status = body.status || "idle";
      await kv.set(["rex-status"], status);
      return new Response(JSON.stringify({ status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  // GET (default)
  const entry = await kv.get(["rex-status"]);
  const status = (entry.value as string) || "idle";
  return new Response(JSON.stringify({ status }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
