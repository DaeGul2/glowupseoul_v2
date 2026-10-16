/* Glow Up Seoul — 시안 공용 런타임 (v2 of proposals, 2026-10-16 저녁).
 * 경로는 전부 이 스크립트 위치 기준 상대경로 → 서버에서도, 파일로 열어도 동작.
 * 카탈로그(시안 C 전용): /api/v3/catalog 라이브 → 실패 시 shared/catalog.json 스냅샷.
 */
(function () {
  const G = (window.GUS = window.GUS || {});
  const D = G.data;
  const C = D.contact;
  const SHARED = new URL('.', document.currentScript.src).href;
  const ASSETS = new URL('../assets/', SHARED).href;
  G.asset = (p) => ASSETS + p;
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  G.esc = esc;
  G.qs = (k) => new URLSearchParams(location.search).get(k);
  const site = document.body.dataset.site || 'a';
  const page = document.body.dataset.page || 'home';
  const cfg = G.site || {};

  /* labels / money */
  G.L = {
    duration: { temporary: 'A few weeks', months_3_6: '3–6 months', months_6_12: '6–12 months', year_1_2: '1–2 years', years_2_plus: '2+ years', semi_permanent: 'Semi-permanent', permanent: 'Permanent' },
    pain: { soft: 'Gentle', mild: 'Mild', hard: 'Strong' },
    recovery: { immediate: 'No downtime', '1_2_days': '1–2 days', '1_week_plus': '1 week+' },
  };
  G.krw = (n) => (n == null ? 'Ask us' : '₩' + Number(n).toLocaleString('en-US'));
  G.usd = (n) => (n == null ? '' : '≈ $' + (Math.round(n / 1380 / 10) * 10).toLocaleString('en-US'));
  const cleanNote = (s) => String(s || '').replace(/\s*\(reference\)\s*/i, '').replace(/^reference$/i, '').trim();
  G.wa = (text) => 'https://wa.me/' + C.wa + (text ? '?text=' + encodeURIComponent(text) : '');
  G.reel = (id) => 'https://www.instagram.com/glowupseoul/reel/' + id + '/';
  G.detailHref = (it) => 'treatment.html?k=' + (it.kind === 'surgery' ? 'surgeries' : 'treatments') + '&s=' + encodeURIComponent(it.slug);
  G.thumb = (it) => ASSETS + 'tx/' + it.slug + '.jpg';

  /* data loading */
  function getJSON(url, ms) {
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const t = ctl && ms ? setTimeout(() => ctl.abort(), ms) : null;
    return fetch(url, ctl ? { signal: ctl.signal } : undefined)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .finally(() => t && clearTimeout(t));
  }
  const onServer = location.protocol.startsWith('http');
  let _cat = null;
  G.catalog = function () {
    if (_cat) return _cat;
    _cat = (onServer ? getJSON('/api/v3/catalog', 6000) : Promise.reject())
      .then((d) => (d && d.treatments ? d : Promise.reject()))
      .catch(() => getJSON(SHARED + 'catalog.json'))
      .then((d) => {
        const items = [...d.treatments.map((x) => ({ ...x, kind: 'treatment' })), ...d.surgeries.map((x) => ({ ...x, kind: 'surgery' }))];
        const areaById = Object.fromEntries(d.areas.map((a) => [a.id, a]));
        const concerns = d.concerns.map((c) => ({ ...c, track: (areaById[c.area_id] || {}).track || 'non_surgical' }));
        return { items, concerns };
      });
    return _cat;
  };
  G.detail = (k, s) => (onServer ? getJSON('/api/v3/catalog/' + k + '/' + encodeURIComponent(s), 6000).then((d) => d.row || Promise.reject()) : Promise.reject())
    .catch(() => getJSON(SHARED + 'details.json').then((all) => all[k + '/' + s] || Promise.reject(new Error('not found'))));

  /* tiny markdown */
  G.md = function (src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(\S[^*]*?)\*/g, '<em>$1</em>');
    const isBlock = (l) => /^(#{1,4}\s|\s*\||>|\s*[-*]\s|\s*\d+\.\s)/.test(l);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const lv = Math.min(4, m[1].length + 1); out.push(`<h${lv}>${inline(m[2])}</h${lv}>`); i++; continue; }
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]);
        const body = rows.slice(1).filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map(cells);
        out.push('<div class="md-table"><table>' + (head.filter(Boolean).length > 1 ? '<thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead>' : '') +
          '<tbody>' + body.map((r) => '<tr>' + r.map((c, j) => (j === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('') + '</tr>').join('') + '</tbody></table></div>');
        continue;
      }
      if (/^>/.test(l)) { const q = []; while (i < lines.length && /^>/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue; }
      if (/^\s*[-*]\s+/.test(l)) { const it = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) it.push(lines[i++].replace(/^\s*[-*]\s+/, '')); out.push('<ul>' + it.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>'); continue; }
      const p = [];
      while (i < lines.length && lines[i].trim() && !isBlock(lines[i])) p.push(lines[i++]);
      out.push(`<p>${inline(p.join(' '))}</p>`);
    }
    return out.join('');
  };

  /* Seoul time */
  G.status = function () {
    const hm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const h = parseInt(hm.slice(0, 2), 10);
    const open = h >= C.hoursKST[0] && h < C.hoursKST[1];
    return { open, hm, text: open ? `Online now · ${hm} in Seoul` : `Replies from 9am Seoul time · now ${hm}`, short: open ? 'Online now' : 'Back at 9am Seoul time' };
  };

  /* review bar */
  const PAGES = { d: ['index.html', 'journal.html', 'faq.html'], a: ['index.html'], b: ['index.html', 'faq.html'], c: ['index.html', 'treatments.html', 'treatment.html', 'faq.html'] };
  const NAMES = { d: 'D · B×C 믹스 ★', a: 'A · Text Romie', b: 'B · Scrapbook', c: 'C · Menu' };
  const ROOT = new URL('../', SHARED).href;
  function reviewBar() {
    const file = location.pathname.split('/').pop() || 'index.html';
    const bar = document.createElement('div');
    bar.className = 'rv-bar';
    bar.innerHTML = `<a href="${ROOT}index.html">시안 목록</a>` +
      Object.keys(NAMES).map((k) => { const href = k === site ? location.href : ROOT + k + '/' + (PAGES[k].includes(file) ? file + location.search : 'index.html'); return `<a class="${k === site ? 'on' : ''}" href="${href}">${NAMES[k]}</a>`; }).join('') +
      `<button type="button" class="rv-notes">메모 숨기기</button>`;
    document.body.prepend(bar);
    const btn = bar.querySelector('.rv-notes');
    const apply = (hide) => { document.body.classList.toggle('hide-notes', hide); btn.textContent = hide ? '메모 보기' : '메모 숨기기'; };
    let hide = false;
    try { hide = localStorage.getItem('gus-hide-notes') === '1'; } catch (e) {}
    apply(hide);
    btn.addEventListener('click', () => { hide = !hide; apply(hide); try { localStorage.setItem('gus-hide-notes', hide ? '1' : '0'); } catch (e) {} });
  }
  G.note = (t) => `<span class="note">${esc(t)}</span>`;

  /* header / footer / bottom bar */
  function header() {
    const el = document.querySelector('[data-gus="header"]');
    if (!el) return;
    const nav = cfg.nav || [];
    const links = nav.map(([k, h, t]) => `<a href="${h}"${k === page || (k === 'treatments' && page === 'treatment') ? ' aria-current="page"' : ''}>${t}</a>`).join('');
    el.outerHTML = `<header class="gh"><div class="gh-in">
  <a class="gh-logo" href="index.html">${cfg.logo || 'Glow Up Seoul'}</a>
  <nav class="gh-nav" aria-label="Main">${links}</nav>
  <a class="gh-cta" href="${G.wa('Hi Romie! 👋')}" target="_blank" rel="noopener">${esc(cfg.cta || 'Text Romie')}</a>
</div></header>`;
    const h = document.querySelector('.gh');
    const on = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
  }
  function footer() {
    const el = document.querySelector('[data-gus="footer"]');
    if (!el) return;
    el.outerHTML = `<footer class="gf"><div class="gf-in">
  <div class="gf-big">${cfg.logo || 'Glow Up Seoul'}</div>
  <div class="gf-links">
    <a href="${G.wa()}" target="_blank" rel="noopener">WhatsApp ${esc(C.waDisplay)}</a>
    <a href="https://www.instagram.com/${esc(C.instagram)}/" target="_blank" rel="noopener">Instagram @${esc(C.instagram)}</a>
    <a href="mailto:${esc(C.email)}">${esc(C.email)}</a>
    <span>WeChat ${esc(C.wechat)} ${G.note('ID 확인')}</span>
  </div>
  <p class="gf-legal">Foreign Patient Attraction Agency registered with the Ministry of Health &amp; Welfare, Korea · Reg. no. ${C.regNo ? esc(C.regNo) : G.note('등록번호')} · Business no. ${C.bizNo ? esc(C.bizNo) : G.note('사업자번호')} · ${esc(C.address)}<br>We’re a concierge, not a clinic. Medical decisions are made between you and your doctor. © 2026 Glow Up Seoul</p>
</div></footer>`;
  }
  function bottomBar() {
    if (cfg.noBar) return;
    const bar = document.createElement('div');
    bar.className = 'gbar';
    bar.innerHTML = `<a class="gbar-wa" href="${G.wa('Hi Romie! 👋')}" target="_blank" rel="noopener" data-wa-bar><span class="ico-wa" aria-hidden="true"></span>${esc(cfg.barLabel || 'Text Romie on WhatsApp')}</a>`;
    document.body.appendChild(bar);
    document.body.classList.add('has-gbar');
  }

  /* content blocks */
  const ICO = {
    match: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4M8 11l2 2 4-4"/>',
    with: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 14.3A5 5 0 0 1 21.5 19"/>',
    care: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z"/><path d="M12.3 15l-2.7-2.6a1.8 1.8 0 0 1 2.7-2.3 1.8 1.8 0 0 1 2.7 2.3z"/>',
    free: '<path d="M3 12.2V4h8.2L21 13.8 13.8 21z"/><circle cx="7.6" cy="7.6" r="1.4"/>',
  };
  G.ico = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k] || ''}</svg>`;
  const blocks = {
    service: () => `<ul class="g-svc">${D.service.points.map((p) => `<li><span class="g-svc-i">${G.ico(p.ico)}</span><span class="g-svc-t"><b>${esc(p.t)}</b><small>${esc(p.d)}</small></span></li>`).join('')}</ul>`,
    trust: () => `<p class="g-trust">${esc(D.service.trust)}</p>`,
    status: (el) => { const s = G.status(); return `<span class="g-status${s.open ? ' is-open' : ''}"><i></i>${esc(el.dataset.short ? s.short : s.text)}</span>`; },
    stats: () => `<ul class="g-stats">${D.stats.map((s) => `<li><b>${esc(s.n)}</b><span>${esc(s.l)}</span></li>`).join('')}</ul>`,
    steps: () => `<ol class="g-steps">${D.steps.map((s, i) => `<li><span class="g-step-n">${i + 1}</span><h3>${esc(s.t)}</h3><p>${esc(s.get)}</p><small>${esc(s.time)}</small></li>`).join('')}</ol>`,
    reels: () => `<div class="g-reels">${D.reels.map((r) => `<a class="g-reel" href="${G.reel(r.id)}" target="_blank" rel="noopener"><img src="${ASSETS + r.cover}" alt="" loading="lazy"><span class="g-reel-k">${esc(r.k)}</span><span class="g-reel-t">${esc(r.t)}</span><span class="g-reel-d">▶ ${esc(r.dur)}</span></a>`).join('')}</div>`,
    dms: (el) => { const n = +el.dataset.limit || D.dms.length; return `<div class="g-dms">${D.dms.slice(0, n).map((d) => `<div class="g-dm">${d.m.map(([w, t]) => `<p class="g-bub g-bub--${w}">${esc(t)}</p>`).join('')}<small>${esc(d.when)}</small></div>`).join('')}</div>`; },
    reviews: (el) => { const n = +el.dataset.limit || D.reviews.length; return `<div class="g-reviews">${D.reviews.slice(0, n).map((r) => `<figure class="g-review"><blockquote>${esc(r.q)}</blockquote><figcaption><b>${esc(r.name)}</b> · ${esc(r.meta)}</figcaption></figure>`).join('')}</div>`; },
    photos: (el) => { const ids = (el.dataset.ids || '').split(',').filter(Boolean); const list = ids.length ? ids.map((id) => D.photos.find((p) => p.id === id)).filter(Boolean) : D.photos; return `<div class="g-photos">${list.map((p) => `<figure class="g-photo"><img src="${ASSETS + p.src}" alt="${esc(p.alt)}" loading="lazy" style="object-position:${p.pos || '50% 30%'}"><figcaption>${esc(p.cap)}</figcaption></figure>`).join('')}</div>`; },
    marquee: () => { const items = D.marquee.map((t) => `<span>${esc(t)}</span>`).join(''); return `<div class="g-marquee" aria-label="${esc(D.marquee.join(', '))}"><div class="g-marquee-track" aria-hidden="true">${items}${items}</div></div>`; },
    channels: () => `<ul class="g-channels">
