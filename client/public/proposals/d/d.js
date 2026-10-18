/* 시안 D — 모달 · 떠 있는 버튼 · 모션 · 구글 리뷰.
   [data-open="id"] → <dialog id> 열기 · [data-close] / 바깥 클릭 / Esc → 닫기.
   모션(10/18, 참고: 부드러운 스크롤 + 스크롤 등장): Lenis 부드러운 스크롤, [data-r] 등장, .split 제목 단어별 올라오기,
   .rv-img 사진 걷히기, [data-speed] 패럴랙스, [data-count] 숫자 올라가기. 움직임 줄이기 설정이면 전부 끔. */
(function () {
  window.GUS_D = true;
  const html = document.documentElement;
  const fab = document.querySelector('.fab-wrap');
  const head = document.querySelector('.gh');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHome = document.body.dataset.page === 'home';

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!calm && window.Lenis && !/[?&]nosmooth/.test(location.search)) {   // ?nosmooth = 점검용(스크린샷)
    try {
      lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }
  // in-page links (#how, table of contents) glide instead of jumping
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const t = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) - 12;
    if (lenis) lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  });

  /* ---------- modals ---------- */
  function open(id, opener) {
    const d = document.getElementById(id);
    if (!d) {
      const chatBtn = document.querySelector('[data-view-btn="chat"]');
      if (chatBtn) { chatBtn.click(); chatBtn.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    d._opener = opener || null;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
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
  const sync = () => {
    const on = !!document.querySelector('dialog.sheet[open]');
    html.classList.toggle('modal-open', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };
  const mo = new MutationObserver((recs) => {
    sync();
    recs.forEach((r) => { const d = r.target; if (!d.open && d._opener && d._opener.focus) { d._opener.focus({ preventScroll: true }); d._opener = null; } });
  });
  document.querySelectorAll('dialog.sheet').forEach((d) => mo.observe(d, { attributes: true, attributeFilter: ['open'] }));
  document.querySelectorAll('.fc-thread,.fc-chips').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
  if (location.hash === '#ask') setTimeout(() => open('m-chat'), 60);

  /* ---------- header + floating buttons + reading progress ---------- */
  const prog = document.querySelector('.prog');
  const article = document.querySelector('.bl-art');
  const hero = document.querySelector('.hero');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (head) {
      head.classList.toggle('is-scrolled', isHome ? y > (hero ? hero.offsetHeight - 80 : 40) : y > 4);
      head.classList.toggle('is-hidden', y > 400 && y > lastY + 2 && !html.classList.contains('modal-open'));
      if (y < lastY - 2) head.classList.remove('is-hidden');
    }
    if (fab && isHome && hero) fab.classList.toggle('is-top', y < hero.offsetHeight * 0.6);
    if (prog && article) {
      const r = article.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      prog.style.transform = `scaleX(${p})`;
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // tuck the floating buttons away while the footer is on screen, so they never cover legal text
  const foot = document.querySelector('.gf');
  if (fab && foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => fab.classList.toggle('is-low', en.isIntersecting), { rootMargin: '0px 0px -120px 0px' }).observe(foot);
  }

  /* ---------- split headings into words (each word slides up) ---------- */
  function split(el) {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const parts = c.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'wd';
            const i = document.createElement('span'); i.textContent = p; i.style.setProperty('--w', n++);
            w.appendChild(i); frag.appendChild(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
    el.classList.add('is-split');
  }
  document.querySelectorAll('.split').forEach(split);

  /* ---------- reveal on scroll ---------- */
  const targets = document.querySelectorAll('[data-r], .split, .rv-img');
  if (calm || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('in'));
  } else {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    targets.forEach((t) => io.observe(t));
  }
  if (hero) requestAnimationFrame(() => setTimeout(() => hero.classList.add('in'), 60));

  /* ---------- parallax ---------- */
  const par = [...document.querySelectorAll('[data-speed]')];
  if (!calm && par.length) {
    const tick = () => {
      par.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) return;
        el.style.translate = `0 ${(-box.top * parseFloat(el.dataset.speed)).toFixed(1)}px`;
      });
    };
    window.addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
    tick();
  }

  /* ---------- count-up numbers ---------- */
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length && !calm && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target; const to = +el.dataset.count; const suf = el.dataset.suffix || ''; const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 1600); const v = Math.round(to * (1 - Math.pow(1 - k, 4)));
        el.textContent = v + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.5 });
    nums.forEach((n) => { n.textContent = '0' + (n.dataset.suffix || ''); io.observe(n); });
  }

  /* ---------- table of contents: highlight the section you're reading ---------- */
  const tocLinks = [...document.querySelectorAll('.bl-toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.toggle('on', a === map.get(en.target.id)));
    }), { rootMargin: '0px 0px -70% 0px' });
    map.forEach((_a, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }

  /* ---------- Google reviews (live from /api/google-reviews; never hard-coded) ---------- */
  const box = document.querySelector('[data-reviews]');
  if (box) {
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const sum = document.querySelector('[data-rv-sum]');
    const fallback = () => {
      box.innerHTML = `<div class="rv-empty"><p>Read what patients say about working with Romie, in their own words on Google.</p></div>`;
    };
    fetch('/api/google-reviews', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!d || !d.ok || !d.reviews || !d.reviews.length) return fallback();
        if (sum && d.rating) {
          sum.innerHTML = `<b>${d.rating.toFixed(1)}</b><span><i class="stars" style="--v:${d.rating}" aria-label="${d.rating} out of 5"></i>${d.count} reviews on Google</span>`;
          sum.hidden = false;
        }
        box.classList.toggle('many', d.reviews.length > 3);
        box.innerHTML = d.reviews.map((r, i) => {
          const av = r.photo
            ? `<img src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
            : `<span class="rv-av">${esc((r.author || '?').trim().charAt(0))}</span>`;
          const name = r.author_url ? `<a href="${esc(r.author_url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(r.author)}</a>` : esc(r.author);
          return `<article class="rv" data-r style="--i:${i}">
  <div class="rv-h">${av}<div><b>${name}</b><small>${esc(r.relative)}</small></div></div>
  <i class="stars" style="--v:${r.rating || 0}" aria-label="${r.rating} out of 5"></i>
  <p>${esc(r.text)}</p>
  ${r.text.length > 360 ? '<button type="button" class="rv-more">Read more</button>' : ''}
  <span class="rv-tl">${r.translated ? 'Translated by Google' : 'Google review'}</span>
</article>`;
        }).join('');
        requestAnimationFrame(() => box.querySelectorAll('.rv').forEach((el) => el.classList.add('in')));
      })
      .catch(fallback);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.rv-more'); if (!b) return;
      const card = b.closest('.rv'); card.classList.toggle('open');
      b.textContent = card.classList.contains('open') ? 'Show less' : 'Read more';
    });
  }
})();
