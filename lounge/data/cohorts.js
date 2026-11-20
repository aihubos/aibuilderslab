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
    // 근거(2026-11-20 확인): https://lounge.ai-hub-os.com/curriculum/ · cohort1.html. 제레미 확인: "커리큘럼 사이트가 맞아"
    status: null, // TODO(운영자): 모집 상태. 커리큘럼 사이트에 마감 여부·신청 마감일이 적혀 있지 않아 확정 전으로 둡니다.
    summary: "4주 동안 매주 한 번, 회마다 두 가지씩 내 AI 도구를 만들어요.",
    graduates: null, // TODO(운영자): 1기 수료생 수
    target: "무료 설치반을 들은 분",
    schedule: "2026년 11월 시작 · 평일 수 오전 10~12시 · 오후 14~16시 (11/11~12/2) · 주말 토 10~12시 (11/14~12/5)",
    sessions: { count: 4, hours: 2 },
    sessionsNote: "강사 시연을 보고, 공통 예제를 따라 한 뒤, 내 주제로 바꿉니다.",
    price: 120000,
    priceNote: "회당 30,000원 · 장소 대여비 포함. 후기 작성과 결과물 공유를 모두 하면 회당 15,000원을 돌려받아, 4회 모두 들으면 실제 부담은 60,000원이에요. 정규 과정에는 수강료와 별개로 Grok Premium 구독(월 ₩45,000, 세금 별도)이 필요해요.",
    capacity: 5,
    capacityUnit: "반별", // 커리큘럼 사이트: "반별 정원 5명"
    deadline: null, // TODO(운영자): 신청 마감일 (커리큘럼 사이트에 없음)
    flowTitle: "회마다 두 가지를 완성해요",
    flow: [
      "1회 일정·할 일 비서 + 업무 자동화(블로그·SNS)",
      "2회 나만의 지식창고(LLM Wiki) + 내 홈페이지",
      "3회 캐릭터 시트 + 쇼츠 + 롱폼",
      "4회 주문 자동화 + 관리 자동화(대시보드)",
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
