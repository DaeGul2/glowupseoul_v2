import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdminKey, verifyAdminKey } from './api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const ok = await verifyAdminKey(key);
    setBusy(false);
    if (!ok) {
      setError('Invalid key.');
      return;
    }
    setAdminKey(key);
    navigate('/admin/dashboard', { replace: true });
  }

  return (
    <div className="gs-admin-login">
      <form onSubmit={submit} className="gs-admin-login-card">
        <h1>Glow Up Seoul · Admin</h1>
        <p className="gs-admin-login-sub">Enter the admin key to continue.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="X-Admin-Key"
          autoFocus
        />
        {error && <div className="gs-admin-login-err">{error}</div>}
        <button type="submit" disabled={busy || !key}>{busy ? 'Verifying…' : 'Sign in'}</button>
        <div className="gs-admin-login-hint">
          Set <code>ADMIN_KEY</code> in <code>server/.env</code> and restart the server.
        </div>
      </form>
    </div>
  );
}
