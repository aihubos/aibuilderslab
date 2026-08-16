"use strict";

const CONTACT_LINKS = Object.freeze({
  freeIntro: "https://open.kakao.com/o/grZIANIi",
  kakaoProfile: "https://open.kakao.com/me/aibuilderslab",
  paidWorkshop:
    "https://daangn.com/kr/share/community/ref/invite-group/baRr2nojJVT?utm_campaign=share_qr",
});

const GOOGLE_CALENDAR = Object.freeze({
  email: "aibuilderslab.kr@gmail.com",
  holidayId: "ko.south_korea#holiday@group.v.calendar.google.com",
  subscribe: "https://calendar.google.com/calendar/r?cid=aibuilderslab.kr@gmail.com",
  snapshot: "assets/google-calendar.ics",
  ics: "https://calendar.google.com/calendar/ical/aibuilderslab.kr%40gmail.com/public/basic.ics",
  holidayIcs: "https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics",
  proxy: "/api/google-calendar.ics",
  refreshMs: 60 * 1000,
});

const ADMIN_SESSION_KEY = "ai-builders-admin-unlocked";
const ADMIN_PASSWORD_HASH = "3f44b2fbb0aaffb68530a82cd4e4da9498b9337ae9c805b600efff12624c2cc7";
const RECRUIT_DIALOG_DISMISSED_KEY = "ai-builders-cohort-1-dismissed-at";
const RECRUIT_DIALOG_SESSION_KEY = "ai-builders-cohort-1-auto-shown";
const RECRUIT_DIALOG_DELAY_MS = 3000;
const RECRUIT_DIALOG_COOLDOWN_MS = 24 * 60 * 60 * 1000;

document.documentElement.classList.add("js");

const THEME_STORAGE_KEY = "ai-builders-theme";
const THEMES = Object.freeze({
  default: { label: "기본 블루", themeColor: "#FFFFFF" },
  "neon-yellow": { label: "네온 옐로우", themeColor: "#FFFFFF" },
  "ultra-violet": { label: "울트라 바이올렛", themeColor: "#FFFFFF" },
  "pale-green": { label: "옅은 그린", themeColor: "#FFFFFF" },
  "carmine-pastel": { label: "카민 파스텔", themeColor: "#FFFFFF" },
  dark: { label: "다크 포인트", themeColor: "#FFFFFF" },
});

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const navLinks = [...document.querySelectorAll("[data-site-nav] > a")];
const mobileBreakpoint = window.matchMedia("(max-width: 1439px)");
const downloadMenu = document.querySelector("[data-download-menu]");
const downloadToggle = document.querySelector("[data-download-toggle]");
const downloadPanel = document.querySelector("[data-download-panel]");
const downloadLinks = [...document.querySelectorAll("[data-download-panel] a")];
const themeControl = document.querySelector("[data-theme-control]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themePanel = document.querySelector("[data-theme-panel]");
const themeOptions = [...document.querySelectorAll("[data-theme-option]")];
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const heroVideo = document.querySelector("[data-hero-video]");
const heroVideoToggle = document.querySelector("[data-hero-video-toggle]");
const heroVideoLabel = document.querySelector("[data-hero-video-label]");
const heroScroll = document.querySelector("[data-hero-scroll]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function syncHeroVideoControl() {
  if (!heroVideo || !heroVideoToggle || !heroVideoLabel) return;

  const isPaused = heroVideo.paused;
  heroVideoLabel.textContent = isPaused ? "재생" : "일시정지";
  heroVideoToggle.setAttribute("aria-pressed", String(isPaused));
  heroVideoToggle.setAttribute(
    "aria-label",
    isPaused ? "브랜드 영상 재생" : "브랜드 영상 일시정지",
  );
}

async function playHeroVideo() {
  if (!heroVideo) return;
  heroVideo.muted = true;
  heroVideo.volume = 0;

  try {
    await heroVideo.play();
  } catch (error) {
    /* 자동재생이 제한된 환경에서는 재생 버튼으로 시작할 수 있습니다. */
  }

  syncHeroVideoControl();
}

if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.volume = 0;

  if (reduceMotion.matches) {
    heroVideo.pause();
  } else {
    playHeroVideo();
  }

  heroVideo.addEventListener("play", syncHeroVideoControl);
  heroVideo.addEventListener("pause", syncHeroVideoControl);
  heroVideo.addEventListener("error", () => {
    if (!heroVideoToggle || !heroVideoLabel) return;
    heroVideoLabel.textContent = "재생 불가";
    heroVideoToggle.disabled = true;
    heroVideoToggle.setAttribute("aria-label", "브랜드 영상을 재생할 수 없음");
  });
}

