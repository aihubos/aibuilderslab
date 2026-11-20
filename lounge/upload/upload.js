/*
 * 결과물 올리기: 한 화면에 한 질문
 * 기존 공개 쇼케이스 API(/lounge/api/entries)와 같은 필드·제한을 그대로 씁니다.
 * 서버 계약: services/showcase-api/src/app.js (name, cohort, title, summary, link[], tools, prompt,
 *            image[], file[], company_website(허니팟), turnstileToken)
 */

const API = "/lounge/api";
const SECRET_KEY = "aibl-showcase-secrets"; // 쇼케이스의 수정·삭제 버튼과 같은 저장 키
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const FILE_EXT = new Set(["pdf", "zip", "pptx", "docx", "xlsx", "txt", "md"]);
const MB = 1024 * 1024;
const LIMITS = Object.freeze({ images: 4, files: 4, imageBytes: 5 * MB, fileBytes: 20 * MB, totalBytes: 25 * MB, links: 8 });
const STEPS = Object.freeze(["name", "cohort", "title", "links", "images", "files", "tools", "contact", "review"]);
const EMAIL = /^[^\s@,<>"]+@[^\s@,<>"]+\.[^\s@,<>"]+$/;
const COHORT_LABEL = Object.freeze({ "1": "1기", "2": "2기" });

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const form = $("#up-form");
const state = {
  step: 0,
  images: [],
  files: [],
  sending: false,
  done: false,
  dirty: false,
};

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = String(value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function formatBytes(size) {
  const value = Number(size) || 0;
  if (value < MB) return `${Math.max(1, Math.ceil(value / 1024))}KB`;
  return `${(value / MB).toFixed(1)}MB`;
}

function extensionOf(name) {
  const base = String(name || "").split(/[/\\]/).pop() || "";
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot + 1).toLowerCase();
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/*
 * 연락 링크: https 주소 또는 이메일(mailto)만 받습니다. 서버(parseContact)도 같은 규칙으로 다시 검사합니다.
 * "open.kakao.com/o/..."처럼 적으면 https://를 붙여 줍니다.
 */
function normalizeContact(value) {
  const text = String(value || "").trim();
  if (!text) return { value: "", ok: true };
  if (EMAIL.test(text)) return { value: text, ok: true };
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    if (url.protocol === "mailto:") {
      return { value: candidate, ok: !url.search && EMAIL.test(decodeURIComponent(url.pathname)) };
    }
    return { value: url.toString(), ok: url.protocol === "https:" && !url.username && !url.password && /\./.test(url.hostname) };
  } catch {
    return { value: text, ok: false };
  }
}

/* 사람이 "www.example.com"처럼 적어도 받아 줍니다. */
function normalizeLink(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+/.test(text)) return `https://${text}`;
  return text;
}

function announce(message) {
  const live = $("[data-live]");
  if (live) live.textContent = message;
}

function totalBytes() {
  return [...state.images, ...state.files].reduce((sum, item) => sum + item.file.size, 0);
}

/* ---------- 오류 표시 ---------- */

function setError(id, message, field) {
  const box = document.getElementById(id);
  if (box) box.textContent = message || "";
  if (field) {
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }
}

function clearErrors(section) {
  $$(".up-error", section).forEach((box) => { box.textContent = ""; });
  $$("[aria-invalid]", section).forEach((field) => field.removeAttribute("aria-invalid"));
}

/* ---------- 단계별 확인 ---------- */

function validateStep(name) {
  const section = $(`[data-step="${name}"]`);
  clearErrors(section);

  if (name === "name") {
    const field = form.elements.name;
    const value = field.value.trim();
    if (!value) return fail("e-name", "이름을 적어 주세요.", field);
    if (value.length > 40) return fail("e-name", "이름은 40자 이내로 적어 주세요.", field);
  }

  if (name === "cohort") {
    if (!form.elements.cohort.value) return fail("e-cohort", "1기 또는 2기를 골라 주세요.", $('[name="cohort"]'));
  }

  if (name === "title") {
    const title = form.elements.title;
    const summary = form.elements.summary;
    let ok = true;
    if (!title.value.trim()) { setError("e-title", "제목을 적어 주세요.", title); ok = false; }
    if (!summary.value.trim()) { setError("e-summary", "한 줄 설명을 적어 주세요.", summary); ok = false; }
    if (!ok) {
      (title.value.trim() ? summary : title).focus();
      return false;
    }
  }

  if (name === "contact") {
    const field = form.elements.contact;
    const contact = normalizeContact(field.value);
    if (!contact.ok) return fail("e-contact", "https:// 로 시작하는 주소나 이메일만 넣을 수 있어요. (http, 전화번호는 안 돼요)", field);
    field.value = contact.value;
  }

  if (name === "links") {
    for (const input of $$("[data-link-input]")) {
      const value = normalizeLink(input.value);
      if (!value) continue;
      if (!safeHttpUrl(value)) return fail("e-links", "링크는 https:// 로 시작하는 주소만 넣을 수 있어요.", input);
      input.value = value;
    }
  }

  return true;
}

