import { useEffect, useState, createContext, useContext } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScanModal from './components/ScanModal.jsx';
import HomePage from './pages/HomePage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import TreatmentDetailPage from './pages/TreatmentDetailPage.jsx';
import HospitalDetailPage from './pages/HospitalDetailPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import FAQPage from './pages/FAQPage.jsx';

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const parts = raw.split('/').filter(Boolean).map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'category' && parts[1]) return { name: 'category', slug: parts[1] };
  if (parts[0] === 'treatment' && parts[1]) return { name: 'treatment', slug: parts[1] };
  if (parts[0] === 'clinic' && parts[1]) return { name: 'clinic', slug: parts[1] };
  if (parts[0] === 'device' && parts[1]) return { name: 'device', slug: parts[1] };
  if (parts[0] === 'results') return { name: 'results' };
  if (parts[0] === 'about' || parts[0] === 'about-us') return { name: 'about' };
  if (parts[0] === 'how-it-works' || parts[0] === 'how') return { name: 'how' };
  if (parts[0] === 'services') return { name: 'services' };
  if (parts[0] === 'faq') return { name: 'faq' };
  return { name: 'home' };
}

export function navigate(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Scan/match flow state — kept at app level so /results survives a page change.
const ScanContext = createContext(null);
export const useScanFlow = () => useContext(ScanContext);

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { snapshot, prefs }

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const flow = {
    openScan: () => setScanOpen(true),
    closeScan: () => setScanOpen(false),
    restart: () => { setScanResult(null); setScanOpen(true); },
    result: scanResult,
  };

  function onScanSubmit(payload) {
    setScanResult(payload);
    setScanOpen(false);
    navigate('/results');
  }

  return (
    <ScanContext.Provider value={flow}>
      <Header />
      {route.name === 'home'      && <HomePage />}
      {route.name === 'category'  && <CategoryPage slug={route.slug} />}
      {route.name === 'treatment' && <TreatmentDetailPage slug={route.slug} />}
      {route.name === 'clinic'    && <HospitalDetailPage slug={route.slug} />}
      {route.name === 'device'    && <DeviceDetailPage slug={route.slug} />}
      {route.name === 'results'   && <ResultsPage snapshot={scanResult?.snapshot} ai={scanResult?.ai} prefs={scanResult?.prefs} onRestart={flow.restart} />}
      {route.name === 'about'     && <AboutPage />}
      {route.name === 'how'       && <HowItWorksPage />}
      {route.name === 'services'  && <ServicesPage />}
      {route.name === 'faq'       && <FAQPage />}
      <Footer />
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onSubmit={onScanSubmit} />
    </ScanContext.Provider>
  );
}