heroVideoToggle?.addEventListener("click", () => {
  if (!heroVideo) return;

  if (heroVideo.paused) {
    playHeroVideo();
  } else {
    heroVideo.pause();
  }
});

let heroFadeFrame = 0;

function updateHeroScrollFade() {
  heroFadeFrame = 0;
  if (!heroScroll) return;

  if (reduceMotion.matches) {
    heroScroll.style.setProperty("--hero-scroll-progress", "0");
    return;
  }

  const fadeRatio = Number.parseFloat(
    getComputedStyle(heroScroll).getPropertyValue("--hero-fade-distance-ratio"),
  );
  if (!fadeRatio) return;

  const travelled = Math.max(0, -heroScroll.getBoundingClientRect().top);
  const fadeDistance = heroScroll.offsetHeight * fadeRatio;
  const progress = Math.min(1, travelled / fadeDistance);
  heroScroll.style.setProperty("--hero-scroll-progress", progress.toFixed(3));
}

function scheduleHeroScrollFade() {
  if (heroFadeFrame) return;
  heroFadeFrame = window.requestAnimationFrame(updateHeroScrollFade);
}

if (heroScroll) {
  updateHeroScrollFade();
  window.addEventListener("scroll", scheduleHeroScrollFade, { passive: true });
  window.addEventListener("resize", scheduleHeroScrollFade, { passive: true });
  reduceMotion.addEventListener("change", scheduleHeroScrollFade);
}

function applyTheme(themeName, persist = true) {
  const selectedTheme = THEMES[themeName] ? themeName : "default";
  document.documentElement.dataset.theme = selectedTheme;

  themeOptions.forEach((option) => {
    option.setAttribute("aria-checked", String(option.dataset.themeOption === selectedTheme));
  });

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      `사이트 테마 선택, 현재 ${THEMES[selectedTheme].label}`,
    );
    themeToggle.title = `사이트 테마 선택 · ${THEMES[selectedTheme].label}`;
  }

  if (themeColorMeta) themeColorMeta.content = THEMES[selectedTheme].themeColor;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    } catch (error) {
      /* 저장이 제한된 환경에서도 현재 화면의 테마 전환은 유지합니다. */
    }
  }
}

function setThemePanel(open, restoreFocus = false) {
  if (!themeToggle || !themePanel) return;

  themeToggle.setAttribute("aria-expanded", String(open));
  themePanel.hidden = !open;

  if (open) {
    setDownloadMenu(false);
    setMenu(false);
    const selected = themeOptions.find((option) => option.getAttribute("aria-checked") === "true");
    (selected || themeOptions[0])?.focus();
  } else if (restoreFocus) {
    themeToggle.focus();
  }
}

function setDownloadMenu(open, restoreFocus = false) {
  if (!downloadToggle || !downloadPanel) return;

  downloadToggle.setAttribute("aria-expanded", String(open));
  downloadPanel.hidden = !open;

  if (open) {
    setThemePanel(false);
    downloadLinks[0]?.focus();
  } else if (restoreFocus) {
    downloadToggle.focus();
  }
}

function setMenu(open, restoreFocus = false) {
  if (!menuToggle || !siteNav) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  siteNav.classList.toggle("is-open", open);
  siteNav.inert = mobileBreakpoint.matches && !open;
  document.body.classList.toggle("menu-open", open && mobileBreakpoint.matches);

  if (open) {
    setThemePanel(false);
    navLinks[0]?.focus();
  } else {
    setDownloadMenu(false);
    if (restoreFocus) menuToggle.focus();
  }
}

function syncMenuForViewport() {
  if (!siteNav || !menuToggle) return;

  if (mobileBreakpoint.matches) {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    siteNav.inert = !open;
  } else {
    siteNav.inert = false;
    siteNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
    document.body.classList.remove("menu-open");
    setDownloadMenu(false);
  }
}

applyTheme(document.documentElement.dataset.theme, false);

