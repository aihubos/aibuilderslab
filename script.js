"use strict";

const CONTACT_LINKS = Object.freeze({
  freeIntro: "https://open.kakao.com/o/grZIANIi",
  kakaoProfile: "https://open.kakao.com/me/aibuilderslab",
  paidWorkshop:
    "https://daangn.com/kr/share/community/ref/invite-group/baRr2nojJVT?utm_campaign=share_qr",
  oneToOneInterest: "tel:+821030657890",
});

const CALENDAR_MONTHS = Object.freeze([
  { key: "2026-08", year: 2026, monthIndex: 7, label: "2026년 8월" },
  { key: "2026-09", year: 2026, monthIndex: 8, label: "2026년 9월" },
]);

const HOLIDAYS = Object.freeze({
  "2026-08-15": { label: "광복절", short: "광복절" },
  "2026-08-17": { label: "광복절 대체공휴일", short: "대체휴일" },
  "2026-09-24": { label: "추석 연휴", short: "추석연휴" },
  "2026-09-25": { label: "추석", short: "추석" },
  "2026-09-26": { label: "추석 연휴", short: "추석연휴" },
});

const WEEKDAY_WORKSHOP = Object.freeze({
  type: "workshop",
  short: "주제별 실습",
  detail:
    "주제별 소수정예 실습. 09:00~12:00, 14:00~17:00, 18:00~21:00. 1회 2만원, 3시간, 스터디카페, 커피 또는 음료 제공. 주제는 신청 시 선택합니다.",
});

const SCHEDULE_BY_DAY = Object.freeze({
  0: {
    type: "none",
    short: "정기 일정 없음",
    detail: "일요일은 정기 일정이 없습니다.",
  },
  1: WEEKDAY_WORKSHOP,
  2: WEEKDAY_WORKSHOP,
  3: WEEKDAY_WORKSHOP,
  4: WEEKDAY_WORKSHOP,
  5: {
    type: "chat",
    short: "자유 커피챗",
    detail: "시간이 맞는 빌더끼리 자유롭게 만나는 커피챗 운영 계획.",
  },
  6: {
    type: "intro",
    short: "무료 AI 입문",
    detail: "10:00~12:00 무료 AI 입문 모임. Hermes Agent 시연과 STIC 실습. 교육비 무료, 음료 비용은 개인 결제.",
  },
});

const COHORT_ONE = Object.freeze({
  name: "AI 빌더스 랩 1기",
  status: "모집 중",
  price: 80000,
  duration: "2주 · 총 4회 · 총 12시간",
  capacity: "최소 2명, 최대 3명",
  applicationKey: "paidWorkshop",
  sessions: Object.freeze([
    Object.freeze({
      id: "cohort-1-session-1",
      date: "2026-08-17",
      day: "월요일",
      slot: "morning",
      label: "AI 빌더스 랩 1기 · 1회차",
      shortLabel: "1기 · 1회차",
      courseTitle: "나만의 AI 작업환경 구축",
      summary: "Hermes Agent와 LLM Wiki",
      participantIds: Object.freeze(["삼만원님"]),
    }),
    Object.freeze({
      id: "cohort-1-session-2",
      date: "2026-08-20",
      day: "목요일",
      slot: "morning",
      label: "AI 빌더스 랩 1기 · 2회차",
      shortLabel: "1기 · 2회차",
      courseTitle: "나만의 자동화 구축",
      summary: "Hermes를 활용한 반복 작업 자동화",
      participantIds: Object.freeze(["삼만원님"]),
    }),
    Object.freeze({
      id: "cohort-1-session-3",
      date: "2026-08-24",
      day: "월요일",
      slot: "morning",
      label: "AI 빌더스 랩 1기 · 3회차",
      shortLabel: "1기 · 3회차",
      courseTitle: "바이브 코딩 입문 및 실습",
      summary: "대시보드 화면 초안 제작",
      participantIds: Object.freeze(["삼만원님"]),
    }),
    Object.freeze({
      id: "cohort-1-session-4",
      date: "2026-08-27",
      day: "목요일",
      slot: "morning",
      label: "AI 빌더스 랩 1기 · 4회차",
      shortLabel: "1기 · 4회차",
      courseTitle: "나만의 대시보드 완성",
      summary: "자동화 연결, 모바일 확인과 최종 테스트",
      participantIds: Object.freeze(["삼만원님"]),
    }),
  ]),
});

