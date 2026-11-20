import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";

export function createId() {
  return randomBytes(12).toString("base64url");
}

export function createSecret() {
  return randomBytes(18).toString("base64url");
}

export function hashSecret(secret, salt = randomBytes(16)) {
  const hash = scryptSync(String(secret), salt, 32, { N: 16384, r: 8, p: 1 });
  return { salt: salt.toString("base64url"), hash: hash.toString("base64url") };
}

export function verifySecret(secret, saltText, hashText) {
  try {
    const salt = Buffer.from(String(saltText), "base64url");
    const expected = Buffer.from(String(hashText), "base64url");
    const actual = scryptSync(String(secret), salt, expected.length, { N: 16384, r: 8, p: 1 });
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function safeEqual(left, right) {
  const a = createHash("sha256").update(String(left)).digest();
  const b = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(a, b);
}

export function clientIp(request) {
  const header = request.headers["cf-connecting-ip"];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value === "string" && isIP(value.trim())) return value.trim();
  const address = request.ip || request.socket?.remoteAddress || "0.0.0.0";
  return isIP(address) ? address : "0.0.0.0";
}

export function hashIp(ip, salt) {
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

export function loadRateSalt(dataDir, explicitSalt) {
  if (explicitSalt) return String(explicitSalt);
  const file = path.join(dataDir, "rate-salt");
  try {
    const existing = readFileSync(file, "utf8").trim();
    if (existing) return existing;
  } catch {
    // A new data directory gets a new salt.
  }
  const salt = randomBytes(32).toString("hex");
  writeFileSync(file, `${salt}\n`, { mode: 0o600 });
  return salt;
}

export function readAdminToken(file) {
  if (!file) return "";
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}
