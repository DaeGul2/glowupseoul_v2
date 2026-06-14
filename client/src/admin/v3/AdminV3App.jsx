// v3 Admin — simple, intuitive treatments/surgeries manager. English only.
// State machine: login → list (Treatments/Surgeries tabs) → edit.
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { api, uploadToS3, verifyKey, setKey, clearKey, isAuthed } from './apiV3.js';
import './adminV3.css';

marked.setOptions({ breaks: true, gfm: true });

const KINDS = [
  { key: 'treatments', label: 'Treatments', hint: 'Non-surgical (Ulthera, Thermage, fillers …)' },
  { key: 'surgeries',  label: 'Surgeries',  hint: 'Surgical (rhinoplasty, facelift …)' },
];

const PAIN = [
  { v: 'soft', label: 'Soft', emoji: '🙂' },
  { v: 'mild', label: 'Mild', emoji: '😐' },
  { v: 'hard', label: 'Hard', emoji: '😣' },
];
const RECOVERY = [
  { v: 'immediate',   label: 'Back to normal right away', emoji: '⚡' },
  { v: '1_2_days',    label: '1–2 days',                  emoji: '🌙' },
  { v: '1_week_plus', label: '1 week or more',            emoji: '🗓️' },
];
// Standardized so it can be matched to concerns (no free text).
const DURATION = [
  { v: 'temporary',      label: 'Temporary' },
  { v: 'months_3_6',     label: '~3–6 months' },
  { v: 'months_6_12',    label: '~6–12 months' },
  { v: 'year_1_2',       label: '~1–2 years' },
  { v: 'years_2_plus',   label: '2+ years' },
  { v: 'semi_permanent', label: 'Semi-permanent' },
  { v: 'permanent',      label: 'Permanent' },
];

const painLabel     = (v) => PAIN.find((p) => p.v === v)?.label || '—';
const recoveryLabel = (v) => RECOVERY.find((r) => r.v === v)?.label || '—';
const durationLabel = (v) => DURATION.find((d) => d.v === v)?.label || '—';

