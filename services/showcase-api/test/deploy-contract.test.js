import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");

test("deploy files keep uploads outside the public rsync tree and apply the nginx limits", async () => {
  const compose = await readFile(path.join(root, "deploy/docker-compose.showcase.yml"), "utf8");
  const nginx = await readFile(path.join(root, "deploy/nginx/showcase-locations.conf"), "utf8");
  const backup = await readFile(path.join(root, "deploy/backup-showcase.sh"), "utf8");
  assert.match(compose, /aibl-showcase-api/);
  assert.match(compose, /mem_limit:\s*256m/);
  assert.match(compose, /cpus:\s*0\.5/);
  assert.match(compose, /read_only:\s*true/);
  assert.match(compose, /127\.0\.0\.1:4332:4331/);
  assert.match(compose, /\/opt\/aibl-showcase\/uploads/);
  assert.doesNotMatch(compose, /\/opt\/aibuilderslab\/public/);
  assert.match(nginx, /client_max_body_size\s+25m/);
  assert.match(nginx, /Content-Security-Policy "default-src 'none'"/);
  assert.match(nginx, /X-Content-Type-Options nosniff/);
  assert.match(nginx, /X-Robots-Tag noindex/);
  assert.match(nginx, /Content-Disposition "attachment"/);
  assert.match(nginx, /expires 30d/);
  assert.match(nginx, /CF-Connecting-IP/);
  assert.match(backup, /showcase\.db/);
  assert.match(backup, /mtime \+7/);
});
