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
      setError('관리자 키가 일치하지 않습니다.');
      return;
    }
    setAdminKey(key);
    navigate('/admin/dashboard', { replace: true });
  }

  return (
    <div className="gs-admin-login">
      <form onSubmit={submit} className="gs-admin-login-card">
        <h1>Glow Up Seoul · 관리자</h1>
        <p className="gs-admin-login-sub">관리자 키를 입력하세요.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="관리자 키"
          autoFocus
        />
        {error && <div className="gs-admin-login-err">{error}</div>}
        <button type="submit" disabled={busy || !key}>{busy ? '확인 중…' : '로그인'}</button>
        <div className="gs-admin-login-hint">
          키 분실 시 운영팀에 문의. 서버측 <code>server/.env</code> 의 <code>ADMIN_KEY</code> 값과 일치해야 합니다.
        </div>
      </form>
    </div>
  );
}
