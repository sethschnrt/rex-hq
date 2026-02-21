// Rex HQ API — Cloudflare Worker + KV
// Status: GET /status, PUT /status
// Tasks:  GET /tasks, POST /tasks, PUT /tasks/:id, DELETE /tasks/:id
// Chat:   POST /chat/send, GET /chat/messages, POST /chat/reply

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
  board: string;
  column: string;
  title: string;
  desc: string;
  priority: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

// ── Chat types ──
interface ChatMsg {
  id: string;
  sender: 'user' | 'rex';
  text: string;
  media?: string;       // URL to media file
  mediaType?: string;   // 'image' | 'video' | 'file'
  timestamp: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Task helpers ──
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

// ── Chat helpers ──
async function getMessages(env: Env, limit = 50): Promise<ChatMsg[]> {
  const raw = await env.STATUS_KV.get('chat_messages');
  let msgs: ChatMsg[] = [];
  if (raw) {
    try { msgs = JSON.parse(raw); } catch { msgs = []; }
  }
  return msgs.slice(-limit);
}

async function addMessage(env: Env, msg: ChatMsg): Promise<void> {
  const msgs = await getMessages(env, 200);
  msgs.push(msg);
  // Keep last 200 messages
  const trimmed = msgs.slice(-200);
  await env.STATUS_KV.put('chat_messages', JSON.stringify(trimmed));
}

// ── Router ──
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // ── Status ──
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

    // ── Tasks ──
    if (path === '/tasks' && request.method === 'GET') {
      const board = url.searchParams.get('board') || undefined;
      const tasks = await getTasks(env, board);
      return json({ tasks });
    }

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

    if (taskMatch && request.method === 'DELETE') {
      const id = taskMatch[1];
      let tasks = await getTasks(env);
      const before = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      if (tasks.length === before) return json({ error: 'not found' }, 404);
      await saveTasks(env, tasks);
      return json({ ok: true });
    }

    // ── Chat: Send message (user → KV) ──
    if (path === '/chat/send' && request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const text = formData.get('text') as string || '';
          const file = formData.get('file') as File | null;

          const msg: ChatMsg = {
            id: generateId(),
            sender: 'user',
            text: text || (file ? file.name : ''),
            timestamp: Date.now(),
          };

          if (file) {
            const fType = file.type || '';
            if (fType.startsWith('image/')) msg.mediaType = 'image';
            else if (fType.startsWith('video/')) msg.mediaType = 'video';
            else msg.mediaType = 'file';

            // Store file as base64 data URL in KV (small files only, <1MB)
            const buf = await file.arrayBuffer();
            if (buf.byteLength < 1_000_000) {
              const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
              msg.media = `data:${fType};base64,${b64}`;
            } else {
              msg.text = (msg.text ? msg.text + ' ' : '') + '[file too large for preview]';
            }
          }

          await addMessage(env, msg);
          return json({ ok: true, message: msg }, 201);
        } else {
          const body = await request.json() as { text?: string };
          const text = body.text || '';
          if (!text) return json({ error: 'empty message' }, 400);

          const msg: ChatMsg = {
            id: generateId(),
            sender: 'user',
            text,
            timestamp: Date.now(),
          };
          await addMessage(env, msg);
          return json({ ok: true, message: msg }, 201);
        }
      } catch (e: any) {
        return json({ error: 'bad request', detail: e.message }, 400);
      }
    }

    // ── Chat: Get messages ──
    if (path === '/chat/messages' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const after = parseInt(url.searchParams.get('after') || '0');
      let msgs = await getMessages(env, limit);
      if (after) msgs = msgs.filter(m => m.timestamp > after);
      return json({ messages: msgs });
    }

    // ── Chat: Pending messages (Rex polls this) ──
    if (path === '/chat/pending' && request.method === 'GET') {
      const raw = await env.STATUS_KV.get('chat_last_read');
      const lastRead = raw ? parseInt(raw) : 0;
      const msgs = await getMessages(env, 200);
      const pending = msgs.filter(m => m.sender === 'user' && m.timestamp > lastRead);
      return json({ messages: pending, lastRead });
    }

    // ── Chat: Mark as read ──
    if (path === '/chat/read' && request.method === 'POST') {
      const body = await request.json() as { timestamp?: number };
      const ts = body.timestamp || Date.now();
      await env.STATUS_KV.put('chat_last_read', ts.toString());
      return json({ ok: true });
    }

    // ── Chat: Rex reply (called by Rex's scripts) ──
    if (path === '/chat/reply' && request.method === 'POST') {
      try {
        const body = await request.json() as { text?: string; media?: string; mediaType?: string };
        const text = body.text || '';
        if (!text && !body.media) return json({ error: 'empty reply' }, 400);

        const msg: ChatMsg = {
          id: generateId(),
          sender: 'rex',
          text,
          timestamp: Date.now(),
        };
        if (body.media) { msg.media = body.media; msg.mediaType = body.mediaType || 'image'; }

        await addMessage(env, msg);
        return json({ ok: true, message: msg }, 201);
      } catch {
        return json({ error: 'bad request' }, 400);
      }
    }

    return json({ error: 'not found' }, 404);
  },
};
