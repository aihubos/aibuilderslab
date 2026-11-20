import { COHORTS } from "../data/cohorts.js";
import { loadStats } from "../data/stats.js";

const API = "/lounge/api";
const LIKED_KEY = "aibl-showcase-liked";
const SECRET_KEY = "aibl-showcase-secrets";
const ADMIN_KEY = "aibl-showcase-admin-token";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FILE_EXT = new Set(["pdf", "zip", "pptx", "docx", "xlsx", "txt", "md"]);
const LIMITS = { images: 4, files: 4, imageBytes: 5 * 1024 * 1024, fileBytes: 20 * 1024 * 1024, totalBytes: 25 * 1024 * 1024, links: 8 };

const UPLOAD_PAGE = "/lounge/upload/";
const initialCohort = new URLSearchParams(location.search).get("cohort");

const state = {
  cohort: initialCohort === "2" ? "2" : "1",
  entries: [],
  config: { turnstileSiteKey: null },
  admin: new URLSearchParams(location.search).has("admin"),
  adminToken: "",
  editingId: "",
  lastFocus: null,
};

const $ = (selector) => document.querySelector(selector);

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

function readSecrets() {
  try { return JSON.parse(sessionStorage.getItem(SECRET_KEY) || "{}"); } catch { return {}; }
}

function saveSecret(id, secret) {
  const all = readSecrets();
  all[id] = secret;
  sessionStorage.setItem(SECRET_KEY, JSON.stringify(all));
}

function formatBytes(size) {
  const value = Number(size) || 0;
  if (value < 1024) return `${value}B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)}KB`;
  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch { return ""; }
}

/* "이 빌더에게 질문하기": https 또는 mailto만 링크로 만듭니다. 서버도 같은 규칙으로 검증합니다. */
function safeContactUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol === "https:" && !url.username && !url.password) return url.toString();
    if (url.protocol === "mailto:" && !url.search && /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(decodeURIComponent(url.pathname))) return url.toString();
    return "";
  } catch { return ""; }
}

function contactButton(entry, className) {
  const href = safeContactUrl(entry.contact);
  if (!href) return null;
  const isMail = href.startsWith("mailto:");
  return h("a", {
    class: className,
    href,
    target: isMail ? null : "_blank",
    rel: "ugc nofollow noopener noreferrer",
    "aria-label": `${entry.name || "빌더"}에게 질문하기${isMail ? " (메일)" : " (새 창)"}`,
  }, ["이 빌더에게 질문하기"]);
}

function readLiked() {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]")); } catch { return new Set(); }
}

function rememberLiked(id) {
  const liked = readLiked();
  liked.add(id);
  try { localStorage.setItem(LIKED_KEY, JSON.stringify([...liked].slice(-500))); } catch { /* 저장이 막혀도 좋아요 수는 서버 기준으로 보여 줍니다. */ }
}

function likeButton(entry) {
  const liked = readLiked().has(entry.id);
  const count = h("span", { class: "like-count", text: String(Number(entry.likes) || 0) });
  const button = h("button", {
    class: "like-button",
    type: "button",
    "aria-pressed": String(liked),
    "aria-label": `좋아요 ${Number(entry.likes) || 0}개${liked ? ", 눌렀어요" : ""}`,
  }, [h("span", { class: "like-heart", "aria-hidden": "true", text: liked ? "♥" : "♡" }), " 좋아요 ", count]);
  button.addEventListener("click", () => likeEntry(entry, button, count));
  return button;
}

async function likeEntry(entry, button, count) {
  if (button.getAttribute("aria-pressed") === "true" || button.disabled) return;
  button.disabled = true;
  try {
    const data = await api(`/entries/${entry.id}/like`, { method: "POST" });
    entry.likes = data.likes;
    rememberLiked(entry.id);
    document.querySelectorAll(`[data-like-for="${entry.id}"]`).forEach((node) => {
      node.querySelector(".like-count").textContent = String(data.likes);
      node.querySelector(".like-heart").textContent = "♥";
      node.setAttribute("aria-pressed", "true");
      node.setAttribute("aria-label", `좋아요 ${data.likes}개, 눌렀어요`);
    });
    count.textContent = String(data.likes);
  } catch (error) {
    setStatus(error.message || "좋아요를 보내지 못했습니다.");
  } finally {
    button.disabled = false;
  }
}