// ---------------------------------------------------------------- Login
function Login({ onOk }) {
  const [key, setK] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const ok = await verifyKey(key);
    setBusy(false);
    if (!ok) { setErr('That admin key is not correct.'); return; }
    setKey(key); onOk();
  }
  return (
    <div className="v3a-login">
      <form className="v3a-login-card" onSubmit={submit}>
        <div className="v3a-login-mark">✦</div>
        <h1>Glow Up Seoul</h1>
        <p>Sign in to the admin panel.</p>
        <input type="password" value={key} onChange={(e) => setK(e.target.value)}
          placeholder="Admin key" autoFocus />
        {err && <div className="v3a-login-err">{err}</div>}
        <button type="submit" disabled={busy || !key}>{busy ? 'Checking…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- List
function List({ kind, onAdd, onEdit, refreshToken }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try { const d = await api.list(kind, q); setRows(d.rows || []); }
    catch (e) { setErr(e.message); setRows([]); }
  }, [kind, q]);

  useEffect(() => { load(); }, [load, refreshToken]);

  const meta = KINDS.find((k) => k.key === kind);

  return (
    <div className="v3a-list">
      <div className="v3a-list-top">
        <div>
          <h2>{meta.label}</h2>
          <p className="v3a-sub">{meta.hint}</p>
        </div>
        <button className="v3a-btn v3a-btn-primary" onClick={onAdd}>＋ New {meta.label.replace(/s$/, '')}</button>
      </div>

      <div className="v3a-search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" />
      </div>

      {err && <div className="v3a-error">Failed to load: {err}</div>}
      {rows == null && <div className="v3a-empty">Loading…</div>}
      {rows && rows.length === 0 && (
        <div className="v3a-empty">
          No {meta.label.toLowerCase()} yet.<br />
          <button className="v3a-btn v3a-btn-primary" onClick={onAdd} style={{ marginTop: 14 }}>＋ Add the first one</button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="v3a-cards">
          {rows.map((r) => (
            <button key={r.id} className="v3a-card" onClick={() => onEdit(r.id)}>
              <div className="v3a-card-thumb" style={r.thumbnail_url ? { backgroundImage: `url(${r.thumbnail_url})` } : {}}>
                {!r.thumbnail_url && <span>{(r.name || '?').slice(0, 1)}</span>}
              </div>
              <div className="v3a-card-body">
                <div className="v3a-card-name">{r.name}</div>
                {r.summary && <div className="v3a-card-summary">{r.summary}</div>}
                <div className="v3a-card-meta">
                  <span>💰 {r.price_krw != null ? `₩${Number(r.price_krw).toLocaleString()}` : 'Consult'}</span>
                  <span>⏱ {recoveryLabel(r.recovery_level)}</span>
                  <span>⏳ {durationLabel(r.duration)}</span>
                  <span>Pain {painLabel(r.pain_level)}</span>
                  {!r.is_active && <span className="v3a-badge-off">Hidden</span>}
                </div>
                {Array.isArray(r.tags) && r.tags.length > 0 && (
                  <div className="v3a-card-tags">
                    {r.tags.map((t) => <span key={t.id} className="v3a-card-tag">{t.name}</span>)}
                  </div>
                )}
              </div>
              <span className="v3a-card-arrow">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Field helpers
function Field({ label, help, required, children }) {
  return (
    <label className="v3a-field">
      <span className="v3a-field-label">{label}{required && <em className="v3a-req"> *</em>}</span>
      {help && <span className="v3a-field-help">{help}</span>}
      {children}
    </label>
  );
}
function Choice({ options, value, onChange }) {
  return (
    <div className="v3a-choice">
      {options.map((o) => (
        <button type="button" key={o.v}
          className={`v3a-choice-btn ${value === o.v ? 'on' : ''}`}
          onClick={() => onChange(value === o.v ? null : o.v)}>
          {o.emoji && <span className="v3a-choice-emoji">{o.emoji}</span>}{o.label}
        </button>
      ))}
    </div>
  );
}

const BLANK = {
  name: '', summary: '', description: '',
  price_krw: '', price_note: '', duration: null,
  pain_level: null, recovery_level: null, recovery_note: '',
  benefits: [], cautions: [], linked_note: '', thumbnail_url: '',
  display_order: 0, is_active: true, slug: '',
};

// Markdown editor with live preview. Writes raw MD; preview renders via marked.
const MD_PLACEHOLDER = `# How it works

Write the full description in **Markdown**.

## What to expect
- Quick, comfortable session
- Little to no downtime

> A highlighted note for the patient.

Add **bold**, *italic*, and [links](https://glowupseoul.com).`;

function MarkdownEditor({ value, onChange }) {
  const html = useMemo(() => marked.parse(value || ''), [value]);
  return (
    <div className="v3a-md-editor">
      <textarea className="v3a-md-src" rows={14} value={value || ''}
        onChange={(e) => onChange(e.target.value)} placeholder={MD_PLACEHOLDER} spellCheck={false} />
      <div className="v3a-md-pane">
        <div className="v3a-md-pane-label">Live preview</div>
        {value && value.trim()
          ? <div className="v3a-md" dangerouslySetInnerHTML={{ __html: html }} />
          : <div className="v3a-md-empty">Rendered Markdown appears here as you type.</div>}
      </div>
    </div>
  );
}

// Direct image upload to S3 (presign → PUT). Shows a preview; no URL typing.
function ImageUpload({ kind, owner, value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function handle(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }
    setBusy(true); setErr(null);
    try {
      const ps = await api.presign({ kind, owner: owner || 'new', slot: 'thumbnail', mime: file.type, size: file.size });
      const url = await uploadToS3(ps, file);
      onChange(url);
    } catch (e) { setErr(e.message || 'upload failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="v3a-uploader">
      {value ? (
        <div className="v3a-uploader-preview">
          <img src={value} alt="thumbnail" />
          <div className="v3a-uploader-actions">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Replace'}</button>
            <button type="button" className="rm" onClick={() => onChange('')} disabled={busy}>Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" className="v3a-uploader-drop" disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files?.[0]); }}>
          <span className="v3a-uploader-ico">🖼</span>
          {busy ? 'Uploading…' : 'Click or drop an image to upload'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ''; }} />
      {err && <div className="v3a-uploader-err">{err}</div>}
    </div>
  );
}

// Inline-editable text — shows a saved value as plain text; click to edit.
// (So already-entered values aren't permanent input boxes.)
function InlineText({ value, onSave, placeholder, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  function commit() { setEditing(false); const t = (v || '').trim(); if (t !== (value || '')) onSave(t); }
  if (editing) {
    return (
      <input autoFocus className={`v3a-inline-input ${className}`} value={v} placeholder={placeholder}
        onChange={(e) => setV(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') { setV(value ?? ''); setEditing(false); } }} />
    );
  }
  return (
    <span className={`v3a-inline-text ${className}`} onClick={() => setEditing(true)} title="클릭해서 수정">
      {value ? value : <em>{placeholder || '입력…'}</em>}
    </span>
  );
}

// Repeatable string list — saved items show as text (click to edit); add via the bottom field.
function ListEditor({ value, onChange, placeholder }) {
  const items = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState('');
  const add = () => { const t = draft.trim(); if (!t) return; onChange([...items, t]); setDraft(''); };
  return (
    <div className="v3a-list-edit">
      {items.map((it, i) => (
        <div className="v3a-list-edit-row" key={i}>
          <span className="v3a-list-edit-bullet">•</span>
          <InlineText value={it} placeholder={placeholder} className="v3a-inline-grow"
            onSave={(t) => onChange(items.map((x, idx) => (idx === i ? t : x)).filter(Boolean))} />
          <button type="button" className="v3a-list-edit-x" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="remove">×</button>
        </div>
      ))}
      <div className="v3a-list-edit-addrow">
        <input value={draft} placeholder={placeholder || 'Add an item…'} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="v3a-list-edit-add" onClick={add}>＋ Add</button>
      </div>
    </div>
  );
}

// Tag editor — add/remove chips one by one. Existing tags autocomplete; new ones are created.
function TagEditor({ value, onChange }) {
  const [all, setAll] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.listTags().then((d) => setAll(d.rows || [])).catch(() => {}); }, []);

  const selectedIds = new Set(value.map((t) => t.id));
  const q = text.trim().toLowerCase();
  const suggestions = q
    ? all.filter((t) => !selectedIds.has(t.id) && t.name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const exactExists = all.some((t) => t.name.toLowerCase() === q) || value.some((t) => t.name.toLowerCase() === q);

  function add(tag) { if (!selectedIds.has(tag.id)) onChange([...value, tag]); setText(''); }
  function remove(id) { onChange(value.filter((t) => t.id !== id)); }

  async function createAndAdd() {
    const name = text.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const d = await api.createTag({ name });
      const tag = d.row;
      setAll((a) => (a.some((t) => t.id === tag.id) ? a : [...a, tag]));
      add(tag);
    } catch { /* noop */ } finally { setBusy(false); }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const match = all.find((t) => t.name.toLowerCase() === q);
      if (match) add(match);
      else if (q) createAndAdd();
    } else if (e.key === 'Backspace' && !text && value.length) {
      remove(value[value.length - 1].id);
    }
  }

  return (
    <div className="v3a-tags">
      <div className="v3a-tags-box">
        {value.map((t) => (
          <span key={t.id} className="v3a-tagchip">
            {t.name}
            <button type="button" onClick={() => remove(t.id)} aria-label="Remove">×</button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
          placeholder={value.length ? '' : 'Type a tag, then Enter'} />
      </div>
      {q && (
        <div className="v3a-tags-suggest">
          {suggestions.map((t) => (
            <button type="button" key={t.id} onClick={() => add(t)}>{t.name}</button>
          ))}
          {!exactExists && (
            <button type="button" className="new" disabled={busy} onClick={createAndAdd}>
              ＋ Add "{text.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Concern-link editor — relate this procedure to concerns (multiple) + a reason each.
function ConcernLinksEditor({ value, onChange }) {
  const [all, setAll] = useState([]);
  useEffect(() => { api.list('concerns').then((d) => setAll(d.rows || [])).catch(() => {}); }, []);
  const items = Array.isArray(value) ? value : [];
  const used = new Set(items.map((i) => Number(i.concern_id)).filter(Boolean));
  const setAt = (i, patch) => onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const byArea = {};
  for (const c of all) { const a = c.area?.name || '(no area)'; (byArea[a] ||= []).push(c); }
  return (
    <div className="v3a-cl">
      {items.map((it, i) => (
        <div className="v3a-cl-row" key={i}>
          <select className="v3a-cl-sel" value={it.concern_id || ''} onChange={(e) => setAt(i, { concern_id: Number(e.target.value) })}>
            <option value="">고민 선택…</option>
            {Object.entries(byArea).map(([area, cs]) => (
              <optgroup key={area} label={area}>
                {cs.map((c) => <option key={c.id} value={c.id} disabled={used.has(c.id) && Number(it.concern_id) !== c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          <InlineText className="v3a-cl-reason" placeholder="이유 — 왜 이 시술이 이 고민에 좋은지" value={it.reason || ''} onSave={(reason) => setAt(i, { reason })} />
          <button type="button" className="v3a-list-edit-x" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="remove">×</button>
        </div>
      ))}
      <button type="button" className="v3a-list-edit-add" onClick={() => onChange([...items, { concern_id: '', reason: '', relevance: 'primary' }])}>＋ 고민 연결 추가</button>
      {all.length === 0 && <div className="v3a-sec-hint" style={{ margin: '8px 0 0' }}>먼저 "고민" 탭에서 고민을 등록하세요.</div>}
    </div>
  );
}

// Concerns management — areas (부위) + concerns (세부 고민) CRUD.
const TRACKS = [
  { v: 'non_surgical', label: '비수술' },
  { v: 'surgical', label: '수술' },
  { v: 'both', label: '공용' },
];
const CA_SUBTABS = [
  { v: 'non_surgical', label: '시술 (비수술)' },
  { v: 'surgical',     label: '수술' },
];
function ConcernAdmin() {
  const [track, setTrack] = useState('non_surgical');
  const [areas, setAreas] = useState(null);
  const [concerns, setConcerns] = useState([]);
  const [err, setErr] = useState(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newConcern, setNewConcern] = useState({});
  const [openId, setOpenId] = useState(null);   // expanded area

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [a, c] = await Promise.all([api.list('concern_areas'), api.list('concerns')]);
      setAreas(a.rows || []); setConcerns(c.rows || []);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visibleAreas = (areas || []).filter((a) => a.track === track);
  const trackLabel = track === 'surgical' ? '수술' : '시술';

  async function addArea() {
    if (!newAreaName.trim()) return;
    try { await api.create('concern_areas', { name: newAreaName.trim(), track }); setNewAreaName(''); load(); }
    catch (e) { setErr(e.message); }
  }
  async function patchArea(id, patch) { try { await api.update('concern_areas', id, patch); load(); } catch (e) { setErr(e.message); } }
  async function delArea(id) { if (!window.confirm('이 부위와 하위 고민이 사라집니다. 삭제할까요?')) return; try { await api.remove('concern_areas', id); load(); } catch (e) { setErr(e.message); } }
  async function addConcern(areaId) {
    const name = (newConcern[areaId] || '').trim(); if (!name) return;
    try { await api.create('concerns', { name, area_id: areaId }); setNewConcern((s) => ({ ...s, [areaId]: '' })); load(); }
    catch (e) { setErr(e.message); }
  }
  async function patchConcern(id, patch) { try { await api.update('concerns', id, patch); load(); } catch (e) { setErr(e.message); } }
  async function delConcern(id) { try { await api.remove('concerns', id); load(); } catch (e) { setErr(e.message); } }

  if (areas == null) return <div className="v3a-empty">불러오는 중…</div>;

  return (
    <div className="v3a-ca">
      <div className="v3a-list-top">
        <div><h2>고민 관리</h2><p className="v3a-sub">시술/수술별로 부위 → 세부 고민. 챗봇 질문지·매칭이 여기서 나옵니다.</p></div>
      </div>

      <div className="v3a-ca-subtabs">
        {CA_SUBTABS.map((t) => (
          <button key={t.v} className={`v3a-ca-subtab ${track === t.v ? 'on' : ''}`} onClick={() => { setTrack(t.v); setOpenId(null); }}>{t.label}</button>
        ))}
      </div>

      {err && <div className="v3a-error">{err}</div>}

      <div className="v3a-ca-addarea">
        <input placeholder={`새 ${trackLabel} 부위 이름 (예: ${track === 'surgical' ? 'Nose' : 'Skin'})`} value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addArea()} />
        <button className="v3a-btn v3a-btn-primary" onClick={addArea}>＋ 부위 추가</button>
      </div>

      {visibleAreas.length === 0 && <div className="v3a-empty">이 탭({trackLabel})에 부위가 없습니다. 위에서 추가하세요.</div>}

      {/* 5-up area grid — click a card to reveal its concerns below */}
      <div className="v3a-ca-grid">
        {visibleAreas.map((a) => {
          const n = concerns.filter((c) => c.area_id === a.id).length;
          return (
            <button key={a.id} className={`v3a-ca-card ${openId === a.id ? 'on' : ''}`} onClick={() => setOpenId(openId === a.id ? null : a.id)}>
              <span className="v3a-ca-card-name">{a.name}</span>
              <span className="v3a-ca-card-n">고민 {n}개</span>
            </button>
          );
        })}
      </div>

      {openId && (() => {
        const a = visibleAreas.find((x) => x.id === openId);
        if (!a) return null;
        const subs = concerns.filter((c) => c.area_id === a.id);
        return (
          <div className="v3a-ca-panel">
            <div className="v3a-ca-panel-head">
              <InlineText className="v3a-ca-name" value={a.name} onSave={(name) => patchArea(a.id, { name })} />
              <button className="v3a-btn v3a-btn-danger" onClick={() => { delArea(a.id); setOpenId(null); }}>부위 삭제</button>
            </div>
            <div className="v3a-ca-concerns">
              {subs.map((c) => (
                <div className="v3a-ca-concern" key={c.id}>
                  <InlineText className="v3a-inline-grow" value={c.name} placeholder="고민" onSave={(name) => patchConcern(c.id, { name })} />
                  <button className="v3a-cl-x v3a-list-edit-x" onClick={() => delConcern(c.id)}>×</button>
                </div>
              ))}
              <div className="v3a-ca-addconcern">
                <input placeholder="＋ 세부 고민 추가 (예: Pores)" value={newConcern[a.id] || ''} onChange={(e) => setNewConcern((s) => ({ ...s, [a.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addConcern(a.id)} autoFocus />
                <button onClick={() => addConcern(a.id)}>추가</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------- Edit
function Edit({ kind, id, onDone, onCancel }) {
  const isNew = id == null;
  const singular = KINDS.find((k) => k.key === kind).label.replace(/s$/, '');
  const [form, setForm] = useState(BLANK);
  const [tags, setTags] = useState([]);   // [{ id, name }]
  const [concernLinks, setConcernLinks] = useState([]); // [{ concern_id, reason, relevance }]
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isNew) { setForm(BLANK); setTags([]); setConcernLinks([]); return; }
    (async () => {
      try {
        const d = await api.get(kind, id);
        const { tags: rowTags, concern_links, ...rest } = d.row;
        setForm({
          ...BLANK, ...rest, price_krw: rest.price_krw ?? '',
          benefits: Array.isArray(rest.benefits) ? rest.benefits : [],
          cautions: Array.isArray(rest.cautions) ? rest.cautions : [],
        });
        setTags(Array.isArray(rowTags) ? rowTags : []);
        setConcernLinks(Array.isArray(concern_links) ? concern_links : []);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [kind, id, isNew]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    setSaving(true); setErr(null);
    const payload = {
      ...form,
      tag_ids: tags.map((t) => t.id),
      price_krw: form.price_krw === '' ? null : Number(form.price_krw),
      display_order: Number(form.display_order) || 0,
      benefits: (form.benefits || []).map((s) => s.trim()).filter(Boolean),
      cautions: (form.cautions || []).map((s) => s.trim()).filter(Boolean),
      concern_links: concernLinks
        .filter((l) => l.concern_id)
        .map((l) => ({ concern_id: Number(l.concern_id), reason: l.reason || '', relevance: l.relevance || 'primary' })),
    };
    if (!payload.slug) delete payload.slug; // let server auto-generate
    try {
      if (isNew) await api.create(kind, payload);
      else await api.update(kind, id, payload);
      onDone();
    } catch (e) { setErr(e.message); setSaving(false); }
  }

  async function remove() {
    if (!window.confirm(`Delete "${form.name}"? (it will be hidden from the list)`)) return;
    setSaving(true);
    try { await api.remove(kind, id); onDone(); }
    catch (e) { setErr(e.message); setSaving(false); }
  }

  if (loading) return <div className="v3a-empty">Loading…</div>;

  return (
    <div className="v3a-edit">
      <div className="v3a-edit-top">
        <button className="v3a-back" onClick={onCancel}>‹ Back to list</button>
        <h2>{isNew ? `New ${singular}` : `Edit ${singular}`}</h2>
      </div>

      {err && <div className="v3a-error">{err}</div>}

      {/* Basics */}
      <section className="v3a-sec">
        <h3>Basics</h3>
        <Field label="Name" help="Shown on the site. e.g. Ulthera" required>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ulthera" />
        </Field>
        <Field label="Short summary" help="One sentence describing this in plain English.">
          <input value={form.summary || ''} onChange={(e) => set('summary', e.target.value)} placeholder="Non-invasive HIFU lifting." />
        </Field>
        <Field label="Photo" help="Upload a representative image — drag & drop or click. (Stored on our server.)">
          <ImageUpload kind={kind} owner={form.slug} value={form.thumbnail_url} onChange={(v) => set('thumbnail_url', v)} />
        </Field>
        <Field label="Tags" help="Type and press Enter to add, × to remove. Existing tags autocomplete.">
          <TagEditor value={tags} onChange={setTags} />
        </Field>
      </section>

      {/* Description (Markdown) */}
      <section className="v3a-sec">
        <h3>Description <span className="v3a-md-badge">Markdown</span></h3>
        <p className="v3a-sec-hint">Write the full description in Markdown — headings, lists, bold, links, quotes. The preview on the right is exactly how it'll look.</p>
        <MarkdownEditor value={form.description} onChange={(v) => set('description', v)} />
      </section>

      {/* Price & duration */}
      <section className="v3a-sec">
        <h3>Price &amp; duration</h3>
        <div className="v3a-row2">
          <Field label="Reference price (KRW)" help="Rough price. Leave empty to show 'Consult'.">
            <input type="number" value={form.price_krw} onChange={(e) => set('price_krw', e.target.value)} placeholder="700000" />
          </Field>
          <Field label="Price note" help="e.g. from 300 shots">
            <input value={form.price_note || ''} onChange={(e) => set('price_note', e.target.value)} placeholder="from 300 shots" />
          </Field>
        </div>
        <Field label="How long it lasts" help="Standardized so we can match this to a patient's concern. Pick the closest.">
          <Choice options={DURATION} value={form.duration} onChange={(v) => set('duration', v)} />
        </Field>
      </section>

      {/* Pain & recovery */}
      <section className="v3a-sec">
        <h3>Pain &amp; recovery</h3>
        <Field label="Pain level" help="Tap to select. Tap again to clear.">
          <Choice options={PAIN} value={form.pain_level} onChange={(v) => set('pain_level', v)} />
        </Field>
        <Field label="Recovery time" help="Time until back to daily life.">
          <Choice options={RECOVERY} value={form.recovery_level} onChange={(v) => set('recovery_level', v)} />
        </Field>
        <Field label="Recovery note" help="e.g. Some redness/flushing may appear right after.">
          <textarea rows={2} value={form.recovery_note || ''} onChange={(e) => set('recovery_note', e.target.value)} />
        </Field>
      </section>

      {/* Recommendation & cautions */}
      <section className="v3a-sec">
        <h3>Good for &amp; cautions</h3>
        <Field label="Good for (who it suits)" help="Add points one at a time — each becomes its own bullet.">
          <ListEditor value={form.benefits} onChange={(v) => set('benefits', v)} placeholder="e.g. Great for lifting without any incision" />
        </Field>
        <Field label="Things to note" help="Cautions — one per item.">
          <ListEditor value={form.cautions} onChange={(v) => set('cautions', v)} placeholder="e.g. Mild swelling may occur afterward" />
        </Field>
      </section>

      {/* Related concerns (matching) */}
      <section className="v3a-sec">
        <h3>이 시술이 해결하는 고민 <span className="v3a-md-badge">매칭</span></h3>
        <p className="v3a-sec-hint">연관된 고민을 여러 개 연결하고, 각각 왜 이 시술이 좋은지 이유를 적어주세요. 챗봇 추천·매칭에 쓰입니다.</p>
        <ConcernLinksEditor value={concernLinks} onChange={setConcernLinks} />
      </section>

      {/* Advanced (optional) */}
      <section className="v3a-sec">
        <button type="button" className="v3a-advanced-toggle" onClick={() => setShowAdvanced((s) => !s)}>
          {showAdvanced ? '− Hide advanced' : '＋ Advanced (optional)'}
        </button>
        {showAdvanced && (
          <div className="v3a-advanced">
            <Field label="Partner / concierge note (optional)" help="If there's a specially linked hospital or concierge service.">
              <textarea rows={2} value={form.linked_note || ''} onChange={(e) => set('linked_note', e.target.value)} />
            </Field>
            <div className="v3a-row2">
              <Field label="Sort order" help="Lower numbers show first.">
                <input type="number" value={form.display_order} onChange={(e) => set('display_order', e.target.value)} />
              </Field>
              <Field label="Slug" help="Leave empty to auto-generate. Don't change once set.">
                <input value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} placeholder="auto" />
              </Field>
            </div>
          </div>
        )}
      </section>

      <label className="v3a-active">
        <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
        <span>Visible on the site <em>(uncheck to hide)</em></span>
      </label>

      <div className="v3a-edit-actions">
        <button className="v3a-btn v3a-btn-primary v3a-btn-lg" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="v3a-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        {!isNew && <button className="v3a-btn v3a-btn-danger" onClick={remove} disabled={saving}>Delete</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Shell
export default function AdminV3App() {
  const [authed, setAuthed] = useState(isAuthed());
  const [kind, setKindState] = useState('treatments');
  const [view, setView] = useState({ name: 'list', id: null }); // 'list' | 'edit'
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => { document.title = 'Glow Up Seoul · Admin'; }, []);

  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  const setKind = (k) => { setKindState(k); setView({ name: 'list', id: null }); };
  const backToList = () => { setView({ name: 'list', id: null }); setRefreshToken((t) => t + 1); };

  return (
    <div className="v3a">
      <header className="v3a-head">
        <div className="v3a-head-brand">✦ Glow Up Seoul <span>Admin</span></div>
        <nav className="v3a-tabs">
          {KINDS.map((k) => (
            <button key={k.key} className={`v3a-tab ${kind === k.key ? 'on' : ''}`} onClick={() => setKind(k.key)}>
              {k.label}
            </button>
          ))}
          <button className={`v3a-tab ${kind === 'concerns' ? 'on' : ''}`} onClick={() => setKind('concerns')}>고민 Concerns</button>
        </nav>
        <button className="v3a-logout" onClick={() => { clearKey(); setAuthed(false); }}>Sign out</button>
      </header>

      <main className="v3a-main">
        {kind === 'concerns' ? (
          <ConcernAdmin />
        ) : (
          <>
            {view.name === 'list' && (
              <List kind={kind} refreshToken={refreshToken}
                onAdd={() => setView({ name: 'edit', id: null })}
                onEdit={(id) => setView({ name: 'edit', id })} />
            )}
            {view.name === 'edit' && (
              <Edit kind={kind} id={view.id} onDone={backToList} onCancel={backToList} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
