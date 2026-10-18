// 블로그(Journal) 글 쓰기 — 홈페이지 /proposals/d/journal/ 에 일반 블로그 글처럼 올라간다.
// 기존 글 20개(코드로 만든 글)는 그대로 두고, 여기서 쓴 글이 목록 맨 앞에 같이 나온다 (server/routes/blogV3.js).
// 비개발자용: 제목·분류·한 줄 요약·표지 사진·본문만. 본문은 버튼으로 서식을 넣고 오른쪽에서 바로 미리 본다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { api, uploadToS3 } from './apiV3.js';

const SITE = '/proposals/d/journal/';
const BLANK = { title: '', category: '', excerpt: '', cover_url: '', body_md: '', slug: '', status: 'draft' };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

async function uploadImage(file, owner) {
  if (!file || !file.type.startsWith('image/')) throw new Error('사진 파일을 골라 주세요.');
  const ps = await api.presign({ kind: 'blog', owner: owner || 'post', slot: 'image', mime: file.type, size: file.size });
  return uploadToS3(ps, file);
}

// ---------------------------------------------------------------- list
function PostList({ onNew, onEdit }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [showOld, setShowOld] = useState(false);
  useEffect(() => { api.blogList().then(setData).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="v3a-list">
      <div className="v3a-list-top">
        <div>
          <h2>블로그 Journal</h2>
          <p className="v3a-sub">홈페이지 Journal 에 올라가는 글이에요. 사이트가 영어라 글도 영어로 써 주세요.</p>
        </div>
        <button className="v3a-btn v3a-btn-primary" onClick={onNew}>＋ 새 글 쓰기</button>
      </div>
      {err && <div className="v3a-error">불러오지 못했어요: {err}</div>}
      {!data && !err && <div className="v3a-empty">불러오는 중…</div>}
      {data && data.rows.length === 0 && (
        <div className="v3a-empty">아직 직접 쓴 글이 없어요.<br />
          <button className="v3a-btn v3a-btn-primary" onClick={onNew} style={{ marginTop: 14 }}>＋ 첫 글 쓰기</button>
        </div>
      )}
      {data && data.rows.length > 0 && (
        <div className="v3a-cards">
          {data.rows.map((r) => (
            <button key={r.id} className="v3a-card" onClick={() => onEdit(r.id)}>
              <div className="v3a-card-thumb" style={r.cover_url ? { backgroundImage: `url(${r.cover_url})` } : {}}>
                {!r.cover_url && <span>{(r.title || '?').slice(0, 1)}</span>}
              </div>
              <div className="v3a-card-body">
                <div className="v3a-card-name">{r.title}</div>
                {r.excerpt && <div className="v3a-card-summary">{r.excerpt}</div>}
                <div className="v3a-card-meta">
                  <span className={r.status === 'published' ? 'v3a-blog-pub' : 'v3a-badge-off'}>{r.status === 'published' ? '공개 중' : '임시저장'}</span>
                  {r.category && <span>{r.category}</span>}
                  <span>{r.status === 'published' ? `${fmt(r.published_at)} 공개` : `${fmt(r.updated_at)} 저장`}</span>
                </div>
              </div>
              <span className="v3a-card-arrow">›</span>
            </button>
          ))}
        </div>
      )}
      {data && (
        <div className="v3a-blog-old">
          <button type="button" className="v3a-advanced-toggle" onClick={() => setShowOld((v) => !v)}>
            {showOld ? '▾' : '▸'} 처음부터 있던 글 {data.static_posts.length}개 (가이드·장비 글 — 그대로 공개 중, 여기서는 수정 안 돼요)
          </button>
          {showOld && (
            <ul>
              {data.static_posts.map((p) => (
                <li key={p.slug}><a href={`${SITE}${p.slug}.html`} target="_blank" rel="noreferrer">{p.title}</a> <small>{p.cat}</small></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- body editor (toolbar + live preview)
function BodyEditor({ value, onChange, slug }) {
  const ta = useRef(null);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const html = useMemo(() => marked.parse(value || '', { breaks: true, gfm: true }), [value]);

  // wrap the selection (or insert a placeholder) and keep the cursor sensible
  function apply(kind) {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart; const e = el.selectionEnd; const v = value || '';
    const sel = v.slice(s, e);
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    let next = v; let cur = [s, e];
    const wrap = (a, b, ph) => { const t = sel || ph; next = v.slice(0, s) + a + t + b + v.slice(e); cur = [s + a.length, s + a.length + t.length]; };
    const prefix = (p) => {
      const lines = (sel || '').split('\n');
      if (!sel) { next = v.slice(0, lineStart) + p + v.slice(lineStart); cur = [s + p.length, s + p.length]; return; }
      const t = lines.map((l) => p + l).join('\n'); next = v.slice(0, s) + t + v.slice(e); cur = [s, s + t.length];
    };
    if (kind === 'h2') prefix('## ');
    if (kind === 'h3') prefix('### ');
    if (kind === 'b') wrap('**', '**', 'bold text');
    if (kind === 'ul') prefix('- ');
    if (kind === 'ol') prefix('1. ');
    if (kind === 'quote') prefix('> ');
    if (kind === 'link') { const url = window.prompt('링크 주소 (https://…)'); if (!url) return; wrap('[', `](${url})`, 'link text'); }
    if (kind === 'hr') { next = v.slice(0, s) + '\n\n---\n\n' + v.slice(e); cur = [s + 7, s + 7]; }
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cur[0], cur[1]); });
  }
  async function addImage(file) {
    setBusy(true); setErr(null);
    try {
      const url = await uploadImage(file, slug);
      const alt = window.prompt('사진 설명 (사진 아래에 작게 나와요. 비워도 돼요)', '') || '';
      const el = ta.current; const v = value || ''; const at = el ? el.selectionStart : v.length;
      const snippet = `\n\n![${alt.replace(/[[\]]/g, '')}](${url})\n\n`;
      onChange(v.slice(0, at) + snippet + v.slice(at));
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const B = (k, label, title) => <button type="button" className="v3a-blog-tool" title={title} onClick={() => apply(k)}>{label}</button>;
  return (
    <div className="v3a-blog-editor">
      <div className="v3a-blog-tools">
        {B('h2', '큰 소제목', '## 소제목 — 목차에 들어가요')}
        {B('h3', '작은 소제목', '### 작은 소제목')}
        {B('b', <b>굵게</b>, '선택한 글자를 굵게')}
        {B('ul', '• 목록', '점 목록')}
        {B('ol', '1. 목록', '번호 목록')}
        {B('quote', '❝ 인용', '강조하고 싶은 한 줄')}
        {B('link', '🔗 링크', '선택한 글자에 링크')}
        {B('hr', '― 구분선', '구분선')}
        <button type="button" className="v3a-blog-tool" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? '올리는 중…' : '🖼 사진 넣기'}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {err && <div className="v3a-uploader-err">{err}</div>}
      <div className="v3a-md-editor">
        <textarea ref={ta} className="v3a-md-src" rows={22} value={value || ''} onChange={(e) => onChange(e.target.value)}
          placeholder={'Write your article here.\n\n위 버튼으로 소제목·굵게·목록·사진을 넣을 수 있어요.\n소제목(큰 소제목)이 3개 이상이면 글 옆에 목차가 자동으로 생겨요.'}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const f = e.dataTransfer.files?.[0]; if (f) { e.preventDefault(); addImage(f); } }} />
        <div className="v3a-md-pane">
          <div className="v3a-md-pane-label">미리보기</div>
          {value && value.trim()
            ? <div className="v3a-md" dangerouslySetInnerHTML={{ __html: html }} />
            : <div className="v3a-md-empty">쓰는 대로 여기에 보여요.</div>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- edit
function PostEdit({ id, categories, onDone }) {
  const isNew = id == null;
  const [form, setForm] = useState(BLANK);
  const [row, setRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [cats, setCats] = useState(categories || []);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverRef = useRef(null);

  useEffect(() => {
    if (!categories) api.blogList().then((d) => setCats([...new Set([...(d.categories || []), ...d.rows.map((r) => r.category).filter(Boolean)])])).catch(() => {});
    if (isNew) return;
    api.blogGet(id).then((r) => { setRow(r); setForm({ ...BLANK, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? ''])) }); })
      .catch((e) => setErr(e.message));
  }, [id, isNew, categories]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const published = (row?.status || form.status) === 'published';

  async function save(status) {
    if (!form.title.trim()) { setErr('제목을 입력해 주세요.'); return; }
    if (status === 'published' && !form.body_md.trim()) { setErr('본문이 비어 있어요.'); return; }
    setSaving(true); setErr(null); setMsg(null);
    const body = { title: form.title, category: form.category, excerpt: form.excerpt, cover_url: form.cover_url, body_md: form.body_md, status };
    if (isNew || form.slug !== row?.slug) body.slug = form.slug;
    try {
      const r = isNew ? await api.blogCreate(body) : await api.blogUpdate(id, body);
      setRow(r); setForm((f) => ({ ...f, slug: r.slug, status: r.status }));
      setMsg(status === 'published' ? '공개했어요. 홈페이지 Journal 맨 앞에 나와요.' : '임시저장했어요. 아직 홈페이지에는 안 보여요.');
      if (isNew) onDone(r.id, true);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }
  async function remove() {
    if (!window.confirm('이 글을 지울까요? 되돌릴 수 없어요.')) return;
    try { await api.blogDelete(id); onDone(null); } catch (e) { setErr(e.message); }
  }
  async function preview() {
    const w = window.open('', '_blank');
    try {
      const html = await api.blogPreview({ ...form, published_at: row?.published_at || new Date().toISOString() });
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    } catch (e) { if (w) w.close(); setErr(e.message); }
  }
  async function cover(file) {
    setCoverBusy(true); setErr(null);
    try { set('cover_url', await uploadImage(file, form.slug)); } catch (e) { setErr(e.message); } finally { setCoverBusy(false); }
  }

  return (
    <div className="v3a-edit v3a-blog">
      <div className="v3a-edit-top">
        <button className="v3a-back" onClick={() => onDone(null)}>‹ 글 목록</button>
        <div className="v3a-blog-state">
          {published ? <span className="v3a-blog-pub">공개 중</span> : <span className="v3a-badge-off">임시저장</span>}
          {published && row?.slug && <a href={`${SITE}${row.slug}.html`} target="_blank" rel="noreferrer">사이트에서 보기 ↗</a>}
        </div>
      </div>
      {err && <div className="v3a-error">{err}</div>}
      {msg && <div className="v3a-blog-ok">{msg}</div>}

      <section className="v3a-sec">
        <label className="v3a-field">
          <span className="v3a-field-label">제목<em className="v3a-req"> *</em></span>
          <input className="v3a-blog-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. What to pack for your first treatment trip to Seoul" />
        </label>
        <div className="v3a-blog-row">
          <label className="v3a-field">
            <span className="v3a-field-label">분류</span>
            <span className="v3a-field-help">목록 위 분류 버튼으로 쓰여요. 기존 분류를 고르거나 새로 적어도 돼요.</span>
            <input list="v3a-blog-cats" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Guides" />
            <datalist id="v3a-blog-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="v3a-field">
            <span className="v3a-field-label">주소 (선택)</span>
            <span className="v3a-field-help">비워 두면 제목으로 자동으로 만들어요. 영어 소문자·숫자·-</span>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="what-to-pack-for-seoul" />
          </label>
        </div>
        <label className="v3a-field">
          <span className="v3a-field-label">한 줄 요약</span>
          <span className="v3a-field-help">제목 아래와 구글 검색 결과에 나와요. 1~2문장.</span>
          <textarea rows={2} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={400} />
        </label>
        <div className="v3a-field">
          <span className="v3a-field-label">표지 사진 (선택)</span>
          <span className="v3a-field-help">목록 카드와 글 맨 위에 나와요. 세로 사진이 잘 어울려요. 없으면 글자 표지가 나와요.</span>
          <div className="v3a-uploader">
            {form.cover_url ? (
              <div className="v3a-uploader-preview">
                <img src={form.cover_url} alt="" />
                <div className="v3a-uploader-actions">
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={coverBusy}>{coverBusy ? '올리는 중…' : '바꾸기'}</button>
                  <button type="button" className="rm" onClick={() => set('cover_url', '')}>빼기</button>
                </div>
              </div>
            ) : (
              <button type="button" className="v3a-uploader-drop" disabled={coverBusy} onClick={() => coverRef.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); cover(e.dataTransfer.files?.[0]); }}>
                <span className="v3a-uploader-ico">🖼</span>{coverBusy ? '올리는 중…' : '눌러서 고르거나 사진을 끌어다 놓으세요'}
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => { cover(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
      </section>

      <section className="v3a-sec">
        <span className="v3a-field-label">본문</span>
        <BodyEditor value={form.body_md} onChange={(v) => set('body_md', v)} slug={form.slug} />
      </section>

      <div className="v3a-edit-actions v3a-blog-actions">
        <button className="v3a-btn" onClick={preview} disabled={saving}>실제 화면으로 미리보기 ↗</button>
        <span style={{ flex: 1 }} />
        {published
          ? <button className="v3a-btn" onClick={() => save('draft')} disabled={saving}>공개 취소 (임시저장으로)</button>
          : <button className="v3a-btn" onClick={() => save('draft')} disabled={saving}>임시저장</button>}
        <button className="v3a-btn v3a-btn-primary v3a-btn-lg" onClick={() => save('published')} disabled={saving}>
          {saving ? '저장 중…' : published ? '수정 내용 공개' : '공개하기'}
        </button>
        {!isNew && <button className="v3a-btn v3a-btn-danger" onClick={remove} disabled={saving}>삭제</button>}
      </div>
    </div>
  );
}

export default function BlogAdmin() {
  const [view, setView] = useState({ name: 'list', id: null, key: 0 });
  const done = useCallback((newId, stay) => {
    if (stay && newId) setView((v) => ({ name: 'edit', id: newId, key: v.key }));
    else setView((v) => ({ name: 'list', id: null, key: v.key + 1 }));
  }, []);
  if (view.name === 'edit') return <PostEdit key={`${view.id}`} id={view.id} onDone={done} />;
  return <PostList key={view.key} onNew={() => setView((v) => ({ ...v, name: 'edit', id: null }))} onEdit={(id) => setView((v) => ({ ...v, name: 'edit', id }))} />;
}