themeToggle?.addEventListener("click", () => {
  const open = themeToggle.getAttribute("aria-expanded") !== "true";
  setThemePanel(open);
});

themeOptions.forEach((option, index) => {
  option.addEventListener("click", () => {
    applyTheme(option.dataset.themeOption);
    setThemePanel(false, true);
  });

  option.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + themeOptions.length) % themeOptions.length;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % themeOptions.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = themeOptions.length - 1;
    themeOptions[nextIndex]?.focus();
  });
});

downloadToggle?.addEventListener("click", () => {
  const open = downloadToggle.getAttribute("aria-expanded") !== "true";
  setDownloadMenu(open);
});

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  setMenu(open);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

downloadLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setDownloadMenu(false);
    setMenu(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (themeToggle?.getAttribute("aria-expanded") === "true") return setThemePanel(false, true);
  if (downloadToggle?.getAttribute("aria-expanded") === "true") return setDownloadMenu(false, true);
  if (menuToggle?.getAttribute("aria-expanded") === "true") setMenu(false, true);
});

document.addEventListener("pointerdown", (event) => {
  if (
    themeToggle?.getAttribute("aria-expanded") === "true" &&
    themeControl &&
    !themeControl.contains(event.target)
  ) {
    setThemePanel(false);
  }

  if (
    downloadToggle?.getAttribute("aria-expanded") === "true" &&
    downloadMenu &&
    !downloadMenu.contains(event.target)
  ) {
    setDownloadMenu(false);
  }

  if (
    menuToggle?.getAttribute("aria-expanded") === "true" &&
    siteNav &&
    !siteNav.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    setMenu(false);
  }
});

mobileBreakpoint.addEventListener("change", syncMenuForViewport);
syncMenuForViewport();