function renderCohortStats() {
  const box = document.querySelector("[data-cohort-stats]");
  if (!box) return;
  const cohort = COHORTS.find((item) => item.id === state.cohort);
  const graduates = Number.isInteger(cohort?.graduates)
    ? h("span", { class: "chip", text: `수료생 ${cohort.graduates}명` })
    : h("span", { class: "lx-placeholder", text: "수료생 수 입력 필요" });
  const entries = h("span", { class: "chip", text: "결과물 집계 중" });
  box.replaceChildren(graduates, entries);
  loadStats().then((counts) => {
    const count = counts.get(state.cohort);
    entries.textContent = Number.isInteger(count) ? `결과물 ${count}개` : "결과물 수 확인 불가";
  });
}

function safeMediaPath(value) {
  const text = String(value || "");
  if (!text.startsWith("/lounge/") || text.includes("..") || text.includes("\\")) return "";
  return text;
}

function youtubeId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(value || "") ? value : "";
}

function extensionOf(name) {
  const base = String(name || "").split(/[/\\]/).pop() || "";
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot + 1).toLowerCase();
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.adminToken) headers.set("X-Admin-Token", state.adminToken);
  const response = await fetch(`${API}${path}`, { ...options, headers, cache: "no-store" });
  const text = await response.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = { error: "응답을 읽지 못했습니다." }; }
  }
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

function setStatus(message) {
  $("#status").textContent = message || "";
}

function cohortLabel(cohort) {
  return cohort === "2" ? "2기" : "1기";
}

/* 새 결과물은 한 화면에 한 질문씩 묻는 /lounge/upload/에서 올립니다. 수정은 아래 대화상자를 그대로 씁니다. */
function uploadHref() {
  return `${UPLOAD_PAGE}?cohort=${state.cohort}`;
}