function fail(errorId, message, field) {
  setError(errorId, message, field);
  field?.focus?.();
  return false;
}

/* ---------- 단계 이동 ---------- */

function stepHasInput(name) {
  if (name === "links") return linkValues().length > 0;
  if (name === "images") return state.images.length > 0;
  if (name === "files") return state.files.length > 0;
  if (name === "tools") return Boolean(form.elements.tools.value.trim() || form.elements.prompt.value.trim());
  if (name === "contact") return Boolean(form.elements.contact.value.trim());
  return true;
}

function updateChrome() {
  const name = STEPS[state.step];
  const section = $(`[data-step="${name}"]`);
  const total = STEPS.length;
  const now = state.step + 1;

  $("[data-step-now]").textContent = String(now);
  $("[data-step-total]").textContent = String(total);
  const progress = $("[data-progress]");
  progress.setAttribute("aria-valuenow", String(now));
  progress.setAttribute("aria-valuetext", `${total}단계 중 ${now}단계`);
  $("[data-progress-bar]").style.width = `${(now / total) * 100}%`;

  const optional = section?.hasAttribute("data-optional");
  const skip = $("[data-skip]");
  const next = $("[data-next]");
  skip.hidden = !optional || stepHasInput(name);
  next.textContent = name === "review" ? (state.sending ? "올리는 중…" : "올리기") : "다음";
  next.disabled = state.sending;

  $("[data-back]").setAttribute("aria-label", state.step === 0 ? "라운지로 돌아가기" : "이전 질문으로");
}

function showStep(index, { focus = true, push = true } = {}) {
  const clamped = Math.max(0, Math.min(STEPS.length - 1, index));
  state.step = clamped;
  const name = STEPS[clamped];
  $$(".up-step").forEach((section) => { section.hidden = section.dataset.step !== name; });
  if (name === "review") renderReview();
  updateChrome();
  if (push) history.pushState({ step: clamped }, "", `#${name}`);
  window.scrollTo({ top: 0 });

  const section = $(`[data-step="${name}"]`);
  const question = $(".up-question", section)?.textContent?.trim() || "";
  announce(`${STEPS.length}단계 중 ${clamped + 1}단계. ${question}`);
  if (!focus) return;
  const target = name === "name" || name === "title" || name === "tools" || name === "contact"
    ? $("input:not([type=hidden]), textarea", section)
    : name === "cohort"
      ? ($('[name="cohort"]:checked') || $("#q-cohort"))
      : $(".up-question", section);
  window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
}

function goNext() {
  const name = STEPS[state.step];
  if (name === "review") {
    submit();
    return;
  }
  if (!validateStep(name)) return;
  showStep(state.step + 1);
}

function goBack() {
  if (state.done) return;
  if (state.step === 0) {
    window.location.href = "/lounge/";
    return;
  }
  history.back();
}

/* ---------- 링크 ---------- */

function linkValues() {
  return $$("[data-link-input]").map((input) => normalizeLink(input.value)).filter(Boolean);
}

function renderLinks(values) {
  const wrap = $("[data-links]");
  const list = values.length ? values.slice(0, LIMITS.links) : [""];
  wrap.replaceChildren(...list.map((value, index) => {
    const id = `f-link-${index + 1}`;
    const input = h("input", {
      class: "up-input",
      id,
      type: "url",
      inputmode: "url",
      autocomplete: "url",
      maxlength: "500",
      placeholder: "https://",
      "data-link-input": "",
      "aria-describedby": "e-links",
    });
    input.value = value;
    input.addEventListener("input", () => { state.dirty = true; updateChrome(); });
    const row = h("div", { class: "up-link-row" }, [
      h("div", { class: "up-field" }, [h("label", { class: "up-label", for: id, text: index === 0 ? "링크" : `링크 ${index + 1}` }), input]),
    ]);
    if (list.length > 1) {
      row.append(h("button", {
        class: "up-remove",
        type: "button",
        text: "삭제",
        "aria-label": `링크 ${index + 1} 삭제`,
        onclick: () => {
          const current = $$("[data-link-input]").map((item) => item.value);
          current.splice(index, 1);
          renderLinks(current);
          updateChrome();
        },
      }));
    }
    return row;
  }));
  $("[data-add-link]").hidden = list.length >= LIMITS.links;
}