const TRAINING_SLOTS = Object.freeze([
  { key: "morning", label: "오전", time: "09:00~12:00" },
  { key: "afternoon", label: "오후", time: "14:00~17:00" },
  { key: "evening", label: "저녁", time: "18:00~21:00" },
]);

const COMPLETED_SESSIONS = Object.freeze([
  Object.freeze({
    id: "chat-2026-08-05-evening",
    date: "2026-08-05",
    slot: "evening",
    type: "chat",
    title: "수다모임",
    startTime: "19:00",
    courseTitle: "자유 커피챗",
    completed: true,
    participantIds: Object.freeze(["진행 완료"]),
  }),
  Object.freeze({
    id: "intro-2026-08-12-evening",
    date: "2026-08-12",
    slot: "evening",
    type: "intro",
    title: "무료 입문반",
    startTime: "18:00",
    courseTitle: "Hermes 입문",
    completed: true,
    participantIds: Object.freeze(["진행 완료"]),
  }),
]);

// 공개 캘린더에는 실명이나 연락처 대신 신청자가 사용하는 아이디만 입력합니다.
const DEFAULT_CALENDAR_BOOKINGS = Object.freeze((() => {
  const bookings = {};
  [...COMPLETED_SESSIONS, ...COHORT_ONE.sessions.map((session) => ({
    id: session.id,
    date: session.date,
    slot: session.slot,
    type: "cohort",
    title: session.label,
    courseTitle: session.courseTitle,
    participantIds: session.participantIds,
  }))].forEach((session) => {
    const existing = bookings[session.date] ? [...bookings[session.date]] : [];
    existing.push(Object.freeze({
      id: session.id,
      slot: session.slot,
      type: session.type,
      title: session.title,
      courseTitle: session.courseTitle,
      startTime: session.startTime || "",
      completed: Boolean(session.completed),
      participantIds: session.participantIds,
    }));
    bookings[session.date] = Object.freeze(existing);
  });
  return bookings;
})());

const BOOKINGS_STORAGE_KEY = "ai-builders-calendar-bookings";
const ADMIN_SESSION_KEY = "ai-builders-admin-unlocked";
const ADMIN_PASSWORD_HASH = "3f44b2fbb0aaffb68530a82cd4e4da9498b9337ae9c805b600efff12624c2cc7";
const RECRUIT_DIALOG_DISMISSED_KEY = "ai-builders-cohort-1-dismissed-at";
const RECRUIT_DIALOG_SESSION_KEY = "ai-builders-cohort-1-auto-shown";
const RECRUIT_DIALOG_DELAY_MS = 3000;
const RECRUIT_DIALOG_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function cloneDefaultBookings() {
  return JSON.parse(JSON.stringify(DEFAULT_CALENDAR_BOOKINGS));
}

function findCohortSession(booking) {
  return COHORT_ONE.sessions.find((session) => session.id === booking.id)
    || COHORT_ONE.sessions.find((session) => session.date === booking.date && session.slot === booking.slot)
    || null;
}

