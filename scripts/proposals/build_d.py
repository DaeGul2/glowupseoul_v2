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
V = '20'
DATE = '2026-10-17'
DATE_H = '17 Oct 2026'

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
    return f'<span class="note">{e(t)}</span>'


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
NAV = [('home', 'index.html', 'Home'), ('journal', 'journal.html', 'Journal'), ('faq', 'faq.html', 'FAQ')]
FONTS = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap'


def header(page, pre):
    cur = ' aria-current="page"'
    links = ''.join(f'<a href="{pre}{h}"{cur if k == page else ""}>{t}</a>' for k, h, t in NAV)
    return f'''<header class="gh"><div class="gh-in">
  <a class="gh-logo" href="{pre}index.html">glow<i></i>up seoul</a>
  <nav class="gh-nav" aria-label="Main">{links}</nav>
  <a class="gh-cta" href="{WA}?text={e("Hi Romie! 👋")}" target="_blank" rel="noopener">Text Romie</a>
</div></header>'''


def footer(pre):
    nav = ''.join(f'<a href="{pre}{h}">{t}</a>' for _, h, t in NAV)
    return f'''<footer class="gf"><div class="gf-in">
  <div class="gf-big">glow<i></i>up seoul</div>
  <nav class="gf-nav" aria-label="Footer">{nav}</nav>
  <div class="gf-links">
    <a href="{WA}" target="_blank" rel="noopener">WhatsApp {e(C["waDisplay"])}</a>
    <a href="https://www.instagram.com/{e(C["instagram"])}/" target="_blank" rel="noopener">Instagram @{e(C["instagram"])}</a>
    <a href="mailto:{e(C["email"])}">{e(C["email"])}</a>
    <span>WeChat {e(C["wechat"])} {note("ID 확인")}</span>
  </div>
  <p class="gf-legal">Glow Up Seoul · Foreign Patient Attraction Agency registered with the Ministry of Health &amp; Welfare, Korea · Reg. no. {note("등록번호")} · Business no. {note("사업자번호")} · {e(C["address"])}<br>We’re a concierge, not a clinic. Medical decisions are made between you and your doctor. © 2026 Glow Up Seoul</p>
</div></footer>'''


