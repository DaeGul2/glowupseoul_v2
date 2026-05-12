import { useEffect, useState, createContext, useContext } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScanModal from './components/ScanModal.jsx';
import db from './data/db.js';
import { matchOfferings } from './utils/matching.js';
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

    // Persist anonymized feed entry ONLY if user opted in.
    // Mirrors v2/db/schema.sql `public_feed_entries` shape — when real DB lands,
    // this client-side localStorage append is replaced by POST /api/feed.
    const prefs = payload?.prefs;
    if (prefs?.feedConsent) {
      try {
        const matches = matchOfferings(prefs);
        const top = matches[0];
        if (!top) return;
        const { hp, procedure, hospital, brand, discount_pct } = top.offering;
        const concernLabels = (prefs.concernIds || [])
          .map((id) => db.concernById[id]?.name_en)
          .filter(Boolean)
          .slice(0, 3)
          .join(' · ');

        const initials = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const langToCountry = { en: ['US','GB','AU','SG'], zh: ['CN','HK','TW'], ja: ['JP'], ko: ['KR'], vi: ['VN'], id: ['ID'], th: ['TH'], ru: ['RU'] };
        const pool = langToCountry[prefs.language] || ['??'];
        const countryCode = pool[Math.floor(Math.random() * pool.length)];

        const BUDGET_LABELS = { under_300: 'Under ₩300k', '300_800': '₩300k – ₩800k', '800_2000': '₩800k – ₩2M', '2000_5000': '₩2M – ₩5M', over_5000: 'Over ₩5M' };
        const STYLE_LABELS = ['Subtle', 'Soft', 'Balanced', 'Bold', 'Dramatic'];

        db.addPublicFeedEntry({
          display_initial: initials[Math.floor(Math.random() * 26)] + '.',
          country_code: countryCode,
          country_label_en: countryCode,
          concern_slugs: (prefs.concernIds || []).map((id) => db.concernById[id]?.slug).filter(Boolean),
          concern_labels_en: concernLabels || 'Personal scan',
          treatment_slug: procedure.slug,
          treatment_label_en: procedure.name_en,
          hospital_slug: hospital.slug,
          hospital_label_en: brand.name_en || brand.name_ko,
          outcome: 'matched',
          outcome_note_en: `matched with ${matches.length} candidate${matches.length === 1 ? '' : 's'}`,
          story_en: prefs.notes ? prefs.notes.slice(0, 140) : null,
          // Full case for the detail modal
          case: {
            prefs: {
              budget_tier: prefs.budget_tier,
              budget_label: BUDGET_LABELS[prefs.budget_tier] || `Up to ₩${(prefs.budgetMax || 0).toLocaleString()}`,
              downtime_max: prefs.downtimeMax,
              pain_max: prefs.painMax,
              style_target: prefs.styleTarget,
              style_label: STYLE_LABELS[(prefs.styleTarget || 3) - 1],
              language: prefs.language,
              notes: prefs.notes,
            },
            ai_scan: payload.ai ? {
              narrative: payload.ai.narrative,
              confidence: payload.ai.confidence,
              concerns_detected: payload.ai.concerns,
              metrics: payload.ai.metrics,
              regions: payload.ai.regions,
            } : null,
            synth: null, // synth result lives on ResultsPage state; future: persist via API
            top_match: {
              procedure_name_en: procedure.name_en,
              hospital_name_en: `${brand.name_en || brand.name_ko} · ${hospital.neighborhood}`,
              price_krw: hp.starting_price_krw,
              original_price_krw: hp.original_price_krw,
              discount_pct: discount_pct || 0,
              device_brands: hp.device_brands || [],
            },
          },
        });
      } catch (e) {
        console.warn('feed append failed', e);
      }
    }
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
