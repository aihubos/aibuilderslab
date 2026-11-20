/*
 * 라운지 정적 생성기
 * lounge/data/*.js(기수·모집·FAQ)와 lounge/showcase/samples.json을 읽어
 * HTML의 <!-- lounge:이름 --> ... <!-- /lounge:이름 --> 구간을 다시 씁니다.
 *  - 화면: 모집 상태 카드, 기수 카드, FAQ, 현재 위치(breadcrumb)
 *  - 검색: JSON-LD (Organization, WebPage, BreadcrumbList, FAQPage, Course, ItemList/VideoObject)
 * 화면과 JSON-LD가 같은 데이터에서 나오므로 내용이 항상 일치합니다.
 *
 * 사용: node scripts/render-lounge.mjs          (파일 갱신)
 *       node scripts/render-lounge.mjs --check  (다르면 실패, 파일은 그대로)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const root = process.cwd();
const SITE = "https://aibuilderslab.kr";
const ORG_ID = `${SITE}/#organization`;

const { RECRUIT, RECRUIT_STATUS, COHORTS, COMMON, COURSE } = await import(pathToFileURL(resolve(root, "lounge/data/cohorts.js")).href);
const { APPLY_FAQ, SHOWCASE_FAQ, samplesFaq } = await import(pathToFileURL(resolve(root, "lounge/data/faq.js")).href);

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const won = (value) => `${Number(value).toLocaleString("ko-KR")}원`;
const placeholder = (text) => `<span class="lx-placeholder">${esc(text)}</span>`;

async function siteConfig() {
  const source = await readFile(resolve(root, "site-config.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.AI_BUILDERS_CONFIG;
}

function kakaoButton(href, label, { assets, size = "lx-btn-lg", block = false } = {}) {
  const className = ["lx-btn", "lx-btn-kakao", size, block ? "lx-btn-block" : ""].filter(Boolean).join(" ");
  return `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-config-link="kakaoProfile"
            ><img src="${assets}kakao-openchat-icon-84.webp" width="84" height="84" alt="" />${esc(label)}<span class="lx-sr"> (새 창)</span></a
          >`;
}

/* ---------- 화면 조각 ---------- */

