const CATALOG = "/lounge/showcase/samples.json";
const state = { data: null, filter: "all", lastFocus: null };

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

function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function posterUrl(item) {
  const poster = String(item.poster || "");
  if (!poster || poster.includes("..") || poster.includes("\\")) return "";
  if (poster.startsWith("/")) return poster;
  return `/lounge/showcase/${poster}`;
}

function renderFilters() {
  const filters = $("#sample-filters");
  filters.replaceChildren();
  const categories = [{ id: "all", label: "전체" }, ...(state.data.categories || [])];
  for (const category of categories) {
    const count = category.id === "all"
      ? state.data.items.length
      : state.data.items.filter((item) => item.category === category.id).length;
    const selected = state.filter === category.id;
    filters.append(h("button", {
      type: "button",
      role: "tab",
      "aria-selected": String(selected),
      tabindex: selected ? "0" : "-1",
      text: `${category.label} (${count})`,
      onclick: () => {
        state.filter = category.id;
        render();
      },
    }));
  }
}

function sampleCard(item) {
  const media = h("div", { class: "media" });
  if (item.badge) media.append(h("span", { class: "sample-badge", text: item.badge }));
  const poster = posterUrl(item);
  if (poster) media.append(h("img", { src: poster, alt: "" }));
  media.append(h("span", { class: "duration-badge", text: formatDuration(item.durationSec) }));
  return h("button", { class: "sample-card", type: "button", "data-slug": item.slug, onclick: () => openPlayer(item) }, [
    media,
    h("div", { class: "caption" }, [h("strong", { text: item.title || "샘플 영상" })]),
  ]);
}

function renderGroup(category, items) {
  return h("section", { class: "sample-group" }, [
    h("h2", { text: `${category.label} (${items.length})` }),
    h("div", { class: "sample-grid" }, items.map(sampleCard)),
  ]);
}

function render() {
  renderFilters();
  const grid = $("#sample-grid");
  grid.replaceChildren();
  const items = state.data.items || [];
  if (state.filter === "all") {
    for (const category of state.data.categories || []) {
      const group = items.filter((item) => item.category === category.id);
      if (group.length) grid.append(renderGroup(category, group));
    }
    return;
  }
  const visible = items.filter((item) => item.category === state.filter);
  grid.append(h("div", { class: "sample-grid" }, visible.map(sampleCard)));
}

function openPlayer(item) {
  state.lastFocus = document.activeElement;
  $("#player-title").textContent = item.title || "샘플 영상";
  const badge = $("#player-badge");
  badge.hidden = !item.badge;
  if (item.badge) badge.textContent = item.badge;
  const video = $("#player");
  const poster = posterUrl(item);
  if (poster) video.poster = poster;
  if (!/^[A-Za-z0-9._-]+\.mp4$/.test(item.file || "")) return;
  video.preload = "none";
  video.src = `/lounge/media/samples/${item.file}`;
  video.load();
  $("#player-dialog").showModal();
}

function stopVideo() {
  const video = $("#player");
  video.pause();
  video.removeAttribute("src");
  video.load();
}

/* 라운지 홈의 미리보기(/lounge/samples/#slug)에서 들어오면 해당 영상을 바로 엽니다. */
function openFromHash() {
  const slug = decodeURIComponent(location.hash.slice(1));
  if (!/^[A-Za-z0-9-]{1,80}$/.test(slug)) return;
  const item = (state.data?.items || []).find((entry) => entry.slug === slug);
  if (!item) return;
  const card = [...document.querySelectorAll(".sample-card")].find((node) => node.dataset.slug === slug);
  card?.scrollIntoView({ block: "center" });
  card?.focus({ preventScroll: true });
  openPlayer(item);
  history.replaceState(null, "", location.pathname + location.search);
}

function closePlayer() {
  stopVideo();
  $("#player-dialog").close();
  state.lastFocus?.focus?.();
}

async function load() {
  const grid = $("#sample-grid");
  try {
    const response = await fetch(CATALOG, { cache: "no-store" });
    if (!response.ok) throw new Error("샘플 목록을 불러오지 못했습니다.");
    state.data = await response.json();
    render();
    openFromHash();
  } catch (error) {
    grid.replaceChildren(h("div", { class: "empty" }, [h("strong", { text: error.message })]));
  }
}

const dialog = $("#player-dialog");
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closePlayer();
});
dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closePlayer));
dialog.addEventListener("close", () => {
  stopVideo();
  state.lastFocus?.focus?.();
});
load();
