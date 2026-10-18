# -*- coding: utf-8 -*-
"""시안 D (B×C 믹스 + Journal 블로그) 정적 페이지 생성기.

    python scripts/proposals/build_d.py

출력: client/public/proposals/d/{index,journal,faq}.html + d/journal/<slug>.html
모든 글·FAQ 는 정적 HTML 로 박힌다 (AI 크롤러는 JS 를 실행하지 않음).
입력: proposals/shared/data.js (문구·FAQ·사진·DM), shared/details.json (운영 DB 시술 설명 스냅샷)
"""
import html, json, math, os, re, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = os.path.join(ROOT, 'client', 'public', 'proposals')
OUT = os.path.join(P, 'd')
LIVE = 'https://glowupseoul.onrender.com/proposals/d/'
V = '40'
DATE = '2026-10-17'
DATE_H = '17 Oct 2026'
GOOGLE_REVIEWS = 'https://www.google.com/maps/place/glowup+seoul/data=!4m6!3m5!1s0x357ca395b5f2fda7:0x348e4305c8a65ae3!9m1!1b1!16s%2Fg%2F11xtyd24zx'

js = subprocess.run(['node', '-e', "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.GUS.data))",
                     os.path.join(P, 'shared', 'data.js')], capture_output=True, text=True, encoding='utf-8', check=True).stdout
D = json.loads(js)
DET = json.load(open(os.path.join(P, 'shared', 'details.json'), encoding='utf-8'))
C = D['contact']
FAQ = {f['id']: f for f in D['faq']}
WA = 'https://wa.me/' + C['wa']
e = lambda s: html.escape(str(s or ''), quote=True)
reel = lambda rid: f'https://www.instagram.com/glowupseoul/reel/{rid}/'

DUR = {'temporary': 'short-term', 'months_3_6': 'about 3–6 months', 'months_6_12': 'about 6–12 months', 'year_1_2': 'about 1–2 years',
       'years_2_plus': '2 years or more', 'semi_permanent': 'semi-permanent', 'permanent': 'permanent'}
DUR_T = {'temporary': 'Short-term', 'months_3_6': '3–6 months', 'months_6_12': '6–12 months', 'year_1_2': '1–2 years',
         'years_2_plus': '2+ years', 'semi_permanent': 'Semi-permanent', 'permanent': 'Permanent'}
PAIN = {'soft': 'Gentle', 'mild': 'Mild', 'hard': 'Strong'}
REC = {'immediate': 'No downtime', '1_2_days': '1–2 days', '1_week_plus': '1 week+'}

ICO = {
    'match': '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4M8 11l2 2 4-4"/>',
    'with': '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 14.3A5 5 0 0 1 21.5 19"/>',
    'care': '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z"/><path d="M12.3 15l-2.7-2.6a1.8 1.8 0 0 1 2.7-2.3 1.8 1.8 0 0 1 2.7 2.3z"/>',
    'free': '<path d="M3 12.2V4h8.2L21 13.8 13.8 21z"/><circle cx="7.6" cy="7.6" r="1.4"/>',
}
ico = lambda k: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICO[k]}</svg>'


def note(t):
    return ''   # 10/17: review notes removed from D (it reads as one real site now)


