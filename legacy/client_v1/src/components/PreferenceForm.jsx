import { useState } from 'react';

const CONCERN_OPTIONS = [
  '모공', '잡티', '주름', '리프팅', '처짐',
  '윤곽', '턱선', '광대', '얼굴축소',
  '눈', '코', '입술',
  '여드름', '여드름흉터', '피부톤', '다크서클',
  '볼륨', '탄력', '피부결'
];

const STYLE_LABELS = ['자연', '약간', '중간', '뚜렷', '드라마틱'];

export default function PreferenceForm({ onSubmit }) {
  const [concerns, setConcerns] = useState([]);
  const [budgetMax, setBudgetMax] = useState(1500000);
  const [downtimeMax, setDowntimeMax] = useState(3);
  const [painMax, setPainMax] = useState(3);
  const [styleTarget, setStyleTarget] = useState(2);
  const [notes, setNotes] = useState('');

  function toggleConcern(c) {
    setConcerns(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }

  function submit() {
    onSubmit({
      concerns,
      budgetMax,
      downtimeMax,
      painMax,
      styleTarget,
      notes
    });
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">
          <span className="symbol">✦</span>고민사항 · Concerns
        </label>
        <div className="chips">
          {CONCERN_OPTIONS.map(c => (
            <button
              key={c}
              className={`chip ${concerns.includes(c) ? 'active' : ''}`}
              onClick={() => toggleConcern(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="symbol">◈</span>예산 한도 · Budget
        </label>
        <div className="range-wrap">
          <div className="range-value">
            {budgetMax.toLocaleString()}
            <span className="unit">원 이하</span>
          </div>
          <input
            type="range"
            min="100000"
            max="10000000"
            step="100000"
            value={budgetMax}
            onChange={e => setBudgetMax(Number(e.target.value))}
          />
          <div className="scale-labels">
            <span>10만</span>
            <span>1000만</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="symbol">◇</span>다운타임 · Downtime
        </label>
        <div className="range-wrap">
          <div className="range-value">
            {downtimeMax === 0 ? '없음' : `${downtimeMax}일`}
            <span className="unit">까지 OK</span>
          </div>
          <input
            type="range"
            min="0"
            max="21"
            step="1"
            value={downtimeMax}
            onChange={e => setDowntimeMax(Number(e.target.value))}
          />
          <div className="scale-labels">
            <span>0일</span>
            <span>3주+</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="symbol">⬡</span>통증 허용도 · Pain Tolerance
        </label>
        <div className="range-wrap">
          <div className="range-value">
            {['', '아주 약함', '약함', '보통', '강함', '매우 강함'][painMax]}
            <span className="unit">까지 OK</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={painMax}
            onChange={e => setPainMax(Number(e.target.value))}
          />
          <div className="scale-labels">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="symbol">☽</span>선호 스타일 · Preferred Style
        </label>
        <div className="range-wrap">
          <div className="range-value">{STYLE_LABELS[styleTarget - 1]}</div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={styleTarget}
            onChange={e => setStyleTarget(Number(e.target.value))}
          />
          <div className="scale-labels">
            <span>자연스럽게</span>
            <span>드라마틱하게</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="symbol">◎</span>추가 메모 · Notes
        </label>
        <textarea
          className="notes"
          placeholder="예: 결혼식이 한 달 뒤라 빠르게 효과가 나오는 시술 원해요"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button
        className="primary"
        onClick={submit}
        disabled={concerns.length === 0}
      >
        Find My Match
      </button>
      {concerns.length === 0 && (
        <div className="helper-text">고민사항을 1개 이상 선택해주세요</div>
      )}
    </div>
  );
}
