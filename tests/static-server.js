const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 4173;

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const rel = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
    const file = path.join(ROOT, path.normalize(rel).replace(/^[/\\]+/, ""));

    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(body);
    });
  })
  .listen(PORT, "127.0.0.1");
