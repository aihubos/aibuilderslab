/*
 * 기수 신청 페이지 데이터: 여기만 고치면 /lounge/apply/ 화면이 바뀝니다.
 *
 * 새 기수(3기 등) 추가 방법:
 *   1) 아래 COHORTS 배열 맨 앞에 2기 항목을 복사해 붙여 넣습니다.
 *   2) id와 label을 "3", "3기"로 바꾸고 아는 내용만 채웁니다.
 *   3) 모르는 값은 null로 둡니다. 화면에 "확정 전" 표시가 자동으로 나옵니다.
 *
 * 규칙: 저장소나 운영자가 확인한 사실만 적습니다. 추측한 일정·가격·인원은 넣지 않습니다.
 * status 값: "open"(모집 중) | "upcoming"(모집 예정) | "closed"(모집 마감) | null(확정 전)
 *
 * 주의: 결과물 업로드 API는 현재 1기·2기만 받습니다(services/showcase-api/src/validate.js).
 *       3기 결과물을 받으려면 서버 쪽 변경이 따로 필요합니다.
 */

export const COHORTS = Object.freeze([
  {
    id: "2",
    label: "2기",
    status: null, // TODO(운영자): 2기 모집 상태
    summary: null, // TODO(운영자): 2기를 한 문장으로 소개
    facts: [
      { label: "대상", value: null }, // TODO(운영자)
      { label: "일정", value: null }, // TODO(운영자): 시작일·요일·시간
      { label: "진행 방식", value: null }, // TODO(운영자): 회차 수·수업 길이
      { label: "교육비", value: null }, // TODO(운영자)
      { label: "정원", value: null }, // TODO(운영자)
      { label: "신청 마감", value: null }, // TODO(운영자)
    ],
    flow: [],
    notes: [],
  },
  {
    id: "1",
    label: "1기",
    // 근거: DESIGN.md의 신청 마감 8월 31일. 오늘 기준 지난 날짜라 "모집 마감"으로 표시합니다.
    status: "closed",
    summary: "각자 고른 프로젝트를 같은 제작 리듬으로 만들어 보는 4회 과정입니다.",
    facts: [
      { label: "대상", value: null }, // TODO(운영자): 1기 대상 (저장소에 기록 없음)
      { label: "일정", value: null }, // TODO(운영자): 1기 수업 날짜 (저장소에 기록 없음)
      { label: "진행 방식", value: "3시간 수업 4회", note: "도구별 진도를 강제하지 않고 각자 선택한 프로젝트를 진행합니다." },
      {
        label: "교육비",
        value: "정규 교육비 80,000원",
        note: "매 수업 결과물 공유 시 50% 할인 40,000원, 매 수업 후기 작성 시 20% 할인 64,000원. 할인 확인 방법과 중복 적용 여부는 신청 전에 안내합니다.",
      },
      { label: "정원", value: null }, // TODO(운영자)
      { label: "신청 마감", value: "8월 31일" },
    ],
    flowTitle: "매 회차 3시간은 이렇게 흘러가요",
    flow: [
      "원하는 결과와 첫 Plan 세우기",
      "실행해 보고 오류 분석하기",
      "기능 확장과 회귀 검수",
      "완성 범위 확인과 다음 행동 정하기",
    ],
    notes: [],
  },
]);
