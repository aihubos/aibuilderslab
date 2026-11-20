import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = [
  "index.html",
  "hermes.html",
  "styles.css",
  "home.css",
  "script.js",
  "site-config.js",
  "robots.txt",
  "sitemap.xml",
  "install/index.html",
  "install/install.css",
  "install/install.js",
  "lounge/index.html",
  "lounge/lounge.css",
  "lounge/lounge.js",
  "lounge/settings.js",
  "lounge/placeholders.js",
  "lounge/apply/index.html",
  "lounge/apply/cohorts.js",
  "lounge/apply/apply.js",
  "lounge/upload/index.html",
  "lounge/upload/upload.js",
  "lounge/data/cohorts.js",
  "lounge/data/faq.js",
  "lounge/data/stats.js",
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
const loungeHtml = source.get("lounge/index.html");
const loungeScript = source.get("lounge/lounge.js");
const loungeSettingsScript = source.get("lounge/settings.js");
const loungePlaceholdersScript = source.get("lounge/placeholders.js");
const scanned = [...source.values()].join("\n");

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "courses",
  "outcomes",
  "proof",
  "curriculum",
  "audience",
  "trust",
  "schedule",
  "faq",
  "final-cta",
].forEach((id) => expect(indexHtml.includes(`id="${id}"`), `#${id} 섹션이 없습니다.`));

