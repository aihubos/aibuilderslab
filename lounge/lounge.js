/*
 * Builders Lounge 공통 스크립트
 * - 카카오톡 같은 신청·참여 링크는 site-config.js 한 곳에서만 관리합니다.
 *   HTML의 href는 스크립트가 꺼져 있을 때를 위한 같은 값의 예비 주소입니다.
 * - 이 파일은 서버 요청이나 업로드를 하지 않습니다.
 */

const LINK_KEYS = new Set(["kakaoProfile", "kakaoGroup", "daangn"]);

function readConfigLink(key) {
  const application = window.AI_BUILDERS_CONFIG?.application;
  const value = application && LINK_KEYS.has(key) ? application[key] : "";
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function syncConfigLinks(root = document) {
  root.querySelectorAll("[data-config-link]").forEach((link) => {
    const href = readConfigLink(link.dataset.configLink);
    if (href) link.setAttribute("href", href);
  });
}

syncConfigLinks();
