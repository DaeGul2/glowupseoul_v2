import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { KINDS, KIND_SECTIONS } from './specs.js';
import { clearAdminKey } from './api.js';

const LS_KEY = 'gs_admin_nav_open';

function loadOpenState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function saveOpenState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  function logout() {
    clearAdminKey();
    navigate('/admin/login', { replace: true });
  }

  function navItem(to, label, match, hint) {
    const active =
      (typeof match === 'string' && location.pathname.startsWith(match)) ||
      (typeof match === 'function' && match());
    return (
      <Link key={to} to={to} className={`gs-admin-nav-item${active ? ' is-active' : ''}`} title={hint || label}>
        {label}
      </Link>
    );
  }

  // Group KINDS by section. Items without a section fall back to "기타".
  const grouped = {};
  for (const k of KINDS) {
    const key = k.section || '_misc';
    (grouped[key] = grouped[key] || []).push(k);
  }
  const orderedSections = KIND_SECTIONS.filter((s) => grouped[s.key]?.length > 0);
  if (grouped['_misc']?.length) {
    orderedSections.push({ key: '_misc', label: '기타', hint: '' });
  }

  // Accordion state — persisted to localStorage. Default: all open on first visit.
  const [openMap, setOpenMap] = useState(() => {
    const saved = loadOpenState();
    if (saved) return saved;
    const init = {};
    for (const s of orderedSections) init[s.key] = true;
    return init;
  });

  // Auto-open the section containing the active kind, so user always sees
  // their current location. Doesn't close anything else.
  useEffect(() => {
    if (!params.kind) return;
    const activeSection = KINDS.find((k) => k.kind === params.kind)?.section;
    if (activeSection && !openMap[activeSection]) {
      const next = { ...openMap, [activeSection]: true };
      setOpenMap(next);
      saveOpenState(next);
    }
  }, [params.kind]);  // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(sectionKey) {
    const next = { ...openMap, [sectionKey]: !openMap[sectionKey] };
    setOpenMap(next);
    saveOpenState(next);
  }

  return (
    <div className="gs-admin-root">
      <aside className="gs-admin-side">
        <div className="gs-admin-brand">
          <span className="gs-admin-brand-mark">✦</span> Glow Up · 관리자
        </div>
        <nav className="gs-admin-nav">
          {navItem('/admin/dashboard', '대시보드',         '/admin/dashboard')}
          {navItem('/admin/partners',  '파트너 신청서',     '/admin/partners',
            '병원이 보낸 등록 신청서. 검토 후 \"승인\" 시 DB 등록.')}

          {orderedSections.map((sec) => {
            const open = !!openMap[sec.key];
            const count = grouped[sec.key].length;
            return (
              <div key={sec.key} className={`gs-admin-nav-group${open ? ' is-open' : ' is-closed'}`}>
                <button
                  type="button"
                  className="gs-admin-nav-sec"
                  onClick={() => toggle(sec.key)}
                  title={sec.hint || ''}
                  aria-expanded={open}
                >
                  <span className="gs-admin-nav-sec-caret">{open ? '▾' : '▸'}</span>
                  <span className="gs-admin-nav-sec-label">{sec.label}</span>
                  <span className="gs-admin-nav-sec-count">{count}</span>
                </button>
                {open && (
                  <div className="gs-admin-nav-children">
                    {grouped[sec.key].map((k) =>
                      navItem(`/admin/${k.kind}`, k.label, () => params.kind === k.kind, k.help)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button className="gs-admin-logout" onClick={logout}>로그아웃</button>
      </aside>
      <main className="gs-admin-main">{children}</main>
    </div>
  );
}