# ---------------- markdown (DB descriptions) ----------------
def inline(s):
    s = e(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    return re.sub(r'\*(\S[^*]*?)\*', r'<em>\1</em>', s)


def md(src):
    lines = str(src or '').replace('\r', '').split('\n')
    out, i, table_rows = [], 0, {}
    blk = re.compile(r'^(#{1,4}\s|\s*\||>|\s*[-*]\s|\s*\d+\.\s)')
    while i < len(lines):
        l = lines[i]
        if not l.strip():
            i += 1; continue
        m = re.match(r'^(#{1,4})\s+(.*)', l)
        if m:
            lv = min(3, len(m.group(1)))
            out.append(f'<h{lv}>{inline(m.group(2))}</h{lv}>'); i += 1; continue
        if re.match(r'^\s*\|', l):
            rows = []
            while i < len(lines) and re.match(r'^\s*\|', lines[i]):
                rows.append(lines[i]); i += 1
            cells = lambda r: [c.strip() for c in r.strip().strip('|').split('|')]
            head = cells(rows[0])
            body = [cells(r) for r in rows[1:] if not re.match(r'^\s*\|?\s*:?-{2,}', r)]
            h = '<div class="md-table"><table>'
            if len([c for c in head if c]) > 1:
                h += '<thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead>'
            elif head[0]:
                h += f'<caption class="sr">{inline(head[0])}</caption>'
            h += '<tbody>' + ''.join('<tr>' + ''.join((f'<th scope="row">{inline(c)}</th>' if j == 0 else f'<td>{inline(c)}</td>') for j, c in enumerate(r)) + '</tr>' for r in body) + '</tbody></table></div>'
            for r in body:
                if len(r) >= 2:
                    table_rows[r[0].lower()] = r[1]
            out.append(h); continue
        if l.startswith('>'):
            q = []
            while i < len(lines) and lines[i].startswith('>'):
                q.append(re.sub(r'^>\s?', '', lines[i])); i += 1
            out.append(f'<blockquote>{inline(" ".join(q))}</blockquote>'); continue
        if re.match(r'^\s*[-*]\s+', l):
            it = []
            while i < len(lines) and re.match(r'^\s*[-*]\s+', lines[i]):
                it.append(re.sub(r'^\s*[-*]\s+', '', lines[i])); i += 1
            out.append('<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in it) + '</ul>'); continue
        p = []
        while i < len(lines) and lines[i].strip() and not blk.match(lines[i]):
            p.append(lines[i]); i += 1
        out.append(f'<p>{inline(" ".join(p))}</p>')
    return ''.join(out), table_rows


def words(s):
    return len(re.sub(r'<[^>]+>', ' ', s).split())


# ---------------- page shell ----------------
NAV = [('home', 'index.html', 'Home'), ('journal', 'journal/index.html', 'Journal'), ('faq', 'faq.html', 'FAQ')]
# 10/18 회의: 파스텔·둥근 Gabarito 톤 → 운영 사이트(onrender)와 같은 Geist + Geist Mono, 웜 화이트·잉크·서울 블루.
FONTS = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap'
LENIS = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js'
# 로고: 빨간 점 없앰. "Glow Up · Seoul" — Glow Up 과 Seoul 사이에 작은 점.
LOGO = 'Glow Up<i aria-hidden="true"></i>Seoul'


def header(page, pre):
    cur = ' aria-current="page"'
    links = ''.join(f'<a href="{pre}{h}"{cur if k == page else ""}>{t}</a>' for k, h, t in NAV)
    return f'''<header class="gh"><div class="gh-in">
  <a class="gh-logo" href="{pre}index.html" aria-label="Glow Up Seoul home">{LOGO}</a>
  <nav class="gh-nav" aria-label="Main">{links}</nav>
  <a class="gh-cta" href="{WA}?text={e("Hi Romie! 👋")}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span><span>Message Romie</span></a>
</div></header>'''


def footer(pre):
    nav = ''.join(f'<a href="{pre}{h}">{t}</a>' for _, h, t in NAV)
    return f'''<footer class="gf"><div class="gf-in">
  <div class="gf-top">
    <div class="gf-big">{LOGO}</div>
    <p class="gf-line">A personal concierge for skin &amp; plastic surgery clinics in Seoul.</p>
  </div>
  <div class="gf-cols">
    <div><span class="gf-h">Site</span>{nav}</div>
    <div><span class="gf-h">Contact</span>
      <a href="{WA}" target="_blank" rel="noopener">WhatsApp {e(C["waDisplay"])}</a>
      <a href="mailto:{e(C["email"])}">{e(C["email"])}</a>
      <span>WeChat {e(C["wechat"])}</span>
    </div>
    <div><span class="gf-h">Follow</span>
      <a href="https://www.instagram.com/{e(C["instagram"])}/" target="_blank" rel="noopener">Instagram @{e(C["instagram"])}</a>
      <a href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Google reviews</a>
    </div>
  </div>
  <p class="gf-legal">Glow Up Seoul · Foreign Patient Attraction Agency registered with the Ministry of Health &amp; Welfare, Korea · {e(C["address"])}<br>We’re a concierge, not a clinic. Medical decisions are made between you and your doctor. © 2026 Glow Up Seoul</p>
</div></footer>'''


def sheet(mid, title, inner, sub=''):
    """modal: bottom sheet on phones, centered dialog on desktop (native <dialog>)"""
    sb = f'<p class="sheet-sub">{sub}</p>' if sub else ''
    return f'''<dialog class="sheet" id="{mid}" aria-labelledby="{mid}-t"><div class="sheet-in">
  <header class="sheet-h"><div><h2 id="{mid}-t">{title}</h2>{sb}</div><button type="button" class="sheet-x" data-close aria-label="Close">×</button></header>
  <div class="sheet-b" data-lenis-prevent>{inner}</div>
</div></dialog>'''


def chat_sheet(pre, ids=''):
    ci = f' data-ids="{ids}"' if ids else ''
    sub = f'<span data-gus="status"></span> · <a href="{WA}?text={e("Hi Romie! 👋")}" target="_blank" rel="noopener">WhatsApp</a>'
    return sheet('m-chat', 'Ask Romie', f'<div data-gus="faqchat"{ci}></div><p class="sheet-more"><a href="{pre}faq.html">See all 22 questions as a list →</a></p>', sub)


def fab(pre):
    return f'''<div class="fab-wrap">
  <a class="fab-wa" href="{WA}?text={e("Hi Romie! 👋")}" target="_blank" rel="noopener" aria-label="Message Romie on WhatsApp"><span class="ico-wa" aria-hidden="true"></span></a>
  <button type="button" class="fab" data-open="m-chat" aria-haspopup="dialog"><img src="{pre}../assets/romie-closeup.jpg" alt=""><span>Ask Romie</span></button>
</div>'''


def shell(page, title, desc, body, pre='', ld=None, modals='', chat_ids='', css='', tail='', raw=False):
    """raw=True: title/desc/ld 를 그대로 넣는다 (서버가 채우는 %%GUS_…%% 자리표시용 템플릿)."""
    sh = pre + '../shared/'
    title = title.replace(' (시안 D)', '')
    xcss = f'<link rel="stylesheet" href="{css}?v={V}">' if css else ''
    t, d = (title, desc) if raw else (e(title), e(desc))
    ldt = ld if raw else (json.dumps(ld, ensure_ascii=False) if ld else '')
    ldj = f'<script type="application/ld+json">{ldt}</script>' if ldt else ''
    return f'''<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#FAFAF8">
<title>{t}</title>
<meta name="description" content="{d}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{sh}base.css?v={V}">
<link rel="stylesheet" href="{pre}style.css?v={V}">
{xcss}
<script>document.documentElement.className='js';setTimeout(function(){{if(!window.GUS_D)document.documentElement.classList.add('rv-off')}},2500)</script>
{ldj}
</head>
<body data-site="d" data-page="{page}">
<div class="prog" aria-hidden="true"></div>
{header(page, pre)}
<main id="main">
{body}
</main>
{footer(pre)}
{fab(pre)}
{chat_sheet(pre, chat_ids) if page != 'faq' else ''}
{modals}
<script src="{sh}data.js?v={V}"></script>
<script>window.GUS.site={{noBar:true,noReview:true}};</script>
<script src="{sh}app.js?v={V}"></script>
<script src="{LENIS}" defer></script>
<script src="{pre}d.js?v={V}" defer></script>
{tail}
</body>
</html>
'''


# ---------------- shared bits ----------------
def faq_item(f, idp='faq-'):
    rl = f'<a class="faq-reel" href="{reel(f["reel"])}" target="_blank" rel="noopener">▶ Watch Romie answer this</a>' if f.get('reel') else ''
    nt = note(f['note']) if f.get('note') else ''
    return f'<details class="faq-i" id="{idp}{f["id"]}"><summary><span>{e(f["q"])}</span></summary><div class="faq-a"><p>{e(f["a"])}</p>{nt}{rl}</div></details>'


def faq_ld(pairs):
    return {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in pairs]}


def svc():
    return '<ul class="g-svc">' + ''.join(f'<li><span class="g-svc-i">{ico(p["ico"])}</span><span class="g-svc-t"><b>{e(p["t"])}</b><small>{e(p["d"])}</small></span></li>' for p in D['service']['points']) + '</ul>'


def ask_block(title, lead):
    return f'''<section class="w sec"><div class="ask" data-r>
  <div><span class="k">Takes 10 seconds</span><h2 class="split">{title}</h2><p class="lead">{lead}</p></div>
  <div data-gus="contact"></div>
</div></section>'''


# ---------------- articles ----------------
CATS = ['Guides', 'Lifting', 'Skin boosters', 'Lasers', 'Injectables', 'Facials & wellness']
DEVICE_CAT = {'ulthera': 'Lifting', 'thermage': 'Lifting', 'shurink': 'Lifting', 'inmode': 'Lifting', 'thread_lift': 'Lifting',
              'rejuran': 'Skin boosters', 'juvelook': 'Skin boosters', 'pico_laser': 'Lasers', 'co2_laser': 'Lasers',
              'botox': 'Injectables', 'filler': 'Injectables', 'tear_trough': 'Injectables', 'aqua_peel': 'Facials & wellness', 'iv_glow': 'Facials & wellness'}
TAKE = {
    'rejuran': ('romie', 'Personally, Rejuran. It gives that Korean glass skin and I really like the results.', 'DbA-y2eh02k', 'Romie, This or That'),
    'juvelook': ('romie', 'For first-timers I’d say try skin boosters. They work on almost every skin type and you can see the results after two to three weeks.', 'DcIzInAh49R', 'Romie, Q&A'),
    'botox': ('romie', 'Lots of people outside Korea know Botox only for wrinkles. Here, skin Botox is also used to refine pores and get that glass-skin look.', 'DbvLWIuh8kj', 'Romie, Q&A'),
    'pico_laser': ('romie', 'Lasers target more specific problems than skin boosters. Choose them after a consultation with a doctor.', 'DbA-y2eh02k', 'Romie, This or That'),
    'co2_laser': ('romie', 'Lasers target more specific problems than skin boosters. Choose them after a consultation with a doctor.', 'DbA-y2eh02k', 'Romie, This or That'),
    'ulthera': ('local', 'A woman in her 40s we met in Gangnam told us Ulthera is the most popular treatment among her friends.', 'DacMHY4hqbU', 'Seoul Skin Talk, episode 1'),
}
GUIDE_IMG = {'seoul-skin-treatment-guide': 'clinic-lobby.jpg', 'first-time-in-korea': 'romie-closeup.jpg', 'trustworthy-clinic': 'romie-profile.jpg', 'this-or-that': 'romie-red.jpg',
             'cheapest-clinic': 'romie-desk.jpg', 'what-koreans-get-done': 'street-ep1.jpg'}
ARTICLES = []   # dicts: slug, title, cat, excerpt, img, mins, body, faq pairs, related


def take_html(slug):
    if slug not in TAKE:
        return ''
    kind, q, rid, src = TAKE[slug]
    img = '../../assets/romie-closeup.jpg' if kind == 'romie' else '../../assets/street-ep1.jpg'
    lab = 'Romie’s take' if kind == 'romie' else 'What locals say'
    text = f'“{e(q)}”' if kind == 'romie' else e(q)
    return f'<aside class="ar-take{" local" if kind == "local" else ""}"><img src="{img}" alt=""><div><p>{text}</p><small>{lab} · <a href="{reel(rid)}" target="_blank" rel="noopener">{e(src)} on Instagram</a></small></div></aside>'


def dev_row(sl):
    return DET[f'treatments/{sl}']


def price_of(r):
    return f'₩{r["price_krw"]:,}' if r.get('price_krw') else 'Ask us'


def compare_table(rows, link_pre=''):
    head = '<thead><tr><th>Treatment</th><th>Often chosen for</th><th>Downtime</th><th>Lasts</th><th>From</th></tr></thead>'
    body = ''.join(f'<tr><th scope="row"><a href="{link_pre}{r["slug"]}.html">{e(r["name"])}</a></th><td data-l="Often chosen for">{e(", ".join(c["name"] for c in (r.get("concern_links") or []) if c.get("name")))}</td>'
                   f'<td data-l="Downtime">{e(REC[r["recovery_level"]])}</td><td data-l="Lasts">{e(DUR_T[r["duration"]])}</td><td data-l="From">{e(price_of(r))}</td></tr>' for r in rows)
    return f'<div class="md-table cmp"><table>{head}<tbody>{body}</tbody></table></div>'


CONSULT_QS = ['Is this the right treatment for my concern, or would you suggest something else?', 'How many sessions would you suggest for me, and how far apart?',
              'What does the price include, and could anything be added on the day?', 'What should I avoid afterwards, and for how long?',
              'What kind of result is realistic for me, and when might I notice it?']
LASERS = {'pico_laser', 'co2_laser'}
SOURCES = f'<p class="ar-src"><b>Sources</b> Partner clinic information, Romie’s Q&amp;A videos on Instagram and our experience coordinating treatments in Seoul. Last reviewed {DATE_H}.</p>'

for slug, cat in DEVICE_CAT.items():
    row = DET[f'treatments/{slug}']
    name = row['name']
    body_md, table = md(row['description'])
    price = row.get('price_krw')
    pnote = (row.get('price_note') or '').replace('(reference)', '').strip()
    usd = f'≈ ${round(price / 1380 / 10) * 10:,}' if price else ''
    rec, dur, pain = row['recovery_level'], row['duration'], row['pain_level']
    links = [c for c in (row.get('concern_links') or []) if c.get('name')]
    concerns = ', '.join(c['name'].lower() for c in links)
    price_txt = f'₩{price:,}' if price else 'on consultation'
    quick = f'{row["summary"]} {"No downtime" if rec == "immediate" else "Downtime is " + REC[rec].lower()}, results usually last {DUR[dur]}, and reference prices in Seoul start from {price_txt}' + (f' ({pnote})' if pnote else '') + '.'
    sensation = table.get('sensation')
    faq = [
        (f'What is {name}?', row['summary']),
        (f'How long does {name} last?', f'Results usually last {DUR[dur]}, though it can vary from person to person.' + (' ' + row['cautions'][0] if row.get('cautions') and dur in ('months_3_6', 'temporary') else '')),
        (f'Is there downtime after {name}?', row.get('recovery_note') or REC[rec]),
        (f'Does {name} hurt?', f'Many people describe it as {PAIN[pain].lower()}, but everyone feels it a little differently.' + (f' What it feels like: {sensation}.' if sensation else '')),
        (f'How much does {name} cost in Seoul?', f'Reference prices at our partner clinics start from {price_txt}' + (f' ({pnote}, {usd})' if pnote and usd else (f' ({usd})' if usd else '')) + '. You’d get a full written quote before anything is booked.'),
    ]
    if concerns:
        faq.append((f'Who might {name} suit?', f'It’s often considered by people who’d like to improve {concerns}. Your doctor can tell you at the consultation whether it suits you.'))
    why = ''.join((f'<details class="ar-why"><summary>{e(c["name"])}</summary><p>{e(c["reason"])}</p></details>' if c.get('reason') else f'<p class="ar-why" style="padding:15px 18px;font-weight:700">{e(c["name"])}</p>') for c in links)
    pc = ''
    if row.get('benefits') or row.get('cautions'):
        pc = '<div class="ar-pc">' + (f'<div><h3>Why people love it</h3><ul>{"".join(f"<li>{e(b)}</li>" for b in row["benefits"])}</ul></div>' if row.get('benefits') else '') + \
             (f'<div><h3>Good to know</h3><ul>{"".join(f"<li>{e(b)}</li>" for b in row["cautions"])}</ul></div>' if row.get('cautions') else '') + '</div>'
    peers = [dev_row(x) for x, c in DEVICE_CAT.items() if c == cat and x != slug]
    if len(peers) < 2:
        mine = {c['concern_id'] for c in links}
        peers += [dev_row(x) for x in DEVICE_CAT if x != slug and dev_row(x) not in peers and mine & {c['concern_id'] for c in (dev_row(x).get('concern_links') or [])}][:3 - len(peers)]
    compare = f'<h2>How {e(name)} compares</h2><p>Similar options people often ask about. Your doctor can help you choose between them.</p>' + compare_table([row] + peers) if peers else ''
    prep = ['Send Romie a clear photo of the area in natural light, so she can suggest clinics that fit.',
            'Let your doctor know about any medication, supplements, allergies or past treatments.']
    if slug in LASERS:
        prep.append('If you use retinoids, you may be asked to pause them 5–7 days before a laser. Your clinic will confirm.')
    prep.append(f'Plan your days so the downtime ({REC[rec].lower()}) fits around your trip.')
    after = [x for x in [row.get('recovery_note')] + (row.get('cautions') or []) if x]
    after.append('Follow the aftercare your clinic gives you, and message Romie if anything feels off. We check in on day 1, 7 and 30.')
    extra = (compare + f'<h2>Before your appointment</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in prep)}</ul>'
             + f'<h2>After your treatment</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in after)}</ul>'
             + f'<h2>Questions you might ask at your consultation</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in CONSULT_QS)}</ul>')
    body = f'''<div class="ar-quick"><h2>Quick answer</h2><p>{e(quick)}</p></div>
<ul class="ar-facts">
  <li><span>Downtime</span><b>{e(REC[rec])}</b></li>
  <li><span>Lasts</span><b>{e(DUR_T[dur])}</b></li>
  <li><span>Feels</span><b>{e(PAIN[pain])}</b></li>
  <li><span>From</span><b>{e(price_txt if price else "Ask us")}</b><small>{e(" · ".join(x for x in (pnote, usd) if x))}</small></li>
</ul>
{note("참고가 노출은 한국 의료광고법 기준 확인 필요")}
<div class="ar-body">
{body_md}
{take_html(slug)}
{f"<h2>Often chosen for</h2>{why}" if why else ""}
{pc}
{extra}
<h2>Questions people ask about {e(name)}</h2>
<div class="faq-list ar-faq">{"".join(f'<details class="faq-i"><summary><span>{e(q)}</span></summary><div class="faq-a"><p>{e(a)}</p></div></details>' for q, a in faq)}</div>
</div>'''
    rel_ids = {c['concern_id'] for c in links}
    ARTICLES.append(dict(slug=slug, kind='device', title=f'{name} in Seoul: what it is, how it feels and what it costs', short=name, cat=cat,
                         excerpt=row['summary'], img=f'../../assets/tx/{slug}.jpg', card_img=f'../assets/tx/{slug}.jpg', body=body, faq=faq,
                         concerns=rel_ids, mins=max(3, math.ceil((words(body)) / 200)),
                         meta=REC[rec] + (' · lasts ' + DUR_T[dur].lower() if dur not in ('temporary', 'semi_permanent', 'permanent') else ' · ' + DUR_T[dur].lower()) + (f' · from {price_txt}' if price else '')))

# ---- guides (Romie's own words from reels + site) ----
def qa_block(ids):
    return '<div class="faq-list ar-faq">' + ''.join(faq_item(FAQ[i], 'q-') for i in ids) + '</div>'


def say(fid, h2=None):
    f = FAQ[fid]
    rl = f' <a href="{reel(f["reel"])}" target="_blank" rel="noopener">Watch Romie answer this on Instagram</a>.' if f.get('reel') else ''
    return (f'<h2>{e(h2)}</h2>' if h2 else '') + f'<p>{e(f["a"])}{rl}</p>' + (note(f['note']) if f.get('note') else '')


checks = ''.join(f'<li><b>{e(t)}</b><span>{e(p)}</span></li>' for t, p in D['checks'])
skin_list = ''.join(f'<li><b>{e(t)}</b><span>{e(p)}</span></li>' for t, p in D['checklist']['skin'])
GUIDES = [
    dict(slug='seoul-skin-treatment-guide', title='Skin treatments in Seoul: a complete guide for first-time visitors',
         excerpt='Everything in one place: popular treatments with downtime and reference prices, how to choose a clinic, where to go, how long to stay, and what happens after you fly home.',
         quick='Most visitors come to Seoul for non-surgical skin treatments such as skin boosters, lifting devices, lasers and injectables. Many of these have little or no downtime, so 1–2 days in Seoul is often enough. It can help to compare clinics on credentials and how well doctors listen, to look at the total price rather than the cheapest headline price, and to message a coordinator 2–4 weeks before you travel.',
         body=('<h2>Why people come to Seoul for skin treatments</h2>'
               '<p>Seoul has thousands of clinics, with more than three thousand in Gangnam alone. Visitors often tell us they come for modern equipment, experienced doctors and prices that can be more affordable than at home. With that much choice, the hard part is usually not finding a clinic but finding the right one for you.</p>'
               '<h2>Popular treatments at a glance</h2><p>Reference prices from our partner clinics, to help you plan. Tap a treatment to read the full guide.</p>'
               + compare_table([dev_row(x) for x in DEVICE_CAT]) + note('참고가 노출은 한국 의료광고법 기준 확인 필요')
               + say('start', 'If it’s your first treatment')
               + say('trust', 'How to choose a clinic') + f'<ul class="ar-check">{checks}</ul>' + say('tiktok')
               + say('area', 'Where in Seoul: Gangnam or Apgujeong?')
               + say('days', 'How long to stay') + say('when', 'When to start planning')
               + f'<h3>Before you fly</h3><ul class="ar-check">{skin_list}</ul>'
               + '<h2>What treatment day can look like</h2><ol>' + ''.join(f'<li><b>{e(x["d"])}: {e(x["t"])}.</b> {e(x["p"])}</li>' for x in D['itinerary']['skin']) + '</ol>'
               + say('alone', 'Coming on your own') + say('lang')
               + '<h2>Prices and paying</h2>' + say('prices') + say('cheap') + say('free') + say('pay')
               + '<h2>After you fly home</h2>' + say('home') + say('bumps') + say('wrong')),
         faq=['start', 'alone', 'days', 'when', 'prices', 'free', 'trust', 'area', 'lang'], related=['first-time-in-korea', 'trustworthy-clinic', 'this-or-that']),
    dict(slug='first-time-in-korea', title='Your first treatment in Korea: where to start',
         excerpt='A few gentle suggestions for your first visit: what you might try, how to prepare and how long to stay.',
         quick='It really depends on your skin and what you’d like to change. If you’d like a gentle start, many first-timers enjoy a skin booster. It can also help to have a rough idea of what you want before you visit, to plan 1–2 days in Seoul for skin treatments, and to message us 2–4 weeks ahead.',
         body=say('start', 'A gentle first step') + say('know', 'Having a rough idea helps') + say('copy', 'Your plan can be your own')
         + say('days', 'How long to stay') + say('when', 'When to message us') + f'<h2>Before you fly: a quick checklist</h2><ul class="ar-check">{skin_list}</ul>',
         faq=['start', 'know', 'copy', 'days', 'when'], related=['rejuran', 'juvelook', 'aqua_peel']),
    dict(slug='trustworthy-clinic', title='How to tell if a clinic in Seoul is trustworthy',
         excerpt='Some signals worth checking, and the one Romie looks for most: doctors who listen.',
         quick='Official signals like certifications, case volume and government recognition are a good place to start. It also helps to look for doctors who listen and explain things, and to compare a few clinics rather than choosing one only because it’s everywhere online.',
         body=say('trust', 'Signals worth checking') + say('tiktok', 'Visibility isn’t everything') + f'<h2>What we check before every recommendation</h2><ul class="ar-check">{checks}</ul>'
         + '<p>We only add clinics we’d be happy to go to ourselves, and we’ve passed on some popular ones along the way.</p>' + say('wrong', 'If something goes wrong'),
         faq=['trust', 'tiktok', 'wrong'], related=['cheapest-clinic', 'first-time-in-korea']),
    dict(slug='this-or-that', title='Botox or skin booster? Booster or laser? Gangnam or Apgujeong?',
         excerpt='Three choices people often ask about, with the way Romie would talk them through with a friend.',
         quick='Botox and skin boosters do different jobs, so some people choose both. Skin boosters tend to work on your skin overall, while lasers usually target something specific. As a rough guide, Gangnam has more skin clinics and Apgujeong more plastic surgeons. Your doctor can help you decide.',
         body=say('botoxbooster', 'Botox or skin booster?') + take_html('rejuran').replace('../../', '../../') + say('skinbotox', 'Isn’t Botox just for wrinkles?') + say('laser', 'Skin booster or laser?') + say('area', 'Gangnam or Apgujeong?'),
         faq=['botoxbooster', 'skinbotox', 'laser', 'area'], related=['botox', 'rejuran', 'pico_laser']),
    dict(slug='cheapest-clinic', title='Is the cheapest clinic in Seoul really the cheapest?',
         excerpt='Why it can be worth looking past the lowest price on the menu and comparing the total for everything you’d get.',
         quick='Sometimes the cheapest treatment on a menu is there to bring you in, and once other treatments are added the total can end up similar or higher. Comparing the total price of everything in your plan, and asking for a written quote before you book, usually gives a fairer picture.',
         body=say('cheap', 'Look past the headline price') + '<h2>Comparing the whole plan</h2><p>It can help to ask for the total price of everything in your plan, not just the headline treatment. That total is usually the fairest number to compare between clinics.</p>'
         + say('prices', 'Reference prices vs your quote') + say('free', 'How Glow Up Seoul is paid'),
         faq=['cheap', 'prices', 'free'], related=['trustworthy-clinic', 'first-time-in-korea']),
]
for g in GUIDES:
    g['body'] = f'<div class="ar-quick"><h2>Quick answer</h2><p>{e(g["quick"])}</p></div><div class="ar-body">{g["body"]}<h2>Quick questions</h2>{qa_block(g["faq"])}</div>'
    g['faq'] = [(FAQ[i]['q'], FAQ[i]['a']) for i in g['faq']]

street = dict(slug='what-koreans-get-done', title='What Koreans actually get done at skin clinics (we asked on the street)',
              excerpt='Regular Botox, skin boosters and Ulthera came up most when we asked locals in Gangnam.',
              quick='The locals we interviewed in Gangnam mostly kept it simple: regular Botox, skin boosters and Ulthera came up most, along with laser hair removal and acne care. Their advice to visitors was to compare clinics carefully, read reviews and take your time.')
street['body'] = f'''<div class="ar-quick"><h2>Quick answer</h2><p>{e(street["quick"])}</p></div>
<div class="ar-body">
<p>For our Seoul Skin Talk series we asked people on the streets of Gangnam what they actually get done. Faces are blurred in the videos.</p>
<h2>A woman in her 40s</h2>
<p>She told us there are more than three thousand clinics in Gangnam. The only treatment she does regularly is Botox. Among her friends, Ulthera and skin boosters are the most popular. For daily care she credits thorough cleansing, yoga or pilates and eight hours of sleep, and says a healthy routine matters more than any treatment. <a href="{reel("DacMHY4hqbU")}" target="_blank" rel="noopener">Watch episode 1</a>.</p>
<h2>Korean men</h2>
<p>A 33-year-old told us he used to get acne peels from time to time but doesn’t get anything done now. Two men in their 20s said they go to budget “factory” clinics for simple things like laser hair removal, and to more expensive clinics when the result depends on the doctor’s skill.</p>
<p>Their advice for visitors: there are a lot of clinics, so compare them carefully, read reviews and take your time choosing. <a href="{reel("DauBo70hiDR")}" target="_blank" rel="noopener">Watch the episode</a>.</p>
<figure class="ar-fig"><img src="../../assets/street-men2.jpg" alt="Romie interviewing two men in Gangnam" loading="lazy"></figure>
<h2>Young women in Seoul</h2>
<p>An 18-year-old told us she has had acne extraction, and that friends who are stressed about acne go to clinics. Asked what she would recommend to visitors: Ulthera, a skin booster for clearer skin, and scar treatment. <a href="{reel("Da9yI06h4-i")}" target="_blank" rel="noopener">Watch the episode</a>.</p>
<h2>Quick questions</h2>
<div class="faq-list ar-faq">
<details class="faq-i"><summary><span>What treatments are popular with Koreans?</span></summary><div class="faq-a"><p>In our street interviews, regular Botox, skin boosters and Ulthera came up most, along with laser hair removal and acne care.</p></div></details>
<details class="faq-i"><summary><span>What do locals recommend to visitors?</span></summary><div class="faq-a"><p>Compare clinics carefully, read reviews and take your time. One local recommended Ulthera, a skin booster and scar treatment.</p></div></details>
</div>
</div>'''
street['faq'] = [('What treatments are popular with Koreans?', 'In our street interviews, regular Botox, skin boosters and Ulthera came up most, along with laser hair removal and acne care.'),
                 ('What do locals recommend to visitors?', 'Compare clinics carefully, read reviews and take your time. One local recommended Ulthera, a skin booster and scar treatment.')]
street['related'] = ['ulthera', 'botox', 'rejuran']
GUIDES.append(street)
for g in reversed(GUIDES):
    ARTICLES.insert(0, dict(slug=g['slug'], kind='guide', title=g['title'], short=g['title'], cat='Guides', excerpt=g['excerpt'], pillar=(g['slug'] == 'seoul-skin-treatment-guide'),
                            img=f'../../assets/{GUIDE_IMG[g["slug"]]}', card_img=f'../assets/{GUIDE_IMG[g["slug"]]}', body=g['body'], faq=g['faq'],
                            related=g['related'], mins=max(3, math.ceil(words(g['body']) / 200))))
ARTICLES.sort(key=lambda a: (a['kind'] != 'guide', CATS.index(a['cat'])))
BY = {a['slug']: a for a in ARTICLES}


# ---------------- Journal (d/journal/): same header, footer and look as the rest of the site ----------------
COVER_T = {'seoul-skin-treatment-guide': 'The Seoul skin guide', 'first-time-in-korea': 'Your first treatment in Korea',
           'trustworthy-clinic': 'Is this clinic trustworthy?', 'this-or-that': 'This or that?',
           'cheapest-clinic': 'Is cheapest worth it?', 'what-koreans-get-done': 'What Koreans actually get done'}
TAG = {'ulthera': 'HIFU lift', 'thermage': 'RF firming', 'shurink': 'HIFU lift', 'inmode': 'RF contouring', 'thread_lift': 'Instant lift',
       'rejuran': 'Salmon PN booster', 'juvelook': 'Collagen booster', 'pico_laser': 'Pigment & tone', 'co2_laser': 'Resurfacing',
       'botox': 'Lines & jaw', 'filler': 'Volume', 'tear_trough': 'Under-eye', 'aqua_peel': 'Deep-clean facial', 'iv_glow': 'Glow drip'}
GLYPH = {
    'lift': '<path d="M12 19V6"/><path d="M7 11l5-5 5 5"/><path d="M5 21h14"/>',
    'focus': '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    'waves': '<path d="M3 7.5c3-3 6 3 9 0s6-3 9 0"/><path d="M3 12.5c3-3 6 3 9 0s6-3 9 0"/><path d="M3 17.5c3-3 6 3 9 0s6-3 9 0"/>',
    'contour': '<path d="M6 3.5c-1.5 6 0 11 6 16.5 6-5.5 7.5-10.5 6-16.5"/><path d="M9 14c1.8 1.4 4.2 1.4 6 0"/>',
    'thread': '<path d="M3.5 19C6.5 9 17.5 9 20.5 19"/><path d="M7 19c2-5.5 8-5.5 10 0"/><circle cx="12" cy="5.5" r="1.6"/>',
    'drop': '<path d="M12 3c4 5 6.5 8.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 11.5 8 8 12 3z"/><path d="M9.3 15a2.7 2.7 0 0 0 2.7 2.7"/>',
    'spark': '<path d="M11 3l1.9 5.6 5.6 1.9-5.6 1.9L11 18l-1.9-5.6-5.6-1.9 5.6-1.9z"/><path d="M18.5 15.5v5M16 18h5"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    'dots': '<g fill="currentColor" stroke="none">' + ''.join(f'<circle cx="{x}" cy="{y}" r="1.5"/>' for x in (6, 12, 18) for y in (6, 12, 18)) + '</g>',
    'smooth': '<circle cx="12" cy="12" r="9"/><path d="M8.3 14.2c2 1.9 5.4 1.9 7.4 0"/><path d="M9 9.6h.01M15 9.6h.01"/>',
    'volume': '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="10" opacity=".4"/>',
    'eye': '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
    'bubbles': '<circle cx="9" cy="14.5" r="5"/><circle cx="17" cy="7.5" r="3"/><circle cx="18.3" cy="16.8" r="1.8"/>',
    'glow': '<path d="M12 7c3 3.8 4.8 6.4 4.8 8.7a4.8 4.8 0 0 1-9.6 0C7.2 13.4 9 10.8 12 7z"/><path d="M12 1.8v2M4.8 4.8l1.4 1.4M19.2 4.8l-1.4 1.4"/>',
}
DEV_GLYPH = {'ulthera': 'lift', 'shurink': 'focus', 'thermage': 'waves', 'inmode': 'contour', 'thread_lift': 'thread', 'rejuran': 'drop',
             'juvelook': 'spark', 'pico_laser': 'sun', 'co2_laser': 'dots', 'botox': 'smooth', 'filler': 'volume', 'tear_trough': 'eye',
             'aqua_peel': 'bubbles', 'iv_glow': 'glow'}
JA = '../../assets/'   # assets, seen from d/journal/
JHOME = 'journal/index.html'


GUIDE_POS = {'seoul-skin-treatment-guide': '50% 45%', 'first-time-in-korea': '50% 22%', 'trustworthy-clinic': '50% 30%', 'this-or-that': '50% 30%',
             'cheapest-clinic': '50% 35%', 'what-koreans-get-done': '50% 40%'}
HOME_PICKS = ['seoul-skin-treatment-guide', 'first-time-in-korea', 'trustworthy-clinic']


def glyph(slug):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{GLYPH[DEV_GLYPH[slug]]}</svg>'


# 10/18: 파스텔 표지 → 일반 블로그 카드. 카드 = 사진(가이드) 또는 선 아이콘(장비) · 분류 · 이름 · 읽는 시간.
# server/routes/blogV3.js 가 admin 에서 쓴 DB 글을 "같은 마크업"으로 목록 맨 앞에 끼운다 (posts.json 참고).
def card_title(a):
    return COVER_T[a['slug']] if a['kind'] == 'guide' else a['short']


def card_meta(a):
    return f'{a["mins"]} min read' if a['kind'] == 'guide' else f'{TAG[a["slug"]]} · {a["mins"]} min read'


def card_media(a, base=JA):
    if a['kind'] == 'guide':
        return f'<img src="{base}{GUIDE_IMG[a["slug"]]}" alt="" loading="lazy" decoding="async" style="object-position:{GUIDE_POS[a["slug"]]}">'
    return f'<span class="pc-g">{glyph(a["slug"])}</span>'


def card(a, href_pre='', base=JA):
    return (f'<a class="pc" href="{href_pre}{a["slug"]}.html" data-cat="{e(a["cat"])}"><span class="pc-m">{card_media(a, base)}</span>'
            f'<span class="pc-k">{e(a["cat"])}</span><span class="pc-t">{e(card_title(a))}</span><span class="pc-d">{e(card_meta(a))}</span></a>')


def related(a):
    if a['kind'] == 'device':
        same = [x for x in ARTICLES if x['kind'] == 'device' and x['slug'] != a['slug'] and (x['concerns'] & a['concerns'])][:2]
        lst = same + [BY['first-time-in-korea'] if a['cat'] in ('Skin boosters', 'Facials & wellness') else BY['this-or-that']]
    else:
        lst = [BY[s] for s in a['related'] if s in BY][:3]
    return ''.join(card(x) for x in lst)


def add_toc(body_html):
    """give every section h2 an id and return the table of contents (skips the 'Quick answer' box)"""
    toc, used = [], set()

    def rep(m):
        text = m.group(1)
        if text == 'Quick answer':
            return m.group(0)
        sid = re.sub(r'[^a-z0-9]+', '-', html.unescape(re.sub(r'<[^>]+>', '', text)).lower()).strip('-')[:48] or 's'
        while sid in used:
            sid += '-2'
        used.add(sid)
        toc.append((sid, text))
        return f'<h2 id="{sid}">{text}</h2>'
    return re.sub(r'<h2>(.*?)</h2>', rep, body_html), toc


TOC_JS = "<script>(function(){var t=document.querySelector('.bl-toc details');if(t&&matchMedia('(min-width:1000px)').matches)t.open=true;})();</script>"

# write articles
os.makedirs(os.path.join(OUT, 'journal'), exist_ok=True)
for a in ARTICLES:
    ask_text = f"Hi Romie! I read your guide on {a['short']}. "
    body_html, toc = add_toc(a['body'])
    if a['kind'] == 'guide':
        fig = f'<figure class="bl-fig"><img src="{JA}{GUIDE_IMG[a["slug"]]}" alt="" fetchpriority="high" style="object-position:{GUIDE_POS[a["slug"]]}"></figure>'
    else:
        fig = f'<figure class="bl-fig bl-fig-g"><span>{glyph(a["slug"])}</span><figcaption>{e(TAG[a["slug"]])}</figcaption></figure>'
    toc_html = ('<aside class="bl-toc"><details><summary>In this guide</summary><ol>' + ''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc) + '</ol></details></aside>') if len(toc) > 2 else ''
    body = f'''<article class="w bl-art">
  <nav class="ar-crumb" aria-label="Breadcrumb"><a href="index.html">Journal</a><span>/</span><span>{e(a["cat"])}</span></nav>
  <header class="bl-head">
    <div class="bl-ht">
      <span class="k">{e(a["cat"])}</span>
      <h1 class="split">{e(a["title"])}</h1>
      <p class="ar-sum">{e(a["excerpt"])}</p>
      <div class="ar-by"><img src="{JA}romie-closeup.jpg" alt=""><span><b>Romie</b> · Updated {DATE_H} · {a["mins"]} min read</span></div>
    </div>
    {fig}
  </header>
  <div class="bl-grid{'' if toc_html else ' no-toc'}">
    {toc_html}
    <div class="bl-main">
      {body_html}
      {SOURCES}
      <section class="ar-ask"><h2>Not sure it’s right for you?</h2><p>Send Romie a photo and your concern. She’ll tell you honestly, even if the answer is “you don’t need this”.</p><a class="btn light" href="{WA}?text={e(ask_text)}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Ask Romie on WhatsApp</a></section>
    </div>
  </div>
</article>
<section class="w bl-related"><h2>Keep reading</h2><div class="pcs">{related(a)}</div></section>'''
    url = f'{LIVE}journal/{a["slug"]}.html'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': a['title'], 'description': a['excerpt'], 'datePublished': DATE, 'dateModified': DATE, 'url': url, 'wordCount': words(a['body']),
         'author': {'@type': 'Person', 'name': 'Romie', 'jobTitle': 'Founder & coordinator, Glow Up Seoul'},
         'publisher': {'@type': 'Organization', 'name': 'Glow Up Seoul'}, 'isPartOf': {'@type': 'Blog', 'name': 'Glow Up Seoul Journal', 'url': LIVE + JHOME}, 'inLanguage': 'en'},
        faq_ld(a['faq']),
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Journal', 'item': LIVE + JHOME},
                                                         {'@type': 'ListItem', 'position': 2, 'name': a['title'], 'item': url}]}]}
    with open(os.path.join(OUT, 'journal', a['slug'] + '.html'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(shell('journal', a['title'] + ' · Glow Up Seoul', a['excerpt'], body, pre='../', ld=ld, css='journal.css', tail=TOC_JS))

# template for admin-written posts: the server fills %%GUS_…%% (server/routes/blogV3.js)
open(os.path.join(OUT, 'journal', '_post.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('journal', '%%GUS_TITLE%%', '%%GUS_DESC%%', '%%GUS_BODY%%', pre='../', ld='%%GUS_LD%%', css='journal.css', tail=TOC_JS, raw=True))
# static posts the server merges with DB posts (same card markup, see card())
json.dump({'cats': CATS, 'posts': [
    {'slug': a['slug'], 'title': card_title(a), 'cat': a['cat'], 'meta': card_meta(a), 'kind': a['kind'], 'home': a['slug'] in HOME_PICKS,
     'media': ({'type': 'photo', 'src': GUIDE_IMG[a['slug']], 'pos': GUIDE_POS[a['slug']]} if a['kind'] == 'guide' else {'type': 'glyph', 'svg': glyph(a['slug'])})}
    for a in ARTICLES]}, open(os.path.join(OUT, 'journal', 'posts.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)

# ---------------- journal home ----------------
chips = ''.join(f'<button type="button" data-f="{e(c)}" aria-pressed="{"true" if i == 0 else "false"}">{e(c)}</button>' for i, c in enumerate(['All'] + CATS))
jbody = f'''<section class="w ph"><span class="mono">Journal</span><h1 class="split">Seoul treatments, explained simply.</h1>
  <p class="lead">Romie’s guides to what people ask about most: what each treatment is, how it feels, how long it lasts and what it costs.</p></section>
<nav class="bl-cats" aria-label="Topics"><div class="bl-cats-in" role="group">{chips}<!--GUS:DB_CATS--></div></nav>
<section class="w bl-list"><div class="pcs pcs-j" data-list><!--GUS:DB_POSTS-->{"".join(card(a) for a in ARTICLES)}</div></section>
{ask_block("Can’t find your treatment?", "Tell Romie what you’d like to change. She’ll walk you through the options, including ones that aren’t in the journal yet.")}
<script>
(function(){{var nav=document.querySelector('.bl-cats'),b=nav.querySelectorAll('button'),c=document.querySelectorAll('[data-list] .pc');
nav.addEventListener('click',function(ev){{var x=ev.target.closest('button');if(!x)return;var f=x.dataset.f;nav.querySelectorAll('button').forEach(function(y){{y.setAttribute('aria-pressed',String(y===x))}});
document.querySelectorAll('[data-list] .pc').forEach(function(k){{k.hidden=!(f==='All'||k.dataset.cat===f)}});document.querySelector('[data-list]').classList.toggle('is-filtered',f!=='All');
var top=nav.getBoundingClientRect().top+window.scrollY;if(window.scrollY>top)window.scrollTo({{top:top,behavior:'smooth'}})}})}})();
</script>'''
ld_list = {'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Glow Up Seoul Journal', 'url': LIVE + JHOME, 'publisher': {'@type': 'Organization', 'name': 'Glow Up Seoul'},
           'author': {'@type': 'Person', 'name': 'Romie'},
           'blogPost': [{'@type': 'BlogPosting', 'headline': a['title'], 'url': f'{LIVE}journal/{a["slug"]}.html', 'datePublished': DATE} for a in ARTICLES]}
open(os.path.join(OUT, 'journal', 'index.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('journal', 'Journal · Seoul treatments, explained simply · Glow Up Seoul', 'Romie’s guides to Korean skin treatments: what it is, how it feels, how long it lasts and what it costs.', jbody, pre='../', ld=ld_list, css='journal.css'))
# the old address forwards to the journal home
open(os.path.join(OUT, 'journal.html'), 'w', encoding='utf-8', newline='\n').write(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Journal · Glow Up Seoul</title>'
    '<meta http-equiv="refresh" content="0; url=journal/index.html"><link rel="canonical" href="journal/index.html"><a href="journal/index.html">Journal</a></html>\n')


# ---------------- FAQ page ----------------
groups = ''
for c in D['faqCats']:
    groups += f'<h2 class="faq-cat">{e(c)}</h2><div class="faq-list">' + ''.join(faq_item(f) for f in D['faq'] if f['c'] == c) + '</div>'
fbody = f'''<section class="w ph"><span class="mono">FAQ</span><h1 class="split">Questions, answered.</h1><p class="lead">Everything people ask Romie before their first trip. Most of these she has also answered on camera.</p></section>
<section class="w">
  <div data-views="chat">
    <div class="vt" role="group" aria-label="How to view the FAQ"><button type="button" data-view-btn="chat" aria-pressed="false">Chat with Romie</button><button type="button" data-view-btn="list" aria-pressed="true">All questions</button></div>
    <div data-view="chat" hidden><div data-gus="faqchat"></div></div>
    <div data-view="list">{groups}</div>
  </div>
</section>
{ask_block("Still curious?", "Ask Romie directly. Send a photo too if you like. She replies personally.")}'''
open(os.path.join(OUT, 'faq.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('faq', 'FAQ · Glow Up Seoul', 'Answers to common questions about treatments in Seoul: cost, safety, travel and aftercare.', fbody,
          ld={'@context': 'https://schema.org', **faq_ld([(f['q'], f['a']) for f in D['faq']])}))


# ---------------- home (10/18 회의) ----------------
# 새롬님: 홈 역할 = 내 서비스 설명 · 나랑 했을 때 기대할 것 · 신뢰 · 정보(블로그) · 구글 리뷰. 30대 기준, 세련되게 + 애니메이션.
# "리얼 메시지"(DM) 는 구글 리뷰로 대체 (리뷰는 /api/google-reviews 로 실시간, 하드코딩 없음).
HOW = [
    ('match', 'Find the right clinic', 'Tell me what you’d like to change. I send 2–3 verified clinics with honest prices and downtime.'),
    ('with', 'Come with you', 'I book it, translate, and sit next to you at the consultation and treatment. Coming alone is fine.'),
    ('care', 'Check on you after', 'Day 1, 7 and 30, even after you fly home. Send me a photo any time.'),
    ('free', 'Free for you', 'Clinics pay us a referral fee, only after your treatment. You pay the clinic the normal price.'),
]
EXPECT = [
    ('romie-desk.jpg', '50% 30%', 'Before you fly', 'A shortlist, not a sales pitch',
     'Within a day of your message you get 2–3 verified clinics for your concern, with honest prices, downtime and a rough plan for your days in Seoul.'),
    ('clinic-lobby.jpg', '50% 55%', 'On the day', 'Someone beside you',
     'I book the appointments, translate at the consultation and stay with you through treatment. Coming on your own is completely fine.'),
    ('romie-closeup.jpg', '50% 25%', 'After you fly home', 'Still here when you’re home',
     'I check in on day 1, 7 and 30. Send me a photo any time, and if anything feels off I talk to the clinic for you.'),
]
MARQUEE = ['Verified clinics only', 'Free for patients', 'Registered with the Ministry of Health & Welfare', 'English · 中文 · Bahasa',
           'With you on the day', 'Aftercare after you fly home']


def num_attrs(n):
    m = re.match(r'^(\d+)(.*)$', n)
    return f' data-count="{m.group(1)}" data-suffix="{e(m.group(2))}"' if m else ''


svc_list = ''.join(f'<li data-r style="--i:{i}"><span class="svc-n">0{i + 1}</span><span class="svc-i">{ico(k)}</span><div><h3>{e(t)}</h3><p>{e(d)}</p></div></li>' for i, (k, t, d) in enumerate(HOW))
expect = ''.join(f'''<article class="xp-i" data-r style="--i:{i}">
      <figure class="xp-img rv-img"><img src="../assets/{img}" alt="" loading="lazy" decoding="async" style="object-position:{pos}"></figure>
      <span class="mono">0{i + 1} · {e(k)}</span><h3>{e(t)}</h3><p>{e(d)}</p>
    </article>''' for i, (img, pos, k, t, d) in enumerate(EXPECT))
stats = ''.join(f'<li data-r style="--i:{i}"><b{num_attrs(s["n"])}>{e(s["n"])}</b><span>{e(s["l"])}</span></li>' for i, s in enumerate(D['stats']))
checks_home = ''.join(f'<li data-r style="--i:{i}"><b>{e(t)}</b><span>{e(p)}</span></li>' for i, (t, p) in enumerate(D['checks']))
mq = ''.join(f'<span>{e(x)}</span>' for x in MARQUEE * 2)
reels = ''.join(f'<a class="g-reel" href="{reel(r["id"])}" target="_blank" rel="noopener"><img src="../assets/{r["cover"]}" alt="" loading="lazy"><span class="g-reel-k">{e(r["k"])}</span><span class="g-reel-t">{e(r["t"])}</span><span class="g-reel-d">▶ {e(r["dur"])}</span></a>' for r in D['reels'])
home_faq = ''.join(faq_item(FAQ[i], 'hq-') for i in ['alone', 'free', 'trust', 'days', 'start'])
latest = ''.join(card(BY[s], 'journal/', '../assets/') for s in HOME_PICKS)
hi = e('Hi Romie! 👋')

hbody = f"""<section class="hero" aria-label="Introduction">
  <div class="hero-media"><img src="../assets/romie-seated.jpg" alt="Romie, founder of Glow Up Seoul" fetchpriority="high" data-speed="0.12"></div>
  <div class="hero-in w">
    <span class="mono hero-k">Medical beauty concierge · Seoul</span>
    <h1 class="split hero-h">Your person in Seoul for <em>skin &amp; surgery.</em></h1>
    <p class="hero-lead">I’m Romie. I match international patients with verified clinics, come with you on the day, and look after you once you’re home.</p>
    <div class="btns"><a class="btn light" href="{WA}?text={hi}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Message me on WhatsApp</a><a class="btn ghost" href="#how">How it works</a></div>
  </div>
  <div class="hero-foot w"><span>Registered with Korea’s Ministry of Health &amp; Welfare</span><span class="cue" aria-hidden="true">Scroll</span></div>
</section>

<div class="mq" aria-hidden="true"><div class="g-marquee"><div class="g-marquee-track">{mq}</div></div></div>

<section class="w sec" id="how">
  <div class="sh"><span class="mono">01 — What I do</span><h2 class="split">One person, from your first message to your last check-in.</h2></div>
  <ol class="svc">{svc_list}</ol>
</section>

<section class="sec xp-sec" id="expect">
  <div class="w">
    <div class="sh"><span class="mono">02 — What to expect</span><h2 class="split">What working with me looks like.</h2><p>No packages to choose from and no pressure. You talk to me, the same person, the whole way through.</p></div>
    <div class="xp">{expect}</div>
    <div class="tiers2" data-r>
      <div><h4>Care <small>Skin treatments · free</small></h4><ul><li>1:1 with Romie from day one</li><li>Verified clinic match</li><li>With you on the day</li><li>Check-ins after your treatment</li></ul></div>
      <div><h4>Premium Care <small>Surgery · free</small></h4><ul><li>Everything in Care</li><li>Airport pickup</li><li>Pharmacy and medication covered</li><li>Day 1 · 7 · 30 check-ins</li></ul></div>
    </div>
  </div>
</section>

<section class="dark sec" id="trust">
  <div class="w">
    <div class="sh"><span class="mono">03 — Why people trust us</span><h2 class="split">Every clinic is checked before I recommend it.</h2></div>
    <ul class="stats">{stats}</ul>
    <div class="trust-grid">
      <div class="reg" data-r><span class="mono">Government registered</span><p>Glow Up Seoul is registered with Korea’s Ministry of Health &amp; Welfare as a Foreign Patient Attraction Agency.</p><p class="reg-free"><b>Free for you.</b> Clinics pay us a referral fee, only after your treatment. You pay the clinic’s normal price.</p></div>
      <ul class="checks">{checks_home}</ul>
    </div>
  </div>
</section>

<section class="w sec" id="reviews">
  <div class="sh sh-row"><div><span class="mono">04 — Reviews</span><h2 class="split">What patients say on Google.</h2></div><div class="rv-sum" data-rv-sum hidden></div></div>
  <div class="rvs" data-reviews data-url="{GOOGLE_REVIEWS}" data-lenis-prevent-horizontal>
    <div class="rv sk"></div><div class="rv sk"></div><div class="rv sk"></div>
  </div>
  <div class="rv-foot"><a class="btn o" href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Read all reviews on Google <span aria-hidden="true">↗</span></a><span class="rv-by">Reviews from Google</span></div>
</section>

<section class="w sec" id="journal">
  <div class="sh sh-row"><div><span class="mono">05 — Journal</span><h2 class="split">Read before you book.</h2></div><a class="more" href="{JHOME}">All articles <span aria-hidden="true">→</span></a></div>
  <div class="pcs pcs-3"><!--GUS:LATEST-->{latest}<!--GUS:/LATEST--></div>
</section>

<section class="sec reels-sec" id="instagram">
  <div class="w"><div class="sh sh-row"><div><span class="mono">06 — On Instagram</span><h2 class="split">Watch me answer.</h2></div><a class="more" href="https://www.instagram.com/{e(C["instagram"])}/" target="_blank" rel="noopener">@{e(C["instagram"])} <span aria-hidden="true">↗</span></a></div></div>
  <div class="g-reels">{reels}</div>
</section>

<section class="w sec" id="faq">
  <div class="faq-wrap">
    <div class="sh"><span class="mono">07 — FAQ</span><h2 class="split">Questions people ask first.</h2><p>Short answers here. Ask me anything else in the chat, or read all 22.</p>
      <div class="btns"><button type="button" class="btn" data-open="m-chat" aria-haspopup="dialog">Ask Romie</button><a class="btn o" href="faq.html">All questions</a></div></div>
    <div class="faq-list">{home_faq}</div>
  </div>
</section>

<section class="w sec">
  <div class="end" data-r>
    <span class="mono">Ready when you are</span>
    <h2 class="split">Tell me what you’d like to change.</h2>
    <p>Send a photo and a few words. I reply personally, usually within a day.</p>
    <div class="btns"><a class="btn light" href="{WA}?text={hi}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Message on WhatsApp</a><a class="btn ghost" href="https://www.instagram.com/{e(C["instagram"])}/" target="_blank" rel="noopener">Instagram</a></div>
  </div>
</section>"""
ld_home = {'@context': 'https://schema.org', '@type': 'Organization', 'name': 'Glow Up Seoul', 'url': LIVE, 'description': D['service']['line'],
           'founder': {'@type': 'Person', 'name': 'Romie'}, 'sameAs': ['https://www.instagram.com/glowupseoul/'],
           'contactPoint': {'@type': 'ContactPoint', 'contactType': 'customer service', 'telephone': '+82-10-6487-1060', 'availableLanguage': ['English', 'Chinese', 'Indonesian']}}
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('home', 'Glow Up Seoul · your person in Seoul for skin & surgery', D['service']['line'], hbody, ld=ld_home,
          chat_ids='alone,trust,start,know,cheap,free,when,days,wrong,botoxbooster,area'))

print(f'wrote D: home, journal ({len(ARTICLES)} articles + _post.html template + posts.json), faq')
for a in ARTICLES:
    print(f"  {a['cat']:18s} {a['slug']:22s} {a['mins']}min  faq={len(a['faq'])}")
