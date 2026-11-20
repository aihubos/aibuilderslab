/*
 * 빌더스 라운지 기수 데이터: 운영자가 바꾸는 곳은 이 파일 하나입니다.
 *
 * 바꾼 뒤에는 `npm run build`(또는 `npm run lounge:render`)를 실행하세요.
 * 홈 모집 카드, 기수 신청 페이지, FAQ, 검색용 구조화 데이터(JSON-LD)가 함께 다시 만들어집니다.
 * `npm test`는 HTML이 이 파일과 다르면 실패합니다.
 *
 * 규칙: 확인된 사실만 적습니다. 모르는 값은 null로 두면 화면에 ‘확정 전’ 표시가 나옵니다.
 */

/* ---------- 1. 다음 기수 모집 상태 (홈 첫 화면에 크게 표시) ---------- */
export const RECRUIT = Object.freeze({
  // 다음 기수 이름. null이면 "다음 기수"로 표시합니다. 예: "3기"
  label: null, // TODO(운영자): 다음 기수 이름
  // "open"(모집 중) | "waitlist"(대기 신청) | "closed"(마감)
  status: "waitlist", // TODO(운영자): 실제 모집 상태로 바꾸세요. 기본값은 대기 신청입니다.
  capacity: 15, // 정원 (기본값 15명)
  applicants: null, // TODO(운영자): 현재 신청 인원 (숫자). 모르면 null
});

export const RECRUIT_STATUS = Object.freeze({
  open: { text: "모집 중", tone: "open", cta: "카카오톡으로 신청하기", lead: "지금 신청할 수 있어요." },
  waitlist: { text: "대기 신청", tone: "waitlist", cta: "카카오톡으로 대기 신청", lead: "일정이 정해지면 대기 신청한 분께 먼저 안내해요." },
  closed: { text: "마감", tone: "closed", cta: "카카오톡으로 다음 기수 문의", lead: "이번 모집은 마감되었어요. 다음 기수는 카카오톡으로 문의해 주세요." },
});

/* ---------- 2. 기수별 안내 (기수 신청 페이지) ----------
 * 새 기수 추가: 맨 앞에 항목을 복사해 넣고 id·label을 바꾼 뒤 아는 값만 채웁니다.
 * status: "open" | "upcoming" | "closed" | null(확정 전)
 * 주의: 결과물 업로드 API는 현재 1기·2기만 받습니다(services/showcase-api/src/validate.js parseCohort, db.js CHECK).
 */
export const COHORTS = Object.freeze([
  {
    id: "2",
    label: "2기",
    status: null, // TODO(운영자)
    summary: null, // TODO(운영자): 한 줄 소개
    graduates: null, // TODO(운영자): 수료생 수 (숫자)
    target: null, // TODO(운영자)
    schedule: null, // TODO(운영자): 시작일·요일·시간
    sessions: null, // TODO(운영자): { count: 회차 수, hours: 회당 시간 }
    sessionsNote: null,
    price: null, // TODO(운영자): 원 단위 숫자
    priceNote: null,
    capacity: null, // TODO(운영자)
    deadline: null, // TODO(운영자)
    flowTitle: null,
    flow: [],
    // 커리큘럼 페이지: 아직 없습니다(2026-11-20 기준 cohort2.html 등 404).
    // 페이지 생기면 여기에 URL을 넣고 npm run build 하세요. 홈 카드가 ‘준비 중’에서 링크 카드로 바뀝니다.
    curriculumUrl: null,
    curriculumOverviewUrl: null,
  },
  {
    id: "1",
    label: "1기",
    // 근거: DESIGN.md 신청 마감 8월 31일이 지나 "모집 마감"으로 표시합니다. (추론, 운영자 확인 필요)
    status: "closed",
    summary: "각자 고른 프로젝트를 같은 제작 리듬으로 만들어 보는 4회 과정입니다.",
    graduates: null, // TODO(운영자): 1기 수료생 수 (저장소에 기록 없음)
    target: null, // TODO(운영자)
    schedule: null, // TODO(운영자)
    sessions: { count: 4, hours: 3 }, // 근거: DESIGN.md "네 번의 3시간 수업"
    sessionsNote: "도구별 진도를 강제하지 않고 각자 선택한 프로젝트를 진행합니다.",
    price: 80000, // 근거: DESIGN.md "정규 교육비 80,000원"
    priceNote: "매 수업 결과물 공유 시 50% 할인 40,000원, 매 수업 후기 작성 시 20% 할인 64,000원. 할인 확인 방법과 중복 적용 여부는 신청 전에 안내합니다.",
    capacity: null, // TODO(운영자)
    deadline: "8월 31일",
    flowTitle: "매 회차 3시간은 이렇게 흘러가요",
    flow: [
      "원하는 결과와 첫 Plan 세우기",
      "실행해 보고 오류 분석하기",
      "기능 확장과 회귀 검수",
      "완성 범위 확인과 다음 행동 정하기",
    ],
    // 커리큘럼 페이지 (외부 사이트 lounge.ai-hub-os.com, 2026-11-20 200 응답 확인)
    curriculumUrl: "https://lounge.ai-hub-os.com/curriculum/cohort1.html", // 회차별 안내
    curriculumOverviewUrl: "https://lounge.ai-hub-os.com/curriculum/", // 모집·커리큘럼 전체
  },
]);

/* 기수 신청 페이지 "기수별 안내" 머리말과 검색용 Course 데이터에 함께 쓰입니다. */
export const COURSE = Object.freeze({
  name: "AI 빌더스랩 기수 과정",
  description: "동탄에서 직접 만나 각자 고른 프로젝트를 AI로 만들어 보는 실습 과정입니다.",
});

/* 모든 기수 공통 (근거: README.md 공개 운영 정보, site-config.js) */
export const COMMON = Object.freeze({
  location: "동탄",
  preparation: "개인 노트북과 충전기",
  applyChannel: "개인 카카오톡",
});