def shell(page, title, desc, body, pre='', ld=None):
    sh = pre + '../shared/'
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#FFFFFF">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{sh}base.css?v={V}">
<link rel="stylesheet" href="{pre}style.css?v={V}">
{ldj}
</head>
<body data-site="d" data-page="{page}">
{header(page, pre)}
<main id="main">
{body}
</main>
{footer(pre)}
<script src="{sh}data.js?v={V}"></script>
<script>window.GUS.site={{barLabel:'Text Romie on WhatsApp'}};</script>
<script src="{sh}app.js?v={V}"></script>
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
    return f'''<section class="w sec"><div class="ask">
  <div><span class="k" style="background:#fff;color:var(--ink)">Takes 10 seconds</span><h2 style="margin-top:14px">{title}</h2><p class="lead">{lead}</p></div>
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
GUIDE_IMG = {'first-time-in-korea': 'romie-closeup.jpg', 'trustworthy-clinic': 'romie-profile.jpg', 'this-or-that': 'romie-red.jpg',
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
    quick = f'{row["summary"]} {"No downtime" if rec == "immediate" else "Downtime is " + REC[rec].lower()}, results last {DUR[dur]}, and reference prices in Seoul start from {price_txt}' + (f' ({pnote})' if pnote else '') + '.'
    sensation = table.get('sensation')
    faq = [
        (f'What is {name}?', row['summary']),
        (f'How long does {name} last?', f'Results usually last {DUR[dur]}.' + (' ' + row['cautions'][0] if row.get('cautions') and dur in ('months_3_6', 'temporary') else '')),
        (f'Is there downtime after {name}?', row.get('recovery_note') or REC[rec]),
        (f'Does {name} hurt?', f'Most people describe it as {PAIN[pain].lower()}.' + (f' What it feels like: {sensation}.' if sensation else '')),
        (f'How much does {name} cost in Seoul?', f'Reference prices at our partner clinics start from {price_txt}' + (f' ({pnote}, {usd})' if pnote and usd else (f' ({usd})' if usd else '')) + '. You get a full written quote before anything is booked.'),
    ]
    if concerns:
        faq.append((f'Who is {name} good for?', f'People who want to improve {concerns}. Your doctor confirms whether it suits you at the consultation.'))
    why = ''.join((f'<details class="ar-why"><summary>{e(c["name"])}</summary><p>{e(c["reason"])}</p></details>' if c.get('reason') else f'<p class="ar-why" style="padding:15px 18px;font-weight:700">{e(c["name"])}</p>') for c in links)
    pc = ''
    if row.get('benefits') or row.get('cautions'):
        pc = '<div class="ar-pc">' + (f'<div><h3>Why people love it</h3><ul>{"".join(f"<li>{e(b)}</li>" for b in row["benefits"])}</ul></div>' if row.get('benefits') else '') + \
             (f'<div><h3>Good to know</h3><ul>{"".join(f"<li>{e(b)}</li>" for b in row["cautions"])}</ul></div>' if row.get('cautions') else '') + '</div>'
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
{f"<h2>Good for</h2>{why}" if why else ""}
{pc}
{f'<p><strong>Recovery:</strong> {e(row["recovery_note"])}</p>' if row.get("recovery_note") else ""}
<h2>Questions people ask about {e(name)}</h2>
<div class="faq-list ar-faq">{"".join(f'<details class="faq-i"><summary><span>{e(q)}</span></summary><div class="faq-a"><p>{e(a)}</p></div></details>' for q, a in faq)}</div>
</div>'''
    rel_ids = {c['concern_id'] for c in links}
    ARTICLES.append(dict(slug=slug, kind='device', title=f'{name} in Seoul: what it is, how it feels and what it costs', short=name, cat=cat,
                         excerpt=row['summary'], img=f'../../assets/tx/{slug}.jpg', card_img=f'../assets/tx/{slug}.jpg', body=body, faq=faq,
                         concerns=rel_ids, mins=max(3, math.ceil((words(body)) / 200))))

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
    dict(slug='first-time-in-korea', title='Your first treatment in Korea: where to start',
         excerpt='Start with a skin booster, know what you want before you walk in, and give yourself 1–2 days in Seoul.',
         quick='Start with a skin booster: it suits almost every skin type and you see results in two to three weeks. Before you book, decide what you actually want, because most clinics have a salesperson. Plan 1–2 days in Seoul for skin treatments and message us 2–4 weeks ahead.',
         body=say('start', 'Start with a skin booster') + say('know', 'Know what you want before you walk in') + say('copy', 'Don’t copy someone else’s treatment list')
         + say('days', 'How many days you need') + say('when', 'When to message us') + f'<h2>Before you fly: a quick checklist</h2><ul class="ar-check">{skin_list}</ul>',
         faq=['start', 'know', 'copy', 'days', 'when'], related=['rejuran', 'juvelook', 'aqua_peel']),
    dict(slug='trustworthy-clinic', title='How to tell if a clinic in Seoul is trustworthy',
         excerpt='Official certificates first, then the thing that matters most: doctors who actually listen.',
         quick='Check official signals first: certifications, case volume and government recognition. Then look for doctors who listen and explain. Don’t choose a clinic just because it is everywhere on social media.',
         body=say('trust', 'Official signals, and the one I trust most') + say('tiktok', 'Don’t judge a clinic by how often you see it') + f'<h2>What we check before every recommendation</h2><ul class="ar-check">{checks}</ul>'
         + '<p>If a clinic doesn’t pass, it doesn’t join our network. We’ve turned down popular clinics that didn’t meet the standard.</p>' + say('wrong', 'If something goes wrong'),
         faq=['trust', 'tiktok', 'wrong'], related=['cheapest-clinic', 'first-time-in-korea']),
    dict(slug='this-or-that', title='Botox or skin booster? Booster or laser? Gangnam or Apgujeong?',
         excerpt='Three choices everyone asks about, answered the way Romie answers friends.',
         quick='Botox and skin boosters do different jobs, so many people need both. Skin boosters improve your skin overall, while lasers target a specific problem. Gangnam has more skin clinics, Apgujeong has more plastic surgeons.',
         body=say('botoxbooster', 'Botox or skin booster?') + take_html('rejuran').replace('../../', '../../') + say('skinbotox', 'Isn’t Botox just for wrinkles?') + say('laser', 'Skin booster or laser?') + say('area', 'Gangnam or Apgujeong?'),
         faq=['botoxbooster', 'skinbotox', 'laser', 'area'], related=['botox', 'rejuran', 'pico_laser']),
    dict(slug='cheapest-clinic', title='Why the cheapest clinic in Seoul usually isn’t',
         excerpt='The lowest price on the menu is often a bait price. Compare the total of everything you’ll get.',
         quick='The cheapest treatment on a menu is often a bait price: once you’re in the clinic, other treatments get added and the total ends up similar or higher. Compare the total price of everything in your plan, and ask for a written quote before you book.',
         body=say('cheap', 'The bait price') + '<h2>Compare the whole plan</h2><p>Ask for the total price of everything in your plan, not just the headline treatment. That is the number to compare between clinics.</p>'
         + say('prices', 'Reference prices vs your quote') + say('free', 'How Glow Up Seoul is paid'),
         faq=['cheap', 'prices', 'free'], related=['trustworthy-clinic', 'first-time-in-korea']),
]
for g in GUIDES:
    g['body'] = f'<div class="ar-quick"><h2>Quick answer</h2><p>{e(g["quick"])}</p></div><div class="ar-body">{g["body"]}<h2>Quick questions</h2>{qa_block(g["faq"])}</div>'
    g['faq'] = [(FAQ[i]['q'], FAQ[i]['a']) for i in g['faq']]

