import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = ["index.html", "styles.css", "script.js", "site-config.js"];
const contents = await Promise.all(
  sourceFiles.map(async (file) => [file, await readFile(resolve(root, file), "utf8")]),
);
const source = new Map(contents);
const indexHtml = source.get("index.html");
const script = source.get("script.js");
const config = source.get("site-config.js");

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const scanned = [...source.values()].join("\n");

expect(indexHtml.includes('id="apply"'), "#apply 신청 영역이 없습니다.");
expect(indexHtml.includes("당근 댓글로 신청"), "당근 신청 버튼이 없습니다.");
expect(indexHtml.includes("개인 카카오톡으로 신청"), "개인 카카오톡 신청 버튼이 없습니다.");
expect(indexHtml.includes('data-contact-key="paidWorkshop"'), "당근 신청 링크 설정이 없습니다.");
expect(indexHtml.includes('data-contact-key="kakaoProfile"'), "카카오 신청 링크 설정이 없습니다.");
expect(!/data-airtable|Airtable|AIRTABLE|airtable\.com|신청 폼 준비/i.test(scanned), "Airtable 신청 흐름이 남아 있습니다.");
expect(!/무상 보충|보충교육|completion-support|조건 충족자 완료/i.test(scanned), "삭제 대상 보충교육 문구가 남아 있습니다.");
expect(!/전화 문의|010-3065|821030657890|oneToOneInterest/i.test(scanned), "전화 문의 정보가 남아 있습니다.");
expect(!/api\.airtable\.com|Authorization:\s*Bearer|pat[A-Za-z0-9_-]{10,}/i.test(scanned), "Airtable 인증 정보 또는 API 호출이 남아 있습니다.");
expect(config.includes("CONTACT_NOTE"), "신청 채널 설정 안내가 없습니다.");
expect(script.includes("CONTACT_LINKS"), "연락 채널 설정이 없습니다.");

const builtIndex = await readFile(resolve(root, "dist", "client", "index.html"), "utf8");
const builtScript = await readFile(resolve(root, "dist", "client", "script.js"), "utf8");
expect(!/data-airtable|Airtable|AIRTABLE|airtable\.com|신청 폼 준비/i.test(`${builtIndex}\n${builtScript}`), "빌드 결과에 Airtable 신청 흐름이 남아 있습니다.");
await access(resolve(root, "dist", "client", "index.html"));

console.log("교육 신청 채널 정적 검사 통과");
