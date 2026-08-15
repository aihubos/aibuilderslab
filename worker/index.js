const GOOGLE_ICS_URL =
  "https://calendar.google.com/calendar/ical/aibuilderslab.kr%40gmail.com/public/basic.ics";
const GOOGLE_HTML_EMBED =
  "https://calendar.google.com/calendar/htmlembed?src=aibuilderslab.kr%40gmail.com&ctz=Asia%2FSeoul&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&hl=ko&wkst=2";

const CALENDAR_FALLBACK_CSS = `
<style>
  html, body { margin: 0; padding: 0; background: #fff; color: #06102b; font-family: "SF Pro Text", "Apple SD Gothic Neo", sans-serif; }
  body.view-month { padding: 12px 16px 16px; }
  h1 { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; font-size: 18px; }
  h1 img { height: 22px; width: auto; }
  .period-range { margin: 0 0 12px; font-size: 20px; font-weight: 700; }
  #nav { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  #nav td { vertical-align: middle; }
  .nav-buttons { white-space: nowrap; }
  .nav-buttons a, #nav-today { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; margin-right: 6px; padding: 0 10px; border: 1px solid #d7deea; border-radius: 999px; background: #fff; color: #06102b; text-decoration: none; font-size: 13px; }
  #month-tab, #week-tab, #agenda-tab { display: none; }
  table.mv-daynames-table, table.st-grid, table[id^="mv"] { width: 100%; border-collapse: collapse; }
  .column-label, .date-marker { padding: 8px 6px; text-align: center; font-size: 12px; }
  .column-label { color: #667085; font-weight: 700; }
  .date-marker { border-top: 1px solid #e6ebf2; color: #06102b; font-weight: 700; }
  .date-not-month { color: #98a2b3; }
  .date-today, .today .date-marker, td.date-today { color: #0b63ce; background: #eef6ff; }
  .cell-empty, .cell-empty-below, .cell-last-row { border-top: 1px solid #f2f4f7; height: 18px; }
  .view-cap, #footer { margin-top: 12px; color: #667085; font-size: 12px; }
  #subscribe-link { display: none; }
</style>
`;

function rewriteGoogleCalendarHtml(html) {
  const styled = html.includes("</head>")
    ? html.replace("</head>", `${CALENDAR_FALLBACK_CSS}\n</head>`)
    : `${CALENDAR_FALLBACK_CSS}\n${html}`;
  return styled
    .replaceAll('href="/', 'href="https://calendar.google.com/')
    .replaceAll("href='/", "href='https://calendar.google.com/")
    .replaceAll('src="/', 'src="https://calendar.google.com/')
    .replaceAll("src='/", "src='https://calendar.google.com/")
    .replaceAll("url(/", "url(https://calendar.google.com/")
    .replaceAll("https://calendar.google.com/calendar/htmlembed", "/api/google-calendar")
    .replaceAll("https://calendar.google.com/api/google-calendar", "/api/google-calendar");
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/google-calendar.ics") {
      try {
        const upstream = await fetch(GOOGLE_ICS_URL, {
          headers: { "User-Agent": "AI-Builders-Lab-Site/1.0" },
          cf: { cacheTtl: 60, cacheEverything: true },
        });
        return new Response(await upstream.text(), {
          status: upstream.ok ? 200 : upstream.status,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Cache-Control": "public, max-age=60",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch {
        return new Response("구글 캘린더를 불러오지 못했습니다.", {
          status: 502,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }

    if (url.pathname === "/api/google-calendar") {
      try {
        const upstreamUrl = new URL(GOOGLE_HTML_EMBED);
        url.searchParams.forEach((value, key) => {
          if (key === "src") return;
          upstreamUrl.searchParams.set(key, value);
        });
        const upstream = await fetch(upstreamUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        return new Response(rewriteGoogleCalendarHtml(await upstream.text()), {
          status: upstream.ok ? 200 : upstream.status,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        });
      } catch {
        return new Response("<p>구글 캘린더를 불러오지 못했습니다.</p>", {
          status: 502,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) return response;

    const fallbackUrl = new URL("/index.html", request.url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  },
};

export default worker;
