import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const projectRoot = resolve(process.env.SITE_ROOT || process.cwd());
const port = Number(process.env.PORT || 4173);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".avif", "image/avif"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".txt", "text/plain; charset=utf-8"],
]);

function safePathname(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://127.0.0.1:${port}`).pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = resolve(projectRoot, `.${requestedPath}`);
  const rootPrefix = projectRoot.endsWith(sep) ? projectRoot : `${projectRoot}${sep}`;
  return absolutePath.startsWith(rootPrefix) ? absolutePath : null;
}

const server = createServer(async (request, response) => {
  const filePath = safePathname(request.url || "/");

  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("접근할 수 없는 경로입니다.");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("not-file");

    response.writeHead(200, {
      "Content-Type": contentTypes.get(extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("파일을 찾을 수 없습니다.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local URL: http://127.0.0.1:${port}`);
});
