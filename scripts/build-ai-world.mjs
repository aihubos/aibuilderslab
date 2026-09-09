import {mkdir, writeFile} from 'node:fs/promises';
import {sessions, photos} from './ai-world-content.mjs';

const out = new URL('../activities/ai-world-2026/', import.meta.url);
const asset = '/assets/ai-world-2026/';
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {work:'일하는 방식',industry:'산업과 인프라',trust:'신뢰와 정책'};
const photo = (id, alt, eager=false) => `<img src="${asset}field-${id}-720.webp" srcset="${asset}field-${id}-720.webp 720w, ${asset}field-${id}-1600.webp 1600w" sizes="${eager?'(max-width: 760px) 100vw, 58vw':'(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw'}" width="1600" height="1200" alt="${esc(alt)}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
const download = (s, label='공식 발표자료') => `<a class="download-link" href="${esc(s.pdf)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)} 공식 발표자료 PDF ${s.pages}쪽 열기 및 다운로드 (새 창)"><span>${label} <small>PDF · ${s.pages}p</small></span><span aria-hidden="true">↓</span></a>`;
const cards = sessions.map((s,i)=>`<article class="session-card" id="session-${s.id}" data-session data-category="${s.category}" data-pdf="${Boolean(s.pdf)}">
  <div class="card-top"><span>${labels[s.category]}</span><span>${String(i+1).padStart(2,'0')}</span></div>
  <div class="speaker">${s.id==='dialogue'?`<span class="speaker-pair"><img src="${asset}speaker-4.webp" width="240" height="240" alt="이세돌 공식 프로필" loading="lazy"><img src="${asset}speaker-5.webp" width="240" height="240" alt="김덕진 공식 프로필" loading="lazy"></span>`:`<img src="${asset}speaker-${s.portrait}.webp" width="240" height="240" alt="${esc(s.name)} 공식 프로필" loading="lazy" decoding="async">`}<div><h3>${esc(s.name)}</h3><p>${esc(s.company)}<br>${esc(s.role)}</p></div></div>
  <p class="session-title">${esc(s.title)}</p><p class="card-lede">${esc(s.lede)}</p>
  <ul class="takeaways">${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>
  <details class="session-detail"><summary>상세 내용 읽기<span aria-hidden="true">+</span></summary><div class="detail-body">
    ${s.photo?`<figure>${photo(s.photo,`${s.name} 발표 현장`)}<figcaption>AI 빌더스 랩 현장 사진</figcaption></figure>`:''}
    ${s.details.map(([h,p])=>`<h4>${esc(h)}</h4><p>${esc(p)}</p>`).join('')}
    ${s.id==='dialogue'?'<a class="inline-link" href="#dialogue">특별대담 집중 리포트 읽기 →</a>':''}
    <p class="source-note">요약 근거: ${esc(s.source)}</p>
  </div></details>
  <div class="card-bottom">${s.pdf?download(s):'<span class="unavailable">공개 PDF 미확인 · 요약으로 읽기</span>'}</div>
</article>`).join('\n');
const gallery = (items) => items.map(([id,person,caption])=>`<figure class="gallery-item"><a href="${asset}field-${id}-1600.webp" data-photo data-caption="${esc(person+' — '+caption)}" aria-label="${esc(person+' — '+caption)} 사진 크게 보기">${photo(id,person+' — '+caption)}<span class="expand-photo" aria-hidden="true">↗</span></a><figcaption><span>${esc(person)}</span><strong>${esc(caption)}</strong></figcaption></figure>`).join('');
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI WORLD 2026 현장 리포트 | 이세돌·김덕진 대담과 연사별 핵심 요약 — AI 빌더스 랩</title>
  <meta name="description" content="AI 이후, 인간의 다음 수. 이세돌·김덕진 특별대담을 중심으로 AI WORLD 2026의 21개 세션 요약, 공식 발표자료 13건, 직접 촬영한 현장 사진 18장을 만나보세요.">
  <meta name="theme-color" content="#161223"><link rel="canonical" href="https://builderslab.ai-hub-os.com/activities/ai-world-2026/">
  <meta property="og:type" content="article"><meta property="og:locale" content="ko_KR"><meta property="og:title" content="AI 이후, 인간의 다음 수. — AI WORLD 2026">
  <meta property="og:description" content="이세돌 × 김덕진 특별대담부터 연사별 핵심 요약, 공식 발표자료, 현장의 장면까지. AI 빌더스 랩의 컨퍼런스 노트.">
  <meta property="og:url" content="https://builderslab.ai-hub-os.com/activities/ai-world-2026/"><meta property="og:image" content="https://builderslab.ai-hub-os.com/assets/ai-world-2026/field-104633-1600.webp">
  <meta name="twitter:card" content="summary_large_image"><meta property="article:published_time" content="2026-09-10T00:00:00+09:00">
  <link rel="icon" href="/assets/favicon.png"><link rel="preload" href="/assets/fonts/WantedSansVariable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/home.css?v=20260910-aiworld"><link rel="stylesheet" href="./archive.css?v=1">
  <script src="./archive.js?v=1" type="module"></script>
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:'AI 이후, 인간의 다음 수. — AI WORLD 2026 현장 리포트',datePublished:'2026-09-10',author:{'@type':'Organization',name:'AI 빌더스 랩',url:'https://builderslab.ai-hub-os.com/'},image:'https://builderslab.ai-hub-os.com/assets/ai-world-2026/field-104633-1600.webp',about:{'@type':'Event',name:'AI WORLD 2026',startDate:'2026-09-09',location:{'@type':'Place',name:'서울 롯데월드타워 롯데시네마 5층'}},inLanguage:'ko',mainEntityOfPage:'https://builderslab.ai-hub-os.com/activities/ai-world-2026/'})}</script>
</head>
<body class="archive-page">
<a class="skip-link" href="#main-content">본문으로 바로가기</a>
<header class="archive-header"><div class="archive-shell header-row"><a href="/" class="archive-brand" aria-label="AI 빌더스 랩 홈페이지"><img src="/assets/ai-builders-lab-logo-transparent-384.webp" width="384" height="128" alt="AI 빌더스 랩"></a><nav aria-label="주요 메뉴"><a href="/#courses">교육 과정</a><a href="./" aria-current="page">활동 자료</a><a class="home-return" href="/">빌더스랩 홈 <span aria-hidden="true">↗</span></a></nav></div></header>
<main id="main-content">
  <section class="cover" aria-labelledby="cover-title">
    <div class="archive-shell">
      <div class="cover-kicker"><span>활동 자료 <i aria-hidden="true">/</i> FIELD REPORT 001</span><span>2026.09.09 · SEOUL</span></div>
      <div class="event-brand"><a href="https://www.ai-world.kr/" target="_blank" rel="noopener noreferrer" aria-label="AI WORLD 공식 홈페이지 (새 창)"><img src="${asset}official-logo.svg" width="82" height="64" alt="AI WORLD 공식 로고"></a><div><strong>AI WORLD 2026</strong><span>AI Shift — The New Economy</span></div><span class="report-badge">AI 빌더스 랩 현장 기록</span></div>
      <div class="cover-grid">
        <div class="cover-copy"><p class="cover-overline">THE NEXT HUMAN MOVE</p><h1 id="cover-title">AI 이후,<br>인간의 <em>다음 수.</em></h1><p class="cover-deck">더 똑똑한 AI가 아니라,<br>AI와 함께 무엇을 만들 것인가.</p><p class="cover-description">이세돌·김덕진 특별대담에서 시작해<br>산업, 일하는 방식, 신뢰의 변화까지.<br>현장에서 가져온 질문과 배움을 나눕니다.</p><a class="archive-button primary" href="#dialogue">메인 대담 읽기 <span aria-hidden="true">↗</span></a></div>
        <figure class="cover-photo"><a href="${asset}field-104633-1600.webp" data-photo data-caption="이세돌 · 김덕진 — 특별대담 현장" aria-label="이세돌·김덕진 대담 현장 사진 크게 보기">${photo('104633','AI WORLD 2026 이세돌·김덕진 특별대담 안내 화면을 직접 촬영한 사진',true)}<span class="photo-label">ON THE SCENE <span aria-hidden="true">↗</span></span></a><figcaption><span>특별대담 · 알파고 이후, AI와 인간의 공존시대</span><span>직접 촬영</span></figcaption></figure>
      </div>
      <div class="cover-bottom"><p>서울 롯데월드타워<br><strong>롯데시네마 5F</strong></p><dl><div><dt>세션 요약</dt><dd>21<span>개</span></dd></div><div><dt>공식 발표자료</dt><dd>13<span>건</span></dd></div><div><dt>현장 사진</dt><dd>18<span>장</span></dd></div></dl><a href="#sessions">연사별로 둘러보기 <span aria-hidden="true">↓</span></a></div>
    </div>
  </section>
  <nav class="jump-nav" aria-label="이 페이지 목차"><div class="archive-shell"><a href="#dialogue">01 특별대담</a><a href="#sessions">02 연사별 요약</a><a href="#downloads">03 발표자료</a><a href="#gallery">04 현장 사진</a></div></nav>

  <section class="spotlight archive-shell section-pad" id="dialogue" aria-labelledby="dialogue-title">
    <div class="section-label"><span>01 / THE CONVERSATION</span><span>메인 스토리 · 약 4분</span></div>
    <div class="story-heading"><h2 id="dialogue-title">AI가 답을 줘도,<br>다음 수는 사람이 둔다.</h2><p>알파고 이후 바둑에서 먼저 일어난 변화는<br>지금 우리의 일과 배움에 같은 질문을 던집니다.<br><span>아래 제목과 문장은 대담을 재구성한 편집 요약입니다.</span></p></div>
    <div class="conversation-people"><div><img src="${asset}speaker-4.webp" alt="이세돌 공식 프로필" width="240" height="240" loading="lazy"><p><strong>이세돌</strong><span>UNIST 특임교수</span></p></div><span class="people-x" aria-hidden="true">×</span><div><img src="${asset}speaker-5.webp" alt="김덕진 공식 프로필" width="240" height="240" loading="lazy"><p><strong>김덕진</strong><span>IT커뮤니케이션연구소 소장 · 대담 진행</span></p></div></div>
    <div class="story-grid"><aside class="story-aside"><span class="mini-label">IN ONE SENTENCE</span><p>AI를 닮아가는 것보다,<br><strong>AI를 이해해<br>나의 방식을 만드는 것.</strong></p><a href="#takeaway">빌더에게 남는 질문 ↓</a><p class="source-note">현장 전사록 기반 요약<br>대담 도입부 일부 미포함<br>공개 PDF는 확인되지 않았습니다.</p></aside><div class="story-body">
      <p class="story-intro">누구나 AI의 답을 볼 수 있게 되면, 모두의 실력이 같아질까요? 대담은 오히려 그 답을 이해하는 능력에 따라 격차가 생길 수 있다는 바둑계의 경험에서 출발합니다.</p>
      <article><span>01</span><div><h3>같은 답을 봐도, 같은 곳에 도착하지 않는다.</h3><p>이세돌은 AI의 새로운 수를 처음 접했을 때 의미를 이해하기 어려웠다고 설명합니다. 같은 수를 따라 둘 수는 있어도 왜 좋은지 아는 것과는 다릅니다. AI에 대한 접근이 평등해지는 것과 그 결과를 해석하고 자기 상황에 활용하는 능력이 같아지는 것은 별개의 문제입니다.</p><p>이 대담에서 경쟁력은 더 빠르게 정답을 복사하는 능력보다, 낯선 답을 이해하고 변형하는 힘에 가깝습니다.</p></div></article>
      <article><span>02</span><div><h3>모방은 출발점이다. 목적지는 자기만의 방식이다.</h3><p>처음에는 AI를 따라 했다면, 시간이 지나며 원리를 이해하고 각자의 바둑을 다시 만들게 됐다는 이야기입니다. 신진서의 끊임없는 탐구를 예로 들며, AI와 공부하는 일이 자신의 직업에 의미를 부여하고 고유한 선택을 준비하는 과정일 수 있다고 말합니다.</p><div class="learning-path" aria-label="모방에서 이해를 거쳐 자기 방식으로"><span>모방<small>새로운 답을 만난다</small></span><i aria-hidden="true">→</i><span>이해<small>이유와 맥락을 묻는다</small></span><i aria-hidden="true">→</i><span>자기 방식<small>내 문제에 맞게 바꾼다</small></span></div></div></article>
      <details class="story-more"><summary><span>대담을 더 깊이 읽기 <small>업무 재설계 · 학습 · 사람에게 남는 시간</small></span><span class="detail-symbol" aria-hidden="true">+</span></summary><div class="story-continuation">
      <article><span>03</span><div><h3>도구를 붙이는 일에서, 일의 방식을 바꾸는 일로.</h3><p>기존 업무에 AI를 점진적으로 적용하는 접근과 AI를 전제로 조직과 절차를 새로 만드는 접근을 비교합니다. 현실적인 전환 속도도 고려해야 하지만, 익숙한 방식만 고수해서는 기술이 열어주는 가능성을 충분히 활용하기 어렵다는 관점입니다.</p><p>기업과 개인 모두 무엇을 더 빨리 할지뿐 아니라, 지금의 일 자체를 어떻게 다시 설계할지 물어야 한다는 이야기로 이어집니다.</p></div></article>
      <article><span>04</span><div><h3>기초를 이해하고, 깊이 파거나 새롭게 연결한다.</h3><p>이해 없는 답안 복사는 일정 수준에서 한계에 부딪히고 선택을 획일화할 수 있습니다. 대담은 기초 구조를 배우는 일과 AI를 활용하는 일을 대립시키지 않습니다. 한 분야를 깊게 파는 길과 여러 분야의 지식을 연결하는 길 모두에 이해가 필요합니다.</p><p>한국의 제조 기반과 피지컬 AI 기회에 대한 논의에서도 결국 사람과 인재 환경으로 돌아옵니다. 새로운 기술과 인재가 각자의 가능성을 펼칠 수 있는 여건을 만들어야 한다는 메시지입니다.</p></div></article>
      <article><span>05</span><div><h3>시간을 아꼈다면, 그 시간을 누구에게 돌려줄까.</h3><p>대담은 AI를 효율과 비용 절감만으로 보지 말자는 이야기로 마무리됩니다. 일을 더 빨리 끝냈을 때 남는 시간을 다시 업무량으로만 채운다면 변화의 의미는 제한됩니다.</p><p>직원이 배우고 새로운 아이디어를 시도하며 자신만의 방식을 만들 수 있도록 시간을 쓰는 것. 생산성의 다음 질문은 사람에게 어떤 성장과 가치를 남길지에 관한 것입니다.</p></div></article>
      <p class="source-note">바둑 교육에 관한 경험을 모든 교육 분야의 동일한 기준으로 일반화하지 않았습니다. 대담에서 언급된 모델 성능·산업 전망은 별도 성능 검증 자료가 아닙니다.</p></div></details>
      <div class="builder-question" id="takeaway"><span class="mini-label">A QUESTION FOR BUILDERS</span><h3>우리는 AI의 답을 복사하고 있나요,<br>우리의 다음 수를 만들고 있나요?</h3><p>다음 작업에서는 결과물만 남기지 말고, 왜 그 선택을 했는지도 한 줄 남겨보세요. 대담에서 얻은 빌더스랩의 실천 제안입니다.</p></div>
    </div></div>
  </section>

  <section class="sessions-section section-pad" id="sessions" aria-labelledby="sessions-title"><div class="archive-shell">
    <div class="section-label"><span>02 / IDEAS TO TAKE HOME</span><span>기록이 확보된 21개 세션</span></div><div class="section-head"><div><h2 id="sessions-title">무엇이 바뀌고,<br>무엇이 더 중요해질까.</h2><p>핵심 세 가지를 먼저 읽고, 궁금한 발표는 더 깊이 살펴보세요.</p></div><a class="inline-link" href="https://www.ai-world.kr/#program" target="_blank" rel="noopener noreferrer">공식 전체 프로그램 ↗</a></div>
    <form class="session-tools" role="search" aria-label="연사 및 발표 검색" hidden><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="session-search">연사, 회사, 주제 검색</label><input id="session-search" type="search" placeholder="연사, 회사, 주제로 찾아보세요" autocomplete="off"><button type="reset" aria-label="검색과 필터 초기화">초기화</button></div><div class="filter-row" role="group" aria-label="발표 주제 필터"><button type="button" data-filter="all" aria-pressed="true">전체</button><button type="button" data-filter="work" aria-pressed="false">일하는 방식</button><button type="button" data-filter="industry" aria-pressed="false">산업과 인프라</button><button type="button" data-filter="trust" aria-pressed="false">신뢰와 정책</button><button type="button" data-filter="pdf" aria-pressed="false">PDF 있는 발표 <span>13</span></button></div></form>
    <p class="result-count" role="status" aria-live="polite" aria-atomic="true"><span data-result-count>21개 세션</span><span>핵심 요약 · 발표자 소속은 행사 당시 기준</span></p>
    <div class="session-grid">${cards}</div><div class="no-results" hidden><h3>일치하는 발표가 없습니다.</h3><p>다른 검색어를 입력하거나 필터를 초기화해 주세요.</p><button type="button" class="archive-button" data-reset>전체 발표 보기 ↗</button></div>
    <p class="section-footnote">모든 연사의 전체 발언을 수록한 페이지는 아닙니다. 확보한 전사록과 공개 자료를 바탕으로 정리했으며, 요약 근거와 기록 범위는 각 상세 내용에 표시했습니다.</p>
    <details class="other-program"><summary>그 밖의 공식 프로그램 <span>기록 미확보 · 7명</span><span aria-hidden="true">+</span></summary><div><p>아래는 공식 프로그램에 소개된 연사와 발표 주제입니다. 전사록이나 공개 발표자료를 확보하지 못해 발표 내용을 추정하여 요약하지 않았습니다.</p><dl>
      <div><dt>루스 선 <small>구글 클라우드 코리아 사장</small></dt><dd>모델을 넘어 현실로: AI가 이끄는 산업의 새로운 모멘텀</dd></div>
      <div><dt>최경진 <small>한국인공지능법학회장 · 가천대학교 교수</small><br>최장혁 <small>서울대학교 공과대학 전기정보공학부 특임교수</small><br>안젤리나 콴 <small>Future Native 공동창업자 · 최고리스크·컴플라이언스책임자</small></dt><dd>AI for Industry · 패널</dd></div>
      <div><dt>박세준 <small>티오리 대표</small></dt><dd>모두의 보안: 프로젝트 캐노피</dd></div>
      <div><dt>류준석 <small>네이버클라우드 데이터센터 각 세종 기술리더</small></dt><dd>AI시대의 데이터센터</dd></div>
      <div><dt>김병석 <small>포스코DX AI Workforce TF팀장 · 상무보</small></dt><dd>AI직원과 함께 일하는 지능형 자율기업의 시작</dd></div>
    </dl><a class="inline-link" href="https://www.ai-world.kr/#program" target="_blank" rel="noopener noreferrer">공식 프로그램에서 확인 ↗</a></div></details>
  </div></section>

  <section class="downloads-section section-pad archive-shell" id="downloads" aria-labelledby="downloads-title"><div class="section-label"><span>03 / THE READING ROOM</span><span>2026.09.10 공개 링크 확인</span></div><div class="section-head"><div><h2 id="downloads-title">더 깊이 읽고 싶을 때.</h2><p>공식 발표자료 13건을 한곳에 모았습니다.</p></div><span class="pdf-mark" aria-hidden="true">PDF ↓</span></div><div class="download-grid">${sessions.filter(s=>s.pdf).map(s=>`<div class="download-row"><div><h3>${esc(s.name)}</h3><p>${esc(s.company)} · ${esc(s.role)}</p></div>${download(s,'자료 열기')}</div>`).join('')}</div><div class="download-notice"><p><strong>원본은 공식 사이트에서 열립니다.</strong> 브라우저 PDF 뷰어의 다운로드 버튼으로 저장할 수 있으며, 일부 자료는 바로 다운로드됩니다. 개인 대담·미공개 발표에는 임의의 다운로드 버튼을 만들지 않았습니다.</p><p>AI WORLD와 파이낸셜뉴스 행사 안내의 공개 자료를 함께 확인했습니다. 링크가 변경되면 <a href="https://www.ai-world.kr/#speaker" target="_blank" rel="noopener noreferrer">AI WORLD 강연자 안내 ↗</a> 또는 <a href="https://event.fnnews.com/event/397" target="_blank" rel="noopener noreferrer">파이낸셜뉴스 행사 안내 ↗</a>에서 확인해 주세요.</p></div></section>

  <section class="gallery-section section-pad" id="gallery" aria-labelledby="gallery-title"><div class="archive-shell"><div class="section-label"><span>04 / THROUGH OUR LENS</span><span>현장 사진 18장</span></div><div class="section-head"><div><h2 id="gallery-title">그날, 우리가 멈춰 본 장면.</h2><p>스크린에 남은 메시지, 현장에서 이어진 질문들.<br>사진을 누르면 더 크게 볼 수 있습니다.</p></div><span class="photo-credit">PHOTOGRAPHY<br><strong>AI BUILDERS LAB</strong></span></div><div class="gallery-grid">${gallery(photos.slice(0,6))}</div><details class="gallery-more"><summary>현장 사진 12장 더 보기 <span aria-hidden="true">+</span></summary><div class="gallery-grid">${gallery(photos.slice(6))}</div></details></div></section>

  <section class="colophon archive-shell"><div><span class="mini-label">ABOUT THIS REPORT</span><h2>현장에서 배운 것을,<br>다음 만들기로.</h2><p>AI 빌더스 랩은 배우고, 나누고, 함께 만듭니다.<br>컨퍼런스의 아이디어가 우리의 실제 작업으로 이어지기를 바랍니다.</p><a class="archive-button" href="/#courses">빌더스랩에서 함께 만들기 <span aria-hidden="true">↗</span></a></div><div class="credits"><h3>기록과 출처</h3><p>행사: AI WORLD 2026 · 2026년 9월 9일<br>장소: 서울 롯데월드타워 롯데시네마 5층<br>현장 사진·편집: AI 빌더스 랩<br>게시: 2026년 9월 10일</p><p>공식 행사 홈페이지가 아닌 독립적인 현장 리포트입니다. 연사별 글은 전사록과 발표자료를 읽기 쉽게 재구성한 요약이며, 연사 검수본이나 발언 전문이 아닙니다.</p><p>AI WORLD 로고·연사 프로필 사진·발표자료의 권리는 각 권리자에게 있습니다. 공식 소속·제휴·후원을 의미하지 않습니다. 발표자료는 재배포하지 않고 공식 공개 링크로 연결합니다.</p><a href="https://www.ai-world.kr/" target="_blank" rel="noopener noreferrer">AI WORLD 공식 홈페이지 ↗</a><a href="https://open.kakao.com/me/aibuilderslab" target="_blank" rel="noopener noreferrer">내용 정정·권리 관련 문의 ↗</a></div></section>
</main>
<footer class="archive-footer"><div class="archive-shell"><a href="/">AI BUILDERS LAB</a><span>배우고, 나누고, 성장한다.</span><a href="#main-content">처음으로 ↑</a></div></footer>
<dialog class="photo-dialog" aria-labelledby="photo-caption"><form method="dialog"><button class="photo-close" aria-label="사진 닫기">닫기 ×</button></form><img alt="" width="1600" height="1200"><p id="photo-caption"></p><div class="photo-controls"><button type="button" data-photo-prev aria-label="이전 사진">← 이전</button><span data-photo-position aria-live="polite"></span><button type="button" data-photo-next aria-label="다음 사진">다음 →</button></div><a class="photo-original" target="_blank" rel="noopener noreferrer">큰 이미지 새 창에서 열기 ↗</a></dialog>
</body></html>`;
await mkdir(out,{recursive:true});
await writeFile(new URL('index.html',out),html+'\n');
console.log(`AI WORLD report built: ${sessions.length} sessions / ${sessions.filter(s=>s.pdf).length} downloads / ${photos.length} photos.`);
