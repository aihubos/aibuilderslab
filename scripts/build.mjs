import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distRoot = resolve(projectRoot, "dist");
const clientRoot = resolve(distRoot, "client");
const serverRoot = resolve(distRoot, "server");
const metadataRoot = resolve(distRoot, ".openai");

const requiredFiles = [
  "index.html",
  "hermes.html",
  "styles.css",
  "site-config.js",
  "script.js",
  "sitemap.xml",
  "install/index.html",
  "install/install.css",
  "install/install.js",
];

for (const file of requiredFiles) {
  await access(resolve(projectRoot, file));
}

await rm(distRoot, { recursive: true, force: true });
await mkdir(clientRoot, { recursive: true });
await mkdir(serverRoot, { recursive: true });
await mkdir(metadataRoot, { recursive: true });

for (const file of [
  "index.html",
  "hermes.html",
  "styles.css",
  "site-config.js",
  "script.js",
  "robots.txt",
  "sitemap.xml",
  "CNAME",
  ".nojekyll",
]) {
  await cp(resolve(projectRoot, file), resolve(clientRoot, file));
}

await cp(resolve(projectRoot, "install"), resolve(clientRoot, "install"), {
  recursive: true,
});
await cp(resolve(projectRoot, "assets"), resolve(clientRoot, "assets"), {
  recursive: true,
});
await cp(resolve(projectRoot, "worker", "index.js"), resolve(serverRoot, "index.js"));
await cp(
  resolve(projectRoot, ".openai", "hosting.json"),
  resolve(metadataRoot, "hosting.json"),
);

const html = await readFile(resolve(clientRoot, "index.html"), "utf8");
if (!html.includes("Hermes와 LLM Wiki를") || !html.includes('id="curriculum"')) {
  throw new Error("전환형 홈페이지 핵심 섹션이 없습니다.");
}

const installHtml = await readFile(resolve(clientRoot, "install", "index.html"), "utf8");
if (!installHtml.includes("Codex 설치 요청문 복사")) {
  throw new Error("설치 페이지의 복사 동작이 없습니다.");
}

const sitemap = await readFile(resolve(clientRoot, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://builderslab.ai-hub-os.com/")) {
  throw new Error("sitemap.xml의 홈페이지 주소가 없습니다.");
}

await writeFile(resolve(distRoot, "BUILD_OK"), "AI 빌더스 랩 정적 빌드 완료\n");
console.log(`정적 빌드 완료: ${distRoot}`);