const observedSectionIds = ["top", "about", "stages", "schedule", "tools", "operations", "apply", "contact"];
const observedSections = observedSectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleEntries.length) return;
      const activeId = visibleEntries[0].target.id;
      const navigationId = activeId === "top" ? "about" : activeId;

      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${navigationId}`;
        if (isCurrent) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-28% 0px -58% 0px",
      threshold: [0, 0.2, 0.5],
    },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
} else {
  navLinks[0]?.setAttribute("aria-current", "true");
}

const revealItems = [...document.querySelectorAll("[data-reveal]")];

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const stageArticles = [...document.querySelectorAll("[data-stage]")];
const stageLinks = [...document.querySelectorAll("[data-stage-link]")];

function setActiveStage(stageId) {
  stageLinks.forEach((link) => {
    const active = link.dataset.stageLink === stageId;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "step");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window) {
  const stageObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveStage(visible.target.dataset.stage);
    },
    { rootMargin: "-30% 0px -48% 0px", threshold: [0.05, 0.3, 0.6] },
  );

  stageArticles.forEach((article) => stageObserver.observe(article));
}

setActiveStage("0");

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}


function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function unfoldIcsLine(value) {
  return String(value || "").replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseIcsDate(value, isDateOnly) {
  const raw = String(value || "").trim();
  if (isDateOnly && /^\d{8}$/.test(raw)) {
    return new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
  }
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc) {
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  }
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function parseIcsEvents(icsText) {
  const unfolded = unfoldIcsLine(icsText);
  return unfolded.split("BEGIN:VEVENT").slice(1).map((block) => {
    const body = block.split("END:VEVENT")[0] || "";
    const get = (name) => {
      const match = body.match(new RegExp(`^${name}(?:;[^:]*)?:([^\\r\\n]+)`, "m"));
      return match ? match[1].trim() : "";
    };
    const startLine = body.match(/^DTSTART([^:\r\n]*):([^\r\n]+)/m);
    const endLine = body.match(/^DTEND([^:\r\n]*):([^\r\n]+)/m);
    const startIsDate = Boolean(startLine && /VALUE=DATE/i.test(startLine[1] || ""));
    const start = parseIcsDate(startLine?.[2], startIsDate);
    const end = parseIcsDate(endLine?.[2], Boolean(endLine && /VALUE=DATE/i.test(endLine[1] || "")));
    return {
      title: (get("SUMMARY") || "일정").replace(/\\,/g, ","),
      start,
      end,
      allDay: startIsDate,
      type: "event",
    };
  }).filter((event) => event.start instanceof Date && !Number.isNaN(event.start.getTime()));
}

function eventTouchesDay(event, date) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const eventEnd = event.end instanceof Date && !Number.isNaN(event.end.getTime())
    ? event.end
    : new Date(event.start.getTime() + (event.allDay ? 24 : 1) * 60 * 60 * 1000);
  if (event.allDay && eventEnd.getTime() === event.start.getTime() + 24 * 60 * 60 * 1000) {
    return event.start >= dayStart && event.start < dayEnd;
  }
  return event.start < dayEnd && eventEnd > dayStart;
}

function formatEventTime(event) {
  if (event.allDay) return "하루";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(event.start);
}

function createMonthGrid(year, monthIndex, events) {
  const grid = makeElement("ol", "google-calendar-grid");
  grid.setAttribute("aria-label", `${year}년 ${monthIndex + 1}월 구글 캘린더`);
  ["월", "화", "수", "목", "금", "토", "일"].forEach((weekday, index) => {
    const label = makeElement("li", "google-calendar-weekday", weekday);
    if (index === 5) label.classList.add("is-saturday");
    if (index === 6) label.classList.add("is-sunday");
    grid.append(label);
  });

  const firstDate = new Date(year, monthIndex, 1);
  const startOffset = (firstDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const blank = makeElement("li", "google-calendar-blank");
      blank.setAttribute("aria-hidden", "true");
      grid.append(blank);
      continue;
    }

    const date = new Date(year, monthIndex, dayNumber);
    const weekday = date.getDay();
    const dateKey = toDateKey(date);
    const day = makeElement("li", "google-calendar-day");
    if (weekday === 0) day.classList.add("is-sunday");
    if (weekday === 6) day.classList.add("is-saturday");
    if (dateKey === todayKey) day.classList.add("is-today");
    day.append(makeElement("span", "google-calendar-date", String(dayNumber)));

    const dayEvents = events
      .filter((event) => eventTouchesDay(event, date))
      .sort((eventA, eventB) => {
        if (eventA.type === "holiday" && eventB.type !== "holiday") return -1;
        if (eventA.type !== "holiday" && eventB.type === "holiday") return 1;
        return (eventA.start?.getTime() || 0) - (eventB.start?.getTime() || 0);
      });
    if (dayEvents.some((event) => event.type === "holiday")) {
      day.classList.add("is-holiday");
    }
    if (dayEvents.length) {
      const list = makeElement("ul", "google-calendar-events");
      dayEvents.slice(0, 3).forEach((event) => {
        const item = makeElement("li", event.type === "holiday" ? "google-calendar-event is-holiday" : "google-calendar-event");
        if (event.type !== "holiday") {
          item.append(makeElement("time", "", formatEventTime(event)));
        }
        item.append(makeElement("span", "", event.title));
        list.append(item);
      });
      if (dayEvents.length > 3) {
        list.append(makeElement("li", "google-calendar-more", `+${dayEvents.length - 3}`));
      }
      day.append(list);
    }
    grid.append(day);
  }
  return grid;
}

function setCalendarStatus(message) {
  const status = document.querySelector("[data-calendar-status]");
  if (status) status.textContent = message;
}

function parseApiDate(value) {
  if (!value) return null;
  if (value.date) {
    const [year, month, day] = value.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const raw = value.dateTime;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function uniqueEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.id || event.title}-${event.start?.getTime() || 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchGoogleCalendarApiEvents(calendarId, type = "event") {
  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 6);
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 18);
  const events = [];
  let pageToken = "";

  do {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeZone", "Asia/Seoul");
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("timeMin", timeMin.toISOString());
    url.searchParams.set("timeMax", timeMax.toISOString());
    url.searchParams.set("key", "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`calendar-api-${response.status}`);
    const data = await response.json();
    (data.items || []).forEach((item) => {
      const start = parseApiDate(item.start);
      if (!start) return;
      events.push({
        id: item.id || item.iCalUID || "",
        title: item.summary || (type === "holiday" ? "공휴일" : "일정"),
        start,
        end: parseApiDate(item.end),
        allDay: Boolean(item.start?.date),
        type,
      });
    });
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return uniqueEvents(events);
}

async function fetchLiveCalendarEvents() {
  const [labEvents, holidayEvents] = await Promise.all([
    fetchGoogleCalendarApiEvents(GOOGLE_CALENDAR.email, "event"),
    fetchGoogleCalendarApiEvents(GOOGLE_CALENDAR.holidayId, "holiday").catch(() => []),
  ]);
  return uniqueEvents([...holidayEvents, ...labEvents]);
}

async function fetchGoogleCalendarIcsEvents() {
  const urls = [GOOGLE_CALENDAR.ics, GOOGLE_CALENDAR.proxy, GOOGLE_CALENDAR.snapshot];
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`calendar-${response.status}`);
      const text = await response.text();
      if (!text.includes("BEGIN:VCALENDAR")) throw new Error("invalid-ics");
      return uniqueEvents(parseIcsEvents(text).map((event) => ({ ...event, type: event.type || "event" })));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("calendar-unavailable");
}

async function fetchHolidayIcsEvents() {
  try {
    const response = await fetch(`${GOOGLE_CALENDAR.holidayIcs}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`holiday-${response.status}`);
    const text = await response.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("invalid-holiday-ics");
    return uniqueEvents(parseIcsEvents(text).map((event) => ({ ...event, type: "holiday", allDay: true })));
  } catch (error) {
    return [];
  }
}

