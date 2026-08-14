import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distRoot = resolve(projectRoot, "dist");
const clientRoot = resolve(distRoot, "client");
const serverRoot = resolve(distRoot, "server");
const metadataRoot = resolve(distRoot, ".openai");

const requiredFiles = ["index.html", "styles.css", "script.js"];

for (const file of requiredFiles) {
  await access(resolve(projectRoot, file));
}

await rm(distRoot, { recursive: true, force: true });
await mkdir(clientRoot, { recursive: true });
await mkdir(serverRoot, { recursive: true });
await mkdir(metadataRoot, { recursive: true });

for (const file of [...requiredFiles, "robots.txt", "CNAME", ".nojekyll"]) {
  await cp(resolve(projectRoot, file), resolve(clientRoot, file));
}

await cp(resolve(projectRoot, "assets"), resolve(clientRoot, "assets"), {
  recursive: true,
});
await cp(resolve(projectRoot, "worker", "index.js"), resolve(serverRoot, "index.js"));
await cp(
  resolve(projectRoot, ".openai", "hosting.json"),
  resolve(metadataRoot, "hosting.json"),
);

const html = await readFile(resolve(clientRoot, "index.html"), "utf8");
if (!html.includes("AI라는 큰 파도")) {
  throw new Error("완성 페이지의 핵심 문구가 없습니다.");
}

await writeFile(resolve(distRoot, "BUILD_OK"), "AI 빌더스 랩 정적 빌드 완료\n");
console.log(`정적 빌드 완료: ${distRoot}`);
