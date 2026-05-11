import { useState } from 'react';
import FaceScanner from './components/FaceScanner.jsx';
import PreferenceForm from './components/PreferenceForm.jsx';
import MatchResults from './components/MatchResults.jsx';

const STEPS = ['scan', 'form', 'results'];

export default function App() {
  const [step, setStep] = useState('scan');
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  async function handleSubmit(prefs) {
    setStep('results');
    setLoading(true);
    setMatches(null);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (e) {
      console.error(e);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="app">
      <div className="brand">Glow Up Seoul</div>

      {step === 'scan' && (
        <>
          <div className="eyebrow">✦ Step 01</div>
          <h1 className="title">
            Your <em>Face,</em><br />Analyzed.
          </h1>
          <p className="subtitle">
            얼굴 윤곽을 인식해 더 정확한 시술을 추천해드립니다.<br />
            데이터는 분석 후 즉시 폐기됩니다.
          </p>
        </>
      )}
      {step === 'form' && (
        <>
          <div className="eyebrow">◈ Step 02</div>
          <h1 className="title">
            Tell us your <em>Story.</em>
          </h1>
          <p className="subtitle">
            고민, 예산, 회복기간, 선호 스타일을 알려주세요.<br />
            AI가 당신만을 위한 시술을 골라드립니다.
          </p>
        </>
      )}
      {step === 'results' && (
        <>
          <div className="eyebrow">◇ Step 03</div>
          <h1 className="title">
            Your <em>Curation.</em>
          </h1>
          <p className="subtitle">
            가격, 다운타임, 스타일을 종합해 추천한 시술입니다.
          </p>
        </>
      )}

      <div className="steps">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`step-dot ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}`}
          />
        ))}
      </div>

      {step === 'scan' && (
        <FaceScanner
          onComplete={(snap) => {
            if (snap) setSnapshot(snap);
            setStep('form');
          }}
        />
      )}
      {step === 'form' && <PreferenceForm onSubmit={handleSubmit} />}
      {step === 'results' && (
        <MatchResults
          matches={matches}
          loading={loading}
          snapshot={snapshot}
          onRestart={() => setStep('form')}
        />
      )}
    </div>
  );
}