function normalizeStartTime(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function inferStartTime(value, slotKey) {
  const fromValue = normalizeStartTime(value);
  if (fromValue) return fromValue;
  const slotTime = TRAINING_SLOTS.find((item) => item.key === slotKey)?.time || "";
  return normalizeStartTime(slotTime.split("~")[0]);
}

function getBookingTime(booking) {
  const startTime = inferStartTime(booking?.startTime || booking?.time, booking?.slot);
  return startTime || TRAINING_SLOTS.find((item) => item.key === booking?.slot)?.time || "";
}

function isBookingCompleted(booking) {
  if (booking?.completed === false) return false;
  if (booking?.completed === true) return true;
  return Array.isArray(booking?.participantIds) && booking.participantIds.includes("진행 완료");
}

function getBookingStatusLabel(booking) {
  return isBookingCompleted(booking) ? "진행 완료" : "예정";
}

function getTodayKey() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeCalendarBookings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalized = {};

  Object.entries(value).forEach(([dateKey, bookings]) => {
    if (!/^2026-(08|09)-\d{2}$/.test(dateKey) || !Array.isArray(bookings)) return;
    const validBookings = bookings
      .filter((booking) => booking && typeof booking === "object")
      .map((booking) => {
        const slot = TRAINING_SLOTS.some((item) => item.key === booking.slot) ? booking.slot : "morning";
        const candidate = {
          id: String(booking.id || `booking-${dateKey}-${slot}`),
          slot,
          date: dateKey,
          title: String(booking.title || "교육 일정").slice(0, 40),
          courseTitle: String(booking.courseTitle || "").trim().slice(0, 40),
          startTime: inferStartTime(booking.startTime || booking.time, slot),
          completed: booking.completed === true || (Array.isArray(booking.participantIds) && booking.participantIds.includes("진행 완료")),
          type: ["cohort", "workshop", "chat", "intro"].includes(booking.type) ? booking.type : "",
          participantIds: Array.isArray(booking.participantIds)
            ? booking.participantIds
                .map((id) => String(id).trim())
                .map((id) => (id === "3만원" ? "삼만원님" : id))
                .filter(Boolean)
                .slice(0, 3)
            : [],
        };
        const cohortSession = findCohortSession(candidate);
        if (cohortSession) {
          candidate.type = "cohort";
          if (!candidate.courseTitle) candidate.courseTitle = cohortSession.courseTitle;
          if (candidate.title === "1기 1회차" || candidate.title === "교육 일정" || /^1기 [1-4]회차$/.test(candidate.title)) {
            candidate.title = cohortSession.label;
          }
        } else if (!candidate.type) {
          candidate.type = "workshop";
        }
        return candidate;
      })
      .filter((booking) => booking.participantIds.length)
      .map(({ date, ...booking }) => booking);
    if (validBookings.length) normalized[dateKey] = validBookings;
  });

  return normalized;
}

function mergeCompletedSessions(bookings) {
  const next = bookings;
  COMPLETED_SESSIONS.forEach((session) => {
    const dayBookings = next[session.date] || [];
    if (dayBookings.some((booking) => booking.id === session.id || booking.title === session.title)) return;
    next[session.date] = [
      ...dayBookings,
      {
        id: session.id,
        slot: session.slot,
        type: session.type,
        title: session.title,
        courseTitle: session.courseTitle,
        startTime: session.startTime || "",
        completed: Boolean(session.completed),
        participantIds: [...session.participantIds],
      },
    ];
  });
  return next;
}

function loadCalendarBookings() {
  try {
    const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!saved) return cloneDefaultBookings();
    const normalized = mergeCompletedSessions(
      normalizeCalendarBookings(JSON.parse(saved)) || cloneDefaultBookings(),
    );
    const serialized = JSON.stringify(normalized);
    if (serialized !== saved) localStorage.setItem(BOOKINGS_STORAGE_KEY, serialized);
    return normalized;
  } catch (error) {
    return cloneDefaultBookings();
  }
}

let calendarBookings = loadCalendarBookings();

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

const observedSectionIds = ["top", "about", "stages", "schedule", "tools", "operations", "contact"];
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