async function fetchGoogleCalendarEvents() {
  try {
    const liveEvents = await fetchLiveCalendarEvents();
    if (liveEvents.length) return liveEvents;
  } catch (error) {
    /* 공개 API가 막히면 ICS로 이어서 확인합니다. */
  }
  const [labEvents, holidayEvents] = await Promise.all([
    fetchGoogleCalendarIcsEvents(),
    fetchHolidayIcsEvents(),
  ]);
  return uniqueEvents([...holidayEvents, ...labEvents]);
}

function initGoogleCalendar() {
  const root = document.querySelector("[data-google-calendar]");
  const monthLabel = document.querySelector("[data-calendar-month]");
  const gridHost = document.querySelector("[data-calendar-grid]");
  const prevButton = document.querySelector("[data-calendar-prev]");
  const nextButton = document.querySelector("[data-calendar-next]");
  if (!root || !monthLabel || !gridHost) return;

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let events = [];

  function renderMonth() {
    monthLabel.textContent = `${viewYear}년 ${viewMonth + 1}월`;
    gridHost.replaceChildren(createMonthGrid(viewYear, viewMonth, events));
  }

  prevButton?.addEventListener("click", () => {
    const next = new Date(viewYear, viewMonth - 1, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();
    renderMonth();
  });

  nextButton?.addEventListener("click", () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();
    renderMonth();
  });

  function applyEvents(loaded, live) {
    events = loaded;
    renderMonth();
    if (loaded.length) {
      setCalendarStatus(live
        ? "구글 캘린더 최신 공개 일정과 대한민국 공휴일을 표시합니다. 1분마다 다시 확인합니다."
        : "구글 캘린더 공개 일정과 대한민국 공휴일을 월간 보기로 표시합니다.");
      return;
    }
    setCalendarStatus("등록된 공개 일정이 아직 없습니다. 구글 캘린더에 일정을 추가하면 여기에 나타납니다.");
  }

  function refreshEvents() {
    return fetchLiveCalendarEvents()
      .then((loaded) => applyEvents(loaded, true))
      .catch(() => Promise.all([fetchGoogleCalendarIcsEvents(), fetchHolidayIcsEvents()])
        .then(([labEvents, holidayEvents]) => applyEvents(uniqueEvents([...holidayEvents, ...labEvents]), false))
        .catch(() => {
          setCalendarStatus("구글 캘린더 일정을 불러오지 못했습니다. 내 구글 캘린더에 등록 버튼으로 확인해주세요.");
        }));
  }

  renderMonth();
  refreshEvents();
  window.setInterval(refreshEvents, GOOGLE_CALENDAR.refreshMs);
}

initGoogleCalendar();

const calendarAdminDialog = document.querySelector("[data-calendar-admin]");
const adminAuthDialog = document.querySelector("[data-admin-auth]");
const adminAuthForm = document.querySelector("[data-admin-auth-form]");
const adminAuthCloseButton = document.querySelector("[data-admin-auth-close]");
const adminAuthStatus = document.querySelector("[data-admin-auth-status]");
const adminOpenButtons = [...document.querySelectorAll("[data-admin-open]")];
const adminCloseButton = document.querySelector("[data-admin-close]");
const adminStatus = document.querySelector("[data-admin-status]");