/* 커리큘럼 주소는 https만 받습니다. 그 밖의 값은 ‘준비 중’으로 취급합니다. */
export function curriculumUrlOf(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/* 외부 사이트 링크: 모두 새 창 + ↗ 표시 + 화면 읽기용 안내로 통일합니다. */
function externalAttrs(href) {
  return `href="${esc(href)}" target="_blank" rel="noopener"`;
}
const EXT_MARK = `<span class="lx-ext" aria-hidden="true">↗</span><span class="lx-sr"> (새 창, 외부 사이트)</span>`;

const byCohortNumber = (list) => [...list].sort((a, b) => Number(a.id) - Number(b.id));

/* 홈 첫 화면: 기수별 커리큘럼 진입 카드. 가격·날짜는 넣지 않습니다. */
export function curriculumHtml(cohorts = COHORTS) {
  const sorted = byCohortNumber(cohorts);
  const cards = sorted.map((cohort) => {
    const url = curriculumUrlOf(cohort.curriculumUrl);
    if (url) {
      return `
              <li>
                <a class="lx-curri-card" ${externalAttrs(url)} data-curriculum="${esc(cohort.id)}">
                  <span class="lx-curri-num" aria-hidden="true">${esc(cohort.label)}</span>
                  <span class="lx-curri-copy"><strong>${esc(cohort.label)} 커리큘럼</strong><small>회차별로 무엇을 배우고 만드는지 보기</small></span>
                  <span class="lx-curri-go">${EXT_MARK}</span>
                </a>
              </li>`;
    }
    return `
              <li>
                <a class="lx-curri-card is-pending" href="/lounge/apply/#cohort-${esc(cohort.id)}" data-curriculum="${esc(cohort.id)}" data-curriculum-pending>
                  <span class="lx-curri-num" aria-hidden="true">${esc(cohort.label)}</span>
                  <span class="lx-curri-copy"><strong>${esc(cohort.label)} 커리큘럼 <span class="lx-curri-state">준비 중</span></strong><small>페이지가 열리기 전까지 ${esc(cohort.label)} 안내 먼저 보기</small></span>
                  <span class="lx-curri-go" aria-hidden="true">→</span>
                </a>
              </li>`;
  }).join("");
  const overviews = sorted
    .map((cohort) => [cohort, curriculumUrlOf(cohort.curriculumOverviewUrl)])
    .filter(([, url]) => url)
    .map(([cohort, url]) => `<a ${externalAttrs(url)}>${esc(cohort.label)} 모집·커리큘럼 전체 페이지${EXT_MARK}</a>`)
    .join("");
  return `
          <section class="lx-curri" id="curriculum" aria-labelledby="curriculum-title">
            <h2 class="lx-curri-label" id="curriculum-title">기수별 커리큘럼 바로가기</h2>
            <ul class="lx-curri-grid">${cards}
            </ul>${overviews ? `
            <p class="lx-curri-more">${overviews}</p>` : ""}
          </section>
          `;
}

/* 홈 아래쪽: 기수별 바로가기 목록 (커리큘럼 · 결과물 · 신청 안내) */
export function cohortLinksHtml(cohorts = COHORTS) {
  const rows = byCohortNumber(cohorts).map((cohort) => {
    const url = curriculumUrlOf(cohort.curriculumUrl);
    const curriculum = url
      ? `<a class="lx-btn lx-btn-line" ${externalAttrs(url)}>커리큘럼${EXT_MARK}</a>`
      : `<a class="lx-btn lx-btn-line" href="/lounge/apply/#cohort-${esc(cohort.id)}">커리큘럼 <span class="lx-curri-state">준비 중</span></a>`;
    return `
            <li class="lx-crow">
              <span class="lx-crow-num">${esc(cohort.label)}</span>
              <span class="lx-crow-links">
                ${curriculum}
                <a class="lx-btn lx-btn-line" href="/lounge/showcase/?cohort=${esc(cohort.id)}">${esc(cohort.label)} 결과물</a>
                <a class="lx-btn lx-btn-line" href="/lounge/apply/#cohort-${esc(cohort.id)}">${esc(cohort.label)} 안내</a>
              </span>
            </li>`;
  }).join("");
  return `
          <ul class="lx-crows">${rows}
          </ul>
          `;
}

function recruitHtml(kakao, assets) {
  const status = RECRUIT_STATUS[RECRUIT.status] || RECRUIT_STATUS.waitlist;
  const label = RECRUIT.label || "다음 기수";
  const hasCount = Number.isInteger(RECRUIT.applicants);
  const rows = [
    `<div><dt>정원</dt><dd>${esc(RECRUIT.capacity)}명</dd></div>`,
    `<div><dt>현재 신청</dt><dd>${hasCount ? `${esc(RECRUIT.applicants)}명` : placeholder("인원 입력 필요")}</dd></div>`,
  ];
  if (hasCount && RECRUIT.status === "open") {
    rows.push(`<div><dt>남은 자리</dt><dd>${Math.max(0, RECRUIT.capacity - RECRUIT.applicants)}명</dd></div>`);
  }
  const ratio = hasCount ? Math.min(100, Math.round((RECRUIT.applicants / RECRUIT.capacity) * 100)) : 0;
  const meter = hasCount
    ? `\n            <div class="lx-recruit-meter" role="img" aria-label="정원 ${esc(RECRUIT.capacity)}명 중 ${esc(RECRUIT.applicants)}명 신청"><span style="width: ${ratio}%"></span></div>`
    : "";
  return `
          <section class="lx-recruit lx-recruit-${status.tone}" aria-labelledby="recruit-status">
            <p class="lx-recruit-kicker">${esc(label)} 모집 상태</p>
            <p class="lx-recruit-status" id="recruit-status"><span class="lx-recruit-dot" aria-hidden="true"></span>${esc(status.text)}</p>
            <p class="lx-recruit-lead">${esc(status.lead)}</p>
            <dl class="lx-recruit-facts">
              ${rows.join("\n              ")}
            </dl>${meter}
            ${kakaoButton(kakao, status.cta, { assets, block: true })}
          </section>
          `;
}

function factRow(label, value, note) {
  const body = value != null && value !== ""
    ? `${esc(value)}${note ? `<small>${esc(note)}</small>` : ""}`
    : placeholder(`${label} 입력 필요`);
  return `<div><dt>${esc(label)}</dt><dd>${body}</dd></div>`;
}

const COHORT_STATUS = Object.freeze({
  open: ["모집 중", "lx-badge-green"],
  upcoming: ["모집 예정", "lx-badge-blue"],
  closed: ["모집 마감", ""],
});

function cohortHtml(cohort, kakao, assets) {
  const status = COHORT_STATUS[cohort.status];
  const statusBadge = status
    ? `<span class="${["lx-badge", status[1]].filter(Boolean).join(" ")}">${status[0]}</span>`
    : placeholder("모집 상태 입력 필요");
  const graduates = Number.isInteger(cohort.graduates)
    ? `<span class="lx-badge lx-badge-count">수료생 ${cohort.graduates}명</span>`
    : placeholder("수료생 수 입력 필요");
  const facts = [
    factRow("대상", cohort.target),
    factRow("일정", cohort.schedule),
    factRow("진행 방식", cohort.sessions ? `${cohort.sessions.hours}시간 수업 ${cohort.sessions.count}회` : null, cohort.sessionsNote),
    factRow("교육비", cohort.price != null ? `정규 교육비 ${won(cohort.price)}` : null, cohort.priceNote),
    factRow("정원", cohort.capacity != null ? `${cohort.capacity}명` : null),
    factRow("신청 마감", cohort.deadline),
  ];
  const flow = cohort.flow?.length
    ? `
              <p class="lx-cohort-note">${esc(cohort.flowTitle || "진행 흐름")}</p>
              <ol class="lx-cohort-flow">${cohort.flow.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>`
    : "";
  const pending = !cohort.status || !cohort.summary || [cohort.target, cohort.schedule, cohort.sessions, cohort.price, cohort.capacity, cohort.deadline, cohort.graduates].some((value) => value == null);
  const action = cohort.status === "closed"
    ? `<a class="lx-btn lx-btn-line" href="/lounge/showcase/?cohort=${esc(cohort.id)}">${esc(cohort.label)} 결과물 보기</a>`
    : kakaoButton(kakao, `카카오톡으로 ${cohort.label} 신청·문의`, { assets, size: "" });
  const curriculumUrl = curriculumUrlOf(cohort.curriculumUrl);
  const curriculum = curriculumUrl
    ? `<a class="lx-btn lx-btn-soft" ${externalAttrs(curriculumUrl)}>${esc(cohort.label)} 커리큘럼 보기${EXT_MARK}</a>`
    : `<span class="lx-badge">${esc(cohort.label)} 커리큘럼 준비 중</span>`;
  return `
            <article class="lx-cohort" id="cohort-${esc(cohort.id)}" aria-labelledby="cohort-${esc(cohort.id)}-title">
              <div class="lx-cohort-head"><h3 id="cohort-${esc(cohort.id)}-title">${esc(cohort.label)}</h3>${statusBadge}</div>
              <p class="lx-cohort-badges">${graduates}<a class="lx-badge lx-badge-blue" href="/lounge/showcase/?cohort=${esc(cohort.id)}" data-entries-badge="${esc(cohort.id)}">결과물 보기</a></p>
              <p>${cohort.summary ? esc(cohort.summary) : placeholder("한 줄 소개 입력 필요")}</p>
              <dl class="lx-facts">
                ${facts.join("\n                ")}
              </dl>${flow}${pending ? `
              <p class="lx-cohort-note">‘확정 전’ 항목은 정해지는 대로 이곳에 안내합니다. 먼저 궁금하면 카카오톡으로 물어보세요.</p>` : ""}
              <div class="lx-cohort-foot">${curriculum}${action}</div>
            </article>`;
}

function cohortsHtml(kakao, assets) {
  const tabs = COHORTS.map((cohort) => `<a href="#cohort-${esc(cohort.id)}">${esc(cohort.label)}</a>`).join("");
  return `
          <div class="lx-section-head">
            <div>
              <p class="lx-kicker">COHORTS</p>
              <h2 class="lx-title" id="cohorts-title">${esc(COURSE.name)}</h2>
              <p class="lx-lead">${esc(COURSE.description)} ‘확정 전’ 표시가 있는 항목은 아직 정해지지 않은 내용이에요.</p>
            </div>
          </div>
          <nav class="lx-cohort-tabs" aria-label="기수 바로가기">${tabs}</nav>
          <div class="lx-cohorts">${COHORTS.map((cohort) => cohortHtml(cohort, kakao, assets)).join("")}
          </div>
          `;
}

function faqHtml(items, { wrap }) {
  const rows = items.map((item, index) => `
              <div class="lx-faq-item" id="faq-${index + 1}">
                <dt>${esc(item.q)}</dt>
                <dd>${item.a ? esc(item.a) : placeholder("답변 준비 중")}</dd>
              </div>`).join("");
  const inner = `
            <div class="lx-section-head">
              <div>
                <p class="lx-kicker">FAQ</p>
                <h2 class="lx-title" id="faq-title">자주 묻는 질문</h2>
              </div>
            </div>
            <dl class="lx-faq">${rows}
            </dl>`;
  return wrap
    ? `
      <section class="lx-section lx-faq-section" aria-labelledby="faq-title">
        <div class="lx-wrap">${inner}
        </div>
      </section>
      `
    : `
      <section class="lx-faq-section lx-faq-bare" aria-labelledby="faq-title">${inner}
      </section>
      `;
}

function crumbsHtml(trail) {
  const items = trail.map((item, index) => index === trail.length - 1
    ? `<li aria-current="page">${esc(item.name)}</li>`
    : `<li><a href="${esc(item.path)}">${esc(item.name)}</a></li>`).join("");
  return `
      <nav class="lx-crumbs" aria-label="현재 위치"><ol>${items}</ol></nav>
      `;
}

/* ---------- JSON-LD ---------- */

const organization = Object.freeze({
  "@type": "Organization",
  "@id": ORG_ID,
  name: "AI 빌더스랩",
  alternateName: ["AI 빌더스 랩", "AI Builders Lab"],
  url: `${SITE}/`,
  logo: `${SITE}/assets/ai-builders-lab-logo-transparent.png`,
  email: "hello@ai-hub-os.com",
  sameAs: ["https://www.youtube.com/@AIBuildersLabKR", "https://open.kakao.com/me/aibuilderslab"],
});

function breadcrumbLd(url, trail) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

function faqLd(url, items) {
  const answered = items.filter((item) => item.a);
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: answered.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function webPageLd(url, page) {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: "ko-KR",
    isPartOf: { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "AI 빌더스랩" },
    publisher: { "@id": ORG_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
}

function courseLd(url) {
  const instances = COHORTS.map((cohort) => {
    const instance = {
      "@type": "CourseInstance",
      name: `AI 빌더스랩 ${cohort.label}`,
      courseMode: "Onsite",
      location: { "@type": "Place", name: COMMON.location },
    };
    if (cohort.sessions) instance.courseWorkload = `PT${cohort.sessions.hours * cohort.sessions.count}H`;
    if (cohort.capacity != null) instance.maximumAttendeeCapacity = cohort.capacity;
    if (cohort.price != null) {
      instance.offers = { "@type": "Offer", category: "정규 교육비", price: cohort.price, priceCurrency: "KRW" };
    }
    return instance;
  });
  if (RECRUIT.label) {
    instances.unshift({
      "@type": "CourseInstance",
      name: `AI 빌더스랩 ${RECRUIT.label}`,
      courseMode: "Onsite",
      location: { "@type": "Place", name: COMMON.location },
      maximumAttendeeCapacity: RECRUIT.capacity,
    });
  }
  return {
    "@type": "Course",
    "@id": `${url}#course`,
    name: COURSE.name,
    description: COURSE.description,
    inLanguage: "ko",
    url,
    provider: { "@id": ORG_ID },
    hasCourseInstance: instances,
  };
}

function videoListLd(url, catalog) {
  const labels = new Map((catalog.categories || []).map((category) => [category.id, category.label]));
  return {
    "@type": "ItemList",
    "@id": `${url}#videos`,
    name: "AI 빌더스랩 샘플 영상",
    numberOfItems: catalog.items.length,
    itemListElement: catalog.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        name: item.title,
        description: item.badge ? `${labels.get(item.category)} · ${item.badge}` : `${labels.get(item.category)} 샘플 영상`,
        thumbnailUrl: `${SITE}/lounge/showcase/${item.poster}`,
        contentUrl: `${SITE}/lounge/media/samples/${item.file}`,
        duration: `PT${Math.round(Number(item.durationSec) || 0)}S`,
        inLanguage: "ko",
        // uploadDate: 저장소에 기록이 없어 넣지 않았습니다. REPORT.md 'uploadDate 필요' 참고.
      },
    })),
  };
}

