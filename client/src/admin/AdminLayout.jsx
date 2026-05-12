import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { KINDS } from './specs.js';
import { clearAdminKey } from './api.js';

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
          <div className="gs-admin-nav-sec">카탈로그 관리</div>
          {KINDS.map((k) => navItem(`/admin/${k.kind}`, k.label, () => params.kind === k.kind, k.help))}
        </nav>
        <button className="gs-admin-logout" onClick={logout}>로그아웃</button>
      </aside>
      <main className="gs-admin-main">{children}</main>
    </div>
  );
}
