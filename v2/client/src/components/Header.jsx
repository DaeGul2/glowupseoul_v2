import { useEffect, useState } from 'react';
import { navigate, useScanFlow } from '../App.jsx';

export default function Header() {
  const flow = useScanFlow();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`gs-header ${solid ? 'gs-header--solid' : ''}`}>
      <div className="gs-header-inner">
        <button onClick={() => navigate('/')} className="gs-logo" style={{ background: 'none', border: 'none' }}>
          glow up <span>seoul</span>
        </button>
        <nav className="gs-nav">
          <button onClick={() => navigate('/services')}>Services</button>
          <button onClick={() => navigate('/how-it-works')}>How it works</button>
          <button onClick={() => navigate('/about')}>About</button>
          <button onClick={() => navigate('/faq')}>FAQ</button>
        </nav>
        <div className="gs-header-right">
          <button className="gs-header-scan" onClick={flow?.openScan}>✦ Start scan</button>
        </div>
      </div>
    </header>
  );
}
