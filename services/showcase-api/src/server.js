import { mkdirSync } from "node:fs";
import { buildApp } from "./app.js";

const port = Number(process.env.PORT || 4331);
const host = process.env.HOST || "0.0.0.0";
const dataDir = process.env.DATA_DIR || "/data";
const uploadDir = process.env.UPLOAD_DIR || "/uploads";
mkdirSync(dataDir, { recursive: true });
mkdirSync(uploadDir, { recursive: true });

const app = await buildApp({
  dataDir,
  uploadDir,
  adminTokenFile: process.env.ADMIN_TOKEN_FILE || "/secrets/admin-token",
  logger: {
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: ["req.headers.x-admin-token", "req.headers.x-edit-secret", "req.headers.cookie", "req.headers.authorization"],
      censor: "[redacted]",
    },
  },
});

const close = async () => {
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", close);
process.on("SIGINT", close);

await app.listen({ port, host });