function setAdminStatus(message) {
  if (adminStatus) adminStatus.textContent = message;
}

function setAdminAuthStatus(message) {
  if (adminAuthStatus) adminAuthStatus.textContent = message;
}

async function hashAdminPassword(value) {
  if (!window.crypto?.subtle) return "";
  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function openVisitorAdmin() {
  updateVisitorCount();
  calendarAdminDialog?.showModal();
  setAdminStatus("방문자 통계를 확인합니다. 일정은 구글 캘린더에서 관리합니다.");
}

function requestVisitorAdmin() {
  setMenu(false);
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    openVisitorAdmin();
    return;
  }
  adminAuthForm?.reset();
  setAdminAuthStatus("");
  adminAuthDialog?.showModal();
  adminAuthForm?.elements.password.focus();
}

adminOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    requestVisitorAdmin();
  });
});

adminAuthCloseButton?.addEventListener("click", () => adminAuthDialog?.close());
adminCloseButton?.addEventListener("click", () => calendarAdminDialog?.close());

adminAuthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const passwordInput = adminAuthForm.elements.password;
  const submittedHash = await hashAdminPassword(passwordInput.value);

  if (!submittedHash) {
    setAdminAuthStatus("이 브라우저에서는 관리자 확인 기능을 사용할 수 없습니다.");
    return;
  }

  if (submittedHash !== ADMIN_PASSWORD_HASH) {
    setAdminAuthStatus("비밀번호가 맞지 않습니다.");
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  adminAuthDialog?.close();
  openVisitorAdmin();
});

const contactButtons = [...document.querySelectorAll("[data-contact-key]")];

contactButtons.forEach((button) => {
  const key = button.dataset.contactKey;
  const configuredUrl = CONTACT_LINKS[key];

  if (configuredUrl) {
    button.href = configuredUrl;
    if (configuredUrl.startsWith("https://")) {
      button.target = "_blank";
      button.rel = "noopener noreferrer";
    }
    return;
  }

  button.removeAttribute("href");
  button.setAttribute("aria-disabled", "true");
});

const recruitDialog = document.querySelector("[data-recruit-dialog]");
const recruitOpenButtons = [...document.querySelectorAll("[data-recruit-open]")];
const recruitCloseButton = document.querySelector("[data-recruit-close]");
const recruitCurriculumLink = document.querySelector("[data-recruit-curriculum]");
let recruitDialogTrigger = null;

function canAutoOpenRecruitDialog() {
  if (sessionStorage.getItem(RECRUIT_DIALOG_SESSION_KEY) === "true") return false;
  const dismissedAt = Number(localStorage.getItem(RECRUIT_DIALOG_DISMISSED_KEY) || 0);
  if (!dismissedAt) return true;
  return Date.now() - dismissedAt >= RECRUIT_DIALOG_COOLDOWN_MS;
}

function restoreRecruitDialogFocus() {
  if (recruitDialogTrigger && typeof recruitDialogTrigger.focus === "function") {
    recruitDialogTrigger.focus();
  }
  recruitDialogTrigger = null;
}

function closeRecruitDialog({ remember = true } = {}) {
  if (!recruitDialog?.open) return;
  if (remember) {
    localStorage.setItem(RECRUIT_DIALOG_DISMISSED_KEY, String(Date.now()));
  }
  recruitDialog.close();
}

function openRecruitDialog({ manual = false } = {}) {
  if (!recruitDialog || recruitDialog.open) return;
  if (!manual && !canAutoOpenRecruitDialog()) return;
  recruitDialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!manual) sessionStorage.setItem(RECRUIT_DIALOG_SESSION_KEY, "true");
  document.body.classList.add("is-recruit-open");
  recruitDialog.showModal();
  recruitCloseButton?.focus();
}

function scheduleRecruitDialog() {
  window.setTimeout(() => openRecruitDialog({ manual: false }), RECRUIT_DIALOG_DELAY_MS);
}

recruitOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openRecruitDialog({ manual: true }));
});

recruitCloseButton?.addEventListener("click", () => closeRecruitDialog({ remember: true }));

