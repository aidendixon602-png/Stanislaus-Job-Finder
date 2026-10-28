// Tiny static server for California Job Finder — no dependencies.
// Usage: npm start   (or: node serve.mjs)  →  http://localhost:4173
// You don't need this to use the app: just double-click index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/\/+$/, '');
const PORT = 4173;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};
// Never serve project internals, even if someone guesses the path.
const DENY = new Set(['/serve.mjs', '/package.json', '/package-lock.json', '/wrangler.jsonc', '/.gitignore', '/.assetsignore', '/_headers', '/readme.md', '/security.md', '/stanislaus-job-finder.zip']);
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; worker-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};
// Simple per-IP rate limit (240 requests/minute) — plenty for a one-page site.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 60000; }
  rec.count += 1; hits.set(ip, rec);
  return rec.count > 240;
}

const server = createServer(async (req, res) => {
  const send = (code, body, type) => {
    res.writeHead(code, { ...SECURITY_HEADERS, 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': code === 200 ? 'no-cache' : 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { send(405, 'Method not allowed'); return; }
    if (rateLimited(req.socket.remoteAddress || 'unknown')) { send(429, 'Too many requests'); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).toLowerCase(); }
    catch { send(400, 'Bad request'); return; }
    if (pathname === '/') pathname = '/index.html';
    if (DENY.has(pathname) || pathname.split('/').some((part) => part.startsWith('.'))) { send(404, 'Not found'); return; }
    if (!MIME[extname(pathname).toLowerCase()]) { send(404, 'Not found'); return; }
    const filePath = normalize(join(root, pathname));
    if (filePath !== root && !filePath.startsWith(root + sep)) { send(403, 'Forbidden'); return; }
    const data = await readFile(filePath);
    send(200, data, MIME[extname(filePath).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(404, 'Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`California Job Finder running at http://localhost:${PORT}`);
});
