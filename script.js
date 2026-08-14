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

const SCHEDULE_BY_DAY = Object.freeze({
  0: {
    type: "none",
    short: "정기 일정 없음",
    detail: "일요일은 정기 일정이 없습니다.",
  },
  1: {
    type: "knowledge",
    short: "Hermes 설치",
    detail:
      "Hermes Agent를 설치하고 첫 실행까지 확인하는 세션. 09:00~12:00, 14:00~17:00, 18:00~21:00. 1회 2만원, 3시간, 스터디카페, 커피 또는 음료 제공.",
  },
  2: {
    type: "build",
    short: "Hermes 자동화",
    detail:
      "Hermes를 활용해 반복 작업 하나를 자동화하는 세션. 09:00~12:00, 14:00~17:00, 18:00~21:00. 1회 2만원, 3시간, 스터디카페, 커피 또는 음료 제공.",
  },
  3: {
    type: "knowledge",
    short: "LLM Wiki",
    detail:
      "내 자료를 담을 LLM Wiki 기본 구조를 만들고 활용하는 세션. 09:00~12:00, 14:00~17:00, 18:00~21:00. 1회 2만원, 3시간, 스터디카페, 커피 또는 음료 제공.",
  },
  4: {
    type: "build",
    short: "대시보드",
    detail:
      "바이브 코딩으로 나만의 대시보드 초안을 만드는 세션. 09:00~12:00, 14:00~17:00, 18:00~21:00. 1회 2만원, 3시간, 스터디카페, 커피 또는 음료 제공.",
  },
  5: {
    type: "chat",
    short: "자유 커피챗",
    detail: "시간이 맞는 빌더끼리 자유롭게 만나는 커피챗 운영 계획.",
  },
  6: {
    type: "intro",
    short: "AI 무료입문",
    detail: "10:00~12:00 무료 AI 입문 모임. Hermes Agent 시연과 STIC 실습. 교육비 무료, 음료 비용은 개인 결제.",
  },
});

const TRAINING_SLOTS = Object.freeze([
  { key: "morning", label: "오전", time: "09:00~12:00" },
  { key: "afternoon", label: "오후", time: "14:00~17:00" },
  { key: "evening", label: "저녁", time: "18:00~21:00" },
]);

// 공개 캘린더에는 실명이나 연락처 대신 신청자가 사용하는 아이디만 입력합니다.
const DEFAULT_CALENDAR_BOOKINGS = Object.freeze({
  "2026-08-17": Object.freeze([
    { id: "cohort-1-session-1", slot: "morning", title: "1기 1회차", participantIds: ["3만원"] },
  ]),
  "2026-08-20": Object.freeze([
    { id: "cohort-1-session-2", slot: "morning", title: "1기 2회차", participantIds: ["3만원"] },
  ]),
  "2026-08-24": Object.freeze([
    { id: "cohort-1-session-3", slot: "morning", title: "1기 3회차", participantIds: ["3만원"] },
  ]),
  "2026-08-27": Object.freeze([
    { id: "cohort-1-session-4", slot: "morning", title: "1기 4회차", participantIds: ["3만원"] },
  ]),
});

const BOOKINGS_STORAGE_KEY = "ai-builders-calendar-bookings";

function cloneDefaultBookings() {
  return JSON.parse(JSON.stringify(DEFAULT_CALENDAR_BOOKINGS));
}

function normalizeCalendarBookings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalized = {};

  Object.entries(value).forEach(([dateKey, bookings]) => {
    if (!/^2026-(08|09)-\d{2}$/.test(dateKey) || !Array.isArray(bookings)) return;
    const validBookings = bookings
      .filter((booking) => booking && typeof booking === "object")
      .map((booking) => ({
        id: String(booking.id || `booking-${dateKey}-${booking.slot || "morning"}`),
        slot: TRAINING_SLOTS.some((slot) => slot.key === booking.slot) ? booking.slot : "morning",
        title: String(booking.title || "교육 일정").slice(0, 40),
        participantIds: Array.isArray(booking.participantIds)
          ? booking.participantIds.map((id) => String(id).trim()).filter(Boolean).slice(0, 3)
          : [],
      }))
      .filter((booking) => booking.participantIds.length);
    if (validBookings.length) normalized[dateKey] = validBookings;
  });

  return normalized;
}