<li><span>WhatsApp</span><a href="${G.wa('Hi Romie! 👋')}" target="_blank" rel="noopener">${esc(C.waDisplay)}</a><button type="button" data-copy="${esc(C.waDisplay)}">Copy</button></li>
<li><span>WeChat</span><b>${esc(C.wechat)}</b><button type="button" data-copy="${esc(C.wechat)}">Copy</button></li>
<li><span>Email</span><a href="mailto:${esc(C.email)}">${esc(C.email)}</a><button type="button" data-copy="${esc(C.email)}">Copy</button></li>
<li><span>Instagram</span><a href="https://www.instagram.com/${esc(C.instagram)}/" target="_blank" rel="noopener">@${esc(C.instagram)}</a><button type="button" data-copy="@${esc(C.instagram)}">Copy</button></li></ul>`,
  };

  /* FAQ (accordion) */
  function faqItem(f) {
    return `<details class="faq-i" id="faq-${f.id}"><summary><span>${esc(f.q)}</span></summary><div class="faq-a"><p>${esc(f.a)}</p>${f.note ? G.note(f.note) : ''}${f.reel ? `<a class="faq-reel" href="${G.reel(f.reel)}" target="_blank" rel="noopener">▶ Watch Romie answer this</a>` : ''}</div></details>`;
  }
  function mountFAQ(el) {
    const ids = (el.dataset.ids || '').split(',').filter(Boolean);
    if (ids.length) { el.innerHTML = `<div class="faq-list">${ids.map((id) => D.faq.find((f) => f.id === id)).filter(Boolean).map(faqItem).join('')}</div>`; return openHash(el); }
    const slug = (c) => c.replace(/\W+/g, '-').toLowerCase();
    el.innerHTML = `<div class="faq-tools"><label class="faq-search"><span class="sr">Search questions</span><input id="faq-q" type="search" placeholder="Search: price, alone, botox…" autocomplete="off"></label>