expect((indexHtml.match(/data-primary-cta/g) || []).length >= 4, "주요 카카오 CTA가 충분하지 않습니다.");
expect(indexHtml.includes('data-contact-key="kakaoProfile"'), "개인 카카오 CTA 설정이 없습니다.");
expect(indexHtml.includes("수요일·토요일"), "정기 운영 요일이 없습니다.");
expect(indexHtml.includes("20,000원") && indexHtml.includes("최대 3명"), "현재 가격 또는 정원이 없습니다.");
expect(indexHtml.includes("그 외 시간 별도 협의"), "추가 시간 협의 안내가 없습니다.");
expect((indexHtml.match(/class="course-option(?: |")/g) || []).length === 5, "교육 과정 다섯 개가 모두 표시되지 않습니다.");
expect(indexHtml.includes("텔레그램 연결, Gateway, 자동화는 포함하지 않습니다."), "기본 설치 과정의 제외 범위가 없습니다.");
expect((indexHtml.match(/logo-shimmer/g) || []).length >= 3, "로고 금속성 스윕 대상이 부족합니다.");
expect(indexHtml.includes("동탄") && indexHtml.includes("개인 노트북"), "지역 또는 준비물이 없습니다.");
expect(indexHtml.includes('aria-controls="curriculum-part-0"'), "커리큘럼 아코디언 연결이 없습니다.");
expect(indexHtml.includes("FAQPage") && /"@type"\s*:\s*"Organization"/.test(indexHtml) && /"@type"\s*:\s*"Course"/.test(indexHtml), "JSON-LD 구조화 데이터가 없습니다.");
expect(/<video[^>]*\bautoplay\b[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b/i.test(indexHtml), "히어로 영상 자동·반복 재생 설정이 없습니다.");
expect(/<video[^>]*preload="auto"/i.test(indexHtml) && indexHtml.includes('data-src="assets/builderslab-brand-motion.mp4"'), "새 브랜드 MP4 연결이 없습니다.");
expect(!indexHtml.includes("hero-builders-character"), "교체한 캐릭터 영상이 남아 있습니다.");
expect(/href="home\.css(?:\?[^\"]*)?"/.test(indexHtml), "홈페이지 전용 스타일이 없습니다.");
expect(script.includes("syncMotionState") && script.includes("data-manifesto") && script.includes("prefers-reduced-motion"), "모션 제어 또는 감소 설정 처리가 없습니다.");
expect(!/api\/google-calendar\.ics|googleapis\.com\/calendar|countapi\.mileshilliard|AIzaSy/i.test(scanned), "실패하는 외부 런타임 호출 또는 API 키가 남아 있습니다.");
expect(indexHtml.includes("calendar.google.com/calendar/embed") && indexHtml.includes("data-google-calendar-frame"), "공개 Google Calendar 임베드가 없습니다.");
expect(indexHtml.includes("data-calendar-refresh") && indexHtml.includes("내 Google Calendar에 추가"), "캘린더 새로고침 또는 구독 동작이 없습니다.");
expect(script.includes("initLiveGoogleCalendar") && script.includes("AGENDA") && script.includes("MONTH"), "반응형 실시간 캘린더 초기화가 없습니다.");
expect(!indexHtml.includes("assets/google-calendar.ics"), "메인 화면에 정적 캘린더 스냅샷이 남아 있습니다.");
expect(!/[—–]/.test(scanned), "화면 문구에 긴 대시 문자가 남아 있습니다.");
expect(!/data-airtable|Airtable|AIRTABLE|airtable\.com|신청 폼 준비/i.test(scanned), "Airtable 신청 흐름이 남아 있습니다.");
expect(!/전화 문의|010-3065|821030657890|oneToOneInterest/i.test(scanned), "삭제 대상 전화 문의 정보가 남아 있습니다.");
expect(!/api\.airtable\.com|Authorization:\s*Bearer|pat[A-Za-z0-9_-]{10,}/i.test(scanned), "외부 인증 정보가 남아 있습니다.");
expect(config.includes("kakaoProfile") && config.includes("embedUrl") && config.includes("subscribeUrl"), "공개 사이트 설정이 없습니다.");
expect(source.get("robots.txt").includes("sitemap.xml"), "robots.txt에 sitemap 참조가 없습니다.");
expect(source.get("sitemap.xml").includes("hermes.html") && source.get("sitemap.xml").includes("install/"), "sitemap.xml 경로가 부족합니다.");
expect(indexHtml.includes('href="install/"'), "메인 내비게이션에 설치 안내 링크가 없습니다.");

expect(installHtml.includes("Codex 설치 요청문 복사"), "설치 요청문 복사 버튼이 없습니다.");
expect(installHtml.includes("TELEGRAM_ALLOWED_USERS"), "Telegram 사용자 허용 목록 안내가 없습니다.");
expect(installHtml.includes("v1.2.1"), "안정 버전이 설치 요청문에 없습니다.");
expect(installHtml.includes("https://raw.githubusercontent.com/jeremylee0213/builderslab-starter/v1.2.1/prompts/codex-install.md"), "버전 고정 Codex 지침 URL이 없습니다.");
expect(installHtml.includes("공식 Hermes Desktop App만 설치"), "Desktop 전용 설치 안내가 없습니다.");
expect(installHtml.includes("Desktop 확인에 실패하면 전체 설치를 중단"), "Desktop 확인 실패 중단 안내가 없습니다.");
expect(installHtml.includes("CLI 전용 설치를 자동 실행하지"), "CLI 전용 자동 설치 금지 안내가 없습니다.");
expect(installHtml.includes("`1`, `2`, `3` 형식으로 답하게"), "번호형 사용자 질문 안내가 없습니다.");
expect(installHtml.includes("Hermes 공식 비밀번호형 자격증명 입력란"), "Bot Token 전용 입력란 안내가 없습니다.");
expect(installHtml.includes("Codex 대화창, 홈페이지, 공개 문서에는 붙여넣지"), "Bot Token 노출 방지 안내가 없습니다.");
expect(!/curl -fsSL|iex\s*\(irm/i.test(installHtml), "홈페이지에 긴 설치 명령을 중복하면 안 됩니다.");
expect(installScript.includes("navigator.clipboard"), "클립보드 복사 동작이 없습니다.");
expect(hermesHtml.includes("Hermes + LLM Wiki 3시간"), "기존 Hermes 입문교육 페이지가 바뀌었습니다.");

expect(indexHtml.includes('href="lounge/"'), "공개 홈페이지에 멤버 도구 진입 링크가 없습니다.");
expect(loungeHtml.includes('href="/lounge/showcase/"'), "라운지에서 공개 쇼케이스로 가는 링크가 없습니다.");
expect(loungeHtml.includes('href="/lounge/samples/"'), "라운지에서 샘플 영상으로 가는 링크가 없습니다.");
expect(source.get("sitemap.xml").includes("https://aibuilderslab.kr/lounge/showcase/"), "sitemap.xml에 쇼케이스 주소가 없습니다.");
expect(source.get("sitemap.xml").includes("https://aibuilderslab.kr/lounge/samples/"), "sitemap.xml에 샘플 영상 주소가 없습니다.");
const showcaseHtml = await readFile(resolve(root, "lounge/showcase/index.html"), "utf8");
const showcaseScript = await readFile(resolve(root, "lounge/showcase/showcase.js"), "utf8");
const samplesHtml = await readFile(resolve(root, "lounge/samples/index.html"), "utf8");
const samplesScript = await readFile(resolve(root, "lounge/samples/samples.js"), "utf8");
const samples = JSON.parse(await readFile(resolve(root, "lounge/showcase/samples.json"), "utf8"));
expect(/<meta\s+name=["']robots["']\s+content=["']index,follow["']/i.test(showcaseHtml), "쇼케이스 검색 허용이 없습니다.");
expect(showcaseHtml.includes('href="/lounge/samples/"'), "쇼케이스에서 샘플 영상으로 가는 링크가 없습니다.");
expect(!showcaseHtml.includes('id="tab-samples"'), "쇼케이스에 샘플 영상 탭이 남아 있습니다.");
expect(/<meta\s+name=["']robots["']\s+content=["']index,follow["']/i.test(samplesHtml), "샘플 영상 검색 허용이 없습니다.");
expect(samplesHtml.includes('href="https://aibuilderslab.kr/lounge/samples/"'), "샘플 영상 canonical 주소가 없습니다.");
expect(samplesScript.includes("/lounge/showcase/samples.json"), "샘플 페이지가 기존 목록을 재사용하지 않습니다.");
expect(samplesScript.includes("/lounge/media/samples/"), "샘플 페이지의 영상 경로가 없습니다.");
expect(samplesScript.includes("샘플용 가상 광고") || samplesHtml.includes("샘플용 가상 광고"), "샘플 광고 안내가 없습니다.");
expect(showcaseScript.includes('rel: "ugc nofollow noopener noreferrer"'), "외부 링크 rel 속성이 없습니다.");
const daangn = samples.items.filter((item) => item.category === "daangn-sample");
expect(daangn.length === 6 && daangn.every((item) => item.badge === "샘플용 가상 광고"), "당근 샘플 광고 배지가 없습니다.");
expect(samples.items.filter((item) => item.category === "short-drama").length === 3, "숏드라마 샘플 수가 맞지 않습니다.");
expect(samples.items.filter((item) => item.category === "store-promo").length === 2, "매장홍보 샘플 수가 맞지 않습니다.");
expect(loungeHtml.includes("AI 회의록") && loungeHtml.includes("AI 쇼츠 스튜디오"), "두 기존 기능의 정확한 표기명이 없습니다.");
expect((loungeHtml.match(/기존 기능 연결 예정/g) || []).length >= 2, "기존 기능 연결 자리가 부족합니다.");
expect(/<meta\s+name=["']robots["']\s+content=["']noindex,nofollow["']/i.test(loungeHtml), "연결 전 멤버 작업공간의 검색 제외 설정이 없습니다.");
expect(!/type\s*=\s*["']file/i.test(loungeHtml), "연결 전 멤버 작업공간에 파일 업로드가 추가되었습니다.");
expect(!/\b(fetch|XMLHttpRequest|FormData)\b/.test(`${loungeScript}\n${loungeSettingsScript}\n${loungePlaceholdersScript}`), "연결 전 멤버 작업공간에 외부 요청 또는 업로드 로직이 추가되었습니다.");
expect(loungeSettingsScript.includes("localStorage"), "작업공간의 로컬 화면 설정 저장이 없습니다.");

// 2026-11 라운지 개편: 홈 첫 화면, 기수 신청, 결과물 올리기
const applyHtml = await readFile(resolve(root, "lounge/apply/index.html"), "utf8");
const applyScript = await readFile(resolve(root, "lounge/apply/apply.js"), "utf8");
const cohortsScript = await readFile(resolve(root, "lounge/data/cohorts.js"), "utf8");
const uploadHtml = await readFile(resolve(root, "lounge/upload/index.html"), "utf8");
const uploadScript = await readFile(resolve(root, "lounge/upload/upload.js"), "utf8");
const kakaoProfile = config.match(/kakaoProfile:\s*"([^"]+)"/)?.[1] || "";
const kakaoGroup = config.match(/kakaoGroup:\s*"([^"]+)"/)?.[1] || "";
expect(loungeHtml.includes('href="/lounge/apply/"'), "라운지 홈에서 기수 신청으로 가는 링크가 없습니다.");
expect(loungeHtml.includes('href="/lounge/upload/"'), "라운지 홈에서 결과물 올리기로 가는 링크가 없습니다.");
expect((loungeHtml.match(/href="\/lounge\/samples\/#[a-z0-9-]+"/g) || []).length >= 3, "라운지 홈에 대표 샘플 미리보기가 3개 이상 없습니다.");
expect(loungeHtml.includes("샘플 영상 전체 보기"), "라운지 홈에 샘플 영상 전체 보기 버튼이 없습니다.");
expect(loungeHtml.includes("샘플용 가상 광고"), "라운지 홈의 당근 샘플에 가상 광고 표시가 없습니다.");
expect(!loungeHtml.includes(kakaoGroup) || loungeHtml.includes('data-config-link="kakaoGroup"'), "라운지 홈의 단체방 링크가 설정값과 연결되지 않았습니다.");
expect(/<meta\s+name=["']robots["']\s+content=["']index,follow["']/i.test(applyHtml), "기수 신청 검색 허용이 없습니다.");
expect(applyHtml.includes('href="https://aibuilderslab.kr/lounge/apply/"'), "기수 신청 canonical 주소가 없습니다.");
expect(source.get("sitemap.xml").includes("https://aibuilderslab.kr/lounge/apply/"), "sitemap.xml에 기수 신청 주소가 없습니다.");
expect(kakaoProfile && applyHtml.includes(`href="${kakaoProfile}"`) && applyHtml.includes('data-config-link="kakaoProfile"'), "기수 신청의 카카오 링크가 site-config.js 값과 다릅니다.");
expect(!/<form\b/i.test(applyHtml) && !/\b(fetch|XMLHttpRequest|FormData)\b/.test(`${applyScript}\n${cohortsScript}`), "기수 신청에 서버 폼이나 외부 요청이 추가되었습니다.");
expect(/id:\s*"1"/.test(cohortsScript) && /id:\s*"2"/.test(cohortsScript), "기수 데이터에 1기와 2기가 없습니다.");
expect(/<meta\s+name=["']robots["']\s+content=["']noindex,nofollow["']/i.test(uploadHtml), "결과물 올리기 화면은 검색에서 제외해야 합니다.");
expect(!source.get("sitemap.xml").includes("/lounge/upload/"), "결과물 올리기 화면이 sitemap.xml에 들어 있습니다.");
expect(uploadHtml.includes('name="company_website"'), "결과물 올리기에 허니팟 칸이 없습니다.");
expect(uploadScript.includes("`${API}/entries`") && uploadScript.includes('const API = "/lounge/api"'), "결과물 올리기가 기존 API를 사용하지 않습니다.");
expect(/imageBytes:\s*5 \* MB/.test(uploadScript) && /fileBytes:\s*20 \* MB/.test(uploadScript) && /images:\s*4/.test(uploadScript), "결과물 올리기 제한이 기존 API와 다릅니다.");
expect(['"name"', '"cohort"', '"title"', '"summary"', '"link"', '"tools"', '"prompt"', '"image"', '"file"', '"company_website"', '"turnstileToken"'].every((field) => uploadScript.includes(field)), "결과물 올리기 필드명이 기존 API와 다릅니다.");
expect(uploadScript.includes('"aibl-showcase-secrets"') && uploadHtml.includes("수정 코드"), "수정 코드 안내 또는 저장이 없습니다.");
expect(showcaseHtml.includes('href="/lounge/upload/?cohort=1"'), "쇼케이스의 결과물 올리기가 새 단계 화면으로 연결되지 않았습니다.");

// 2026-11 추가: 모집 상태, 반응, 기수 숫자, FAQ·구조화 데이터
const { renderLounge } = await import(new URL("./render-lounge.mjs", import.meta.url).href);
const { RECRUIT, RECRUIT_STATUS, COHORTS: cohortData } = await import(new URL("../lounge/data/cohorts.js", import.meta.url).href);
const rendered = await renderLounge({ write: false });
expect(rendered.changed.length === 0, `라운지 HTML이 lounge/data와 다릅니다. npm run lounge:render 를 실행하세요: ${rendered.changed.join(", ")}`);
expect(["open", "waitlist", "closed"].includes(RECRUIT.status), "모집 상태는 open, waitlist, closed 중 하나여야 합니다.");
expect(Number.isInteger(RECRUIT.capacity) && RECRUIT.capacity > 0, "정원이 숫자가 아닙니다.");
expect(loungeHtml.includes('class="lx-recruit ') && loungeHtml.includes(RECRUIT_STATUS[RECRUIT.status].text) && loungeHtml.includes(`${RECRUIT.capacity}명`), "라운지 홈 첫 화면에 모집 상태가 없습니다.");
expect(/class="lx-recruit [^"]*"[\s\S]*?data-config-link="kakaoProfile"/.test(loungeHtml), "모집 상태 카드에 카카오톡 버튼이 없습니다.");
expect(loungeHtml.indexOf("lx-recruit") < loungeHtml.indexOf("SAMPLE VIDEOS"), "모집 상태가 홈 첫 화면 히어로에 있지 않습니다.");
expect(cohortData.every((cohort) => applyHtml.includes(`data-entries-badge="${cohort.id}"`)), "기수별 결과물 수 배지가 없습니다.");
expect(cohortData.every((cohort) => applyHtml.includes(Number.isInteger(cohort.graduates) ? `수료생 ${cohort.graduates}명` : "수료생 수 입력 필요")), "기수별 수료생 배지가 없습니다.");
const statsScript = await readFile(resolve(root, "lounge/data/stats.js"), "utf8");
expect(statsScript.includes('"/lounge/api/stats"') && !/method:\s*"(POST|PUT|PATCH|DELETE)"/.test(statsScript), "기수 통계는 읽기 전용 /stats API를 써야 합니다.");
expect(showcaseScript.includes("/like`") && showcaseScript.includes("이 빌더에게 질문하기") && showcaseScript.includes("safeContactUrl"), "결과물 카드 반응(좋아요·질문하기)이 없습니다.");
expect(!/comment|댓글 달기|댓글 쓰기/i.test(showcaseScript), "공개 댓글 기능은 만들지 않습니다.");
expect(uploadScript.includes('"contact"') && uploadHtml.includes('id="f-contact"'), "결과물 올리기에 연락 링크 질문이 없습니다.");
expect(showcaseHtml.includes('name="contact"'), "결과물 수정 화면에 연락 링크 칸이 없습니다.");
expect(source.get("robots.txt").includes("Disallow: /lounge/api/") && !/Disallow:\s*\/lounge\/?$/m.test(source.get("robots.txt")), "robots.txt의 라운지 규칙이 맞지 않습니다.");

function decodeHtml(text) {
  return text.replace(/<[^>]+>/g, " ").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&").replace(/\s+/g, " ");
}
function jsonLdOf(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => {
    const data = JSON.parse(match[1]);
    return data["@graph"] || [data];
  });
}
const publicPages = { apply: applyHtml, samples: samplesHtml, showcase: showcaseHtml };
for (const [name, html] of Object.entries(publicPages)) {
  const nodes = jsonLdOf(html);
  const types = new Set(nodes.map((node) => node["@type"]));
  const visible = decodeHtml(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<head>[\s\S]*?<\/head>/, ""));
  for (const type of ["Organization", "WebPage", "BreadcrumbList", "FAQPage"]) expect(types.has(type), `${name} 페이지에 ${type} JSON-LD가 없습니다.`);
  const org = nodes.find((node) => node["@type"] === "Organization");
  expect(org.name === "AI 빌더스랩" && org.url === "https://aibuilderslab.kr/", `${name} 페이지 Organization 정보가 다릅니다.`);
  const faq = nodes.find((node) => node["@type"] === "FAQPage");
  const shown = (html.match(/class="lx-faq-item"/g) || []).length;
  expect(shown >= 5 && shown <= 8, `${name} 페이지 FAQ는 5~8문항이어야 합니다. (지금 ${shown})`);
  for (const question of faq.mainEntity) {
    expect(visible.includes(question.name) && visible.includes(question.acceptedAnswer.text), `${name} FAQ JSON-LD가 화면 내용과 다릅니다: ${question.name}`);
  }
  const crumbs = nodes.find((node) => node["@type"] === "BreadcrumbList").itemListElement;
  expect(crumbs.every((crumb) => visible.includes(crumb.name)) && html.includes('class="lx-crumbs"'), `${name} 페이지 현재 위치 표시가 JSON-LD와 다릅니다.`);
  expect(html.includes(`<link rel="canonical" href="https://aibuilderslab.kr/lounge/${name}/" />`) && html.includes('property="og:image"') && html.includes('property="og:site_name" content="AI 빌더스랩"'), `${name} 페이지 canonical·OG가 부족합니다.`);
  expect(/<title>[^<]+\| AI 빌더스랩<\/title>/.test(html), `${name} 페이지 title 형식이 다릅니다.`);
}
const course = jsonLdOf(applyHtml).find((node) => node["@type"] === "Course");
expect(course && course.provider?.["@id"] === "https://aibuilderslab.kr/#organization" && course.hasCourseInstance?.length >= 1, "기수 신청 페이지 Course JSON-LD가 없습니다.");
expect(decodeHtml(applyHtml).includes(course.name) && decodeHtml(applyHtml).includes(course.description), "Course JSON-LD 이름·설명이 화면에 없습니다.");
const videoList = jsonLdOf(samplesHtml).find((node) => node["@type"] === "ItemList");
const videos = videoList?.itemListElement?.map((entry) => entry.item) || [];
expect(videos.length === samples.items.length && videos.every((video, index) => {
  const item = samples.items[index];
  return video["@type"] === "VideoObject"
    && video.name === item.title
    && video.thumbnailUrl === `https://aibuilderslab.kr/lounge/showcase/${item.poster}`
    && video.contentUrl === `https://aibuilderslab.kr/lounge/media/samples/${item.file}`;
}), "샘플 영상 VideoObject 목록이 samples.json과 다릅니다.");
expect(!jsonLdOf(loungeHtml).length && !jsonLdOf(uploadHtml).length, "검색 제외 페이지에 JSON-LD가 들어 있습니다.");

// 2026-11 커리큘럼 스타일: 1기·2기 커리큘럼 진입, 내비 커리큘럼 항목, 공통 토큰
const { curriculumHtml, cohortLinksHtml, curriculumUrlOf } = await import(new URL("./render-lounge.mjs", import.meta.url).href);
const COHORT1_CURRICULUM = "https://lounge.ai-hub-os.com/curriculum/cohort1.html";
const cohort1 = cohortData.find((cohort) => cohort.id === "1");
const cohort2 = cohortData.find((cohort) => cohort.id === "2");
expect(cohort1?.curriculumUrl === COHORT1_CURRICULUM && cohort1?.curriculumOverviewUrl === "https://lounge.ai-hub-os.com/curriculum/", "1기 커리큘럼 주소가 cohorts.js에 없습니다.");
expect(cohort2 && "curriculumUrl" in cohort2, "2기 항목에 curriculumUrl 칸이 없습니다(없으면 null).");
const heroHtml = loungeHtml.slice(loungeHtml.indexOf('class="lx-hero"'), loungeHtml.indexOf("SAMPLE VIDEOS"));
expect(heroHtml.includes('id="curriculum"'), "라운지 홈 첫 화면에 커리큘럼 바로가기(#curriculum)가 없습니다.");
expect(heroHtml.indexOf('id="curriculum"') < heroHtml.indexOf('class="lx-recruit '), "커리큘럼 바로가기가 모집 카드보다 먼저 나와야 합니다.");
expect(new RegExp(`<a class="lx-curri-card" href="${COHORT1_CURRICULUM.replaceAll(".", "\\.")}" target="_blank" rel="noopener" data-curriculum="1">`).test(heroHtml), "첫 화면에 1기 커리큘럼 링크 카드(새 창)가 없습니다.");
const extLinks = [...loungeHtml.matchAll(/<a [^>]*href="https:\/\/lounge\.ai-hub-os\.com[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
expect(extLinks.length >= 3 && extLinks.every((link) => link.includes('target="_blank"') && link.includes('rel="noopener"') && link.includes("↗") && link.includes("(새 창, 외부 사이트)")), "외부 커리큘럼 링크는 모두 새 창 + ↗ 표시여야 합니다.");
if (curriculumUrlOf(cohort2.curriculumUrl)) {
  expect(heroHtml.includes(`href="${cohort2.curriculumUrl}"`) && !heroHtml.includes('data-curriculum="2" data-curriculum-pending'), "2기 커리큘럼 주소가 있는데 첫 화면 카드가 링크가 아닙니다.");
} else {
  expect(/<a class="lx-curri-card is-pending" href="\/lounge\/apply\/#cohort-2" data-curriculum="2" data-curriculum-pending>[\s\S]*?2기 커리큘럼 <span class="lx-curri-state">준비 중<\/span>/.test(heroHtml), "2기 커리큘럼 카드가 ‘준비 중’ + 기수 신청 2기 안내 링크가 아닙니다.");
  expect(applyHtml.includes('id="cohort-2"') && applyHtml.includes("2기 커리큘럼 준비 중"), "2기 준비 중 링크가 가리키는 기수 신청 2기 안내가 없습니다.");
}
// 데이터에 2기 주소가 생기면 자동으로 링크 카드로 바뀌는지 (가짜 주소로 생성만 확인)
const futureCohorts = cohortData.map((cohort) => (cohort.id === "2" ? { ...cohort, curriculumUrl: "https://example.com/cohort2.html" } : cohort));
const futureHero = curriculumHtml(futureCohorts);
expect(futureHero.includes('href="https://example.com/cohort2.html" target="_blank" rel="noopener" data-curriculum="2"') && !futureHero.includes("준비 중"), "2기 curriculumUrl을 넣어도 홈 카드가 링크로 바뀌지 않습니다.");
expect(cohortLinksHtml(futureCohorts).includes('href="https://example.com/cohort2.html"'), "2기 curriculumUrl을 넣어도 기수별 바로가기가 링크로 바뀌지 않습니다.");
expect(!curriculumHtml(cohortData.map((cohort) => ({ ...cohort, curriculumUrl: "javascript:alert(1)" }))).includes("javascript:"), "커리큘럼 주소는 https만 허용해야 합니다.");
expect(!/(\d{1,3}(,\d{3})+원|\d+만\s?원|\d{1,2}월\s?\d{1,2}일)/.test(futureHero), "커리큘럼 진입 카드에는 가격·날짜를 넣지 않습니다.");
const navPages = { home: loungeHtml, apply: applyHtml, samples: samplesHtml, showcase: showcaseHtml };
for (const [name, html] of Object.entries(navPages)) {
  const nav = html.match(/<nav class="lx-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  expect(nav.includes('<a href="/lounge/#curriculum">커리큘럼</a>'), `${name} 상단 메뉴에 커리큘럼 항목이 없습니다.`);
}
const loungeCss = await readFile(resolve(root, "lounge/lounge.css"), "utf8");
expect(/--lx-blue:\s*#2f6bff/i.test(loungeCss) && /--lx-navy:\s*#0d1b3a/i.test(loungeCss) && /--lx-neon:\s*#c6ff3d/i.test(loungeCss), "라운지 공통 색 토큰(블루·navy·형광)이 lounge.css 한 곳에 없습니다.");
expect(!/@import|fonts\.googleapis|cdn\.jsdelivr|unpkg\.com/.test(loungeCss), "라운지 공통 CSS에 외부 CDN이 들어 있습니다.");
expect(/prefers-reduced-motion/.test(loungeCss) && /word-break:\s*keep-all/.test(loungeCss), "움직임 줄이기 또는 한글 줄바꿈 설정이 없습니다.");

const builtIndex = await readFile(resolve(root, "dist", "client", "index.html"), "utf8");
const builtScript = await readFile(resolve(root, "dist", "client", "script.js"), "utf8");
const builtInstall = await readFile(resolve(root, "dist", "client", "install", "index.html"), "utf8");
const builtLounge = await readFile(resolve(root, "dist", "client", "lounge", "index.html"), "utf8");
expect(!/api\/google-calendar\.ics|googleapis\.com\/calendar|countapi\.mileshilliard|AIzaSy/i.test(`${builtIndex}\n${builtScript}`), "빌드 결과에 외부 런타임 호출 또는 API 키가 남아 있습니다.");
expect(builtIndex.includes("calendar.google.com/calendar/embed") && builtIndex.includes("data-google-calendar-frame"), "빌드 결과에 실시간 Google Calendar가 없습니다.");
expect(builtIndex.includes('id="curriculum"') && builtIndex.includes("FAQPage"), "빌드 결과에 전환형 홈페이지가 없습니다.");
expect(builtInstall.includes("Codex 설치 요청문 복사"), "빌드 결과에 설치 페이지가 없습니다.");
expect(builtLounge.includes("AI 회의록") && builtLounge.includes("AI 쇼츠 스튜디오"), "빌드 결과에 멤버 도구 화면이 없습니다.");
await access(resolve(root, "dist", "client", "index.html"));
await access(resolve(root, "dist", "client", "hermes.html"));
await access(resolve(root, "dist", "client", "install", "install.css"));
await access(resolve(root, "dist", "client", "install", "install.js"));
await access(resolve(root, "dist", "client", "lounge", "index.html"));
await access(resolve(root, "dist", "client", "lounge", "lounge.css"));
await access(resolve(root, "dist", "client", "lounge", "lounge.js"));
await access(resolve(root, "dist", "client", "lounge", "apply", "index.html"));
await access(resolve(root, "dist", "client", "lounge", "apply", "cohorts.js"));
await access(resolve(root, "dist", "client", "lounge", "upload", "index.html"));
await access(resolve(root, "dist", "client", "lounge", "upload", "upload.js"));
await access(resolve(root, "dist", "client", "sitemap.xml"));
await access(resolve(root, "dist", "client", "home.css"));
await access(resolve(root, "dist", "client", "assets", "builderslab-brand-motion.mp4"));
await access(resolve(root, "dist", "client", "assets", "builderslab-brand-motion-poster.jpg"));

console.log("전환형 홈페이지, 실시간 Google Calendar, SEO, 신청 채널과 설치 페이지 정적 검사 통과");
