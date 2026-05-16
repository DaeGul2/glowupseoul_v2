// 재사용 뒤로가기 버튼.
//   - history 스택이 있으면 navigate(-1)
//   - 새 탭 / 직접 URL 진입 등으로 스택이 없으면 fallback path 로 이동
import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallback = '/admin/dashboard', label = '뒤로' }) {
  const navigate = useNavigate();

  function go() {
    // window.history.length 는 항상 ≥ 1 (현재 페이지 포함). 시작 진입 시는 1.
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button type="button" className="gs-admin-back" onClick={go} aria-label={`${label}로 가기`}>
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
