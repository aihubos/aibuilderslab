import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = ["index.html", "styles.css", "script.js", "site-config.js"];
const contents = new Map();

for (const file of sourceFiles) {
  const content = await readFile(resolve(root, file), "utf8");
  contents.set(file, content);
}

const indexHtml = contents.get("index.html");
const script = contents.get("script.js");
const config = contents.get("site-config.js");

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const formUrlMatch = config.match(/AIRTABLE_FORM_URL\s*:\s*"([^"]*)"/);
expect(formUrlMatch, "site-config.js에 AIRTABLE_FORM_URL 설정이 필요합니다.");

const configuredFormUrl = formUrlMatch[1];
if (configuredFormUrl) {
  const parsedFormUrl = new URL(configuredFormUrl);
  expect(parsedFormUrl.protocol === "https:", "Airtable 신청 폼 주소는 HTTPS여야 합니다.");
  expect(parsedFormUrl.hostname === "airtable.com" || parsedFormUrl.hostname.endsWith(".airtable.com"), "Airtable 신청 폼 주소만 설정할 수 있습니다.");
}
expect(indexHtml.indexOf('src="site-config.js"') < indexHtml.indexOf('src="script.js'), "site-config.js는 script.js보다 먼저 로드해야 합니다.");
expect(indexHtml.includes('id="apply"'), "#apply 신청 영역이 없습니다.");
expect(indexHtml.includes("data-airtable-apply"), "공식 신청 CTA가 없습니다.");
expect(indexHtml.includes("data-airtable-status"), "신청 상태 안내 영역이 없습니다.");
expect(script.includes("isValidAirtableFormUrl"), "Airtable URL 검증 로직이 없습니다.");
expect(script.includes("aria-disabled"), "미설정 신청 버튼 비활성화 처리가 없습니다.");
expect(script.includes("https:"), "HTTPS 검증 로직이 없습니다.");
expect(script.includes("airtable.com"), "Airtable 호스트 검증 로직이 없습니다.");

const scanned = [...contents.values()].join("\n");
const forbiddenPatterns = [
  [/api\.airtable\.com/i, "브라우저 Airtable REST API 호출"],
  [/Authorization:\s*Bearer/i, "Authorization Bearer 헤더"],
  [/pat[A-Za-z0-9_-]{10,}/, "Airtable PAT 형태의 값"],
];

for (const [pattern, label] of forbiddenPatterns) {
  expect(!pattern.test(scanned), `${label}이 소스에 포함되어 있습니다.`);
}

const phoneNumbers = scanned.match(/01[0-9][-\s]?\d{3,4}[-\s]?\d{4}/g) || [];
const unexpectedPhoneNumbers = phoneNumbers.filter((phone) => phone.replace(/[-\s]/g, "") !== "01030657890");
expect(unexpectedPhoneNumbers.length === 0, `허용되지 않은 전화번호가 있습니다: ${unexpectedPhoneNumbers.join(", ")}`);

await access(resolve(root, "dist", "client", "site-config.js"));
const builtConfig = await readFile(resolve(root, "dist", "client", "site-config.js"), "utf8");
expect(builtConfig.includes("AIRTABLE_FORM_URL"), "빌드 결과에 site-config.js가 포함되지 않았습니다.");

console.log("신청 시스템 정적 검사 통과");
