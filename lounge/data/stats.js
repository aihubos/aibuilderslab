/*
 * 기수별 결과물 수: 공개 API GET /lounge/api/stats (읽기 전용)
 * 불러오지 못하면 배지는 원래 문구("결과물 보기")를 그대로 둡니다.
 */
const STATS_URL = "/lounge/api/stats";
let pending = null;

export function loadStats() {
  if (!pending) {
    pending = fetch(STATS_URL, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const counts = new Map();
        for (const row of data?.cohorts || []) {
          if (/^[0-9]{1,2}$/.test(String(row.cohort)) && Number.isInteger(row.entries)) counts.set(String(row.cohort), row.entries);
        }
        return counts;
      })
      .catch(() => new Map());
  }
  return pending;
}

export async function fillEntryBadges(root = document) {
  const counts = await loadStats();
  root.querySelectorAll("[data-entries-badge]").forEach((badge) => {
    const count = counts.get(badge.dataset.entriesBadge);
    if (Number.isInteger(count)) badge.textContent = `결과물 ${count}개`;
  });
  return counts;
}
