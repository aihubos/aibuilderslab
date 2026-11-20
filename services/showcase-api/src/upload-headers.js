import path from "node:path";

const IMAGE_NAME = /\.(?:jpe?g|png|gif|webp)$/i;

export function uploadResponseHeaders(storedName) {
  const image = IMAGE_NAME.test(String(storedName || ""));
  return {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
    "X-Robots-Tag": "noindex",
    "Content-Disposition": image ? "inline" : "attachment",
    "Cache-Control": image ? "public, max-age=86400" : "private, max-age=3600",
  };
}

export function resolveInside(root, requestPath) {
  const decoded = decodeURIComponent(String(requestPath || "")).replace(/^\/+/, "");
  if (!decoded || decoded.includes("\0")) return null;
  const rootResolved = path.resolve(root);
  const target = path.resolve(rootResolved, decoded);
  if (target !== rootResolved && !target.startsWith(`${rootResolved}${path.sep}`)) return null;
  return target;
}