street = dict(slug='what-koreans-get-done', title='What Koreans actually get done at skin clinics (we asked on the street)',
              excerpt='Regular Botox, skin boosters and Ulthera came up most when we asked locals in Gangnam.',
              quick='Locals we interviewed in Gangnam mostly keep it simple: regular Botox, skin boosters and Ulthera came up most, along with laser hair removal and acne care. Their advice to visitors: compare clinics carefully, read reviews and take your time.')
street['body'] = f'''<div class="ar-quick"><h2>Quick answer</h2><p>{e(street["quick"])}</p></div>
<div class="ar-body">
<p>For our Seoul Skin Talk series we asked people on the streets of Gangnam what they actually get done. Faces are blurred in the videos.</p>
<h2>A woman in her 40s</h2>
<p>She told us there are more than three thousand clinics in Gangnam. The only treatment she does regularly is Botox. Among her friends, Ulthera and skin boosters are the most popular. For daily care she credits thorough cleansing, yoga or pilates and eight hours of sleep, and says a healthy routine matters more than any treatment. <a href="{reel("DacMHY4hqbU")}" target="_blank" rel="noopener">Watch episode 1</a>.</p>
<h2>Korean men</h2>
<p>A 33-year-old told us he used to get acne peels from time to time but doesn’t get anything done now. Two men in their 20s said they go to budget “factory” clinics for simple things like laser hair removal, and to more expensive clinics when the result depends on the doctor’s skill.</p>
<p>Their advice for visitors: there are a lot of clinics, so compare them carefully, read reviews and take your time choosing. <a href="{reel("DauBo70hiDR")}" target="_blank" rel="noopener">Watch the episode</a>.</p>
<figure style="margin:20px 0"><img src="../../assets/street-men2.jpg" alt="Romie interviewing two men in Gangnam" style="width:100%;border-radius:28px" loading="lazy"></figure>
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
    ARTICLES.insert(0, dict(slug=g['slug'], kind='guide', title=g['title'], short=g['title'], cat='Guides', excerpt=g['excerpt'],
                            img=f'../../assets/{GUIDE_IMG[g["slug"]]}', card_img=f'../assets/{GUIDE_IMG[g["slug"]]}', body=g['body'], faq=g['faq'],
                            related=g['related'], mins=max(3, math.ceil(words(g['body']) / 200))))
ARTICLES.sort(key=lambda a: (a['kind'] != 'guide', CATS.index(a['cat'])))
BY = {a['slug']: a for a in ARTICLES}


def card(a, pre=''):
    img = a['card_img'] if pre == '' else a['img']
    href = f'{pre}journal/{a["slug"]}.html' if pre == '' else f'{a["slug"]}.html'
    return f'''<a class="jc{" guide" if a["kind"] == "guide" else ""}" href="{href}" data-cat="{e(a["cat"])}">
  <span class="jc-img"><img src="{img}" alt="" loading="lazy" decoding="async"></span>
  <span class="jc-body"><span class="jc-cat">{e(a["cat"])}</span><span class="jc-t">{e(a["short"] if a["kind"] == "device" else a["title"])}</span><span class="jc-ex">{e(a["excerpt"])}</span><span class="jc-meta">{a["mins"]} min read · Romie</span></span>