function loadCalendarBookings() {
  try {
    const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!saved) return cloneDefaultBookings();
    return normalizeCalendarBookings(JSON.parse(saved)) || cloneDefaultBookings();
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

    const bookingDescription = bookings
      .map((booking) => {
        const slot = TRAINING_SLOTS.find((item) => item.key === booking.slot);
        return `${slot?.label || booking.slot} ${slot?.time || ""}, ${booking.title}, 참여자 ${booking.participantIds.join(", ")}`;
      })
      .join(". ");
    day.setAttribute(
      "aria-label",
      `${monthConfig.year}년 ${monthConfig.monthIndex + 1}월 ${dayNumber}일. ${holiday ? `${holiday.label}. ` : ""}${schedule.detail}${bookingDescription ? ` 등록 교육. ${bookingDescription}.` : ""}`,
    );

    day.append(makeElement("span", "calendar-date", String(dayNumber)));
    if (holiday) day.append(makeElement("span", "calendar-holiday", holiday.short));
    day.append(makeElement("span", "calendar-event", bookings[0]?.title || schedule.short));

    if (bookings.length) {
      day.append(makeElement("span", "calendar-booking-badge", "등록"));
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
          slotRow.append(
            makeElement("strong", "calendar-slot-participants", booking.participantIds.join(", ")),
          );
        } else {
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
        item.append(makeElement("span", "calendar-booking-time", `${slot.label} ${slot.time}`));
        item.append(makeElement("strong", "calendar-booking-course", booking.title));
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
    information.append(
      makeElement(
        "span",
        "",
        `${booking.date} · ${slot.label} ${slot.time} · ${booking.participantIds.join(", ")}`,
      ),
    );
    const actions = makeElement("div", "calendar-admin-booking-actions");
    const editButton = makeElement("button", "", "수정");
    editButton.type = "button";
    editButton.dataset.bookingEdit = booking.id;
    const deleteButton = makeElement("button", "", "삭제");
    deleteButton.type = "button";
    deleteButton.dataset.bookingDelete = booking.id;
    actions.append(editButton, deleteButton);
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
    renderAdminBookingList();
    setAdminStatus("수정할 일정을 선택하거나 새 일정을 입력하세요.");
    calendarAdminDialog?.showModal();
    bookingForm?.elements.title.focus();
  });
});

adminCloseButton?.addEventListener("click", () => calendarAdminDialog?.close());
bookingNewButton?.addEventListener("click", resetBookingForm);

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const bookingId = String(formData.get("bookingId") || `booking-${Date.now()}`);
  const date = String(formData.get("date") || "");
  const title = String(formData.get("title") || "").trim();
  const slot = String(formData.get("slot") || "morning");
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
  calendarBookings[date] = sameDateBookings.filter((booking) => booking.slot !== slot);
  calendarBookings[date].push({ id: bookingId, slot, title, participantIds });
  if (!persistCalendarBookings()) return;

  refreshCalendarAfterAdminChange(date.slice(0, 7));
  bookingForm.elements.bookingId.value = bookingId;
  setAdminStatus(`${title} 일정을 이 브라우저에 저장했습니다.`);
});

adminBookingList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-booking-edit]");
  const deleteButton = event.target.closest("[data-booking-delete]");

  if (editButton) {
    const booking = getSortedBookings().find((item) => item.id === editButton.dataset.bookingEdit);
    if (!booking) return;
    bookingForm.elements.bookingId.value = booking.id;
    bookingForm.elements.title.value = booking.title;
    bookingForm.elements.participantIds.value = booking.participantIds.join(", ");
    bookingForm.elements.date.value = booking.date;
    bookingForm.elements.slot.value = booking.slot;
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