/* ---------- 이미지 ---------- */

function addImages(fileList) {
  const errors = [];
  for (const file of fileList) {
    if (state.images.length >= LIMITS.images) { errors.push("이미지는 4장까지 올릴 수 있어요."); break; }
    if (!IMAGE_TYPES.has(file.type) && !IMAGE_EXT.has(extensionOf(file.name))) { errors.push(`${file.name}: jpg, png, webp, gif만 올릴 수 있어요.`); continue; }
    if (file.size > LIMITS.imageBytes) { errors.push(`${file.name}: 한 장에 5MB까지 올릴 수 있어요. (지금 ${formatBytes(file.size)})`); continue; }
    if (totalBytes() + file.size > LIMITS.totalBytes) { errors.push("이미지와 파일을 합쳐 한 번에 25MB까지 올릴 수 있어요."); break; }
    state.images.push({ file, url: URL.createObjectURL(file) });
    state.dirty = true;
  }
  setError("e-images", [...new Set(errors)].join(" "));
  renderImages();
}

function renderImages() {
  const list = $("[data-image-list]");
  list.replaceChildren(...state.images.map((item, index) => h("li", { class: "up-thumb" }, [
    h("img", { src: item.url, alt: `고른 이미지 ${index + 1}: ${item.file.name}` }),
    index === 0 ? h("span", { class: "up-thumb-main", text: "대표" }) : null,
    h("button", {
      class: "up-remove",
      type: "button",
      text: "삭제",
      "aria-label": `이미지 ${index + 1} 삭제`,
      onclick: () => {
        URL.revokeObjectURL(item.url);
        state.images.splice(index, 1);
        renderImages();
        $("#f-images").focus();
      },
    }),
  ])));
  $("[data-image-count]").textContent = `${state.images.length} / ${LIMITS.images}장`;
  syncPicker("#f-images", state.images.length >= LIMITS.images);
  updateChrome();
}

/* ---------- 파일 ---------- */

function addFiles(fileList) {
  const errors = [];
  for (const file of fileList) {
    if (state.files.length >= LIMITS.files) { errors.push("파일은 4개까지 올릴 수 있어요."); break; }
    if (!FILE_EXT.has(extensionOf(file.name))) { errors.push(`${file.name}: pdf, zip, pptx, docx, xlsx, txt, md만 올릴 수 있어요.`); continue; }
    if (file.size > LIMITS.fileBytes) { errors.push(`${file.name}: 하나에 20MB까지 올릴 수 있어요. (지금 ${formatBytes(file.size)})`); continue; }
    if (totalBytes() + file.size > LIMITS.totalBytes) { errors.push("이미지와 파일을 합쳐 한 번에 25MB까지 올릴 수 있어요."); break; }
    state.files.push({ file });
    state.dirty = true;
  }
  setError("e-files", [...new Set(errors)].join(" "));
  renderFiles();
}

function renderFiles() {
  const list = $("[data-file-list]");
  list.replaceChildren(...state.files.map((item, index) => h("li", {}, [
    h("div", {}, [h("strong", { text: item.file.name }), h("small", { text: formatBytes(item.file.size) })]),
    h("button", {
      class: "up-remove",
      type: "button",
      text: "삭제",
      "aria-label": `${item.file.name} 삭제`,
      onclick: () => {
        state.files.splice(index, 1);
        renderFiles();
        $("#f-files").focus();
      },
    }),
  ])));
  $("[data-file-count]").textContent = `${state.files.length} / ${LIMITS.files}개`;
  syncPicker("#f-files", state.files.length >= LIMITS.files);
  updateChrome();
}

function syncPicker(selector, full) {
  const input = $(selector);
  input.disabled = full;
  $(`label[for="${input.id}"]`)?.classList.toggle("is-full", full);
}