</a>'''


def related(a):
    if a['kind'] == 'device':
        same = [x for x in ARTICLES if x['kind'] == 'device' and x['slug'] != a['slug'] and (x['concerns'] & a['concerns'])][:3]
        guides = [BY['first-time-in-korea'] if a['cat'] in ('Skin boosters', 'Facials & wellness') else BY['this-or-that']]
        lst = same + guides
    else:
        lst = [BY[s] for s in a['related'] if s in BY]
    return ''.join(card(x, pre='x') for x in lst)


# write articles
os.makedirs(os.path.join(OUT, 'journal'), exist_ok=True)
for a in ARTICLES:
    ask_text = f"Hi Romie! I read your guide on {a['short']}. "
    body = f'''<article class="narrow ar">
  <nav class="ar-crumb" aria-label="Breadcrumb"><a href="../journal.html">Journal</a><span>›</span><span>{e(a["cat"])}</span></nav>
  <header class="ar-head">
    <span class="k butter">{e(a["cat"])}</span>
    <h1>{e(a["title"])}</h1>
    <p class="ar-sum">{e(a["excerpt"])}</p>
    <div class="ar-by"><img src="../../assets/romie-closeup.jpg" alt=""><span><b>Romie</b> · Glow Up Seoul · Updated {DATE_H} · {a["mins"]} min read</span></div>
  </header>
  <figure class="ar-img"><img src="{a["img"]}" alt=""></figure>
  {a["body"]}
  <section class="ar-ask"><h2>Not sure it’s right for you?</h2><p>Send Romie a photo and your concern. She’ll tell you honestly, even if the answer is “you don’t need this”.</p><a class="btn" href="{WA}?text={e(ask_text)}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Ask Romie on WhatsApp</a></section>
  <p class="ar-fine">This guide is general information, not medical advice. Whether a treatment suits you is decided by your doctor at consultation. Prices are reference prices from partner clinics for planning only.</p>
</article>
<section class="w ar-related"><h2>Keep reading</h2><div class="jc-grid">{related(a)}</div></section>'''
    url = f'{LIVE}journal/{a["slug"]}.html'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': a['title'], 'description': a['excerpt'], 'datePublished': DATE, 'dateModified': DATE, 'url': url,
         'author': {'@type': 'Person', 'name': 'Romie', 'jobTitle': 'Founder & coordinator, Glow Up Seoul'},
         'publisher': {'@type': 'Organization', 'name': 'Glow Up Seoul'}, 'inLanguage': 'en'},
        faq_ld(a['faq']),
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Journal', 'item': LIVE + 'journal.html'},
                                                         {'@type': 'ListItem', 'position': 2, 'name': a['title'], 'item': url}]}]}
    with open(os.path.join(OUT, 'journal', a['slug'] + '.html'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(shell('journal', a['title'] + ' · Glow Up Seoul (시안 D)', a['excerpt'], body, pre='../', ld=ld))

# ---------------- journal list ----------------
feat = BY['first-time-in-korea']
chips = ''.join(f'<button type="button" data-f="{e(c)}" aria-pressed="{"true" if i == 0 else "false"}">{e(c)}</button>' for i, c in enumerate(['All'] + CATS))
jbody = f'''<section class="w ph"><span class="k">Journal</span><h1>Seoul treatments, <mark class="hl">explained simply.</mark></h1>
  <p class="lead">Short, honest guides to the treatments people ask Romie about most: what it is, how it feels, how long it lasts and roughly what it costs in Seoul.</p>
  {note("새롬님 의견 반영: 시술 정보는 블로그 글로. 글은 정적 HTML이라 AI 검색(ChatGPT·Perplexity 등)이 읽을 수 있음. 실제 오픈 때 검색 허용(noindex 해제) 필요")}</section>