function createCalendar(monthConfig) {
  const panel = document.querySelector(`[data-calendar-panel="${monthConfig.key}"]`);
  if (!panel) return;

  const title = makeElement("h4", "calendar-month-title", monthConfig.label);
  const grid = makeElement("ol", "calendar-grid");
  grid.setAttribute("aria-label", `${monthConfig.label} 정기 운영 계획 달력`);

  ["월", "화", "수", "목", "금", "토", "일"].forEach((weekday, index) => {
    const label = makeElement("li", "calendar-weekday", weekday);
    if (index === 5) label.classList.add("is-saturday");
    if (index === 6) label.classList.add("is-sunday");
    label.setAttribute("aria-hidden", "true");
    grid.append(label);
  });

  const firstDate = new Date(monthConfig.year, monthConfig.monthIndex, 1);
  const startOffset = (firstDate.getDay() + 6) % 7;
  const daysInMonth = new Date(monthConfig.year, monthConfig.monthIndex + 1, 0).getDate();
  const totalSlots = 42;
  const today = new Date();
  const todayKey = getTodayKey();

  for (let index = 0; index < totalSlots; index += 1) {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const blank = makeElement("li", "calendar-blank");
      blank.setAttribute("aria-hidden", "true");
      grid.append(blank);
      continue;
    }

    const date = new Date(monthConfig.year, monthConfig.monthIndex, dayNumber);
    const weekday = date.getDay();
    const schedule = SCHEDULE_BY_DAY[weekday];
    const dateKey = [
      monthConfig.year,
      String(monthConfig.monthIndex + 1).padStart(2, "0"),
      String(dayNumber).padStart(2, "0"),
    ].join("-");
    const holiday = HOLIDAYS[dateKey];
    const bookings = calendarBookings[dateKey] || [];
    const day = makeElement("li", "calendar-day");
    day.dataset.date = dateKey;
    const isToday =
      today.getFullYear() === monthConfig.year &&
      today.getMonth() === monthConfig.monthIndex &&
      today.getDate() === dayNumber;

    if (schedule.type !== "none") day.dataset.scheduleType = schedule.type;
    if (weekday === 0) day.classList.add("is-sunday");
    if (weekday === 6) day.classList.add("is-saturday");
    if (holiday) day.classList.add("is-holiday");
    if (bookings.length) day.classList.add("has-booking");
    if (isToday) {
      day.classList.add("is-today");
      day.setAttribute("aria-current", "date");
    }

    const hasCohortBooking = bookings.some((booking) => booking.type === "cohort");
    if (hasCohortBooking) day.dataset.scheduleType = "cohort";

    const bookingDescription = bookings
      .map((booking) => {
        const slot = TRAINING_SLOTS.find((item) => item.key === booking.slot);
        const courseTitle = booking.courseTitle ? `, ${booking.courseTitle}` : "";
        return `${slot?.label || booking.slot} ${getBookingTime(booking)}, ${booking.title}${courseTitle}, ${getBookingStatusLabel(booking)}, 참여자 ${booking.participantIds.join(", ")}`;
      })
      .join(". ");
    day.setAttribute(
      "aria-label",
      `${monthConfig.year}년 ${monthConfig.monthIndex + 1}월 ${dayNumber}일. ${holiday ? `${holiday.label}. ` : ""}${schedule.detail}${bookingDescription ? ` 등록 교육. ${bookingDescription}.` : ""}`,
    );

    day.append(makeElement("span", "calendar-date", String(dayNumber)));
    if (holiday) day.append(makeElement("span", "calendar-holiday", holiday.short));
    day.append(makeElement("span", "calendar-event", bookings[0]?.title || schedule.short));
    if (bookings[0]?.courseTitle) {
      day.append(makeElement("span", "calendar-course", bookings[0].courseTitle));
    }

    if (bookings.length) {
      const badgeLabel = bookings.every(isBookingCompleted) ? "진행 완료" : "등록";
      day.append(makeElement("span", "calendar-booking-badge", badgeLabel));
    }

    if ([1, 2, 3, 4].includes(weekday)) {
      const slots = makeElement("div", "calendar-slots");
      TRAINING_SLOTS.forEach((slot) => {
        const booking = bookings.find((item) => item.slot === slot.key);
        const slotRow = makeElement("div", "calendar-slot");
        slotRow.dataset.slot = slot.key;
        slotRow.title = `${slot.label} ${slot.time}`;
        slotRow.append(makeElement("span", "calendar-slot-label", slot.label));
        if (booking) {
          slotRow.classList.add("is-booked");
          if (isBookingCompleted(booking)) slotRow.classList.add("is-completed");
          slotRow.append(
            makeElement(
              "strong",
              "calendar-slot-participants",
              isBookingCompleted(booking) ? "진행 완료" : booking.participantIds.join(", "),
            ),
          );
        } else if (dateKey >= todayKey) {
          slotRow.append(makeElement("span", "calendar-slot-open", "신청 가능"));
        }
        slots.append(slotRow);
      });
      day.append(slots);
    }
    grid.append(day);
  }

  const bookingSummary = makeElement("section", "calendar-booking-summary");
  bookingSummary.setAttribute("aria-label", `${monthConfig.label} 교육 등록 현황`);
  bookingSummary.append(makeElement("h5", "calendar-booking-title", "교육 등록 현황"));
  const monthBookings = Object.entries(calendarBookings)
    .filter(([dateKey]) => dateKey.startsWith(monthConfig.key))
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  if (monthBookings.length) {
    const bookingList = makeElement("ul", "calendar-booking-list");
    monthBookings.forEach(([dateKey, bookings]) => {
      bookings.forEach((booking) => {
        const slot = TRAINING_SLOTS.find((item) => item.key === booking.slot);
        const item = makeElement("li", "calendar-booking-item");
        item.append(makeElement("time", "calendar-booking-date", `${Number(dateKey.slice(5, 7))}월 ${Number(dateKey.slice(8, 10))}일`));
        item.append(makeElement("span", "calendar-booking-time", `${slot.label} ${getBookingTime(booking)}`));
        const courseBlock = makeElement("div", "calendar-booking-copy");
        courseBlock.append(makeElement("strong", "calendar-booking-course", booking.title));
        if (booking.courseTitle) {
          courseBlock.append(makeElement("span", "calendar-booking-topic", booking.courseTitle));
        }
        item.append(courseBlock);
        item.append(makeElement("span", "calendar-booking-status", getBookingStatusLabel(booking)));
        item.append(makeElement("span", "calendar-booking-participant", `참여자 ${booking.participantIds.join(", ")}`));
        bookingList.append(item);
      });
    });
    bookingSummary.append(bookingList);
  } else {
    bookingSummary.append(
      makeElement("p", "calendar-booking-empty", "현재 등록된 교육이 없습니다."),
    );
  }

  panel.replaceChildren(title, grid, bookingSummary);
}

