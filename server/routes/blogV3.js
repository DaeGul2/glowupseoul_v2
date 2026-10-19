// Journal 블로그 — admin 이 직접 쓰는 글(DB) + 기존 정적 글(파일)을 한 블로그로 묶는다.
//
// 정적 글: scripts/proposals/build_d.py 가 client/public/proposals/d/journal/*.html 로 생성. 그대로 둔다.
// DB 글:   blog_posts 테이블. 서버가 정적 페이지와 같은 머리말·꼬리말 틀(_post.html)에 끼워 HTML 로 렌더
//          (AI 검색 크롤러는 JS 를 안 돌리므로 서버에서 완성된 HTML 을 준다).
// 목록:    journal/index.html 과 홈(index.html)의 표시 자리(<!--GUS:...-->)에 DB 글 카드를 끼워 넣는다.
//          DB 가 죽어도 정적 페이지는 표시 자리만 비운 채 그대로 나간다.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Marked } from 'marked';
import { BlogPost, Op } from '../db/modelsV3.js';
import { hasDbConfig } from '../db/sequelize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// client/public 은 저장소에 항상 있으므로(Render 포함) 원본을 직접 읽는다. dev 에서도 같은 파일.
const PROPOSALS = path.resolve(__dirname, '../../client/public/proposals');
const D_DIR = path.join(PROPOSALS, 'd');
const J_DIR = path.join(D_DIR, 'journal');
const BASE = '/proposals/d/';
const SITE = (process.env.PROPOSALS_ORIGIN || 'https://glowupseoul.onrender.com').replace(/\/$/, '');

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const words = (html) => String(html).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Seoul' });
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