<section class="w">
  <a class="j-feature" href="journal/{feat["slug"]}.html"><img src="{feat["card_img"]}" alt=""><div class="jf-body"><span class="k">Start here</span><h2>{e(feat["title"])}</h2><p>{e(feat["excerpt"])}</p><span class="jc-meta">{feat["mins"]} min read · Romie</span></div></a>
  <div class="j-filter" role="group" aria-label="Filter guides">{chips}</div>
  <div class="jc-grid" id="jgrid">{"".join(card(a) for a in ARTICLES if a["slug"] != feat["slug"])}</div>
</section>
{ask_block("Can’t find your treatment?", "Tell Romie what you want to fix. She’ll explain the options, including ones not in the journal yet.")}
<script>
(function(){{var b=document.querySelectorAll('.j-filter button'),c=document.querySelectorAll('#jgrid .jc');
b.forEach(function(x){{x.addEventListener('click',function(){{var f=x.dataset.f;b.forEach(function(y){{y.setAttribute('aria-pressed',String(y===x))}});c.forEach(function(k){{k.hidden=!(f==='All'||k.dataset.cat===f)}})}})}})}})();
</script>'''
ld_list = {'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Glow Up Seoul Journal', 'url': LIVE + 'journal.html',
           'blogPost': [{'@type': 'BlogPosting', 'headline': a['title'], 'url': f'{LIVE}journal/{a["slug"]}.html', 'datePublished': DATE} for a in ARTICLES]}
open(os.path.join(OUT, 'journal.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('journal', 'Journal · Seoul treatments explained · Glow Up Seoul (시안 D)', 'Short, honest guides to Korean skin treatments by Romie, a coordinator in Seoul.', jbody, ld=ld_list))

# ---------------- FAQ page ----------------
def faq_views(ids, chat_ids=''):
    lst = ''.join(faq_item(FAQ[i]) for i in ids)
    ci = f' data-ids="{chat_ids}"' if chat_ids else ''
    return f'''<div data-views="chat">
  <div class="vt" role="group" aria-label="How to view the FAQ"><button type="button" data-view-btn="chat" aria-pressed="false">💬 Chat with Romie</button><button type="button" data-view-btn="list" aria-pressed="true">☰ All questions</button></div>
  <div data-view="chat" hidden><div data-gus="faqchat"{ci}></div></div>
  <div data-view="list"><div class="faq-list">{lst}</div></div>
</div>'''


groups = ''
for c in D['faqCats']:
    groups += f'<h2 class="faq-cat">{e(c)}</h2><div class="faq-list">' + ''.join(faq_item(f) for f in D['faq'] if f['c'] == c) + '</div>'
fbody = f'''<section class="w ph"><span class="k">FAQ</span><h1>Questions? <mark class="hl">Same.</mark></h1><p class="lead">Everything people ask Romie before their first trip. Most of these she has also answered on camera.</p></section>
<section class="w">
  <div data-views="chat">
    <div class="vt" role="group" aria-label="How to view the FAQ"><button type="button" data-view-btn="chat" aria-pressed="false">💬 Chat with Romie</button><button type="button" data-view-btn="list" aria-pressed="true">☰ All questions</button></div>
    <div data-view="chat" hidden><div data-gus="faqchat"></div></div>
    <div data-view="list">{groups}</div>
  </div>
