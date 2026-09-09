export function matchesSession(text, category, hasPdf, query, filter) {
  const compact = value => value.normalize('NFC').toLocaleLowerCase('ko').replace(/\s+/g, '');
  const words = query.trim().split(/\s+/).filter(Boolean);
  return (filter === 'all' || (filter === 'pdf' ? hasPdf : category === filter)) && words.every(word => compact(text).includes(compact(word)));
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('.session-tools');
  const search = document.querySelector('#session-search');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-session]')].map(node=>({node,text:node.textContent,category:node.dataset.category,pdf:node.dataset.pdf==='true'}));
  let filter = 'all';
  function updateResults() {
    let count = 0;
    for (const card of cards) {
      const matches = matchesSession(card.text,card.category,card.pdf,search.value,filter);
      card.node.hidden = !matches;
      if (matches) count++;
    }
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
    document.querySelector('[data-result-count]').textContent = `${count}개 세션${search.value.trim()?' · 검색 결과':''}`;
    document.querySelector('.no-results').hidden = count !== 0;
  }
  function reset() { search.value=''; filter='all'; updateResults(); }
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('reset',event=>{event.preventDefault(); reset(); search.focus();});
  search.addEventListener('input',updateResults);
  buttons.forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;updateResults();}));
  document.querySelector('[data-reset]').addEventListener('click',()=>{reset();search.focus();});
  form.hidden = false;

  const dialog = document.querySelector('.photo-dialog');
  const links = [...document.querySelectorAll('[data-photo]')];
  const photos = [...new Map(links.map(a=>[a.href,{url:a.href,caption:a.dataset.caption}])).values()];
  const img = dialog.querySelector('img');
  const caption = dialog.querySelector('#photo-caption');
  let index = 0;
  let opener;
  let oldOverflow = '';
  function showPhoto(next) {
    index = (next+photos.length)%photos.length;
    img.src = photos[index].url;
    img.alt = photos[index].caption;
    caption.textContent = photos[index].caption;
    dialog.querySelector('.photo-original').href = photos[index].url;
    document.querySelector('[data-photo-position]').textContent = `${index+1} / ${photos.length}`;
  }
  img.addEventListener('error',()=>{caption.textContent='사진을 불러오지 못했습니다. 창을 닫고 다시 시도해 주세요.';});
  links.forEach(link=>link.addEventListener('click',event=>{
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    opener = link;
    showPhoto(photos.findIndex(p=>p.url===link.href));
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.showModal();
  }));
  dialog.querySelector('[data-photo-prev]').addEventListener('click',()=>showPhoto(index-1));
  dialog.querySelector('[data-photo-next]').addEventListener('click',()=>showPhoto(index+1));
  dialog.addEventListener('keydown',event=>{
    if (event.key==='ArrowLeft' || event.key==='ArrowRight') {event.preventDefault();showPhoto(index+(event.key==='ArrowLeft'?-1:1));}
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;opener?.focus({preventScroll:true});});

  function openLinkedSession() {
    const card = document.getElementById(location.hash.slice(1));
    if (card?.hasAttribute('data-session')) {reset();card.querySelector('details').open=true;card.scrollIntoView();}
  }
  window.addEventListener('hashchange',openLinkedSession);
  openLinkedSession();
}
