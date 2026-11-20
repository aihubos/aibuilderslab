/*
 * 기수 신청 페이지 스크립트
 * 기수 카드·모집 상태·FAQ는 scripts/render-lounge.mjs가 HTML에 미리 써 넣습니다(데이터: lounge/data/cohorts.js).
 * 여기서는 카카오 링크를 설정값과 맞추고, 기수별 결과물 수 배지만 채웁니다.
 */
import { syncConfigLinks } from "../lounge.js";
import { fillEntryBadges } from "../data/stats.js";

syncConfigLinks();
fillEntryBadges();