<div class="faq-cats">${['All', ...D.faqCats].map((c, i) => `<button type="button" data-cat="${i ? slug(c) : ''}" aria-pressed="${!i}">${esc(c)}</button>`).join('')}</div></div>
<div class="faq-list">${D.faq.map((f) => faqItem(f).replace('<details class="faq-i"', `<details class="faq-i" data-c="${slug(f.c)}"`)).join('')}</div>
<p class="faq-none" hidden>No question matches. <a href="${G.wa('Hi Romie, I have a question: ')}" target="_blank" rel="noopener">Ask Romie directly</a>.</p>`;
    let cat = '';
    const input = el.querySelector('#faq-q');
    const run = () => {
      const q = input.value.trim().toLowerCase();
      let n = 0;
      el.querySelectorAll('.faq-i').forEach((d) => { const hit = (!cat || d.dataset.c === cat) && (!q || d.textContent.toLowerCase().includes(q)); d.hidden = !hit; if (hit) n++; });
      el.querySelector('.faq-none').hidden = n > 0;
    };
    input.addEventListener('input', run);
    el.querySelector('.faq-cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; el.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); run(); });
    openHash(el);
  }
  function openHash(el) {
    const id = location.hash.slice(1);
    if (!id) return;
    const d = el.querySelector('#' + CSS.escape(id));
    if (d && d.tagName === 'DETAILS') { d.open = true; setTimeout(() => d.scrollIntoView({ block: 'center' }), 60); }
  }

  /* FAQ as a KakaoTalk-style chat (시안 B·C, A 참고) */
  function mountFAQChat(el) {
    const AV = ASSETS + 'romie-closeup.jpg';
    const st = G.status();
    const ids = (el.dataset.ids || '').split(',').filter(Boolean);
    const order = ids.length ? ids : ['alone', 'trust', 'start', 'know', 'cheap', 'free', 'botoxbooster', 'skinbotox', 'when', 'days', 'wrong', 'area', 'lang', 'prices', 'pay', 'visa', 'tiktok', 'laser', 'copy', 'bumps', 'home', 'what'];
    el.innerHTML = `<div class="fc">
  <div class="fc-top"><img src="${AV}" alt=""><div class="fc-who"><b>Romie</b><span class="g-status${st.open ? ' is-open' : ''}"><i></i>${esc(st.short)}</span></div><a href="${G.wa('Hi Romie! 👋')}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>WhatsApp</a></div>
  <div class="fc-thread" role="log" aria-live="polite"><p class="fc-day">Today</p></div>
  <div class="fc-dock"><div class="fc-chips" aria-label="Questions"></div>
    <form class="fc-comp"><label class="sr" for="fc-in-${el.dataset.k || 'x'}">Your question</label><input id="fc-in-${el.dataset.k || 'x'}" type="text" placeholder="Or type your own question…" autocomplete="off" enterkeyhint="send"><button type="submit" aria-label="Send on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>
  </div>
