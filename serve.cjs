/* Minimal static file server for local preview.
 * Usage: node serve.cjs [port]
 * Port resolution: $PORT (Freebuff injects this for previews) > CLI arg > 8140.
 * Binds 0.0.0.0 so containerized previews can reach it. */
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const root = process.cwd();
const port = Number(process.env.PORT) || Number(process.argv[2]) || 8140;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.ico': 'image/x-icon', '.md': 'text/plain', '.woff2': 'font/woff2', '.wasm': 'application/wasm'
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(normalize(root))) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('Not found'); }
});

server.listen(port, '0.0.0.0', () => console.log(`Serving ${root} at http://0.0.0.0:${port}`));