function renderCalendars() {
  CALENDAR_MONTHS.forEach(createCalendar);
}

renderCalendars();

const calendarTabs = [...document.querySelectorAll("[data-calendar-tab]")];
const calendarPanels = [...document.querySelectorAll("[data-calendar-panel]")];

function selectCalendar(key, focusTab = false) {
  calendarTabs.forEach((tab) => {
    const selected = tab.dataset.calendarTab === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focusTab) tab.focus();
  });

  calendarPanels.forEach((panel) => {
    panel.hidden = panel.dataset.calendarPanel !== key;
  });
}

calendarTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCalendar(tab.dataset.calendarTab));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + calendarTabs.length) % calendarTabs.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % calendarTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = calendarTabs.length - 1;

    selectCalendar(calendarTabs[nextIndex].dataset.calendarTab, true);
  });
});

const calendarAdminDialog = document.querySelector("[data-calendar-admin]");
const adminAuthDialog = document.querySelector("[data-admin-auth]");
const adminAuthForm = document.querySelector("[data-admin-auth-form]");
const adminAuthCloseButton = document.querySelector("[data-admin-auth-close]");
const adminAuthStatus = document.querySelector("[data-admin-auth-status]");
const adminOpenButtons = [...document.querySelectorAll("[data-admin-open]")];
const adminCloseButton = document.querySelector("[data-admin-close]");
const bookingForm = document.querySelector("[data-booking-form]");
const bookingNewButton = document.querySelector("[data-booking-new]");
const bookingCopyButton = document.querySelector("[data-booking-copy]");
const bookingResetButton = document.querySelector("[data-booking-reset]");
const adminBookingList = document.querySelector("[data-admin-booking-list]");
const adminStatus = document.querySelector("[data-admin-status]");

function setAdminStatus(message) {
  if (adminStatus) adminStatus.textContent = message;
}

function openCalendarAdmin() {
  renderAdminBookingList();
  updateVisitorCount();
  setAdminStatus("수정할 일정을 선택하거나 새 일정을 입력하세요.");
  calendarAdminDialog?.showModal();
  bookingForm?.elements.title.focus();
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

function persistCalendarBookings() {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(calendarBookings));
    return true;
  } catch (error) {
    setAdminStatus("브라우저 저장 공간을 사용할 수 없어 변경 내용을 저장하지 못했습니다.");
    return false;
  }
}