</section>
{ask_block("Still curious?", "Ask Romie directly. Send a photo too if you like. She replies personally.")}'''
open(os.path.join(OUT, 'faq.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('faq', 'FAQ · Glow Up Seoul (시안 D)', 'Answers to common questions about treatments in Seoul: cost, safety, travel and aftercare.', fbody,
          ld={'@context': 'https://schema.org', **faq_ld([(f['q'], f['a']) for f in D['faq']])}))

# ---------------- home ----------------
P_ = {p['id']: p for p in D['photos']}
photos = ''.join(f'<figure class="g-photo"><img src="../assets/{P_[i]["src"]}" alt="{e(P_[i]["alt"])}" loading="lazy" style="object-position:{P_[i].get("pos", "50% 30%")}"><figcaption>{e(P_[i]["cap"])}</figcaption></figure>'
                 for i in ['mic', 'lobby', 'red', 'airport', 'street', 'window', 'men', 'wow'])
dms = ''.join('<div class="g-dm">' + ''.join(f'<p class="g-bub g-bub--{w}">{e(t)}</p>' for w, t in d['m']) + f'<small>{e(d["when"])}</small></div>' for d in D['dms'])
reels = ''.join(f'<a class="g-reel" href="{reel(r["id"])}" target="_blank" rel="noopener"><img src="../assets/{r["cover"]}" alt="" loading="lazy"><span class="g-reel-k">{e(r["k"])}</span><span class="g-reel-t">{e(r["t"])}</span><span class="g-reel-d">▶ {e(r["dur"])}</span></a>' for r in D['reels'])
mq = ''.join(f'<span>{e(t)}</span>' for t in D['marquee'])
home_cards = ''.join(card(BY[s]) for s in ['first-time-in-korea', 'rejuran', 'ulthera', 'this-or-that', 'botox', 'pico_laser', 'what-koreans-get-done'])
hbody = f'''<section class="w">
  <div class="bento">
    <div class="tile t-main">
      <span class="k soft" style="align-self:flex-start">{e(D["service"]["label"])}</span>
      <h1>Your friend in Seoul for <mark class="hl">clinics.</mark></h1>
      <p class="lead">I’m Romie. I match international patients with verified skin &amp; plastic surgery clinics, come with you on the day, and look after you once you’re home.</p>
      {svc()}
      <div class="btns"><a class="btn" href="{WA}?text={e("Hi Romie! 👋")}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Text me on WhatsApp</a><a class="btn o" href="journal.html">Read the journal</a></div>
      <div data-gus="status"></div>
    </div>
    <div class="tile t-collage" aria-label="Photos from Romie's Instagram">
      <figure class="p1"><img src="../assets/romie-mic.jpg" alt="Romie with a microphone in Gangnam" style="object-position:50% 20%" fetchpriority="high"><figcaption>gangnam, last week</figcaption></figure>
      <figure class="p2"><img src="../assets/airport2.jpg" alt="Romie hugging a patient at the airport" style="object-position:50% 30%"><figcaption>airport pickup</figcaption></figure>
      <figure class="p3"><img src="../assets/romie-desk.jpg" alt="Romie planning a clinic shortlist" style="object-position:50% 35%"><figcaption>your shortlist</figcaption></figure>
      <span class="stk s1">hi, i’m romie ✌️</span>
      <span class="stk s2">I come with you</span>
    </div>
    <div class="mini">
      <div class="tile t-free"><b>₩0</b><p>for you. Clinics pay us, only after your treatment.</p>{note("현 사이트 문구 기준, 확인 필요")}</div>
      <div class="tile t-num"><ul><li><b>500+</b><span>patients</span></li><li><b>25+</b><span>countries</span></li></ul></div>
    </div>
  </div>
</section>

<div class="mq"><div class="g-marquee" aria-label="{e(", ".join(D["marquee"]))}"><div class="g-marquee-track" aria-hidden="true">{mq}{mq}</div></div></div>

<section class="w sec">
  <div class="sh"><span class="k">what I do</span><h2>Three things. That’s it.</h2></div>
  <div class="do">
    <article><span class="n">01</span><h3>Find the right clinic</h3><p>Tell me what you’d like to change. I send 2–3 verified clinics with honest prices and downtime, not just the ones with the biggest ad budget.</p><img src="../assets/romie-profile.jpg" alt="" loading="lazy"></article>
    <article><span class="n">02</span><h3>Come with you</h3><p>I book it, meet you, sit next to you at the consultation, translate everything and walk you to the pharmacy. Coming alone is totally fine.</p><img src="../assets/street-ep1.jpg" alt="" loading="lazy"></article>
    <article><span class="n">03</span><h3>Check on you after</h3><p>Day 1, day 7, day 30. Send me a photo any time. If something feels off, I talk to the clinic for you, even after you’re home.</p><img src="../assets/airport.jpg" alt="" loading="lazy"></article>
  </div>