// admin 이 쓴 Markdown → HTML. raw HTML 은 글자 그대로 보이게(이스케이프), 링크는 새 탭.
const md = new Marked({ gfm: true, breaks: true });
md.use({
  renderer: {
    html(token) { return esc(typeof token === 'string' ? token : token?.text || ''); },
    link(href, title, text) {
      const h = typeof href === 'object' ? href.href : href;
      const t = typeof href === 'object' ? href.text : text;
      if (!/^(https?:|mailto:|\/|#|[a-z0-9-]+\.html)/i.test(h || '')) return t;
      const ext = /^https?:/i.test(h) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${esc(h)}"${ext}>${t}</a>`;
    },
    image(href, title, text) {
      const h = typeof href === 'object' ? href.href : href;
      const alt = typeof href === 'object' ? href.text : text;
      if (!/^https?:\/\//i.test(h || '')) return '';
      return `<figure class="ar-fig"><img src="${esc(h)}" alt="${esc(alt)}" loading="lazy" decoding="async">${alt ? `<figcaption>${esc(alt)}</figcaption>` : ''}</figure>`;
    },
  },
});
export const renderMarkdown = (src) => md.parse(String(src || ''))
  .replace(/<p>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/g, '$1')   // 사진 한 줄 = 문단 밖으로
  .replace(/<table>/g, '<div class="md-table"><table>').replace(/<\/table>/g, '</table></div>');

// h2 에 id 를 달고 목차를 만든다 (정적 글의 add_toc 와 같은 규칙).
function addToc(html) {
  const toc = []; const used = new Set();
  const out = html.replace(/<h2>(.*?)<\/h2>/g, (_m, inner) => {
    let id = inner.replace(/<[^>]+>/g, '').toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 's';
    while (used.has(id)) id += '-2';
    used.add(id); toc.push([id, inner]);
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

let tableReady = null;
function ensureTable() {
  if (!tableReady) tableReady = BlogPost.sync().catch((e) => { tableReady = null; throw e; });
  return tableReady;
}

// 정적 글 목록 (build_d.py 가 쓰는 posts.json). 파일이 바뀌면 다시 읽는다.
let staticCache = { mtime: 0, data: { posts: [], cats: [], glyph: {} } };
function staticPosts() {
  try {
    const f = path.join(J_DIR, 'posts.json');
    const m = fs.statSync(f).mtimeMs;
    if (m !== staticCache.mtime) staticCache = { mtime: m, data: JSON.parse(fs.readFileSync(f, 'utf8')) };
  } catch { /* posts.json 없으면 빈 목록 */ }
  return staticCache.data;
}
const staticSlugs = () => new Set(staticPosts().posts.map((p) => p.slug));

async function publishedPosts() {
  if (!hasDbConfig()) return [];
  try {
    await ensureTable();
    return await BlogPost.findAll({
      where: { status: 'published', published_at: { [Op.lte]: new Date() } },
      order: [['published_at', 'DESC']],
      attributes: ['slug', 'title', 'excerpt', 'category', 'cover_url', 'published_at', 'body_md'],
    });
  } catch (e) {
    console.warn('[blog] db read failed', e.message);
    return [];
  }
}

// ---------------------------------------------------------------- cards (build_d.py 의 card() 와 같은 마크업)
function cardHtml({ href, cat, title, meta, media }) {
  return `<a class="pc" href="${esc(href)}" data-cat="${esc(cat)}"><span class="pc-m">${media}</span>`
    + `<span class="pc-k">${esc(cat)}</span><span class="pc-t">${esc(title)}</span><span class="pc-d">${esc(meta)}</span></a>`;
}
const dbMedia = (p) => (p.cover_url
  ? `<img src="${esc(p.cover_url)}" alt="" loading="lazy" decoding="async">`
  : `<span class="pc-g pc-tx"><b>${esc(p.category || 'Journal')}</b></span>`);
const minsOf = (p) => Math.max(1, Math.ceil(words(renderMarkdown(p.body_md)) / 200));
function dbCard(p, hrefPre) {
  return cardHtml({ href: `${hrefPre}${p.slug}.html`, cat: p.category || 'Journal', title: p.title,
    meta: `${fmtDate(p.published_at)} · ${minsOf(p)} min read`, media: dbMedia(p) });
}
function staticCard(p, hrefPre, assetsPre) {
  const media = p.media?.type === 'photo'
    ? `<img src="${assetsPre}${esc(p.media.src)}" alt="" loading="lazy" decoding="async" style="object-position:${esc(p.media.pos || '50% 25%')}">`
    : `<span class="pc-g">${p.media?.svg || ''}</span>`;
  return cardHtml({ href: `${hrefPre}${p.slug}.html`, cat: p.cat, title: p.title, meta: p.meta, media });
}

// ---------------------------------------------------------------- page renderers
const readFile = (f) => fs.readFileSync(f, 'utf8');
const between = (html, tag, inner) => html.replace(new RegExp(`<!--GUS:${tag}-->[\\s\\S]*?<!--GUS:/${tag}-->`), `<!--GUS:${tag}-->${inner}<!--GUS:/${tag}-->`);

async function renderJournalIndex() {
  let html = readFile(path.join(J_DIR, 'index.html'));
  const rows = await publishedPosts();
  if (!rows.length) return html;
  const cats = staticPosts().cats || [];
  const newCats = [...new Set(rows.map((p) => p.category).filter((c) => c && !cats.includes(c)))];
  html = html.replace('<!--GUS:DB_POSTS-->', rows.map((p) => dbCard(p, '')).join(''));
  html = html.replace('<!--GUS:DB_CATS-->', newCats.map((c) => `<button type="button" data-f="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join(''));
  return html;
}

async function renderHome() {
  let html = readFile(path.join(D_DIR, 'index.html'));
  const rows = await publishedPosts();
  if (!rows.length) return html;
  const st = staticPosts().posts.filter((p) => p.home);
  const cards = [...rows.map((p) => dbCard(p, 'journal/')), ...st.map((p) => staticCard(p, 'journal/', '../assets/'))].slice(0, 3);
  return between(html, 'LATEST', cards.join(''));
}

function articleBody(p, { preview = false } = {}) {
  const { html, toc } = addToc(renderMarkdown(p.body_md));
  const cat = p.category || 'Journal';
  const when = p.published_at ? fmtDate(p.published_at) : 'Draft';
  const mins = Math.max(1, Math.ceil(words(html) / 200));
  const tocHtml = toc.length > 2
    ? `<aside class="bl-toc"><details><summary>In this article</summary><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></details></aside>`
    : '';
  const cover = p.cover_url ? `<figure class="bl-fig"><img src="${esc(p.cover_url)}" alt="" fetchpriority="high"></figure>` : '';
  const ask = `Hi Romie! I read your article "${p.title}". `;
  const related = staticPosts().posts.filter((x) => x.home).slice(0, 3).map((x) => staticCard(x, '', '../../assets/')).join('');
  return `${preview ? '<div class="bl-preview">미리보기 · 아직 공개되지 않은 화면이에요</div>' : ''}
<article class="w bl-art">
  <nav class="ar-crumb" aria-label="Breadcrumb"><a href="index.html">Journal</a><span>/</span><span>${esc(cat)}</span></nav>
  <header class="bl-head${p.cover_url ? '' : ' no-fig'}">
    <div class="bl-ht">
      <span class="k">${esc(cat)}</span>
      <h1 class="split">${esc(p.title)}</h1>
      ${p.excerpt ? `<p class="ar-sum">${esc(p.excerpt)}</p>` : ''}
      <div class="ar-by"><img src="../../assets/romie-closeup.jpg" alt=""><span><b>Romie</b> · ${esc(when)} · ${mins} min read</span></div>
    </div>
    ${cover}
  </header>
  <div class="bl-grid${tocHtml ? '' : ' no-toc'}">
    ${tocHtml}
    <div class="bl-main">
      <div class="ar-body">${html}</div>
      <section class="ar-ask"><h2>Not sure it’s right for you?</h2><p>Send Romie a photo and your concern. She’ll tell you honestly, even if the answer is “you don’t need this”.</p><a class="btn light" href="https://wa.me/821064871060?text=${encodeURIComponent(ask)}" target="_blank" rel="noopener"><span class="ico-wa" aria-hidden="true"></span>Ask Romie on WhatsApp</a></section>
    </div>
  </div>
</article>
${related ? `<section class="w bl-related"><h2>Keep reading</h2><div class="pcs">${related}</div></section>` : ''}`;
}

function renderPostPage(p, opts = {}) {
  const tpl = readFile(path.join(J_DIR, '_post.html'));
  const desc = p.excerpt || renderMarkdown(p.body_md).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155);
  const url = `${SITE}${BASE}journal/${p.slug}.html`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc, url,
    datePublished: p.published_at ? isoDate(p.published_at) : undefined,
    dateModified: p.updated_at ? isoDate(p.updated_at) : undefined,
    image: p.cover_url || undefined,
    author: { '@type': 'Person', name: 'Romie', jobTitle: 'Founder & coordinator, Glow Up Seoul' },
    publisher: { '@type': 'Organization', name: 'Glow Up Seoul' },
    isPartOf: { '@type': 'Blog', name: 'Glow Up Seoul Journal', url: `${SITE}${BASE}journal/index.html` },
    inLanguage: 'en',
  };
  let html = tpl
    .replaceAll('%%GUS_TITLE%%', esc(`${p.title} · Glow Up Seoul`))
    .replaceAll('%%GUS_DESC%%', esc(desc))
    .replace('%%GUS_LD%%', JSON.stringify(ld).replace(/</g, '\\u003c'))
    .replace('%%GUS_BODY%%', () => articleBody(p, opts));
  if (opts.preview) html = html.replace('<head>', `<head>\n<base href="${BASE}journal/">`);
  return html;
}

// ---------------------------------------------------------------- public router (/proposals/d/...)
export const proposalsRouter = express.Router();
const sendHtml = (res, html) => { res.set('Cache-Control', 'no-cache'); res.type('html').send(html); };

proposalsRouter.get(['/proposals/d', '/proposals/d/', '/proposals/d/index.html'], async (req, res, next) => {
  if (req.path === '/proposals/d') return res.redirect(301, BASE);
  try { sendHtml(res, await renderHome()); } catch (e) { next(e); }
});
proposalsRouter.get(['/proposals/d/journal', '/proposals/d/journal/', '/proposals/d/journal/index.html'], async (req, res, next) => {
  if (req.path === '/proposals/d/journal') return res.redirect(301, `${BASE}journal/`);
  try { sendHtml(res, await renderJournalIndex()); } catch (e) { next(e); }
});
proposalsRouter.get('/proposals/d/journal/:slug.html', async (req, res, next) => {
  const { slug } = req.params;
  if (slug.startsWith('_')) return res.status(404).end();
  if (fs.existsSync(path.join(J_DIR, `${slug}.html`))) return next();   // 정적 글 → static 이 처리
  if (!hasDbConfig() || !/^[a-z0-9-]{1,80}$/.test(slug)) return next();
  try {
    await ensureTable();
    const p = await BlogPost.findOne({ where: { slug, status: 'published', published_at: { [Op.lte]: new Date() } } });
    if (!p) return next();
    sendHtml(res, renderPostPage(p));
  } catch (e) { next(e); }
});
// 나머지 시안 파일(css/js/사진/정적 글). dev(Vite 프록시)에서도 같은 원본을 준다.
// 글꼴(assets/fonts/*.woff2)은 파일 이름에 버전이 들어 있어서 1년 캐시, 나머지는 매번 확인(no-cache).
proposalsRouter.use('/proposals', express.static(PROPOSALS, {
  setHeaders: (res, file) => res.set('Cache-Control', /[\\/]fonts[\\/][^\\/]+\.woff2$/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache'),
}));

// ---------------------------------------------------------------- admin API (/api/v3/admin/blog-posts)
const COLS = ['title', 'slug', 'excerpt', 'category', 'cover_url', 'body_md', 'status'];
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error('[blog admin]', e);
  res.status(500).json({ error: e.message || 'internal' });
});

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
}

async function cleanBody(body, current) {
  const out = {};
  for (const c of COLS) if (c in body) out[c] = typeof body[c] === 'string' ? body[c].trim() : body[c];
  if ('title' in out && !out.title) throw Object.assign(new Error('제목을 입력해 주세요.'), { status: 400 });
  if ('status' in out && !['draft', 'published'].includes(out.status)) delete out.status;
  if (!current || 'slug' in out) {
    let slug = slugify(out.slug || out.title || current?.title) || `post-${Date.now().toString(36)}`;
    if (staticSlugs().has(slug)) throw Object.assign(new Error(`주소 "${slug}" 는 기존 글이 쓰고 있어요. 다른 주소를 넣어 주세요.`), { status: 409 });
    const clash = await BlogPost.findOne({ where: { slug, ...(current ? { id: { [Op.ne]: current.id } } : {}) } });
    if (clash) throw Object.assign(new Error(`주소 "${slug}" 는 다른 글이 이미 쓰고 있어요.`), { status: 409 });
    out.slug = slug;
  }
  for (const k of ['excerpt', 'category', 'cover_url']) if (out[k] === '') out[k] = null;
  if (out.excerpt) out.excerpt = out.excerpt.slice(0, 400);
  const status = out.status || current?.status;
  if (status === 'published' && !(current?.published_at)) out.published_at = new Date();
  if ('published_at' in body && body.published_at) out.published_at = new Date(body.published_at);
  return out;
}
const fail = (res, e) => res.status(e.status || 500).json({ error: e.message });

export const blogAdminList = wrap(async (_req, res) => {
  await ensureTable();
  const rows = await BlogPost.findAll({ order: [['updated_at', 'DESC']], attributes: { exclude: ['body_md'] } });
  const st = staticPosts();
  res.json({ rows, static_posts: st.posts.map(({ slug, title, cat }) => ({ slug, title, cat })), categories: st.cats || [] });
});
export const blogAdminGet = wrap(async (req, res) => {
  await ensureTable();
  const row = await BlogPost.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: '글을 찾을 수 없어요.' });
  res.json(row);
});
export const blogAdminCreate = wrap(async (req, res) => {
  await ensureTable();
  try { res.status(201).json(await BlogPost.create(await cleanBody(req.body || {}, null))); } catch (e) { fail(res, e); }
});
export const blogAdminUpdate = wrap(async (req, res) => {
  await ensureTable();
  const row = await BlogPost.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: '글을 찾을 수 없어요.' });
  try { await row.update(await cleanBody(req.body || {}, row)); res.json(row); } catch (e) { fail(res, e); }
});
export const blogAdminDelete = wrap(async (req, res) => {
  await ensureTable();
  const n = await BlogPost.destroy({ where: { id: req.params.id } });
  res.json({ ok: n > 0 });
});
// 저장 전 미리보기: 지금 입력한 내용 그대로 실제 글 화면 HTML 을 돌려준다.
export const blogAdminPreview = wrap(async (req, res) => {
  const b = req.body || {};
  const p = { title: b.title || 'Untitled', excerpt: b.excerpt, category: b.category, cover_url: b.cover_url,
    body_md: b.body_md, slug: 'preview', published_at: b.published_at || null };
  res.type('html').send(renderPostPage(p, { preview: true }));
});
