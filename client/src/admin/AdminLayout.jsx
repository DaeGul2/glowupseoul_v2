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

  function navItem(to, label, match) {
    const active =
      (typeof match === 'string' && location.pathname.startsWith(match)) ||
      (typeof match === 'function' && match());
    return (
      <Link key={to} to={to} className={`gs-admin-nav-item${active ? ' is-active' : ''}`}>
        {label}
      </Link>
    );
  }

  return (
    <div className="gs-admin-root">
      <aside className="gs-admin-side">
        <div className="gs-admin-brand">
          <span className="gs-admin-brand-mark">✦</span> Glow Up · Admin
        </div>
        <nav className="gs-admin-nav">
          {navItem('/admin/dashboard', 'Dashboard', '/admin/dashboard')}
          {navItem('/admin/partners',  'Partner Applications', '/admin/partners')}
          <div className="gs-admin-nav-sec">Catalog</div>
          {KINDS.map((k) => navItem(`/admin/${k.kind}`, k.label, () => params.kind === k.kind))}
        </nav>
        <button className="gs-admin-logout" onClick={logout}>Sign out</button>
      </aside>
      <main className="gs-admin-main">{children}</main>
    </div>
  );
}
