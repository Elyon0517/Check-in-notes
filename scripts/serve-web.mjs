import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 5002);
const host = process.env.HOST || "localhost";
const distDir = resolve(process.cwd(), "dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

if (!existsSync(distDir)) {
  console.error("Missing dist directory. Run `npm run build:web` first.");
  process.exit(1);
}

function resolveRequestPath(url = "/") {
  const requestPath = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    join(distDir, safePath),
    join(distDir, `${safePath}.html`),
    join(distDir, safePath, "index.html"),
  ];

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (!resolved.startsWith(`${distDir}${sep}`) && resolved !== distDir) {
      continue;
    }
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      return resolved;
    }
  }

  return join(distDir, "index.html");
}

const server = createServer((req, res) => {
  const filePath = resolveRequestPath(req.url);
  const ext = extname(filePath);
  const shouldAvoidCache = ext === ".html" || ext === ".webmanifest";

  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cache-Control", shouldAvoidCache ? "no-cache" : "public, max-age=3600");
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");

  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Serving Check-in Notes at http://${host}:${port}`);
});