</div>`;
    const th = el.querySelector('.fc-thread');
    const chips = el.querySelector('.fc-chips');
    let last = null;
    const add = (who, html, cls) => {
      const r = document.createElement('div');
      const first = who !== last; last = who;
      r.className = 'fc-row fc-' + who + (first ? ' first' : '');
      r.innerHTML = (who === 'them' ? `<img class="fc-av" src="${AV}" alt="">` : '') + `<div class="fc-col">${first && who === 'them' ? '<span class="fc-name">Romie</span>' : ''}<div class="fc-b ${cls || ''}">${html}</div></div>`;
      th.appendChild(r);
      return r;
    };
    const down = () => th.scrollTo({ top: th.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const answer = (f) => esc(f.a) + (f.note ? ' ' + G.note(f.note) : '') + (f.reel ? `<a class="fc-reel" href="${G.reel(f.reel)}" target="_blank" rel="noopener">▶ Watch me answer this</a>` : '');
    const asked = new Set();
    // questions stack vertically (no sideways scrolling): 3 suggestions, then "More questions" opens the full list
    let expanded = false;
    const SHOW = 2;
    const render = () => {
      const left = order.filter((id) => !asked.has(id)).map((id) => D.faq.find((f) => f.id === id)).filter(Boolean);
      if (!left.length) { chips.className = 'fc-chips'; chips.innerHTML = `<a class="hot" href="${G.wa('Hi Romie! I have a question: ')}" target="_blank" rel="noopener">Ask Romie on WhatsApp</a>`; return; }
      const list = expanded ? left : left.slice(0, SHOW);
      const more = left.length > SHOW ? `<button type="button" class="fc-more" data-more aria-expanded="${expanded}">${expanded ? 'Show fewer' : `See all ${left.length}`}</button>` : '';
      chips.className = 'fc-chips' + (expanded ? ' is-open' : '');
      chips.innerHTML = `<div class="fc-chips-h"><span>${expanded ? 'All questions' : 'Suggested questions'}</span>${more}</div>` + list.map((f, i) => `<button type="button" data-q="${f.id}"${i === 0 && !expanded ? ' class="hot"' : ''}>${esc(f.q)}</button>`).join('');
      if (expanded) chips.scrollTop = 0;
    };
    add('them', 'Hi! I’m Romie 👋 Ask me anything about coming to Seoul for treatment. Tap a question below.');
    const pre = D.faq.find((f) => f.id === 'what');
    if (pre) { asked.add('what'); add('me', esc(pre.q)); add('them', answer(pre)); }
    render();
    chips.addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) { expanded = !expanded; render(); return; }
      const b = e.target.closest('button[data-q]');
      if (!b) return;
      const f = D.faq.find((x) => x.id === b.dataset.q);
      asked.add(f.id); expanded = false; render();
      add('me', esc(f.q), 'pop');
      const ty = add('them', '<span class="fc-typing"><i></i><i></i><i></i></span>', 'fc-plain');
      down();
      setTimeout(() => { const bb = ty.querySelector('.fc-b'); bb.className = 'fc-b pop'; bb.innerHTML = answer(f); down(); }, 700);
    });
    el.querySelector('.fc-comp').addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = e.currentTarget.querySelector('input');
      const t = inp.value.trim();
      if (!t) { inp.focus(); return; }
      window.open(G.wa('Hi Romie! ' + t), '_blank', 'noopener');
      add('me', esc(t), 'pop');
      add('them', 'WhatsApp just opened with your question. Hit send there and I’ll reply personally 💬', 'pop');
      inp.value = ''; down();
    });
  }

  /* chat / list toggle */
  function wireViews() {
    document.querySelectorAll('[data-views]').forEach((box) => {
      const btns = box.querySelectorAll('[data-view-btn]');
      const set = (v) => { btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === v))); box.querySelectorAll('[data-view]').forEach((p) => (p.hidden = p.dataset.view !== v)); };
      btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.viewBtn)));
      set(/^#faq-/.test(location.hash) ? 'list' : box.dataset.views || 'chat');
    });
  }

  /* catalog (시안 C) */
  G.card = function (it) {
    const note = cleanNote(it.price_note);
    return `<a class="tc" href="${G.detailHref(it)}">
  <span class="tc-img"><img src="${G.thumb(it)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${esc(it.thumbnail_url)}'"></span>
  <span class="tc-body"><span class="tc-name">${esc(it.name)}</span><span class="tc-sum">${esc(it.summary)}</span>
  <span class="tc-tags"><span>${esc(G.L.recovery[it.recovery_level] || '—')}</span><span>lasts ${esc((G.L.duration[it.duration] || '—').toLowerCase())}</span><span>${esc(G.krw(it.price_krw))}${it.price_krw ? '~' : ''}</span></span></span>
