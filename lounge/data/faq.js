/*
 * 공개 페이지 FAQ: 화면 FAQ와 검색용 FAQPage(JSON-LD)는 모두 이 파일에서 만들어집니다.
 * a(답)가 null인 질문은 화면에 ‘답변 준비 중’으로 보이고, 검색용 데이터에는 넣지 않습니다.
 * 저장소에 있는 사실만 답으로 씁니다. 바꾼 뒤 `npm run build`.
 */
import { COHORTS, COMMON, RECRUIT } from "./cohorts.js";

const won = (value) => `${Number(value).toLocaleString("ko-KR")}원`;
const first = COHORTS.find((cohort) => cohort.id === "1");

export const APPLY_FAQ = Object.freeze([
  {
    q: "기수 과정은 어떻게 신청하나요?",
    a: `${COMMON.applyChannel}으로 신청합니다. 이 페이지의 카카오톡 버튼을 누르고 신청할 기수를 알려 주세요. 홈페이지에는 이름이나 연락처를 입력하지 않습니다.`,
  },
  {
    q: "수업은 어디에서 하나요?",
    a: `${COMMON.location}에서 진행합니다. 정확한 공간과 주차는 신청 전 카카오톡으로 안내합니다.`,
  },
  {
    q: "무엇을 준비해야 하나요?",
    a: `${COMMON.preparation}을 준비해 주세요.`,
  },
  {
    q: "다음 기수 정원은 몇 명인가요?",
    a: `다음 기수 정원은 ${RECRUIT.capacity}명입니다.`,
  },
  {
    q: "1기는 어떻게 진행되나요?",
    a: `${first.schedule}. 회당 ${first.sessions.hours}시간 수업 ${first.sessions.count}회로 진행합니다. ${first.sessionsNote} 회차별 주제는 ${first.flow.join(", ")}입니다.`,
  },
  {
    q: "교육비는 얼마인가요?",
    a: `1기 정규 교육비는 4회 ${won(first.price)}입니다. ${first.priceNote} 다음 기수 교육비는 신청 전에 카카오톡으로 확인해 주세요.`,
  },
  {
    q: "일정 변경, 취소, 환불 기준은 어디에서 확인하나요?",
    a: "정확한 일정, 공간, 주차, 신청 확정 절차, 취소·환불·노쇼 기준은 신청 전 개인 카카오톡으로 확인합니다.",
  },
  {
    q: "코딩을 몰라도 들을 수 있나요?",
    a: null, // TODO(운영자): 대상·사전 지식 기준
  },
]);

export const SHOWCASE_FAQ = Object.freeze([
  { q: "누가 올린 결과물인가요?", a: "AI 빌더스랩 1기와 2기 빌더가 직접 만든 결과물을 직접 올렸습니다." },
  { q: "로그인해야 올릴 수 있나요?", a: "아니요. 로그인 없이 결과물 올리기 화면에서 한 화면에 한 질문씩 답하면 올릴 수 있습니다." },
  {
    q: "무엇을 올릴 수 있나요?",
    a: "링크 8개, 이미지 4장(jpg·png·webp·gif, 한 장 5MB), 파일 4개(pdf·zip·pptx·docx·xlsx·txt·md, 하나 20MB)까지 올릴 수 있고 한 번에 25MB까지입니다. 사용한 도구와 프롬프트도 함께 적을 수 있습니다.",
  },
  { q: "올린 결과물을 고치거나 지우려면 어떻게 하나요?", a: "올릴 때 한 번만 보여 드리는 수정 코드가 필요합니다. 결과물 상세 화면에서 수정이나 삭제를 누르고 수정 코드를 입력하세요." },
  { q: "만든 빌더에게 질문할 수 있나요?", a: "빌더가 연락 링크를 남긴 결과물에는 ‘이 빌더에게 질문하기’ 버튼이 보입니다. 공개 댓글 기능은 없습니다." },
  { q: "좋아요는 몇 번 누를 수 있나요?", a: "결과물마다 한 번 누를 수 있습니다." },
  { q: "부적절한 결과물은 어떻게 알리나요?", a: "결과물 상세 화면의 신고하기 버튼으로 알려 주세요." },
]);

/* 샘플 FAQ 일부 답은 samples.json에서 계산합니다. render-lounge.mjs가 catalog를 넘겨 줍니다. */
export function samplesFaq(catalog) {
  const items = catalog.items || [];
  const groups = (catalog.categories || [])
    .map((category) => `${category.label} ${items.filter((item) => item.category === category.id).length}편`)
    .join(", ");
  const seconds = items.map((item) => Math.round(Number(item.durationSec) || 0));
  return Object.freeze([
    { q: "어떤 영상인가요?", a: `AI 빌더스랩 수업에서 만든 세로 쇼츠 ${items.length}편입니다. ${groups}으로 나뉩니다.` },
    { q: "당근 홍보 영상은 실제 광고인가요?", a: "아니요. 당근 홍보 영상은 수업과 포트폴리오를 위한 샘플용 가상 광고입니다. 실제 매장, 가격, 연락처가 아닙니다." },
    { q: "영상 길이는 얼마나 되나요?", a: `${Math.min(...seconds)}초부터 ${Math.max(...seconds)}초까지입니다.` },
    { q: "영상을 어떻게 보나요?", a: "포스터를 누르면 이 페이지에서 바로 재생됩니다. 로그인은 필요 없습니다." },
    { q: "어떤 AI 도구로 만들었나요?", a: null }, // TODO(운영자): 사용 도구
    { q: "이런 영상 만드는 법을 배우려면 어떻게 하나요?", a: "기수별 진행 방식과 신청 방법은 기수 신청 페이지에서 확인할 수 있습니다." },
  ]);
}