function jsonLdBlock(graph) {
  const text = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)
    .replaceAll("<", "\\u003c");
  return `
    <script type="application/ld+json">
${text}
    </script>
    `;
}

/* ---------- 페이지 ---------- */

function replaceRegion(html, name, content, file) {
  const start = `<!-- lounge:${name} -->`;
  const end = `<!-- /lounge:${name} -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) throw new Error(`${file}에 ${start} 구간이 없습니다.`);
  return `${html.slice(0, from + start.length)}${content}${html.slice(to)}`;
}

function pageMeta(html) {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1] || "";
  return { title, description };
}

export async function renderLounge({ write = true } = {}) {
  const config = await siteConfig();
  const kakao = config.application.kakaoProfile;
  const catalog = JSON.parse(await readFile(resolve(root, "lounge/showcase/samples.json"), "utf8"));
  const loungeTrail = [{ name: "홈", path: "/" }, { name: "빌더스 라운지", path: "/lounge/" }];

  const pages = [
    {
      file: "lounge/index.html",
      regions: {
        curriculum: () => curriculumHtml(),
        recruit: () => recruitHtml(kakao, "../assets/"),
        "cohort-links": () => cohortLinksHtml(),
      },
    },
    {
      file: "lounge/apply/index.html",
      url: `${SITE}/lounge/apply/`,
      trail: [...loungeTrail, { name: "기수 신청", path: "/lounge/apply/" }],
      faq: APPLY_FAQ,
      wrapFaq: true,
      regions: {
        recruit: () => recruitHtml(kakao, "../../assets/"),
        cohorts: () => cohortsHtml(kakao, "../../assets/"),
      },
      extraLd: (url) => [courseLd(url)],
    },
    {
      file: "lounge/samples/index.html",
      url: `${SITE}/lounge/samples/`,
      trail: [...loungeTrail, { name: "샘플 영상", path: "/lounge/samples/" }],
      faq: samplesFaq(catalog),
      wrapFaq: false,
      regions: {},
      extraLd: (url) => [videoListLd(url, catalog)],
    },
    {
      file: "lounge/showcase/index.html",
      url: `${SITE}/lounge/showcase/`,
      trail: [...loungeTrail, { name: "빌더 결과물", path: "/lounge/showcase/" }],
      faq: SHOWCASE_FAQ,
      wrapFaq: false,
      regions: {},
      extraLd: () => [],
    },
  ];

  const changed = [];
  const graphs = {};
  for (const page of pages) {
    const path = resolve(root, page.file);
    const before = await readFile(path, "utf8");
    let html = before;
    for (const [name, render] of Object.entries(page.regions)) html = replaceRegion(html, name, render(), page.file);
    if (page.url) {
      html = replaceRegion(html, "crumbs", crumbsHtml(page.trail), page.file);
      html = replaceRegion(html, "faq", faqHtml(page.faq, { wrap: page.wrapFaq }), page.file);
      const graph = [
        organization,
        webPageLd(page.url, pageMeta(html)),
        breadcrumbLd(page.url, page.trail),
        faqLd(page.url, page.faq),
        ...page.extraLd(page.url),
      ];
      graphs[page.file] = graph;
      html = replaceRegion(html, "jsonld", jsonLdBlock(graph), page.file);
    }
    if (html !== before) {
      changed.push(page.file);
      if (write) await writeFile(path, html);
    }
  }
  return { changed, graphs, faqs: { apply: APPLY_FAQ, samples: samplesFaq(catalog), showcase: SHOWCASE_FAQ } };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const check = process.argv.includes("--check");
  const { changed } = await renderLounge({ write: !check });
  if (check && changed.length) {
    console.error(`라운지 HTML이 데이터와 다릅니다. npm run lounge:render 를 실행하세요: ${changed.join(", ")}`);
    process.exit(1);
  }
  console.log(changed.length ? `라운지 HTML 갱신: ${changed.join(", ")}` : "라운지 HTML이 데이터와 같습니다.");
}
