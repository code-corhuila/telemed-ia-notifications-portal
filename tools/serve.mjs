// Serves dist/ for local development so the shell (localhost:4200) can load
// remoteEntry.json and `./mount` from localhost:4208.
//
// esbuild's own --serve is not used on purpose (advisory GHSA-g7r4 affects it).
//
// Environment: PORT (4208), HOST (127.0.0.1), SHELL_ORIGIN (http://localhost:4200).

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 4208);
const host = process.env.HOST ?? '127.0.0.1';
const shellOrigin = process.env.SHELL_ORIGIN ?? 'http://localhost:4200';

const contentTypes = {
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

/** The file under dist/ for a request path, or null if it leaves dist/. */
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const file = normalize(join(root, decoded));
  return file.startsWith(root + sep) ? file : null;
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', shellOrigin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, HEAD' }).end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' }).end();
    return;
  }

  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolveFile(pathname);
  const type = file && contentTypes[extname(file)];
  const info = type ? await stat(file).catch(() => null) : null;
  if (!info?.isFile()) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': type,
    'Content-Length': info.size,
    // The bundle names carry a hash; the entry and import map must stay fresh.
    'Cache-Control': 'no-cache',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(`notifications portal served at http://${host}:${port} for ${shellOrigin}`);
});
