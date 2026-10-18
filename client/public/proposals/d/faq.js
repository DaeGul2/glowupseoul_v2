/* 시안 D FAQ 세 가지 방식 (10/18). 데이터는 d/faq-data.js (window.GUS.dfaq).
   [data-d="compose"]  1. WhatsApp 으로 바로: 인사말 + 질문(또는 여행·예약 틀)을 채운 채 WhatsApp 을 연다.
   [data-d="chat"]     2. 채팅: 질문을 누르거나 직접 치면 바로 답. 맞는 답이 없으면 그 문장 그대로 WhatsApp 으로 넘긴다.
   [data-d="faqlist"]  3. 눌러서 보기: 정적 HTML 목록(build_d.py 가 생성)에 검색·분류 필터만 더한다.
   [data-modes]        FAQ 페이지 위쪽 세 갈래 전환 (#message · #chat · #faq-<id> 로 바로 열림). */
(function () {
  const G = window.GUS || {};
  const F = G.dfaq;
  if (!F || !G.wa) return;
  const esc = G.esc || ((s) => String(s == null ? '' : s));
  const AV = new URL('../assets/romie-closeup.jpg', document.querySelector('script[src*="faq.js"]').src).href;
  const byId = Object.fromEntries(F.items.map((f) => [f.id, f]));
  const askText = (f) => (f.tpl && F.tpl[f.tpl] ? F.tpl[f.tpl].text : `Hi Romie! 👋 A question from your FAQ: “${f.q}”\n`);
  const waIcon = '<span class="ico-wa" aria-hidden="true"></span>';
  const statusHtml = () => { const s = G.status(); return `<span class="g-status${s.open ? ' is-open' : ''}"><i></i>${esc(s.short)}</span>`; };

  /* ---------------- matching typed questions to answers ---------------- */
  const STOP = new Set('a an the i im i’m i\'m me my is are am do does did can could would will should to of in on for at it its this that what how when where which who you your yours we our with about and or be have has get got there here any some much many just really please hi hello hey romie'.split(' '));
  const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9가-힣一-龥+\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const KEYS = F.items.map((f) => ({ f, k: String(f.k || '').split('|').map(norm).filter(Boolean), q: norm(f.q).split(' ').filter((w) => w.length > 2 && !STOP.has(w)) }));
  function match(text) {
    const t = ' ' + norm(text) + ' ';
    const words = new Set(t.trim().split(' '));
    let best = null; let score = 0;
    KEYS.forEach(({ f, k, q }) => {
      let s = 0;
      k.forEach((p) => { if (p.includes(' ') ? t.includes(' ' + p + ' ') : words.has(p) || (p.length > 4 && t.includes(' ' + p))) s += p.includes(' ') ? 3 : 2; });
      q.forEach((w) => { if (words.has(w)) s += 1; });
      if (s > score) { score = s; best = f; }
    });
    return score >= 2 ? best : null;
  }

  /* ---------------- 1. WhatsApp composer ---------------- */
  const composers = [];
  function mountCompose(el) {
    const keys = ['plan', 'price', 'book', 'after'];
    el.innerHTML = `<div class="wc">
  <div class="wc-top"><img src="${AV}" alt=""><div><b>Message Romie</b>${statusHtml()}</div></div>
  <p class="wc-lead">Type your question, or start from a template. WhatsApp opens with it ready to send.</p>
  <div class="wc-chips" role="group" aria-label="Start from a template">${keys.map((k) => `<button type="button" data-tpl="${k}" aria-pressed="false">${esc(F.tpl[k].label)}</button>`).join('')}</div>
  <label class="sr" for="wc-${composers.length}">Your message to Romie</label>
  <textarea class="wc-txt" id="wc-${composers.length}" rows="5" data-lenis-prevent></textarea>
  <div class="wc-act"><a class="btn wc-send" href="#" target="_blank" rel="noopener">${waIcon}Send on WhatsApp</a><button type="button" class="wc-copy">Copy for WeChat</button></div>
  <p class="wc-note">Romie usually replies within an hour, 9am–11pm Seoul time. Nothing sends until you tap send in WhatsApp.</p>
</div>`;
    const ta = el.querySelector('.wc-txt');
    const send = el.querySelector('.wc-send');
    const chips = el.querySelectorAll('[data-tpl]');
    const sync = () => { send.href = G.wa(ta.value.trim() || 'Hi Romie! 👋'); };
    const set = (text, key) => {
      ta.value = text;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.tpl === key)));
      sync();
    };
    // put the cursor on the first empty line ("Dates in Seoul: ") so people can type straight away (not on phones: no surprise keyboard)
    const focus = () => {
      if (!matchMedia('(min-width: 760px)').matches) return;
      const at = ta.value.search(/: \n|: $/);
      const pos = at >= 0 ? at + 2 : ta.value.length;
      try { ta.focus({ preventScroll: true }); ta.setSelectionRange(pos, pos); } catch (e) { /* noop */ }
    };
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-tpl]');
      if (c) { const on = c.getAttribute('aria-pressed') === 'true'; set(on ? F.tpl.hello.text : F.tpl[c.dataset.tpl].text, on ? '' : c.dataset.tpl); focus(); }
    });
    ta.addEventListener('input', () => { chips.forEach((c) => c.setAttribute('aria-pressed', 'false')); sync(); });
    el.querySelector('.wc-copy').addEventListener('click', (e) => { if (G.copy) G.copy(ta.value.trim() + '\n(WeChat ID: glowupseoul)', e.currentTarget); });
    set(F.tpl.hello.text, '');
    const api = { set: (text, key) => { set(text, key); setTimeout(focus, 80); }, el };
    composers.push(api);
    return api;
  }
  // openers can preset the composer: data-open="m-wa" data-tpl="plan" | data-ask="<faq id>"
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open="m-wa"],[data-mode="wa"]');
    if (!o) return;
    const box = o.dataset.open ? document.getElementById('m-wa') : document.querySelector('[data-mode-panel="wa"]');
    const c = box && composers.find((x) => box.contains(x.el));
    if (!c) return;
    if (o.dataset.ask && byId[o.dataset.ask]) c.set(askText(byId[o.dataset.ask]), byId[o.dataset.ask].tpl || '');
    else if (o.dataset.tpl && F.tpl[o.dataset.tpl]) c.set(F.tpl[o.dataset.tpl].text, o.dataset.tpl);
    else if (o.dataset.open) c.set(F.tpl.hello.text, '');
  }, true);

  /* ---------------- 2. chat ---------------- */
  function answerHtml(f) {
    const steps = f.steps ? `<ol class="fc-steps">${f.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    const reel = f.reel ? `<a class="fc-reel" href="${G.reel(f.reel)}" target="_blank" rel="noopener">▶ Watch me answer this</a>` : '';
    return `${esc(f.a)}${steps}<span class="fc-links">${reel}<a class="fc-ask" href="${G.wa(askText(f))}" target="_blank" rel="noopener">Ask me about this ↗</a></span>`;
  }
  function mountChat(el) {
    const order = F.items.filter((f) => f.top).concat(F.items.filter((f) => !f.top));
    const n = document.querySelectorAll('[data-d="chat"]').length + Math.random().toString(36).slice(2, 6);
    el.innerHTML = `<div class="fc">
  <div class="fc-top"><img src="${AV}" alt=""><div class="fc-who"><b>Romie</b>${statusHtml()}</div><a href="${G.wa('Hi Romie! 👋')}" target="_blank" rel="noopener">${waIcon}WhatsApp</a></div>
  <div class="fc-thread" role="log" aria-live="polite" data-lenis-prevent><p class="fc-day">Today</p></div>
  <div class="fc-dock"><div class="fc-chips" aria-label="Questions" data-lenis-prevent></div>
    <form class="fc-comp"><label class="sr" for="fc-in-${n}">Type your question</label><input id="fc-in-${n}" type="text" placeholder="Type your question…" autocomplete="off" enterkeyhint="send"><button type="submit" aria-label="Ask"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>
  </div>
</div>`;
    const th = el.querySelector('.fc-thread');
    const chips = el.querySelector('.fc-chips');
    let last = null; let expanded = false;
    const asked = new Set();
    const add = (who, html, cls) => {
      const r = document.createElement('div');
      const first = who !== last; last = who;
      r.className = 'fc-row fc-' + who + (first ? ' first' : '');
      r.innerHTML = (who === 'them' ? `<img class="fc-av" src="${AV}" alt="">` : '') + `<div class="fc-col">${first && who === 'them' ? '<span class="fc-name">Romie</span>' : ''}<div class="fc-b ${cls || ''}">${html}</div></div>`;
      th.appendChild(r);
      return r;
    };
    const down = () => th.scrollTo({ top: th.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const reply = (html, delay) => {
      const ty = add('them', '<span class="fc-typing"><i></i><i></i><i></i></span>', 'fc-plain');
      down();
      setTimeout(() => { const b = ty.querySelector('.fc-b'); b.className = 'fc-b pop'; b.innerHTML = html; down(); }, delay || 650);
    };
    const render = () => {
      const left = order.filter((f) => !asked.has(f.id));
      if (!expanded) {
        const list = left.slice(0, 3);
        chips.className = 'fc-chips';
        chips.innerHTML = `<div class="fc-chips-h"><span>Most asked</span><button type="button" class="fc-more" data-more aria-expanded="false">See all ${left.length}</button></div>`
          + list.map((f, i) => `<button type="button" data-q="${f.id}"${i === 0 ? ' class="hot"' : ''}>${esc(f.q)}</button>`).join('');
        return;
      }
      chips.className = 'fc-chips is-open';
      chips.innerHTML = `<div class="fc-chips-h"><span>All questions</span><button type="button" class="fc-more" data-more aria-expanded="true">Show fewer</button></div>`
        + F.cats.map(([c, label]) => {
          const qs = left.filter((f) => f.c === c);
          return qs.length ? `<p class="fc-cat">${esc(label)}</p>` + qs.map((f) => `<button type="button" data-q="${f.id}">${esc(f.q)}</button>`).join('') : '';
        }).join('');
      chips.scrollTop = 0;
    };
    add('them', 'Hi! I’m Romie 👋 Tap a question, or type your own. If I don’t have the answer here, I’ll reply on WhatsApp.');
    render();
    chips.addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) { expanded = !expanded; render(); return; }
      const b = e.target.closest('button[data-q]');
      if (!b) return;
      const f = byId[b.dataset.q];
      asked.add(f.id); expanded = false; render();
      add('me', esc(f.q), 'pop');
      reply(answerHtml(f));
    });
    el.querySelector('.fc-comp').addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = e.currentTarget.querySelector('input');
      const t = inp.value.trim();
      if (!t) { inp.focus(); return; }
      inp.value = '';
      add('me', esc(t), 'pop');
      const f = match(t);
      if (f) { asked.add(f.id); render(); reply(`<span class="fc-about">${esc(f.q)}</span>${answerHtml(f)}`); return; }
      reply(`Good question. Let me answer that one myself 😊<a class="btn fc-wa" href="${G.wa('Hi Romie! 👋 ' + t)}" target="_blank" rel="noopener">${waIcon}Send it to me on WhatsApp</a>`);
    });
    return { reset: () => {} };
  }

  /* ---------------- 3. browse list (static HTML + filters) ---------------- */
  function mountList(el) {
    const input = el.querySelector('.fl-search input');
    const cats = el.querySelector('.fl-cats');
    const none = el.querySelector('.fl-none');
    const items = [...el.querySelectorAll('.faq-i')];
    const secs = [...el.querySelectorAll('.fl-sec')];
    const count = el.querySelector('.fl-count');
    let cat = 'all';
    const hay = new Map(items.map((i) => [i, norm(i.textContent + ' ' + (i.dataset.k || ''))]));
    const apply = () => {
      const q = norm(input ? input.value : '');
      const words = q.split(' ').filter(Boolean);
      let shown = 0;
      items.forEach((i) => {
        const okCat = cat === 'all' || (cat === 'top' ? i.dataset.top === '1' : i.dataset.c === cat);
        const okQ = !words.length || words.every((w) => hay.get(i).includes(w));
        i.hidden = !(okCat && okQ);
        if (!i.hidden) shown++;
      });
      secs.forEach((s) => { s.hidden = !s.querySelector('.faq-i:not([hidden])'); });
      if (none) none.hidden = shown > 0;
      if (count) count.textContent = words.length || cat !== 'all' ? `${shown} of ${items.length}` : `${items.length} questions`;
      if (words.length && shown === 1) { const only = items.find((i) => !i.hidden); if (only) only.open = true; }
    };
    if (input) input.addEventListener('input', apply);
    if (cats) cats.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]'); if (!b) return;
      cat = b.dataset.c;
      cats.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    });
    if (none) {
      const a = none.querySelector('a');
      if (a && input) input.addEventListener('input', () => { a.href = G.wa('Hi Romie! 👋 ' + input.value.trim()); });
    }
    apply();
  }

  /* ---------------- FAQ page: three ways in ---------------- */
  function mountModes(box) {
    const tabs = [...box.querySelectorAll('[data-mode]')];
    const set = (m, focus) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === m)));
      box.querySelectorAll('[data-mode-panel]').forEach((p) => { p.hidden = p.dataset.modePanel !== m; });
      if (focus) { const p = box.querySelector(`[data-mode-panel="${m}"]`); const t = p && p.querySelector('textarea,.fc-comp input,.fl-search input'); if (t && matchMedia('(min-width: 760px)').matches) t.focus({ preventScroll: true }); }
    };
    tabs.forEach((t) => t.addEventListener('click', () => { set(t.dataset.mode, true); history.replaceState(null, '', t.dataset.mode === 'list' ? location.pathname : '#' + (t.dataset.mode === 'wa' ? 'message' : 'chat')); }));
    const h = location.hash;
    if (h === '#message') set('wa'); else if (h === '#chat' || h === '#ask') set('chat'); else set(box.dataset.modes || 'list');
    if (/^#faq-/.test(h)) { const it = document.getElementById(h.slice(1)); if (it) { it.open = true; setTimeout(() => it.scrollIntoView({ block: 'center' }), 80); } }
    box._set = set;
  }

  document.querySelectorAll('[data-d="compose"]').forEach(mountCompose);
  document.querySelectorAll('[data-d="chat"]').forEach(mountChat);
  document.querySelectorAll('[data-d="faqlist"]').forEach(mountList);
  document.querySelectorAll('[data-modes]').forEach(mountModes);
  G.dfaqMatch = match;
})();
