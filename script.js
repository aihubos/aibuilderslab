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
    short: "Hermes 무료",
    detail: "10:00~12:00 Hermes Agent 설치 입문반. 교육비 무료.",
  },
});

document.documentElement.classList.add("js");

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const navLinks = [...document.querySelectorAll("[data-site-nav] a")];
const mobileBreakpoint = window.matchMedia("(max-width: 899px)");

function setMenu(open, restoreFocus = false) {
  if (!menuToggle || !siteNav) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  siteNav.classList.toggle("is-open", open);
  siteNav.inert = mobileBreakpoint.matches && !open;
  document.body.classList.toggle("menu-open", open && mobileBreakpoint.matches);

  if (open) {
    navLinks[0]?.focus();
  } else if (restoreFocus) {
    menuToggle.focus();
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
  }
}

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  setMenu(open);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false, true);
  }
});

document.addEventListener("pointerdown", (event) => {
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

const observedSectionIds = ["top", "about", "stages", "tools", "operations", "contact"];
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
    if (isToday) {
      day.classList.add("is-today");
      day.setAttribute("aria-current", "date");
    }

    day.setAttribute(
      "aria-label",
      `${monthConfig.year}년 ${monthConfig.monthIndex + 1}월 ${dayNumber}일. ${holiday ? `${holiday.label}. ` : ""}${schedule.detail}`,
    );

    day.append(makeElement("span", "calendar-date", String(dayNumber)));
    if (holiday) day.append(makeElement("span", "calendar-holiday", holiday.short));
    day.append(makeElement("span", "calendar-event", schedule.short));
    grid.append(day);
  }

  panel.replaceChildren(title, grid);
}

CALENDAR_MONTHS.forEach(createCalendar);

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
