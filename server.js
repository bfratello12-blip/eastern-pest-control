/* Minimal zero-dependency static dev server with live reload. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const LIVE_RELOAD_SNIPPET = `<script>
(function () {
  var es = new EventSource('/__events');
  es.onmessage = function (e) { if (e.data === 'reload') location.reload(); };
})();
</script>`;

/** @type {import('http').ServerResponse[]} */
const clients = [];

function broadcastReload() {
  for (const res of clients.slice()) {
    try {
      res.write('data: reload\n\n');
    } catch {
      /* client gone */
    }
  }
}

let reloadTimer = null;
fs.watch(ROOT, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  const name = String(filename).replace(/\\/g, '/');
  if (name.startsWith('node_modules/') || name.startsWith('.git/')) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(broadcastReload, 120);
});

function resolveSafe(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.resolve(ROOT, '.' + path.posix.normalize(decoded));
  // Block traversal outside the project root.
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.url === '/__events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write('retry: 1000\n\n');
    clients.push(res);
    req.on('close', () => {
      const i = clients.indexOf(res);
      if (i > -1) clients.splice(i, 1);
    });
    return;
  }

  let filePath = resolveSafe(req.url || '/');
  if (!filePath) return send(res, 403, 'Forbidden');

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath += '.html';
  }

  if (!fs.existsSync(filePath)) {
    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) {
      const html = fs.readFileSync(notFound, 'utf8').replace('</body>', LIVE_RELOAD_SNIPPET + '</body>');
      return send(res, 404, html, { 'Content-Type': MIME['.html'] });
    }
    return send(res, 404, 'Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';

  if (ext === '.html') {
    const html = fs.readFileSync(filePath, 'utf8').replace('</body>', LIVE_RELOAD_SNIPPET + '</body>');
    return send(res, 200, html, { 'Content-Type': type });
  }

  send(res, 200, fs.readFileSync(filePath), { 'Content-Type': type });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Eastern Pest Control — dev server running`);
  console.log(`  http://localhost:${PORT}\n`);
});