</a>`;
  };
  function mountCatalog(el) {
    el.innerHTML = '<p class="g-loading">Loading…</p>';
    G.catalog().then((cat) => {
      if (el.dataset.mode === 'featured') {
        const list = (el.dataset.slugs || '').split(',').map((s) => cat.items.find((i) => i.slug === s.trim())).filter(Boolean);
        el.innerHTML = `<div class="tc-row">${list.map(G.card).join('')}</div>`;
        return;
      }
      const used = new Set(cat.items.flatMap((i) => i.concern_ids || []));
      const st = { track: G.qs('track') || 'all', concern: G.qs('concern') || '' };
      el.innerHTML = `<div class="cat-tabs">${[['all', 'Everything'], ['non_surgical', 'No surgery'], ['surgical', 'Surgery']].map(([k, t]) => `<button type="button" data-track="${k}">${t}</button>`).join('')}</div><div class="cat-chips"></div><div class="tc-grid"></div>`;
      const chips = el.querySelector('.cat-chips');
      const grid = el.querySelector('.tc-grid');
      const render = () => {
        el.querySelectorAll('[data-track]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.track === st.track)));
        const cs = cat.concerns.filter((c) => used.has(c.id) && (st.track === 'all' || c.track === st.track));
        chips.innerHTML = `<button type="button" data-concern="" aria-pressed="${!st.concern}">Any</button>` + cs.map((c) => `<button type="button" data-concern="${esc(c.slug)}" aria-pressed="${st.concern === c.slug}">${esc(c.name)}</button>`).join('');
        const con = cat.concerns.find((c) => c.slug === st.concern);
        const list = cat.items.filter((i) => (st.track === 'all' || (st.track === 'surgical') === (i.kind === 'surgery')) && (!con || (i.concern_ids || []).includes(con.id)));
        grid.innerHTML = list.map(G.card).join('') || `<p class="g-loading">Nothing here yet. <a href="${G.wa('Hi Romie, I am looking for: ')}" target="_blank" rel="noopener">Ask Romie</a>.</p>`;
        const p = new URLSearchParams();
        if (st.track !== 'all') p.set('track', st.track);
        if (st.concern) p.set('concern', st.concern);
        history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
      };
      el.addEventListener('click', (e) => { const t = e.target.closest('[data-track],[data-concern]'); if (!t) return; if (t.dataset.track) { st.track = t.dataset.track; st.concern = ''; } else st.concern = t.dataset.concern; render(); });
      render();
    }).catch(() => { el.innerHTML = '<p class="g-loading">Couldn’t load the menu right now.</p>'; });
  }
  function mountConcerns(el) {
    G.catalog().then((cat) => {
      const used = new Set(cat.items.flatMap((i) => i.concern_ids || []));
      el.innerHTML = `<div class="g-concerns">${cat.concerns.filter((c) => used.has(c.id)).map((c) => `<a href="treatments.html?track=${c.track}&amp;concern=${esc(c.slug)}">${esc(c.name)}</a>`).join('')}</div>`;
    }).catch(() => {});
  }
  function mountDetail(el) {
    const k = G.qs('k') === 'surgeries' ? 'surgeries' : 'treatments';
    const s = G.qs('s') || '';
    el.innerHTML = '<p class="g-loading">Loading…</p>';
    Promise.all([G.detail(k, s), G.catalog()]).then(([row, cat]) => {
      document.title = `${row.name} · Glow Up Seoul`;
      const ask = `Hi Romie! I'm curious about ${row.name}. `;
      const bar = document.querySelector('[data-wa-bar]');
      if (bar) { bar.href = G.wa(ask); bar.lastChild.textContent = `Ask Romie about ${row.name}`; }
      const links = (row.concern_links || []).filter((c) => c.name);
      const ids = links.map((c) => c.concern_id);
      const rel = cat.items.filter((i) => i.slug !== row.slug && (i.concern_ids || []).some((x) => ids.includes(x))).slice(0, 6);
      const note = cleanNote(row.price_note);
      el.innerHTML = `
<a class="td-back" href="treatments.html">← All treatments</a>
<header class="td-head">
  <span class="td-img"><img src="${G.thumb(row)}" alt="" onerror="this.onerror=null;this.src='${esc(row.thumbnail_url)}'"></span>
  <div><p class="td-kind">${k === 'surgeries' ? 'Surgery' : 'No surgery'} · ${(row.tags || []).map(esc).join(' · ')}</p><h1>${esc(row.name)}</h1><p class="td-sum">${esc(row.summary)}</p></div>
</header>
<ul class="td-facts">
  <li><span>Downtime</span><b>${esc(G.L.recovery[row.recovery_level] || '—')}</b></li>
  <li><span>Lasts</span><b>${esc(G.L.duration[row.duration] || '—')}</b></li>
  <li><span>Feels</span><b>${esc(G.L.pain[row.pain_level] || '—')}</b></li>
  <li><span>From</span><b>${esc(G.krw(row.price_krw))}</b><small>${esc([note, G.usd(row.price_krw)].filter(Boolean).join(' · '))}</small></li>
</ul>
<a class="td-ask" href="${G.wa(ask)}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Ask Romie if it’s right for you</a>
${links.length ? `<section class="td-sec"><h2>Good for</h2>${links.map((c) => c.reason ? `<details class="td-why"><summary>${esc(c.name)}</summary><p>${esc(c.reason)}</p></details>` : `<p class="td-why td-why--plain">${esc(c.name)}</p>`).join('')}</section>` : ''}
<section class="td-sec md">${G.md(row.description)}</section>
${(row.benefits || []).length || (row.cautions || []).length ? `<section class="td-sec td-pc">${(row.benefits || []).length ? `<div><h2>Why people love it</h2><ul>${row.benefits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : ''}${(row.cautions || []).length ? `<div><h2>Good to know</h2><ul>${row.cautions.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : ''}</section>` : ''}
${row.recovery_note ? `<p class="td-note"><b>Recovery:</b> ${esc(row.recovery_note)}</p>` : ''}
${row.linked_note ? `<p class="td-note">${esc(row.linked_note)}</p>` : ''}
${rel.length ? `<section class="td-sec"><h2>Also worth a look</h2><div class="tc-row">${rel.map(G.card).join('')}</div></section>` : ''}
<p class="td-fine">Reference price from partner clinics, for planning only. You get a full written quote before anything is booked.</p>`;
    }).catch(() => { el.innerHTML = `<div class="td-missing"><h1>Hmm, can’t find that one.</h1><p><a href="treatments.html">See the whole menu</a></p></div>`; });
  }

  /* message builder (시안 C) */
  function mountContact(el) {
    const d = new Date();
    const months = Array.from({ length: 10 }, (_, i) => new Date(d.getFullYear(), d.getMonth() + i, 1).toLocaleString('en-US', { month: 'long' }));
    el.innerHTML = `<form class="cf" novalidate>
  <label class="cf-l" for="cf-concern">My concern is</label>
  <input id="cf-concern" type="text" placeholder="e.g. pores, acne scars, my nose…" autocomplete="off">
  <p class="cf-l">I’m coming</p>
  <div class="cf-pills" data-k="month">${['Not sure yet', 'Already in Seoul', ...months.slice(0, 6)].map((m, i) => `<button type="button" aria-pressed="${!i}">${m}</button>`).join('')}</div>
  <p class="cf-l">Reply to me on</p>
  <div class="cf-pills" data-k="ch"><button type="button" aria-pressed="true" data-v="wa">WhatsApp</button><button type="button" aria-pressed="false" data-v="wechat">WeChat</button><button type="button" aria-pressed="false" data-v="email">Email</button></div>
  <pre class="cf-pre" id="cf-pre"></pre>
  <a class="cf-send" id="cf-send" href="#" target="_blank" rel="noopener">Send it</a>
  <button type="button" class="cf-copy" id="cf-copy">Copy message</button>
  <p class="cf-hint" id="cf-hint"></p>
</form>`;
    const $ = (id) => el.querySelector('#' + id);
    const val = (k) => { const b = el.querySelector(`[data-k="${k}"] [aria-pressed="true"]`); return b ? b.dataset.v || b.textContent : ''; };
    const text = () => `Hi Romie! 👋\n• Concern: ${$('cf-concern').value.trim() || 'not sure yet'}\n• Coming: ${val('month')}\n(from glowupseoul.com)`;
    const update = () => {
      const t = text(); $('cf-pre').textContent = t;
      const ch = val('ch'); const send = $('cf-send');
      if (ch === 'wa') { send.hidden = false; send.href = G.wa(t); send.textContent = 'Send on WhatsApp'; $('cf-hint').textContent = 'Opens WhatsApp with this ready. Nothing sends until you tap send.'; }
      else if (ch === 'email') { send.hidden = false; send.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('Hi from glowupseoul.com') + '&body=' + encodeURIComponent(t); send.textContent = 'Send by email'; $('cf-hint').textContent = 'Opens your email app. Or copy and send to ' + C.email; }
      else { send.hidden = true; $('cf-hint').textContent = 'Copy this, add WeChat ID “' + C.wechat + '” and paste.'; }
    };
    el.addEventListener('click', (e) => { const b = e.target.closest('.cf-pills button'); if (!b) return; b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); update(); });
    el.addEventListener('input', update);
    $('cf-copy').addEventListener('click', () => copy(text(), $('cf-copy')));
    update();
  }

  function copy(t, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => (btn.textContent = o), 1600); };
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  }
  G.copy = copy;
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy, b); });

  /* boot */
  reviewBar();
  header();
  footer();
  bottomBar();
  document.querySelectorAll('[data-gus]').forEach((el) => {
    const k = el.dataset.gus;
    if (k === 'faq') mountFAQ(el);
    else if (k === 'catalog') mountCatalog(el);
    else if (k === 'detail') mountDetail(el);
    else if (k === 'concerns') mountConcerns(el);
    else if (k === 'contact') mountContact(el);
    else if (k === 'faqchat') mountFAQChat(el);
    else if (blocks[k]) el.innerHTML = blocks[k](el);
  });
  wireViews();
  /* hide the floating WhatsApp bar while a chat widget is on screen (it has its own composer) */
  const gbar = document.querySelector('.gbar');
  if (gbar && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); gbar.classList.toggle('is-hidden', seen.size > 0); }, { rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fc-dock').forEach((d) => io.observe(d));
  }
  document.querySelectorAll('[data-wa]').forEach((a) => { a.href = G.wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('[data-src]').forEach((im) => { im.src = ASSETS + im.dataset.src; });
})();
