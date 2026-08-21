import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = [
  "index.html",
  "hermes.html",
  "styles.css",
  "script.js",
  "site-config.js",
  "install/index.html",
  "install/install.css",
  "install/install.js",
];
const contents = await Promise.all(
  sourceFiles.map(async (file) => [file, await readFile(resolve(root, file), "utf8")]),
);
const source = new Map(contents);
const indexHtml = source.get("index.html");
const script = source.get("script.js");
const config = source.get("site-config.js");
const hermesHtml = source.get("hermes.html");
const installHtml = source.get("install/index.html");
const installScript = source.get("install/install.js");

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const scanned = [...source.values()].join("\n");

expect(indexHtml.includes('id="apply"'), "#apply 신청 영역이 없습니다.");
expect(indexHtml.includes("당근으로 신청"), "당근 신청 버튼이 없습니다.");
expect(indexHtml.includes("카카오로 신청"), "개인 카카오톡 신청 버튼이 없습니다.");
expect(indexHtml.includes('data-contact-key="paidWorkshop"'), "당근 신청 링크 설정이 없습니다.");
expect(indexHtml.includes('data-contact-key="kakaoProfile"'), "카카오 신청 링크 설정이 없습니다.");
expect(!/data-airtable|Airtable|AIRTABLE|airtable\.com|신청 폼 준비/i.test(scanned), "Airtable 신청 흐름이 남아 있습니다.");
expect(!/무상 보충|보충교육|completion-support|조건 충족자 완료/i.test(scanned), "삭제 대상 보충교육 문구가 남아 있습니다.");
expect(!/전화 문의|010-3065|821030657890|oneToOneInterest/i.test(scanned), "전화 문의 정보가 남아 있습니다.");
expect(!/api\.airtable\.com|Authorization:\s*Bearer|pat[A-Za-z0-9_-]{10,}/i.test(scanned), "Airtable 인증 정보 또는 API 호출이 남아 있습니다.");
expect(config.includes("CONTACT_NOTE"), "신청 채널 설정 안내가 없습니다.");
expect(script.includes("CONTACT_LINKS"), "연락 채널 설정이 없습니다.");
expect(indexHtml.includes('href="install/"'), "메인 내비게이션에 설치 안내 링크가 없습니다.");
expect(installHtml.includes("Codex 설치 요청문 복사"), "설치 요청문 복사 버튼이 없습니다.");
expect(installHtml.includes('data-install-request'), "복사할 설치 요청문 원본이 없습니다.");
expect(installHtml.includes('role="tablist"'), "운영체제 선택기가 없습니다.");
expect(installHtml.includes("macOS") && installHtml.includes("Windows"), "macOS와 Windows 안내가 모두 필요합니다.");
expect(installHtml.includes("TELEGRAM_ALLOWED_USERS"), "Telegram 사용자 허용 목록 안내가 없습니다.");
expect(installHtml.includes("v1.0.0"), "안정 버전이 설치 요청문에 없습니다.");
expect(
  installHtml.includes("https://raw.githubusercontent.com/jeremylee0213/builderslab-starter/v1.0.0/prompts/codex-install.md"),
  "버전 고정 Codex 지침 URL이 없습니다.",
);
expect(!/curl -fsSL|iex\s*\(irm/i.test(installHtml), "홈페이지에 긴 설치 명령을 중복하면 안 됩니다.");
expect(!/<a(?=[^>]*target="_blank")(?![^>]*rel="noopener noreferrer")/i.test(installHtml), "새 창 외부 링크에 rel 속성이 없습니다.");
expect(installScript.includes("navigator.clipboard"), "클립보드 복사 동작이 없습니다.");
expect(hermesHtml.includes("Hermes + LLM Wiki 3시간"), "기존 Hermes 입문교육 페이지가 바뀌었습니다.");

const builtIndex = await readFile(resolve(root, "dist", "client", "index.html"), "utf8");
const builtScript = await readFile(resolve(root, "dist", "client", "script.js"), "utf8");
const builtInstall = await readFile(resolve(root, "dist", "client", "install", "index.html"), "utf8");
expect(!/data-airtable|Airtable|AIRTABLE|airtable\.com|신청 폼 준비/i.test(`${builtIndex}\n${builtScript}`), "빌드 결과에 Airtable 신청 흐름이 남아 있습니다.");
expect(builtInstall.includes("Codex 설치 요청문 복사"), "빌드 결과에 설치 페이지가 없습니다.");
await access(resolve(root, "dist", "client", "index.html"));
await access(resolve(root, "dist", "client", "hermes.html"));
await access(resolve(root, "dist", "client", "install", "install.css"));
await access(resolve(root, "dist", "client", "install", "install.js"));

console.log("교육 신청 채널과 설치 페이지 정적 검사 통과");
