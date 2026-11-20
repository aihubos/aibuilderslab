import { COHORTS } from "./cohorts.js";
import { syncConfigLinks } from "../lounge.js";

const STATUS = Object.freeze({
  open: { text: "모집 중", tone: "lx-badge-green" },
  upcoming: { text: "모집 예정", tone: "lx-badge-blue" },
  closed: { text: "모집 마감", tone: "" },
});

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = String(value);
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/* 확정되지 않은 값은 눈에 띄는 자리표시로 보여 줍니다. 운영자가 cohorts.js에서 채웁니다. */
function placeholder(label) {
  return h("span", { class: "lx-placeholder", "data-placeholder": "", text: `${label} 입력 필요` });
}

function statusBadge(cohort) {
  const status = STATUS[cohort.status];
  if (!status) return h("span", { class: "lx-placeholder", "data-placeholder": "", text: "모집 상태 입력 필요" });
  return h("span", { class: `lx-badge ${status.tone}`.trim(), text: status.text });
}

function factRow(fact) {
  const value = fact.value
    ? [fact.value, fact.note ? h("small", { text: fact.note }) : null]
    : [placeholder(fact.label)];
  return h("div", {}, [h("dt", { text: fact.label }), h("dd", {}, value)]);
}

function kakaoButton(label) {
  return h("a", {
    class: "lx-btn lx-btn-kakao",
    href: "https://open.kakao.com/me/aibuilderslab",
    target: "_blank",
    rel: "noopener noreferrer",
    "data-config-link": "kakaoProfile",
  }, [
    h("img", { src: "../../assets/kakao-openchat-icon-84.webp", width: "84", height: "84", alt: "" }),
    label,
    h("span", { class: "lx-sr", text: " (새 창)" }),
  ]);
}

function cohortSection(cohort) {
  const titleId = `cohort-${cohort.id}-title`;
  const section = h("article", { class: "lx-cohort", id: `cohort-${cohort.id}`, "aria-labelledby": titleId });
  section.append(h("div", { class: "lx-cohort-head" }, [h("h3", { id: titleId, text: cohort.label }), statusBadge(cohort)]));
  section.append(cohort.summary ? h("p", { text: cohort.summary }) : h("p", {}, [placeholder("한 줄 소개")]));
  section.append(h("dl", { class: "lx-facts" }, cohort.facts.map(factRow)));

  if (cohort.flow?.length) {
    section.append(h("p", { class: "lx-cohort-note", text: cohort.flowTitle || "진행 흐름" }));
    section.append(h("ol", { class: "lx-cohort-flow" }, cohort.flow.map((step) => h("li", { text: step }))));
  }
  for (const note of cohort.notes || []) section.append(h("p", { class: "lx-cohort-note", text: note }));
  if (!cohort.status || !cohort.summary || cohort.facts.some((fact) => !fact.value)) {
    section.append(h("p", { class: "lx-cohort-note", text: "‘확정 전’ 항목은 정해지는 대로 이곳에 안내합니다. 먼저 궁금하면 카카오톡으로 물어보세요." }));
  }

  const foot = h("div", { class: "lx-cohort-foot" });
  if (cohort.status === "closed") {
    foot.append(h("a", { class: "lx-btn lx-btn-line", href: `/lounge/showcase/?cohort=${cohort.id}`, text: `${cohort.label} 결과물 보기` }));
  } else {
    foot.append(kakaoButton(`카카오톡으로 ${cohort.label} 신청·문의`));
  }
  section.append(foot);
  return section;
}

function render() {
  const tabs = document.querySelector("[data-cohort-tabs]");
  const list = document.querySelector("[data-cohorts]");
  if (!list) return;
  list.replaceChildren(...COHORTS.map(cohortSection));
  tabs?.replaceChildren(...COHORTS.map((cohort) => h("a", { href: `#cohort-${cohort.id}`, text: cohort.label })));
  syncConfigLinks(list);
}

render();