function getSortedBookings() {
  return Object.entries(calendarBookings)
    .flatMap(([date, bookings]) => bookings.map((booking) => ({ date, ...booking })))
    .sort((bookingA, bookingB) => {
      const dateComparison = bookingA.date.localeCompare(bookingB.date);
      if (dateComparison !== 0) return dateComparison;
      const slotA = TRAINING_SLOTS.findIndex((slot) => slot.key === bookingA.slot);
      const slotB = TRAINING_SLOTS.findIndex((slot) => slot.key === bookingB.slot);
      return slotA - slotB;
    });
}

function resetBookingForm() {
  if (!bookingForm) return;
  bookingForm.reset();
  bookingForm.elements.bookingId.value = "";
  bookingForm.elements.date.value = "2026-08-17";
  bookingForm.elements.slot.value = "morning";
  bookingForm.elements.startTime.value = "09:00";
  bookingForm.elements.completed.checked = false;
  bookingForm.elements.title.focus();
  setAdminStatus("새 일정을 입력할 수 있습니다.");
}

function renderAdminBookingList() {
  if (!adminBookingList) return;
  adminBookingList.replaceChildren();
  const bookings = getSortedBookings();

  if (!bookings.length) {
    adminBookingList.append(
      makeElement("li", "calendar-admin-empty", "등록된 일정이 없습니다."),
    );
    return;
  }

  bookings.forEach((booking) => {
    const slot = TRAINING_SLOTS.find((item) => item.key === booking.slot);
    const item = makeElement("li", "calendar-admin-booking-item");
    const information = makeElement("div", "calendar-admin-booking-info");
    information.append(makeElement("strong", "", booking.title));
    if (booking.courseTitle) {
      information.append(makeElement("span", "", booking.courseTitle));
    }
    information.append(
      makeElement(
        "span",
        "",
        `${booking.date} · ${slot.label} ${getBookingTime(booking)} · ${booking.participantIds.join(", ")}`,
      ),
    );
    information.append(makeElement("span", "", getBookingStatusLabel(booking)));
    const actions = makeElement("div", "calendar-admin-booking-actions");
    const completeButton = makeElement("button", "", isBookingCompleted(booking) ? "예정으로 되돌리기" : "진행 완료");
    completeButton.type = "button";
    completeButton.dataset.bookingComplete = booking.id;
    completeButton.setAttribute("aria-pressed", String(isBookingCompleted(booking)));
    const editButton = makeElement("button", "", "수정");
    editButton.type = "button";
    editButton.dataset.bookingEdit = booking.id;
    const deleteButton = makeElement("button", "", "삭제");
    deleteButton.type = "button";
    deleteButton.dataset.bookingDelete = booking.id;
    actions.append(completeButton, editButton, deleteButton);
    item.append(information, actions);
    adminBookingList.append(item);
  });
}

function removeBookingById(bookingId) {
  const nextBookings = {};
  Object.entries(calendarBookings).forEach(([date, bookings]) => {
    const remaining = bookings.filter((booking) => booking.id !== bookingId);
    if (remaining.length) nextBookings[date] = remaining;
  });
  calendarBookings = nextBookings;
}

function refreshCalendarAfterAdminChange(monthKey = "2026-08") {
  renderCalendars();
  selectCalendar(monthKey);
  renderAdminBookingList();
}

adminOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMenu(false);
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      openCalendarAdmin();
      return;
    }
    adminAuthForm?.reset();
    setAdminAuthStatus("");
    adminAuthDialog?.showModal();
    adminAuthForm?.elements.password.focus();
  });
});

