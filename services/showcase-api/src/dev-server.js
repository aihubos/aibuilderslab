import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdirSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { resolveInside, uploadResponseHeaders } from "./upload-headers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const previewRoot = path.join(repoRoot, ".preview", "showcase");
const dataDir = process.env.DATA_DIR || path.join(previewRoot, "data");
const uploadDir = process.env.UPLOAD_DIR || path.join(previewRoot, "uploads");
const mediaDir = process.env.MEDIA_DIR || path.join(previewRoot, "media", "samples");
const port = Number(process.env.PORT || 4180);
const host = process.env.HOST || "127.0.0.1";

mkdirSync(dataDir, { recursive: true });
mkdirSync(uploadDir, { recursive: true });
mkdirSync(mediaDir, { recursive: true });

const app = await buildApp({
  dataDir,
  uploadDir,
  adminTokenFile: process.env.ADMIN_TOKEN_FILE || path.join(previewRoot, "admin-token"),
  logger: { level: process.env.LOG_LEVEL || "warn" },
});
await app.ready();

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".woff2", "font/woff2"],
  [".mp4", "video/mp4"],
  [".txt", "text/plain; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".zip", "application/zip"],
]);

function contentType(file) {
  return types.get(path.extname(file).toLowerCase()) || "application/octet-stream";
}

function blocked(relative) {
  return relative.split(/[\\/]/).some((part) => part.startsWith(".") || part === "node_modules");
}

function sendFile(req, res, file, { headers = {}, contentTypeName = contentType(file) } = {}) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  const stat = statSync(file);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", contentTypeName);
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.statusCode = 416;
      res.setHeader("Content-Range", `bytes */${stat.size}`);
      res.end();
      return;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stat.size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= stat.size) {
      res.statusCode = 416;
      res.setHeader("Content-Range", `bytes */${stat.size}`);
      res.end();
      return;
    }
    res.statusCode = 206;
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    res.setHeader("Content-Length", String(end - start + 1));
    if (req.method === "HEAD") return res.end();
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Length", String(stat.size));
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    if (url.pathname.startsWith("/lounge/api/") || url.pathname === "/lounge/api") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const payload = Buffer.concat(chunks);
      let target = url.pathname.replace(/^\/lounge\/api/, "") || "/";
      if (!target.startsWith("/")) target = `/${target}`;
      const result = await app.inject({
        method: req.method,
        url: `${target}${url.search}`,
        headers: { ...req.headers, host: "127.0.0.1", "content-length": String(payload.length) },
        payload,
      });
      res.statusCode = result.statusCode;
      for (const [key, value] of Object.entries(result.headers)) {
        if (value != null && key !== "transfer-encoding") res.setHeader(key, value);
      }
      res.end(result.rawPayload);
      return;
    }

    if (url.pathname.startsWith("/lounge/uploads/")) {
      const relative = url.pathname.slice("/lounge/uploads/".length);
      const file = resolveInside(uploadDir, relative);
      if (!file) {
        res.statusCode = 400;
        res.end("Bad path");
        return;
      }
      sendFile(req, res, file, { headers: uploadResponseHeaders(path.basename(file)) });
      return;
    }

    if (url.pathname.startsWith("/lounge/media/samples/")) {
      const relative = url.pathname.slice("/lounge/media/samples/".length);
      const file = resolveInside(mediaDir, relative);
      if (!file) {
        res.statusCode = 400;
        res.end("Bad path");
        return;
      }
      sendFile(req, res, file, {
        headers: {
          "Cache-Control": "public, max-age=2592000",
          "X-Content-Type-Options": "nosniff",
        },
      });
      return;
    }

    const relative = decodeURIComponent(url.pathname);
    if (blocked(relative)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const file = resolveInside(repoRoot, relative === "/" ? "index.html" : relative);
    if (!file) {
      res.statusCode = 400;
      res.end("Bad path");
      return;
    }
    const stat = existsSync(file) ? statSync(file) : null;
    const index = stat?.isDirectory() ? path.join(file, "index.html") : file;
    sendFile(req, res, index);
  } catch (error) {
    res.statusCode = 500;
    res.end("Server error");
    console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`showcase dev http://${host}:${port}/lounge/showcase/`);
});
