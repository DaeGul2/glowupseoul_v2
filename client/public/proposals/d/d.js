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
      // FAQ page has no chat sheet: switch its own "Chat" tab instead
      const tab = document.querySelector(id === 'm-chat' ? '[data-mode="chat"]' : '[data-mode="wa"]');
      if (tab) {
        tab.click();
        const y = tab.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) - 16;
        if (lenis) lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
      }
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
  if (!document.querySelector('[data-modes]')) {
    if (location.hash === '#ask' || location.hash === '#chat') setTimeout(() => open('m-chat'), 60);
    if (location.hash === '#message') setTimeout(() => open('m-wa'), 60);
  }

  /* ---------- extra motion targets (10/18: "폰에서 애니메이션이 너무 적어 보임") ---------- */
  // cards and rows rise one after another; section labels, intros and buttons follow their heading
  document.querySelectorAll('.pcs > .pc, .g-reels > .g-reel, .faq-list > .faq-i, .checks > li, .tiers2 > div, .fm-tabs > button, .gf-cols > div, .ar-facts > li, .ar-check > li').forEach((el) => {
    if (el.hasAttribute('data-r')) return;
    el.setAttribute('data-r', '');
    el.style.setProperty('--i', [...el.parentElement.children].indexOf(el) % 4);
  });
  document.querySelectorAll('.sh > .mono, .sh > p, .sh > .btns, .sh-row > .more, .sh-row .mono, .ph > .mono, .ph > .lead, .ar-sum, .ar-by, .rv-foot, .gf-top').forEach((el) => {
    if (el.hasAttribute('data-r') || el.closest('[data-r]')) return;
    el.setAttribute('data-r', ''); el.classList.add('r-soft');
  });
  const live = !calm && 'IntersectionObserver' in window;
  // section headings fill word by word as you scroll through them
  const fills = live ? [...document.querySelectorAll('.sh h2.split, .end h2.split, .bl-related h2')] : [];
  fills.forEach((h) => { h.classList.add('fill', 'split'); });
  // photos drift slightly inside their frames
  const PX = live ? [...document.querySelectorAll('.xp-img img, .pc-m img, .g-reel img, .bl-fig img, .ar-fig img')] : [];
  PX.forEach((img) => img.classList.add('px'));
  // "What to expect" cards stack on phones
  const stack = [...document.querySelectorAll('.xp > .xp-i')];

  /* ---------- one scroll loop: header, progress, hero, parallax, heading fill, stacking, marquee ---------- */
  const prog = document.querySelector('.prog');
  const article = document.querySelector('.bl-art');
  const hero = document.querySelector('.hero');
  const heroImg = hero && hero.querySelector('[data-speed]');
  const mqTrack = document.querySelector('.mq .g-marquee-track');
  const mqAnim = !calm && mqTrack && mqTrack.getAnimations ? mqTrack.getAnimations()[0] : null;
  const seen = new Set();
  if ('IntersectionObserver' in window && !calm) {
    const vio = new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target))), { rootMargin: '10% 0px 10% 0px' });
    PX.forEach((img) => vio.observe(img.parentElement));
    fills.forEach((h) => vio.observe(h));
  }
  const phone = matchMedia('(max-width: 899px)');
  const tocBox = document.querySelector('.bl-toc');
  const tocGrid = document.querySelector('.bl-grid');
  let rail = null;   // floating section rail (phones/tablets), built below with the table of contents
  let lastY = window.scrollY; let lastT = performance.now(); let rate = 1; let dir = 1; let busyUntil = 0; let ticking = false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function frame(now) {
    const y = window.scrollY; const vh = innerHeight;
    const dy = y - lastY; const dt = Math.max(1, now - lastT);
    if (head) {
      head.classList.toggle('is-scrolled', isHome ? y > (hero ? hero.offsetHeight - 80 : 40) : y > 4);
      if (dy > 2 && y > 400 && !html.classList.contains('modal-open')) head.classList.add('is-hidden');
      if (dy < -2) head.classList.remove('is-hidden');
    }
    if (fab && isHome && hero) fab.classList.toggle('is-top', y < hero.offsetHeight * 0.6);
    if (prog) {
      let p;
      if (article) { const r = article.getBoundingClientRect(); p = -r.top / Math.max(1, r.height - vh); }
      else p = y / Math.max(1, document.documentElement.scrollHeight - vh);
      prog.style.transform = `scaleX(${clamp(p, 0, 1).toFixed(4)})`;
      if (tocBox) tocBox.style.setProperty('--tp', clamp(p, 0, 1).toFixed(4));
    }
    if (rail && tocGrid) {
      const g = tocGrid.getBoundingClientRect();
      rail.classList.toggle('is-on', g.top < vh * 0.35 && g.bottom > vh * 0.55);
      if (!rail.classList.contains('is-on')) rail.classList.remove('open');
    }
    if (!calm) {
      if (hero) {
        const hh = hero.offsetHeight;
        if (y < hh * 1.2) {
          hero.style.setProperty('--hp', clamp(y / hh, 0, 1).toFixed(3));
          if (heroImg) heroImg.style.translate = `0 ${(y * parseFloat(heroImg.dataset.speed)).toFixed(1)}px`;
        }
      }
      seen.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (el.classList.contains('fill')) {
          const words = el._w || (el._w = [...el.querySelectorAll('.wd')]);
          const p = clamp((vh * 0.92 - r.top) / (vh * 0.42), 0, 1);
          const lit = Math.ceil(p * words.length);
          words.forEach((w, i) => w.classList.toggle('lit', i < lit));
        } else {
          const img = el.querySelector('.px');
          if (img) img.style.translate = `0 ${(-((r.top + r.height / 2 - vh / 2) / vh) * r.height * 0.09).toFixed(1)}px`;
        }
      });
      if (stack.length && phone.matches) {
        stack.forEach((c, i) => {
          const next = stack[i + 1];
          if (!next) { c.style.scale = ''; c.style.filter = ''; return; }
          const a = c.getBoundingClientRect(); const b = next.getBoundingClientRect();
          const k = clamp((a.bottom - b.top) / a.height, 0, 1);   // how much the next card covers this one
          c.style.scale = (1 - k * 0.06).toFixed(4);
          c.style.filter = k > 0.01 ? `brightness(${(1 - k * 0.12).toFixed(3)})` : '';
        });
      }
      if (mqAnim) {
        if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;
        const target = dir * (1 + clamp(Math.abs(dy) / dt * 9, 0, 7));
        rate += (target - rate) * 0.12;
        if (Math.abs(rate - dir) < 0.02 && Math.abs(dy) < 0.5) rate = dir;
        mqAnim.playbackRate = rate;
      }
    }
    lastY = y; lastT = now;
    if (now < busyUntil || (mqAnim && Math.abs(rate - dir) > 0.02)) requestAnimationFrame(frame); else ticking = false;
  }
  const kick = () => { busyUntil = performance.now() + 400; if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  kick();
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
  // home intro (CSS-only overlay) lifts at ~2.1s: the hero's own reveal waits for it
  const introOn = !calm && !!document.querySelector('.intro') && !html.classList.contains('intro-skip');
  const targets = [...document.querySelectorAll('[data-r], .split, .rv-img, .svc > li, .stats > li')];
  const heroLater = introOn && hero ? targets.filter((t) => hero.contains(t)) : [];
  if (calm || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('in'));
  } else {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    targets.filter((t) => !heroLater.includes(t)).forEach((t) => io.observe(t));
  }
  if (hero) setTimeout(() => { hero.classList.add('in'); heroLater.forEach((t) => t.classList.add('in')); }, introOn ? 2150 : 60);
  if (introOn) setTimeout(() => { const el = document.querySelector('.intro'); if (el) el.remove(); }, 3400);

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

  /* ---------- table of contents: sidebar on desktop, a floating rail on the left on phones/tablets ---------- */
  const tocLinks = [...document.querySelectorAll('.bl-toc a')];
  if (tocLinks.length) {
    rail = document.createElement('div');
    rail.className = 'toc-rail';
    rail.innerHTML = `<button type="button" class="toc-rail-btn" aria-expanded="false" aria-label="Sections in this article">${tocLinks.map(() => '<i></i>').join('')}</button>`
      + `<nav class="toc-pop" aria-label="In this article"><p class="toc-pop-h">In this article</p><ol>${tocLinks.map((a) => `<li><a href="${a.getAttribute('href')}">${a.innerHTML}</a></li>`).join('')}</ol></nav>`;
    document.body.appendChild(rail);
    const btn = rail.querySelector('.toc-rail-btn');
    const lines = [...rail.querySelectorAll('.toc-rail-btn i')];
    const popLinks = [...rail.querySelectorAll('.toc-pop a')];
    btn.addEventListener('click', () => { const o = rail.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
    rail.addEventListener('click', (e) => { if (e.target.closest('.toc-pop a')) { rail.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('click', (e) => { if (rail.classList.contains('open') && !rail.contains(e.target)) { rail.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
    const setActive = (idx) => {
      tocLinks.forEach((a, i) => a.classList.toggle('on', i === idx));
      popLinks.forEach((a, i) => a.classList.toggle('on', i === idx));
      lines.forEach((l, i) => { l.classList.toggle('on', i === idx); l.classList.toggle('done', i < idx); });
    };
    if ('IntersectionObserver' in window) {
      const ids = tocLinks.map((a) => decodeURIComponent(a.getAttribute('href').slice(1)));
      const io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.isIntersecting) setActive(ids.indexOf(en.target.id));
      }), { rootMargin: '0px 0px -70% 0px' });
      ids.forEach((id) => { const h = document.getElementById(id); if (h) io.observe(h); });
    }
    kick();
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