/* ---------- 확인 화면 ---------- */

function renderReview() {
  const rows = [
    ["이름", form.elements.name.value.trim(), "name"],
    ["기수", COHORT_LABEL[form.elements.cohort.value] || "", "cohort"],
    ["제목", form.elements.title.value.trim(), "title"],
    ["한 줄 설명", form.elements.summary.value.trim(), "title"],
    ["링크", linkValues().join("\n"), "links"],
    ["이미지", state.images.length ? `${state.images.length}장` : "", "images"],
    ["파일", state.files.map((item) => item.file.name).join("\n"), "files"],
    ["사용한 도구", form.elements.tools.value.trim(), "tools"],
    ["프롬프트", form.elements.prompt.value.trim() ? `${form.elements.prompt.value.trim().slice(0, 120)}${form.elements.prompt.value.trim().length > 120 ? "…" : ""}` : "", "tools"],
    ["연락 링크", form.elements.contact.value.trim(), "contact"],
  ];
  $("[data-review]").replaceChildren(...rows.map(([label, value, step]) => h("div", {}, [
    h("dt", { text: label }),
    h("dd", { class: value ? "" : "is-empty", text: value || "없음" }),
    h("button", {
      type: "button",
      text: "고치기",
      "aria-label": `${label} 고치기`,
      onclick: () => showStep(STEPS.indexOf(step)),
    }),
  ])));
}

/* ---------- 제출 ---------- */

function buildPayload() {
  const data = new FormData();
  data.set("name", form.elements.name.value.trim());
  data.set("cohort", form.elements.cohort.value);
  data.set("title", form.elements.title.value.trim());
  data.set("summary", form.elements.summary.value.trim());
  for (const link of linkValues()) data.append("link", link);
  data.set("tools", form.elements.tools.value.trim());
  data.set("prompt", form.elements.prompt.value);
  data.set("contact", normalizeContact(form.elements.contact.value).value);
  data.set("company_website", form.elements.company_website.value);
  const token = $('[name="cf-turnstile-response"]')?.value;
  if (token) data.set("turnstileToken", token);
  for (const item of state.images) data.append("image", item.file, item.file.name);
  for (const item of state.files) data.append("file", item.file, item.file.name);
  return data;
}

function firstInvalidStep() {
  for (const name of ["name", "cohort", "title", "links", "contact"]) {
    if (!validateStep(name)) return name;
  }
  return "";
}

function setSending(sending, ratio = 0) {
  state.sending = sending;
  $("[data-send]").hidden = !sending;
  $("[data-send-bar]").style.width = `${Math.round(ratio * 100)}%`;
  $("[data-send-label]").textContent = sending ? `올리는 중 ${Math.round(ratio * 100)}%` : "";
  updateChrome();
}

