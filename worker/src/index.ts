// Rex HQ API — Cloudflare Worker + KV
// Status: GET /status, PUT /status
// Tasks:  GET /tasks?board=rex, POST /tasks, PUT /tasks/:id, DELETE /tasks/:id

export interface Env {
  STATUS_KV: KVNamespace;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const TTL_MS = 30_000;

// ── Task types ──
interface Task {
  id: string;
  board: string;     // "seth" | "rex"
  column: string;    // "todo" | "progress" | "done"
  title: string;
  desc: string;      // short description
  priority: string;  // "low" | "med" | "high"
  order: number;
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function getTasks(env: Env, board?: string): Promise<Task[]> {
  const raw = await env.STATUS_KV.get('tasks');
  let tasks: Task[] = [];
  if (raw) {
    try { tasks = JSON.parse(raw); } catch { tasks = []; }
  }
  if (board) tasks = tasks.filter(t => t.board === board);
  return tasks.sort((a, b) => a.order - b.order);
}

async function saveTasks(env: Env, tasks: Task[]): Promise<void> {
  await env.STATUS_KV.put('tasks', JSON.stringify(tasks));
}

// ── Router ──
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // ── Status endpoints (original) ──
    if (path === '/status' || path === '/') {
      if (request.method === 'PUT') {
        try {
          const body = await request.json() as { status?: string };
          const status = body.status || 'idle';
          const value = JSON.stringify({ status, ts: Date.now() });
          await env.STATUS_KV.put('current', value);
          return json({ status });
        } catch {
          return json({ error: 'bad request' }, 400);
        }
      }

      // GET
      const raw = await env.STATUS_KV.get('current');
      let status = 'idle';
      if (raw) {
        try {
          const data = JSON.parse(raw);
          status = data.status || 'idle';
          if (status !== 'idle' && data.ts && Date.now() - data.ts > TTL_MS) {
            status = 'idle';
          }
        } catch {
          status = raw;
        }
      }
      return json({ status });
    }

    // ── Tasks endpoints ──
    // GET /tasks?board=seth
    if (path === '/tasks' && request.method === 'GET') {
      const board = url.searchParams.get('board') || undefined;
      const tasks = await getTasks(env, board);
      return json({ tasks });
    }

    // POST /tasks — create task
    if (path === '/tasks' && request.method === 'POST') {
      try {
        const body = await request.json() as Partial<Task>;
        const tasks = await getTasks(env);
        const board = body.board || 'rex';
        const column = body.column || 'todo';
        const boardColTasks = tasks.filter(t => t.board === board && t.column === column);
        const newTask: Task = {
          id: generateId(),
          board,
          column,
          title: body.title || 'Untitled',
          desc: body.desc || '',
          priority: body.priority || 'low',
          order: boardColTasks.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        tasks.push(newTask);
        await saveTasks(env, tasks);
        return json({ task: newTask }, 201);
      } catch {
        return json({ error: 'bad request' }, 400);
      }
    }

    // PUT /tasks/:id — update task (move column, rename, reorder)
    const taskMatch = path.match(/^\/tasks\/([^/]+)$/);
    if (taskMatch && request.method === 'PUT') {
      try {
        const id = taskMatch[1];
        const body = await request.json() as Partial<Task>;
        const tasks = await getTasks(env);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return json({ error: 'not found' }, 404);

        if (body.title !== undefined) tasks[idx].title = body.title;
        if (body.column !== undefined) tasks[idx].column = body.column;
        if (body.order !== undefined) tasks[idx].order = body.order;
        if (body.board !== undefined) tasks[idx].board = body.board;
        if (body.priority !== undefined) tasks[idx].priority = body.priority;
        if (body.desc !== undefined) tasks[idx].desc = body.desc;
        tasks[idx].updatedAt = Date.now();

        await saveTasks(env, tasks);
        return json({ task: tasks[idx] });
      } catch {
        return json({ error: 'bad request' }, 400);
      }
    }

    // DELETE /tasks/:id
    if (taskMatch && request.method === 'DELETE') {
      const id = taskMatch[1];
      let tasks = await getTasks(env);
      const before = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      if (tasks.length === before) return json({ error: 'not found' }, 404);
      await saveTasks(env, tasks);
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },
};
