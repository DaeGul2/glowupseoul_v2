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
  // home intro: starts once its font is ready (inline script after the overlay → html.intro-go, window.GUS_INTRO = start),
  // lifts ~2.1s after that; the hero's own reveal waits for it
  const introEl = document.querySelector('.intro');
  const introOn = !calm && !!introEl && !html.classList.contains('intro-skip');
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
  const showHero = () => { if (hero) { hero.classList.add('in'); heroLater.forEach((t) => t.classList.add('in')); } };
  if (!introOn) setTimeout(showHero, 60);
  else {
    const afterGo = () => {
      const t = performance.now() - window.GUS_INTRO;
      setTimeout(showHero, Math.max(0, 2150 - t));
      setTimeout(() => introEl.remove(), Math.max(0, 3400 - t));
    };
    if (window.GUS_INTRO) afterGo(); else document.addEventListener('gus:intro', afterGo, { once: true });
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

  /* ---------- Google reviews (live from /api/google-reviews; never hard-coded) ----------
     10/19 "구글로 바로 보내지 말고 카드로 묶어서 모달로 · 스크롤하면 아래서 슥 올라오게":
     home cards → tap one (or "Read all") for the reviews sheet #m-rv; the footer's "Google reviews" opens it on every page;
     on the way down the home page a review card slides up from the bottom (closable, once per visit).
     No reviews (API off) → the home section folds away, later section numbers close the gap, and links go to Google Maps. */
  const rvSheet = document.getElementById('m-rv');
  if (rvSheet) {
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const box = document.querySelector('[data-reviews]');
    const sec = box && box.closest('section');
    const sum = document.querySelector('[data-rv-sum]');
    const list = rvSheet.querySelector('[data-d="reviews"]');
    const body = rvSheet.querySelector('.sheet-b');
    const gLink = document.querySelector('.gf a[data-rv-at]');
    let gUrl = gLink ? gLink.href : 'https://www.google.com/maps';
    const LANG = { en: 'English', zh: '中文', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu', ko: '한국어', ja: '日本語', th: 'ภาษาไทย', vi: 'Tiếng Việt', ru: 'Русский', fr: 'Français', de: 'Deutsch', es: 'Español' };
    const rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
    const ago = (r) => {
      if (r.relative) return r.relative;
      const t = Date.parse(r.time || ''); if (!t || !rtf) return '';
      const s = (t - Date.now()) / 1000; const a = Math.abs(s);
      const [u, n] = a < 3600 ? ['minute', 60] : a < 86400 ? ['hour', 3600] : a < 604800 ? ['day', 86400]
        : a < 2629800 ? ['week', 604800] : a < 31557600 ? ['month', 2629800] : ['year', 31557600];
      return rtf.format(Math.round(s / n), u);
    };
    const stars = (v) => `<i class="stars" style="--v:${+v || 0}" role="img" aria-label="${+v || 0} out of 5 stars"></i>`;
    const avatar = (r) => (r.photo
      ? `<img src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy" decoding="async">`
      : `<span class="rv-av" aria-hidden="true">${esc((r.author || '?').trim().charAt(0).toUpperCase())}</span>`);
    const note = (r) => (r.translated ? 'Translated by Google' : r.lang && r.lang !== 'en' ? (LANG[r.lang] || r.lang) : 'Google review');
    const plural = (n) => `${n} review${n === 1 ? '' : 's'}`;
    let data = null; let failed = false;

    const fold = () => {
      failed = true;
      list.innerHTML = `<p class="rvm-load">Reviews can’t be loaded right now. <a href="${esc(gUrl)}" target="_blank" rel="noopener">Read them on Google Maps ↗</a></p>`;
      if (!sec) return;
      sec.hidden = true;
      let n = 0;   // "05 — Journal" → "04 — Journal" …
      document.querySelectorAll('main .sh .mono').forEach((m) => {
        if (m.closest('[hidden]')) return;
        const k = m.textContent.match(/^\d\d( — .*)$/);
        if (k) m.textContent = String(++n).padStart(2, '0') + k[1];
      });
      kick();
    };

    // home: up to 6 cards, the rest live in the sheet
    const card = (r, i) => `<article class="rv" data-r style="--i:${i % 3}" data-rv-at="${i}">
  <div class="rv-top">${stars(r.rating)}<small>${esc(ago(r))}</small></div>
  <p class="rv-q">${esc(r.text)}</p>
  ${r.text.length > 260 ? `<button type="button" class="rv-more" data-rv-at="${i}" aria-haspopup="dialog">Read more</button>` : ''}
  <div class="rv-h">${avatar(r)}<div><b>${esc(r.author)}</b><small>${esc(note(r))}</small></div></div>
</article>`;
    // the sheet: every review in full, with the author's Google profile, the original text and a link to it on Google Maps
    const full = (r, i) => `<article class="rvm" id="rv-${i}" data-lang="${esc(r.lang || '')}">
  <header class="rvm-h">${avatar(r)}<div><b>${r.author_url ? `<a href="${esc(r.author_url)}" target="_blank" rel="noopener">${esc(r.author)}</a>` : esc(r.author)}</b><small>${esc(ago(r))}</small></div>${stars(r.rating)}</header>
  <p class="rvm-t"${r.lang ? ` lang="${esc(r.lang)}"` : ''}>${esc(r.text)}</p>
  ${r.orig ? `<p class="rvm-o" lang="${esc(r.orig_lang || '')}" hidden>${esc(r.orig)}</p>` : ''}
  <footer class="rvm-f">${r.translated ? '<button type="button" data-rv-orig>Translated by Google · <u>See original</u></button>' : `<span>${esc(note(r))}</span>`}${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">View on Google Maps ↗</a>` : ''}</footer>
</article>`;

    function render() {
      const total = data.count || data.reviews.length;
      const rating = data.rating ? Number(data.rating).toFixed(1) : '';
      const langs = [...new Set(data.reviews.map((r) => r.lang).filter(Boolean))];
      list.innerHTML = `<div class="rvm-sum">${rating ? `<b>${rating}</b>` : ''}<div>${stars(data.rating)}<span>${plural(total)}</span></div><small>Google Maps</small></div>`
        + (langs.length > 1 ? `<div class="rvm-ctl" role="group" aria-label="Show reviews in">${['', ...langs].map((l) => `<button type="button" data-rv-lang="${esc(l)}" aria-pressed="${l ? 'false' : 'true'}">${l ? esc(LANG[l] || l) : 'All'}</button>`).join('')}</div>` : '')
        + `<div class="rvm-list">${data.reviews.map(full).join('')}</div>`
        + `<p class="rvm-more">${data.reviews.length < total ? `Showing ${data.reviews.length} of ${total}. ` : ''}<a href="${esc(data.url || gUrl)}" target="_blank" rel="noopener">See all on Google Maps ↗</a>${data.write_url ? ` · <a href="${esc(data.write_url)}" target="_blank" rel="noopener">Write a review</a>` : ''}</p>`;
      if (!box) return;
      if (sum) {
        sum.innerHTML = `<button type="button" class="rv-sum-b" data-rv-at="all" aria-haspopup="dialog">${rating ? `<b>${rating}</b>` : ''}<span>${stars(data.rating)}<em>${plural(total)} on Google Maps</em></span></button>`;
        sum.hidden = false;
      }
      box.innerHTML = data.reviews.slice(0, 6).map(card).join('');
      const cards = [...box.children];
      if (calm || !('IntersectionObserver' in window)) cards.forEach((c) => c.classList.add('in'));
      else {
        const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { cards.forEach((c) => c.classList.add('in')); io.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' });
        io.observe(box);
      }
      if (isHome) peek();
    }

    const setLang = (l) => {
      list.querySelectorAll('[data-rv-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rvLang === l)));
      list.querySelectorAll('.rvm').forEach((a) => { a.hidden = !!l && a.dataset.lang !== l; });
    };
    // open the sheet, scrolled to one review (briefly highlighted) or to the top
    const openAt = (at, opener) => {
      open('m-rv', opener);
      if (!data) return;
      setLang('');
      body.scrollTop = 0;
      const el = at === 'all' ? null : list.querySelector(`#rv-${at}`);
      if (!el) return;
      body.scrollTop = el.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
      el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl');
    };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-rv-at]');
      if (!t || failed || (e.target.closest('a[href]') && !e.target.closest('a[href]').hasAttribute('data-rv-at'))) return;
      e.preventDefault();
      openAt(t.dataset.rvAt, t);
    });
    list.addEventListener('click', (e) => {
      const l = e.target.closest('[data-rv-lang]');
      if (l) { setLang(l.dataset.rvLang); return; }
      const o = e.target.closest('[data-rv-orig]');
      if (!o) return;
      const p = o.closest('.rvm').querySelector('.rvm-o');
      p.hidden = !p.hidden;
      o.innerHTML = `Translated by Google · <u>${p.hidden ? 'See original' : 'Hide original'}</u>`;
    });

    // home: a review card slides up from the bottom once you're past the first screen.
    // It cycles through the best reviews (thin progress lines on top, paused on hover), then slides away by itself.
    // Hidden while the reviews section, the closing call-to-action or the footer is on screen; × closes it for this visit.
    function peek() {
      let seenBefore = false;
      try { seenBefore = sessionStorage.getItem('gus-rvp') === '1'; } catch (e) { /* private mode */ }
      const items = data.reviews.map((r, i) => ({ r, i })).filter((x) => (x.r.rating || 0) >= 4).slice(0, 5);
      if (seenBefore || !items.length) return;
      const total = data.count || data.reviews.length;
      const p = document.createElement('aside');
      p.className = 'rvp';
      p.setAttribute('aria-label', 'Patient reviews from Google Maps');
      p.innerHTML = `<div class="rvp-bar" aria-hidden="true">${items.map(() => '<i></i>').join('')}</div>`
        + '<button type="button" class="rvp-x" aria-label="Close reviews">×</button>'
        + `<button type="button" class="rvp-main" aria-haspopup="dialog"><span class="rvp-k">${data.rating ? `<b>${Number(data.rating).toFixed(1)}</b>` : ''}${stars(data.rating)}<span>${plural(total)} on Google</span></span>`
        + '<span class="rvp-c"><span class="rvp-q"></span><span class="rvp-by"></span></span></button>';
      document.body.appendChild(p);
      const bars = [...p.querySelectorAll('.rvp-bar i')];
      const main = p.querySelector('.rvp-main'); const c = p.querySelector('.rvp-c');
      const q = p.querySelector('.rvp-q'); const by = p.querySelector('.rvp-by');
      let k = -1; let on = false; let over = false; let at = 0;
      const fill = (j) => {
        const { r, i } = items[j];
        at = i;
        q.textContent = r.text;
        by.innerHTML = `${avatar(r)}<span><b>${esc(r.author)}</b>${ago(r) ? ` · ${esc(ago(r))}` : ''}</span><em>Read all <span aria-hidden="true">→</span></em>`;
        bars.forEach((b, x) => { b.classList.toggle('done', x < j); b.classList.remove('on'); });
        if (!calm) { void bars[j].offsetWidth; bars[j].classList.add('on'); }
      };
      const next = () => {
        if (k + 1 >= items.length) { finish(); return; }
        k += 1;
        if (k === 0 || calm) { fill(k); return; }
        c.classList.add('swap');
        setTimeout(() => { fill(k); c.classList.remove('swap'); }, 280);
      };
      const setOn = (v) => {
        on = v;
        p.classList.toggle('on', v);
        html.classList.toggle('rvp-on', v);
        if (v) { if (k < 0) next(); html.style.setProperty('--rvp-h', `${p.offsetHeight + 4}px`); }
      };
      function finish() {
        if (over) return;
        over = true;
        try { sessionStorage.setItem('gus-rvp', '1'); } catch (e) { /* ignore */ }
        setOn(false);
        setTimeout(() => p.remove(), 900);
      }
      p.addEventListener('animationend', (e) => { if (e.animationName === 'rvp-fill') next(); });
      p.querySelector('.rvp-x').addEventListener('click', finish);
      main.addEventListener('click', () => { openAt(String(at), main); finish(); });
      const blockers = [sec, document.querySelector('.end'), document.querySelector('.gf')].filter(Boolean);
      const inView = new Set();
      const check = () => {
        if (over) return;
        const want = window.scrollY > innerHeight * 1.1 && !inView.size;
        if (want !== on) setOn(want);
      };
      if ('IntersectionObserver' in window) {
        const bio = new IntersectionObserver((es) => { es.forEach((en) => (en.isIntersecting ? inView.add(en.target) : inView.delete(en.target))); check(); });
        blockers.forEach((b) => bio.observe(b));
      }
      let queued = false;
      window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } }, { passive: true });
      window.addEventListener('resize', () => { if (on) html.style.setProperty('--rvp-h', `${p.offsetHeight + 4}px`); });
      check();
    }

    fetch('/api/google-reviews', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (d && d.url) gUrl = d.url;
        if (!d || !d.ok || !Array.isArray(d.reviews) || !d.reviews.length) { fold(); return; }
        data = d;
        render();
      })
      .catch(fold);
  }
})();