function submit() {
  if (state.sending) return;
  setError("e-review", "");
  const invalid = firstInvalidStep();
  if (invalid) {
    showStep(STEPS.indexOf(invalid));
    validateStep(invalid);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API}/entries`);
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) setSending(true, event.loaded / event.total);
  };
  xhr.onload = () => {
    setSending(false);
    let body = {};
    try { body = JSON.parse(xhr.responseText || "{}"); } catch { body = {}; }
    if (xhr.status < 200 || xhr.status >= 300) {
      setError("e-review", body.error || "올리지 못했어요. 내용을 다시 확인해 주세요.");
      $("#e-review").focus?.();
      window.turnstile?.reset?.();
      return;
    }
    finish(body);
  };
  xhr.onerror = () => {
    setSending(false);
    setError("e-review", "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
  };
  setSending(true, 0);
  xhr.send(buildPayload());
}

function saveSecret(id, secret) {
  try {
    const all = JSON.parse(sessionStorage.getItem(SECRET_KEY) || "{}");
    all[id] = secret;
    sessionStorage.setItem(SECRET_KEY, JSON.stringify(all));
  } catch {
    // 저장이 막힌 브라우저에서도 화면의 코드는 그대로 보여 줍니다.
  }
}

function finish(body) {
  state.done = true;
  state.dirty = false;
  const cohort = body.entry?.cohort || form.elements.cohort.value || "1";
  if (body.entry?.id && body.editSecret) saveSecret(body.entry.id, body.editSecret);
  $("[data-secret]").value = body.editSecret || "";
  $("[data-done-cohort]").textContent = COHORT_LABEL[cohort] || "1기";
  $("[data-done-link]").href = `/lounge/showcase/?cohort=${encodeURIComponent(cohort)}`;

  $$(".up-step").forEach((section) => { section.hidden = section.dataset.step !== "done"; });
  $("[data-bar]").hidden = true;
  $("[data-back]").hidden = true;
  $(".up-count").hidden = true;
  $("[data-exit]").textContent = "닫기";
  $("[data-progress-bar]").style.width = "100%";
  history.replaceState({ step: "done" }, "", "#done");
  window.scrollTo({ top: 0 });
  announce("결과물을 올렸어요. 수정 코드를 꼭 저장해 주세요.");
  window.requestAnimationFrame(() => $("#q-done").focus({ preventScroll: true }));
  state.images.forEach((item) => URL.revokeObjectURL(item.url));
}

async function copySecret() {
  const input = $("[data-secret]");
  const status = $("[data-copy-status]");
  try {
    await navigator.clipboard.writeText(input.value);
    status.textContent = "수정 코드를 복사했어요. 안전한 곳에 붙여 넣어 두세요.";
  } catch {
    input.select();
    status.textContent = "자동 복사가 안 됐어요. 코드를 길게 눌러 직접 복사해 주세요.";
  }
}

/* ---------- 자동 입력 방지(Turnstile) 설정: 서버가 켜 둔 경우에만 ---------- */

async function loadConfig() {
  let siteKey = null;
  try {
    const response = await fetch(`${API}/config`, { cache: "no-store" });
    if (response.ok) siteKey = (await response.json()).turnstileSiteKey;
  } catch {
    siteKey = null;
  }
  if (!siteKey || !/^[0-9A-Za-z_-]{8,120}$/.test(siteKey)) return;
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  document.head.append(script);
  $("#turnstile").append(h("div", { class: "cf-turnstile", "data-sitekey": siteKey }));
}

/* ---------- 연결 ---------- */

function bind() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    goNext();
  });
  $("[data-skip]").addEventListener("click", () => showStep(state.step + 1));
  $("[data-back]").addEventListener("click", goBack);

  window.addEventListener("popstate", (event) => {
    if (state.done) {
      history.replaceState({ step: "done" }, "", "#done");
      return;
    }
    const step = Number(event.state?.step);
    showStep(Number.isInteger(step) ? step : 0, { push: false });
  });

  $$("[data-counter-for]").forEach((counter) => {
    const field = document.getElementById(counter.dataset.counterFor);
    const max = field.getAttribute("maxlength");
    const sync = () => { counter.textContent = `${field.value.length} / ${max}`; };
    field.addEventListener("input", sync);
    sync();
  });

  form.addEventListener("input", (event) => {
    state.dirty = true;
    const field = event.target;
    if (field.getAttribute("aria-invalid") === "true" && String(field.value || "").trim()) {
      field.removeAttribute("aria-invalid");
      const errorId = field.getAttribute("aria-describedby")?.split(" ").find((id) => id.startsWith("e-"));
      if (errorId) setError(errorId, "");
    }
    updateChrome();
  });

  form.addEventListener("change", (event) => {
    if (event.target.name === "cohort") setError("e-cohort", "");
  });

  $("[data-add-link]").addEventListener("click", () => {
    const values = $$("[data-link-input]").map((input) => input.value);
    renderLinks([...values, ""]);
    $$("[data-link-input]").at(-1)?.focus();
  });

  for (const [selector, add] of [["#f-images", addImages], ["#f-files", addFiles]]) {
    const input = $(selector);
    const label = $(`label[for="${input.id}"]`);
    input.addEventListener("change", () => {
      add([...(input.files || [])]);
      input.value = "";
    });
    input.addEventListener("focus", () => label?.classList.add("is-focus"));
    input.addEventListener("blur", () => label?.classList.remove("is-focus"));
  }

  $("[data-copy-secret]").addEventListener("click", copySecret);

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty || state.done) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function init() {
  const cohort = new URLSearchParams(window.location.search).get("cohort");
  if (cohort && COHORT_LABEL[cohort]) {
    const radio = $(`[name="cohort"][value="${cohort}"]`);
    if (radio) radio.checked = true;
  }
  renderLinks([""]);
  renderImages();
  renderFiles();
  bind();
  history.replaceState({ step: 0 }, "", window.location.pathname + window.location.search);
  showStep(0, { push: false, focus: false });
  loadConfig();
}

init();