recruitCurriculumLink?.addEventListener("click", () => {
  closeRecruitDialog({ remember: true });
});

recruitDialog?.addEventListener("click", (event) => {
  if (event.target === recruitDialog) closeRecruitDialog({ remember: true });
});

recruitDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeRecruitDialog({ remember: true });
});

recruitDialog?.addEventListener("close", () => {
  document.body.classList.remove("is-recruit-open");
  restoreRecruitDialogFocus();
});

scheduleRecruitDialog();

const VISITOR_COUNT_KEY_NAME = "aibuilderslab-site-visits";
const VISITOR_TODAY_KEY_NAME = "aibuilderslab-site-visits-today";
const VISITOR_HIT_KEY = "ai-builders-visitor-hit-on";
const VISITOR_STATS_KEY = "ai-builders-visitor-stats";
const headerVisitorTotal = document.querySelector("[data-visitor-total]");
const headerVisitorToday = document.querySelector("[data-visitor-today]");
const adminVisitorTotal = document.querySelector("[data-admin-visitor-total]");
const adminVisitorToday = document.querySelector("[data-admin-visitor-today]");
const visitorChart = document.querySelector("[data-visitor-chart]");
const visitorDayTable = document.querySelector("[data-visitor-day-table]");
const visitorSourceTable = document.querySelector("[data-visitor-source-table]");

function formatVisitorCount(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function todayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyVisitorStats() {
  return { days: {}, sources: {}, daySources: {} };
}

function loadVisitorStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITOR_STATS_KEY) || "null");
    if (!saved || typeof saved !== "object") return emptyVisitorStats();
    return {
      days: saved.days && typeof saved.days === "object" ? saved.days : {},
      sources: saved.sources && typeof saved.sources === "object" ? saved.sources : {},
      daySources: saved.daySources && typeof saved.daySources === "object" ? saved.daySources : {},
    };
  } catch (error) {
    return emptyVisitorStats();
  }
}

function saveVisitorStats(stats) {
  try {
    localStorage.setItem(VISITOR_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    /* 저장할 수 없어도 화면 표시는 계속합니다. */
  }
}

function shouldCountVisit() {
  try {
    return localStorage.getItem(VISITOR_HIT_KEY) !== todayStamp();
  } catch (error) {
    return true;
  }
}

function rememberVisit() {
  try {
    localStorage.setItem(VISITOR_HIT_KEY, todayStamp());
  } catch (error) {
    /* 저장할 수 없어도 화면 표시는 계속합니다. */
  }
}

function visitSourceLabel() {
  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("utm_source") || params.get("ref");
  if (campaign) return campaign.slice(0, 40);

  const referrer = document.referrer;
  if (!referrer) return "직접 방문";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === window.location.hostname) return "사이트 내부";
    if (host.includes("daangn")) return "당근";
    if (host.includes("kakao")) return "카카오톡";
    if (host.includes("instagram")) return "인스타그램";
    if (host.includes("naver")) return "네이버";
    if (host.includes("google")) return "구글";
    return host;
  } catch (error) {
    return "기타";
  }
}

function recordLocalVisit() {
  if (!shouldCountVisit()) return loadVisitorStats();
  const stats = loadVisitorStats();
  const today = todayStamp();
  const source = visitSourceLabel();
  stats.days[today] = Number(stats.days[today] || 0) + 1;
  stats.sources[source] = Number(stats.sources[source] || 0) + 1;
  stats.daySources[today] = stats.daySources[today] && typeof stats.daySources[today] === "object"
    ? stats.daySources[today]
    : {};
  stats.daySources[today][source] = Number(stats.daySources[today][source] || 0) + 1;
  saveVisitorStats(stats);
  rememberVisit();
  return stats;
}

function renderHeaderCounts(total, today) {
  if (headerVisitorTotal) headerVisitorTotal.textContent = Number.isFinite(total) ? formatVisitorCount(total) : "--";
  if (headerVisitorToday) headerVisitorToday.textContent = Number.isFinite(today) ? formatVisitorCount(today) : "--";
}

