#!/usr/bin/env node
// Tiny HTTP server for Rex status — runs on Mac mini, CORS enabled
import { createServer } from 'http';

let status = 'idle';
const PORT = 3789;

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { status = JSON.parse(body).status || 'idle'; } catch {}
      res.end(JSON.stringify({ status }));
    });
    return;
  }

  res.end(JSON.stringify({ status }));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Rex status server on :${PORT}`);
});