adminAuthCloseButton?.addEventListener("click", () => adminAuthDialog?.close());
adminCloseButton?.addEventListener("click", () => calendarAdminDialog?.close());
bookingNewButton?.addEventListener("click", resetBookingForm);

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
  openCalendarAdmin();
});

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const bookingId = String(formData.get("bookingId") || `booking-${Date.now()}`);
  const date = String(formData.get("date") || "");
  const title = String(formData.get("title") || "").trim();
  const courseTitle = String(formData.get("courseTitle") || "").trim().slice(0, 40);
  const slot = String(formData.get("slot") || "morning");
  const startTime = inferStartTime(formData.get("startTime"), slot);
  const completed = formData.get("completed") === "true";
  const participantIds = String(formData.get("participantIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!/^2026-(08|09)-\d{2}$/.test(date) || !title || !participantIds.length) {
    setAdminStatus("교육 제목, 참여자 아이디, 교육 일자를 모두 입력해주세요.");
    return;
  }

  removeBookingById(bookingId);
  const sameDateBookings = calendarBookings[date] || [];
  const nextBooking = {
    id: bookingId,
    slot,
    title,
    courseTitle,
    startTime,
    completed,
    type: "workshop",
    participantIds,
  };
  const cohortSession = findCohortSession({ ...nextBooking, date });
  if (cohortSession) {
    nextBooking.type = "cohort";
    if (!nextBooking.courseTitle) nextBooking.courseTitle = cohortSession.courseTitle;
  }
  calendarBookings[date] = sameDateBookings.filter((booking) => booking.slot !== slot);
  calendarBookings[date].push(nextBooking);
  if (!persistCalendarBookings()) return;

  refreshCalendarAfterAdminChange(date.slice(0, 7));
  bookingForm.elements.bookingId.value = bookingId;
  setAdminStatus(`${title} 일정을 이 브라우저에 저장했습니다.`);
});

function setBookingCompleted(bookingId, completed) {
  let changed = false;
  Object.entries(calendarBookings).forEach(([date, bookings]) => {
    calendarBookings[date] = bookings.map((booking) => {
      if (booking.id !== bookingId) return booking;
      changed = true;
      return { ...booking, completed };
    });
  });
  return changed;
}

adminBookingList?.addEventListener("click", (event) => {
  const completeButton = event.target.closest("[data-booking-complete]");
  const editButton = event.target.closest("[data-booking-edit]");
  const deleteButton = event.target.closest("[data-booking-delete]");

  if (completeButton) {
    const booking = getSortedBookings().find((item) => item.id === completeButton.dataset.bookingComplete);
    if (!booking) return;
    const nextCompleted = !isBookingCompleted(booking);
    if (!setBookingCompleted(booking.id, nextCompleted) || !persistCalendarBookings()) return;
    refreshCalendarAfterAdminChange(booking.date.slice(0, 7));
    setAdminStatus(`${booking.title}을 ${nextCompleted ? "진행 완료" : "예정"}으로 표시했습니다.`);
    return;
  }

  if (editButton) {
    const booking = getSortedBookings().find((item) => item.id === editButton.dataset.bookingEdit);
    if (!booking) return;
    bookingForm.elements.bookingId.value = booking.id;
    bookingForm.elements.title.value = booking.title;
    bookingForm.elements.courseTitle.value = booking.courseTitle || "";
    bookingForm.elements.participantIds.value = booking.participantIds.join(", ");
    bookingForm.elements.date.value = booking.date;
    bookingForm.elements.slot.value = booking.slot;
    bookingForm.elements.startTime.value = inferStartTime(booking.startTime || booking.time, booking.slot);
    bookingForm.elements.completed.checked = isBookingCompleted(booking);
    bookingForm.elements.title.focus();
    setAdminStatus(`${booking.title} 일정을 수정하고 있습니다.`);
  }

  if (deleteButton) {
    const booking = getSortedBookings().find((item) => item.id === deleteButton.dataset.bookingDelete);
    if (!booking || !window.confirm(`${booking.title} 일정을 삭제할까요?`)) return;
    removeBookingById(booking.id);
    if (!persistCalendarBookings()) return;
    refreshCalendarAfterAdminChange(booking.date.slice(0, 7));
    resetBookingForm();
    setAdminStatus(`${booking.title} 일정을 삭제했습니다.`);
  }
});

bookingCopyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(calendarBookings, null, 2));
    setAdminStatus("공개 반영용 데이터를 클립보드에 복사했습니다.");
  } catch (error) {
    setAdminStatus("복사하지 못했습니다. HTTPS 공개 사이트에서 다시 시도해주세요.");
  }
});

bookingResetButton?.addEventListener("click", () => {
  if (!window.confirm("이 브라우저에서 수정한 일정을 모두 지우고 기본 일정으로 복원할까요?")) return;
  calendarBookings = cloneDefaultBookings();
  if (!persistCalendarBookings()) return;
  refreshCalendarAfterAdminChange();
  resetBookingForm();
  setAdminStatus("기본 일정으로 복원했습니다.");
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
