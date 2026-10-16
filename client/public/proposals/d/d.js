/* 시안 D — 모달(bottom sheet) + 떠 있는 "Ask Romie" 버튼.
   [data-open="id"] → <dialog id> 열기 · [data-close] / 바깥 클릭 / Esc → 닫기.
   해당 dialog 가 없는 페이지(FAQ)에서는 페이지 안의 채팅 보기로 스크롤. */
(function () {
  const html = document.documentElement;
  const fab = document.querySelector('.fab-wrap');

  function open(id, opener) {
    const d = document.getElementById(id);
    if (!d) {
      const chatBtn = document.querySelector('[data-view-btn="chat"]');
      if (chatBtn) { chatBtn.click(); chatBtn.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    d._opener = opener || null;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    html.classList.add('modal-open');
    const thread = d.querySelector('.fc-thread');
    if (thread) setTimeout(() => (thread.scrollTop = thread.scrollHeight), 30);
  }
  function close(d) {
    if (!d) return;
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); open(o.dataset.open, o); return; }
    const x = e.target.closest('[data-close]');
    if (x) { close(x.closest('dialog')); return; }
    if (e.target.matches && e.target.matches('dialog.sheet')) close(e.target); // backdrop
  });

  // scroll lock follows the dialogs' [open] state directly (close/Esc/backdrop all end up here)
  const sync = () => html.classList.toggle('modal-open', !!document.querySelector('dialog.sheet[open]'));
  const mo = new MutationObserver((recs) => {
    sync();
    recs.forEach((r) => { const d = r.target; if (!d.open && d._opener && d._opener.focus) { d._opener.focus({ preventScroll: true }); d._opener = null; } });
  });
  document.querySelectorAll('dialog.sheet').forEach((d) => mo.observe(d, { attributes: true, attributeFilter: ['open'] }));

  // tuck the floating buttons away while the footer is on screen, so they never cover legal text
  const foot = document.querySelector('.gf, .bf');
  if (fab && foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => fab.classList.toggle('is-low', en.isIntersecting), { rootMargin: '0px 0px -120px 0px' }).observe(foot);
  }

  // deep links: #ask #how #messages #reels open the matching modal
  const HASH = { '#ask': 'm-chat', '#how': 'm-how', '#messages': 'm-msgs', '#reels': 'm-reels' };
  if (HASH[location.hash]) setTimeout(() => open(HASH[location.hash]), 60);
})();