function renderVisitorAdmin(stats, total, today) {
  if (adminVisitorTotal) adminVisitorTotal.textContent = Number.isFinite(total) ? formatVisitorCount(total) : "--";
  if (adminVisitorToday) adminVisitorToday.textContent = Number.isFinite(today) ? formatVisitorCount(today) : "--";

  const dayRows = Object.entries(stats.days).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  const sourceRows = Object.entries(stats.sources).sort((a, b) => b[1] - a[1]);

  if (visitorChart) {
    visitorChart.replaceChildren();
    const recent = [...dayRows].slice(0, 14).reverse();
    const maxValue = Math.max(1, ...recent.map(([, count]) => Number(count) || 0));
    if (!recent.length) {
      visitorChart.append(makeElement("p", "", "아직 그래프에 표시할 기록이 없습니다."));
    } else {
      recent.forEach(([date, count]) => {
        const bar = makeElement("div", "visitor-chart-bar");
        const fill = makeElement("span");
        fill.style.height = `${Math.max(8, Math.round((Number(count) / maxValue) * 100))}%`;
        bar.append(fill, makeElement("small", "", date.slice(5)));
        visitorChart.append(bar);
      });
    }
  }

  if (visitorDayTable) {
    visitorDayTable.replaceChildren();
    if (!dayRows.length) {
      const row = makeElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "아직 기록된 방문이 없습니다.";
      row.append(cell);
      visitorDayTable.append(row);
    } else {
      dayRows.forEach(([date, count]) => {
        const row = makeElement("tr");
        row.append(makeElement("th", "", date));
        row.lastElementChild.scope = "row";
        row.append(makeElement("td", "", formatVisitorCount(count)));
        const daySources = Object.entries(stats.daySources?.[date] || {}).sort((a, b) => b[1] - a[1]);
        const topSource = daySources[0] ? `${daySources[0][0]} ${daySources[0][1]}` : "직접 방문";
        row.append(makeElement("td", "", topSource));
        visitorDayTable.append(row);
      });
    }
  }

  if (visitorSourceTable) {
    visitorSourceTable.replaceChildren();
    if (!sourceRows.length) {
      const row = makeElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 2;
      cell.textContent = "아직 기록된 유입이 없습니다.";
      row.append(cell);
      visitorSourceTable.append(row);
    } else {
      sourceRows.forEach(([source, count]) => {
        const row = makeElement("tr");
        row.append(makeElement("th", "", source));
        row.lastElementChild.scope = "row";
        row.append(makeElement("td", "", formatVisitorCount(count)));
        visitorSourceTable.append(row);
      });
    }
  }
}

async function fetchNamedCount(name, action) {
  const response = await fetch(
    `https://countapi.mileshilliard.com/api/v1/${action}/${name}`,
    { cache: "no-store" },
  );
  const data = await response.json().catch(() => ({}));
  const count = Number(data.value);
  if (!response.ok || !Number.isFinite(count)) {
    if (action === "get") return fetchNamedCount(name, "hit");
    throw new Error("counter-failed");
  }
  return count;
}

async function updateVisitorCount() {
  const stats = recordLocalVisit();
  const today = todayStamp();
  const localToday = Number(stats.days[today] || 0);
  renderHeaderCounts(Object.values(stats.days).reduce((sum, value) => sum + Number(value || 0), 0), localToday);
  renderVisitorAdmin(stats, Object.values(stats.days).reduce((sum, value) => sum + Number(value || 0), 0), localToday);

  try {
    const countedToday = localStorage.getItem(VISITOR_HIT_KEY) === today;
    const total = countedToday
      ? await fetchNamedCount(VISITOR_COUNT_KEY_NAME, "get").catch(() => fetchNamedCount(VISITOR_COUNT_KEY_NAME, "hit"))
      : await fetchNamedCount(VISITOR_COUNT_KEY_NAME, "hit");
    const todayCount = countedToday
      ? await fetchNamedCount(`${VISITOR_TODAY_KEY_NAME}-${today}`, "get").catch(() => fetchNamedCount(`${VISITOR_TODAY_KEY_NAME}-${today}`, "hit"))
      : await fetchNamedCount(`${VISITOR_TODAY_KEY_NAME}-${today}`, "hit");
    renderHeaderCounts(total, todayCount);
    renderVisitorAdmin(stats, total, todayCount);
  } catch (error) {
    if (headerVisitorTotal && headerVisitorTotal.textContent === "--") {
      headerVisitorTotal.textContent = "0";
      headerVisitorToday.textContent = "0";
    }
  }
}

updateVisitorCount();