function syncCohortUi() {
  document.querySelectorAll("[data-cohort]").forEach((item) => {
    const selected = item.dataset.cohort === state.cohort;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  const upload = document.querySelector("[data-open-upload]");
  if (upload) upload.href = uploadHref();
  renderCohortStats();
}

function renderEntries() {
  const grid = $("#entry-grid");
  grid.replaceChildren();
  if (!state.entries.length) {
    const cohort = cohortLabel(state.cohort);
    grid.append(h("div", { class: "empty" }, [
      h("strong", { text: "아직 올라온 결과물이 없습니다." }),
      h("p", { text: `${cohort} 빌더의 첫 결과물을 올려 보세요. 로그인 없이 등록할 수 있습니다.` }),
      h("a", { class: "primary", href: uploadHref(), text: "결과물 올리기" }),
    ]));
    return;
  }
  for (const entry of state.entries) grid.append(entryCard(entry));
}

function entryCard(entry) {
  const thumb = entry.images?.[0]?.thumbUrl;
  const media = h("div", { class: "thumb" });
  const src = safeMediaPath(thumb);
  if (src) media.append(h("img", { src, alt: "" }));
  const copy = [
    h("div", { class: "card-meta" }, [h("span", { class: "chip", text: entry.cohortLabel || cohortLabel(entry.cohort) })]),
    h("h3", { text: entry.title || "제목 없음" }),
    h("p", { text: entry.summary || "" }),
    h("span", { class: "hint", text: entry.name || "" }),
  ];
  if (entry.hidden) copy.push(h("span", { class: "hidden-flag", text: "숨김" }));
  const like = likeButton(entry);
  like.dataset.likeFor = entry.id;
  return h("article", { class: "entry-card" }, [
    h("button", { class: "entry-open", type: "button", onclick: () => openDetail(entry), "aria-label": `${entry.title || "결과물"} 자세히 보기` }, [
      media,
      h("div", { class: "card-copy" }, copy),
    ]),
    h("div", { class: "card-actions" }, [like, contactButton(entry, "ask-button")]),
  ]);
}

async function loadEntries() {
  setStatus("결과물을 불러오는 중입니다.");
  try {
    const path = state.admin && state.adminToken
      ? `/admin/entries?cohort=${state.cohort}`
      : `/entries?cohort=${state.cohort}`;
    const data = await api(path);
    state.entries = data.entries || [];
    setStatus("");
    renderEntries();
  } catch (error) {
    state.entries = [];
    $("#entry-grid").replaceChildren();
    setStatus(error.message || "결과물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

function openDetail(entry) {
  state.lastFocus = document.activeElement;
  $("#detail-title").textContent = entry.title || "결과물";
  const body = $("#detail-body");
  body.replaceChildren();
  body.append(
    h("p", {}, [h("span", { class: "chip", text: entry.cohortLabel || cohortLabel(entry.cohort) }), " ", entry.name || ""]),
    h("p", { text: entry.summary || "" }),
  );
  const detailLike = likeButton(entry);
  detailLike.dataset.likeFor = entry.id;
  body.append(h("div", { class: "card-actions detail-reactions" }, [detailLike, contactButton(entry, "ask-button")]));
  if (entry.images?.length) body.append(gallery(entry.images));
  for (const link of entry.links || []) {
    const href = safeHttpUrl(link.url);
    if (!href) continue;
    const id = youtubeId(link.youtubeId);
    if (id) {
      body.append(h("h3", { text: "유튜브" }));
      body.append(h("div", { class: "embed" }, [
        h("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${id}`,
          title: `${entry.title || "결과물"} 영상`,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
        }),
      ]));
    }
    body.append(h("a", { href, target: "_blank", rel: "ugc nofollow noopener noreferrer", text: href }));
  }
  if (entry.files?.length) {
    const list = h("div", {});
    for (const file of entry.files) {
      const href = safeMediaPath(file.url);
      if (!href) continue;
      list.append(h("div", { class: "file-row" }, [
        h("a", { href, download: file.name || "download", rel: "nofollow noopener", text: file.name || "첨부 파일" }),
        h("span", { class: "hint", text: formatBytes(file.size) }),
      ]));
    }
    body.append(h("h3", { text: "첨부 파일" }), list);
  }
  if (entry.tools) body.append(h("h3", { text: "사용한 도구" }), h("p", { text: entry.tools }));
  if (entry.prompt) {
    const prompt = h("pre", { class: "prompt", text: entry.prompt });
    body.append(
      h("h3", { text: "사용한 프롬프트" }),
      prompt,
      h("button", { class: "text-button", type: "button", text: "프롬프트 복사", onclick: () => copyText(entry.prompt, "프롬프트를 복사했습니다.") }),
    );
  }
  const actions = h("div", { class: "detail-actions" });
  actions.append(h("button", { class: "text-button", type: "button", text: "수정", onclick: () => openUpload(entry) }));
  actions.append(h("button", { class: "text-button", type: "button", text: "삭제", onclick: () => deleteOwn(entry) }));
  actions.append(h("button", { class: "text-button", type: "button", text: "신고하기", onclick: () => reportEntry(entry) }));
  if (state.admin && state.adminToken) {
    actions.append(h("button", {
      class: "text-button",
      type: "button",
      text: entry.hidden ? "다시 보이기" : "숨기기",
      onclick: () => hideEntry(entry, !entry.hidden),
    }));
    actions.append(h("button", { class: "text-button", type: "button", text: "관리자 삭제", onclick: () => adminDelete(entry) }));
    if (entry.reportCount) actions.append(h("span", { class: "hint", text: `신고 ${entry.reportCount}건` }));
    for (const report of entry.reports || []) actions.append(h("p", { text: report.reason }));
  }
  body.append(actions);
  $("#detail-dialog").showModal();
}

function gallery(images) {
  const main = h("img", { class: "gallery-main", alt: "결과 이미지" });
  const thumbs = h("div", { class: "gallery-thumbs" });
  const usable = images.map((image) => safeMediaPath(image.url)).filter(Boolean);
  const show = (src) => { main.src = src; };
  if (usable[0]) show(usable[0]);
  images.forEach((image, index) => {
    const full = safeMediaPath(image.url);
    const thumb = safeMediaPath(image.thumbUrl) || full;
    if (!full || !thumb) return;
    thumbs.append(h("button", { type: "button", onclick: () => show(full), "aria-label": `이미지 ${index + 1}` }, [
      h("img", { src: thumb, alt: "" }),
    ]));
  });
  return h("div", { class: "gallery" }, [main, thumbs]);
}

async function reportEntry(entry) {
  const reason = window.prompt("어떤 점이 문제인지 짧게 적어 주세요.");
  if (!reason || !reason.trim()) return;
  try {
    await api(`/entries/${entry.id}/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    setStatus("신고를 접수했습니다. 확인해 볼게요.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function hideEntry(entry, hidden) {
  try {
    await api(`/admin/entries/${entry.id}/hide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    $("#detail-dialog").close();
    await loadEntries();
  } catch (error) {
    setStatus(error.message);
  }
}

async function adminDelete(entry) {
  if (!window.confirm("이 결과물을 삭제할까요? 삭제한 뒤에는 되돌릴 수 없습니다.")) return;
  try {
    await api(`/admin/entries/${entry.id}`, { method: "DELETE" });
    $("#detail-dialog").close();
    await loadEntries();
  } catch (error) {
    setStatus(error.message);
  }
}

function resetLinks(values = [""]) {
  const wrap = $("#link-fields");
  wrap.replaceChildren();
  values.slice(0, LIMITS.links).forEach((value, index) => {
    const id = `field-link-${index + 1}`;
    wrap.append(h("label", { for: id, text: index === 0 ? "링크" : `링크 ${index + 1}` }));
    wrap.append(h("input", { id, name: "link", type: "url", inputmode: "url", maxlength: "500", value, placeholder: "https:// 홈페이지 또는 유튜브" }));
  });
}

function openUpload(entry) {
  state.lastFocus = document.activeElement;
  state.editingId = entry?.id || "";
  const form = $("#upload-form");
  form.reset();
  $("#upload-title").textContent = entry ? "결과물 수정" : "결과물 올리기";
  form.querySelector("[type=submit]").textContent = entry ? "수정 저장" : "등록하기";
  $("#clear-images-label").hidden = !entry;
  $("#clear-files-label").hidden = !entry;
  $("#form-errors").hidden = true;
  $("#image-preview").replaceChildren();
  resetLinks(entry?.links?.map((link) => link.url) || [""]);
  if (entry) {
    let known = readSecrets()[entry.id];
    if (!known) {
      const typed = window.prompt("수정 코드를 입력해 주세요. 올릴 때 저장한 코드입니다.");
      if (!typed) return;
      known = typed.trim();
      saveSecret(entry.id, known);
    }
    form.name.value = entry.name || "";
    form.cohort.value = entry.cohort || "1";
    form.title.value = entry.title || "";
    form.summary.value = entry.summary || "";
    form.tools.value = entry.tools || "";
    form.prompt.value = entry.prompt || "";
    form.contact.value = entry.contact ? entry.contact.replace(/^mailto:/, "") : "";
  } else {
    form.cohort.value = state.cohort;
  }
  $("#upload-dialog").showModal();
  form.name.focus();
}

function showErrors(messages) {
  const box = $("#form-errors");
  box.replaceChildren(h("ul", {}, messages.map((message) => h("li", { text: message }))));
  box.hidden = messages.length === 0;
}

function validateForm(form) {
  const errors = [];
  const name = form.name.value.trim();
  const title = form.title.value.trim();
  const summary = form.summary.value.trim();
  if (!name) errors.push("이름을 입력해 주세요.");
  if (!form.cohort.value) errors.push("기수를 선택해 주세요.");
  if (!title) errors.push("제목을 입력해 주세요.");
  if (!summary) errors.push("한 줄 설명을 입력해 주세요.");
  if (name.length > 40) errors.push("이름은 40자 이내로 적어 주세요.");
  if (title.length > 80) errors.push("제목은 80자 이내로 적어 주세요.");
  if (summary.length > 160) errors.push("한 줄 설명은 160자 이내로 적어 주세요.");
  const links = [...form.querySelectorAll("[name=link]")].map((input) => input.value.trim()).filter(Boolean);
  if (links.length > LIMITS.links) errors.push("링크는 8개까지 넣을 수 있습니다.");
  for (const link of links) if (!safeHttpUrl(link)) errors.push("링크는 http 또는 https 주소만 넣을 수 있습니다.");
  const contact = form.contact.value.trim();
  if (contact && !safeContactUrl(contact) && !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(contact)) {
    errors.push("연락 링크는 https:// 주소나 이메일만 넣을 수 있습니다.");
  }
  const images = [...(form.image.files || [])];
  const files = [...(form.file.files || [])];
  if (images.length > LIMITS.images) errors.push("이미지는 4장까지 올릴 수 있습니다.");
  if (files.length > LIMITS.files) errors.push("첨부 파일은 4개까지 올릴 수 있습니다.");
  let total = 0;
  for (const image of images) {
    total += image.size;
    if (!IMAGE_TYPES.has(image.type) && !["jpg", "jpeg", "png", "webp", "gif"].includes(extensionOf(image.name))) {
      errors.push("이미지는 jpg, png, webp, gif만 올릴 수 있습니다.");
    }
    if (image.size > LIMITS.imageBytes) errors.push("이미지는 한 장에 5MB까지 올릴 수 있습니다.");
  }
  for (const file of files) {
    total += file.size;
    if (!FILE_EXT.has(extensionOf(file.name))) errors.push("첨부 파일은 pdf, zip, pptx, docx, xlsx, txt, md만 올릴 수 있습니다.");
    if (file.size > LIMITS.fileBytes) errors.push("첨부 파일은 하나당 20MB까지 올릴 수 있습니다.");
  }
  if (total > LIMITS.totalBytes) errors.push("한 번에 올릴 수 있는 용량은 25MB입니다.");
  return errors;
}

function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errors = validateForm(form);
  showErrors(errors);
  if (errors.length) return;
  const editing = state.editingId;
  const data = new FormData(form);
  const tokenField = form.querySelector("[name=cf-turnstile-response]");
  if (tokenField?.value) data.set("turnstileToken", tokenField.value);
  if (!form.image.files.length) data.delete("image");
  if (!form.file.files.length) data.delete("file");
  const xhr = new XMLHttpRequest();
  xhr.open(editing ? "PATCH" : "POST", `${API}/entries${editing ? `/${editing}` : ""}`);
  if (editing) {
    const secret = readSecrets()[editing] || "";
    if (!secret) {
      showErrors(["수정 코드가 없습니다. 수정·삭제를 다시 눌러 코드를 입력해 주세요."]);
      return;
    }
    xhr.setRequestHeader("X-Edit-Secret", secret);
  }
  const progress = $("#upload-progress");
  const label = $("#upload-progress-label");
  progress.hidden = false;
  label.hidden = false;
  form.querySelector("[type=submit]").disabled = true;
  xhr.upload.onprogress = (progressEvent) => {
    if (!progressEvent.lengthComputable) return;
    const ratio = progressEvent.loaded / progressEvent.total;
    $("#upload-progress-bar").style.width = `${Math.round(ratio * 100)}%`;
    label.textContent = `올리는 중 ${Math.round(ratio * 100)}%`;
  };
  xhr.onload = () => {
    form.querySelector("[type=submit]").disabled = false;
    progress.hidden = true;
    label.hidden = true;
    let body = {};
    try { body = JSON.parse(xhr.responseText || "{}"); } catch { body = {}; }
    if (xhr.status < 200 || xhr.status >= 300) {
      showErrors([body.error || "올리지 못했습니다. 내용을 다시 확인해 주세요."]);
      return;
    }
    $("#upload-dialog").close();
    if (body.editSecret && body.entry?.id) {
      saveSecret(body.entry.id, body.editSecret);
      showSecret(body.editSecret);
      state.cohort = body.entry.cohort || state.cohort;
      syncCohortUi();
    } else {
      setStatus(editing ? "결과물을 수정했습니다." : "결과물을 등록했습니다.");
    }
    $("#detail-dialog").close();
    loadEntries();
  };
  xhr.onerror = () => {
    form.querySelector("[type=submit]").disabled = false;
    progress.hidden = true;
    showErrors(["서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."]);
  };
  xhr.send(data);
}

function showSecret(secret) {
  const banner = $("#secret-banner");
  $("#secret-value").value = secret;
  banner.hidden = false;
  banner.classList.add("is-visible");
  banner.scrollIntoView({ block: "nearest" });
}

async function copyText(value, message) {
  try {
    await navigator.clipboard.writeText(value);
    setStatus(message);
  } catch {
    setStatus("복사에 실패했습니다. 코드를 길게 눌러 선택해 주세요.");
  }
}

async function deleteOwn(entry) {
  let secret = readSecrets()[entry.id];
  if (!secret) {
    const typed = window.prompt("삭제하려면 수정 코드를 입력해 주세요.");
    if (!typed) return;
    secret = typed.trim();
    saveSecret(entry.id, secret);
  }
  if (!window.confirm("이 결과물을 삭제할까요? 삭제한 뒤에는 되돌릴 수 없습니다.")) return;
  try {
    await api(`/entries/${entry.id}`, { method: "DELETE", headers: { "X-Edit-Secret": secret } });
    $("#detail-dialog").close();
    setStatus("결과물을 삭제했습니다.");
    await loadEntries();
  } catch (error) {
    setStatus(error.message);
  }
}

function closeDialog(dialog) {
  dialog.close();
  state.lastFocus?.focus?.();
}

async function loadConfig() {
  try {
    state.config = await api("/config");
  } catch {
    state.config = { turnstileSiteKey: null };
  }
  const siteKey = state.config.turnstileSiteKey;
  if (siteKey && /^[0-9A-Za-z_-]{8,120}$/.test(siteKey)) {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.head.append(script);
    $("#turnstile").append(h("div", { class: "cf-turnstile", "data-sitekey": siteKey }));
  }
}

function bind() {
  document.querySelectorAll("[data-cohort]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cohort = button.dataset.cohort;
      syncCohortUi();
      const url = new URL(location.href);
      url.searchParams.set("cohort", state.cohort);
      history.replaceState(null, "", url);
      loadEntries();
    });
  });
  syncCohortUi();
  document.querySelector("[data-add-link]").addEventListener("click", () => {
    const count = $("#link-fields").querySelectorAll("input").length;
    if (count >= LIMITS.links) return;
    const values = [...$("#link-fields").querySelectorAll("input")].map((input) => input.value);
    resetLinks([...values, ""]);
  });
  $("#field-images").addEventListener("change", () => {
    const row = $("#image-preview");
    row.replaceChildren();
    [...$("#field-images").files].slice(0, LIMITS.images).forEach((file) => {
      const img = h("img", { alt: "" });
      img.src = URL.createObjectURL(file);
      row.append(img);
    });
  });
  $("#upload-form").addEventListener("submit", submitForm);
  document.querySelector("[data-copy-secret]").addEventListener("click", () => copyText($("#secret-value").value, "수정 코드를 복사했습니다."));
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeDialog(dialog)));
  });
  if (state.admin) {
    $("#admin-bar").hidden = false;
    state.adminToken = sessionStorage.getItem(ADMIN_KEY) || "";
    $("#admin-token").value = state.adminToken;
    $("#admin-form").addEventListener("submit", (event) => {
      event.preventDefault();
      state.adminToken = $("#admin-token").value.trim();
      sessionStorage.setItem(ADMIN_KEY, state.adminToken);
      loadEntries();
    });
  }
}

bind();
loadConfig();
if (location.hash === "#samples") location.replace("/lounge/samples/");
else loadEntries();