</section>

<section class="w">
  <div class="sh-row sh"><div style="display:grid;gap:12px"><span class="k butter" style="justify-self:start">journal</span><h2>Romie’s notes on Seoul treatments.</h2></div><a class="more" href="journal.html">All {len(ARTICLES)} guides →</a></div>
  <div class="jc-row">{home_cards}</div>
</section>

<section class="w sec">
  <div class="free">
    <div><span class="k butter">the money part</span><h2 style="margin-top:16px">Free for you. <span>Really.</span></h2>
      <p style="margin-top:16px">Clinics pay me a referral fee, and only after your treatment is done. You pay the clinic directly at the normal walk-in price, with a written quote before anything is booked.</p>{note("무료·수수료 구조 = 현 glowupseoul.com 문구 기준. 확인 필요")}</div>
    <div class="tiers">
      <div class="tier"><h3>Care <small>skin · free</small></h3><ul><li>1:1 with me from day one</li><li>Verified clinic match</li><li>I’m with you on the day</li><li>1-week check-in</li></ul></div>
      <div class="tier"><h3>Premium Care <small>surgery · free</small></h3><ul><li>Everything in Care</li><li>Airport pickup</li><li>Pharmacy + medication covered</li><li>Day 1 · 7 · 30 check-ins</li></ul></div>
    </div>
  </div>
</section>

<section class="w">
  <div class="sh"><span class="k">camera roll</span><h2>Behind the scenes.</h2><p>Clinic visits, airport pickups and street interviews in Gangnam, straight from our Instagram.</p></div>
  <div class="g-photos">{photos}</div>
  {note("사진은 인스타 릴스 화면(720p)에서 뽑은 것. 고화질 원본 받으면 교체")}
</section>

<section class="w sec">
  <div class="sh-row sh"><div style="display:grid;gap:12px"><span class="k">FAQ</span><h2>You’re probably wondering…</h2></div><a class="more" href="faq.html">All 22 →</a></div>
  {faq_views(['free', 'start', 'alone', 'trust', 'know', 'cheap'], 'start,alone,trust,know,cheap,free,when,days,wrong')}
</section>

<section class="w">
  <div class="dmz">
    <div class="sh"><span class="k">real messages</span><h2>Texts that make me cry at 2am.</h2><p style="color:#5A4038">Shared with permission. Names removed.</p></div>
    <div class="g-dms">{dms}</div>
    {note("인스타 캐러셀 DM 캡처를 텍스트로 옮김. 게재 전 당사자 동의 재확인")}
  </div>
</section>

<section class="w sec">
  <div class="sh"><span class="k">seoul skin talk</span><h2>Watch me answer.</h2></div>
  <div class="g-reels">{reels}</div>
</section>

{ask_block("Tell Romie what you want to fix.", "Your message gets written for you. Send it on WhatsApp, WeChat or email.")}'''
ld_home = {'@context': 'https://schema.org', '@type': 'Organization', 'name': 'Glow Up Seoul', 'url': LIVE, 'description': D['service']['line'],
           'founder': {'@type': 'Person', 'name': 'Romie'}, 'sameAs': ['https://www.instagram.com/glowupseoul/'],
           'contactPoint': {'@type': 'ContactPoint', 'contactType': 'customer service', 'telephone': '+82-10-6487-1060', 'availableLanguage': ['English', 'Chinese', 'Indonesian']}}
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8', newline='\n').write(
    shell('home', 'Glow Up Seoul · your friend in Seoul for clinics (시안 D)', D['service']['line'], hbody, ld=ld_home))

print(f'wrote D: home, journal ({len(ARTICLES)} articles), faq')
for a in ARTICLES:
    print(f"  {a['cat']:18s} {a['slug']:22s} {a['mins']}min  faq={len(a['faq'])}")
