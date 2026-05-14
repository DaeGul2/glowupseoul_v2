import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScanModal from './components/ScanModal.jsx';
import PartnerFloating from './components/PartnerFloating.jsx';
import db from './data/db.js';
import { matchOfferings } from './utils/matching.js';
import { persistMatchRequest } from './utils/api.js';
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
import PartnerApplyPage from './pages/PartnerApplyPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminApp from './admin/AdminApp.jsx';

// Imperative navigate for non-component callers (e.g. event handlers in
// modules that don't have router hooks). Works for both / and #/ legacy URLs.
export function navigate(path) {
  // Strip a leading '#' to gracefully accept legacy '#/x' callers.
  const clean = path.startsWith('#') ? path.slice(1) : path;
  window.history.pushState({}, '', clean);
  // Synthesize a popstate so <BrowserRouter> picks it up.
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// One-time client-side redirect from legacy hash URLs (`#/about`) to path URLs.
function redirectLegacyHash() {
  if (typeof window === 'undefined') return;
  const h = window.location.hash;
  if (!h || !h.startsWith('#/')) return;
  const path = h.slice(1) || '/';
  window.history.replaceState({}, '', path);
}
redirectLegacyHash();

// Scan/match flow state — kept at app level so /results survives a page change.
const ScanContext = createContext(null);
export const useScanFlow = () => useContext(ScanContext);

function SiteShell({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

function SiteRoutes() {
  return (
    <Routes>
      <Route path="/"              element={<HomePage />} />
      <Route path="/category/:slug"  element={<CategoryRoute />} />
      <Route path="/treatment/:slug" element={<TreatmentRoute />} />
      <Route path="/clinic/:slug"    element={<ClinicRoute />} />
      <Route path="/device/:slug"    element={<DeviceRoute />} />
      <Route path="/results"         element={<ResultsRoute />} />
      <Route path="/about"           element={<AboutPage />} />
      <Route path="/about-us"        element={<AboutPage />} />
      <Route path="/how-it-works"    element={<HowItWorksPage />} />
      <Route path="/how"             element={<HowItWorksPage />} />
      <Route path="/services"        element={<ServicesPage />} />
      <Route path="/faq"             element={<FAQPage />} />
      <Route path="/partner"         element={<PartnerApplyPage />} />
      <Route path="/for-clinics"     element={<PartnerApplyPage />} />
      <Route path="/privacy"         element={<PrivacyPolicyPage />} />
      <Route path="/privacy-policy"  element={<PrivacyPolicyPage />} />
      <Route path="/terms"           element={<TermsPage />} />
      <Route path="/terms-of-service" element={<TermsPage />} />
      <Route path="*"                element={<NotFoundPage />} />
    </Routes>
  );
}

function CategoryRoute()  { const { slug } = useParams(); return <CategoryPage slug={slug} />; }
function TreatmentRoute() { const { slug } = useParams(); return <TreatmentDetailPage slug={slug} />; }
function ClinicRoute()    { const { slug } = useParams(); return <HospitalDetailPage slug={slug} />; }
function DeviceRoute()    { const { slug } = useParams(); return <DeviceDetailPage slug={slug} />; }
function ResultsRoute()   {
  const flow = useScanFlow();
  return <ResultsPage snapshot={flow?.result?.snapshot} ai={flow?.result?.ai} prefs={flow?.result?.prefs} onRestart={flow?.restart} />;
}

function BootSplash() {
  return (
    <div className="gs-boot">
      <div className="gs-boot-mark">✦</div>
      <div className="gs-boot-line">
        <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28 }}>
          Glow Up Seoul
        </em>
      </div>
      <div className="gs-boot-sub">Loading the catalog…</div>
      <div className="gs-boot-bar"><span /></div>
    </div>
  );
}

function BootError({ message, onRetry }) {
  return (
    <div className="gs-boot">
      <div className="gs-boot-mark" style={{ color: 'var(--rose, #c83232)' }}>!</div>
      <div className="gs-boot-line">
        <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22 }}>
          We couldn't reach the catalog.
        </em>
      </div>
      <div className="gs-boot-sub" style={{ maxWidth: 480, textAlign: 'center', lineHeight: 1.6 }}>
        {message || 'The catalog service is temporarily unavailable.'}{' '}
        Please try again in a moment.
      </div>
      <button className="gs-cta" onClick={onRetry} style={{ marginTop: 12 }}>Retry</button>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [scanOpen, setScanOpen]     = useState(false);
  const [scanResult, setScanResult] = useState(null); // { snapshot, prefs, ai }
  const [bootState, setBootState]   = useState('loading'); // 'loading' | 'ready' | 'error'
  const [bootError, setBootError]   = useState(null);

  // Hydrate catalog (RDS) on mount. Live-feed hydrate kicks in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await db.hydrate();
        if (cancelled) return;
        setBootState('ready');
        db.hydratePublicFeed().catch(() => {});
      } catch (e) {
        if (cancelled) return;
        console.error('[boot] catalog hydrate failed', e);
        setBootError(e?.message || 'Failed to load catalog');
        setBootState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Scroll-to-top on every route change.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

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

    const prefs = payload?.prefs;

    // ---- RDS persistence (always) ----
    try {
      const matches = matchOfferings(prefs || {});
      const top = matches[0];
      const session_token = sessionStorage.getItem('gs_session_token')
        || (() => { const t = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; sessionStorage.setItem('gs_session_token', t); return t; })();
      persistMatchRequest({
        session_token,
        feed_consent: Boolean(prefs?.feedConsent),
        prefs: {
          concern_slugs: (prefs?.concernIds || []).map((id) => db.concernById[id]?.slug).filter(Boolean),
          budget_tier: prefs?.budget_tier,
          budget_max_krw: prefs?.budgetMax,
          pain_tolerance: prefs?.painMax ? (prefs.painMax <= 2 ? 'low' : prefs.painMax >= 4 ? 'high' : 'medium') : null,
          intensity_pref: prefs?.styleTarget ? (prefs.styleTarget <= 2 ? 'subtle' : prefs.styleTarget >= 4 ? 'dramatic' : 'moderate') : null,
          downtime_max: prefs?.downtimeMax,
          language: prefs?.language,
          notes: prefs?.notes,
        },
        ai_scan: payload?.ai ? {
          narrative: payload.ai.narrative, confidence: payload.ai.confidence,
          concerns: payload.ai.concerns, metrics: payload.ai.metrics, regions: payload.ai.regions,
        } : null,
        top_match: top ? {
          procedure_slug: top.offering.procedure.slug,
          procedure_name_en: top.offering.procedure.name_en,
          hospital_slug: top.offering.hospital.slug,
          price_krw: top.offering.hp.starting_price_krw,
          original_price_krw: top.offering.hp.original_price_krw,
          discount_pct: top.offering.discount_pct,
          device_brands: top.offering.hp.device_brands || [],
        } : null,
        candidates: matches.slice(0, 5).map((m) => ({
          procedure_slug: m.offering.procedure.slug,
          hospital_slug: m.offering.hospital.slug,
          score: m.score,
        })),
        display_initial: payload?.display_initial,
        country_code: ({ en: ['US','GB','AU','SG'], zh: ['CN','HK','TW'], ja: ['JP'], ko: ['KR'], vi: ['VN'], id: ['ID'], th: ['TH'], ru: ['RU'] }[prefs?.language] || ['??'])[Math.floor(Math.random() * 4)],
        outcome_note_en: `matched with ${matches.length} candidate${matches.length === 1 ? '' : 's'}`,
      });
    } catch (e) {
      console.warn('persist match-request failed (non-blocking)', e);
    }

    // Local feed append on opt-in (same as before — surfaces immediately in UI).
    if (prefs?.feedConsent) {
      try {
        const matches = matchOfferings(prefs);
        const top = matches[0];
        if (!top) return;
        const { hp, procedure, hospital, brand, discount_pct } = top.offering;
        const concernLabels = (prefs.concernIds || [])
          .map((id) => db.concernById[id]?.name_en)
          .filter(Boolean).slice(0, 3).join(' · ');
        const initials = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const langToCountry = { en: ['US','GB','AU','SG'], zh: ['CN','HK','TW'], ja: ['JP'], ko: ['KR'], vi: ['VN'], id: ['ID'], th: ['TH'], ru: ['RU'] };
        const pool = langToCountry[prefs.language] || ['??'];
        const countryCode = pool[Math.floor(Math.random() * pool.length)];
        const BUDGET_LABELS = { under_300: 'Under ₩300k', '300_800': '₩300k – ₩800k', '800_2000': '₩800k – ₩2M', '2000_5000': '₩2M – ₩5M', over_5000: 'Over ₩5M' };
        const STYLE_LABELS = ['Subtle', 'Soft', 'Balanced', 'Bold', 'Dramatic'];
        db.addPublicFeedEntry({
          display_initial: initials[Math.floor(Math.random() * 26)] + '.',
          country_code: countryCode, country_label_en: countryCode,
          concern_slugs: (prefs.concernIds || []).map((id) => db.concernById[id]?.slug).filter(Boolean),
          concern_labels_en: concernLabels || 'Personal scan',
          treatment_slug: procedure.slug,
          treatment_label_en: procedure.name_en,
          hospital_slug: hospital.slug,
          hospital_label_en: brand.name_en || brand.name_ko,
          outcome: 'matched',
          outcome_note_en: `matched with ${matches.length} candidate${matches.length === 1 ? '' : 's'}`,
          story_en: prefs.notes ? prefs.notes.slice(0, 140) : null,
          case: {
            prefs: {
              budget_tier: prefs.budget_tier,
              budget_label: BUDGET_LABELS[prefs.budget_tier] || `Up to ₩${(prefs.budgetMax || 0).toLocaleString()}`,
              downtime_max: prefs.downtimeMax, pain_max: prefs.painMax,
              style_target: prefs.styleTarget,
              style_label: STYLE_LABELS[(prefs.styleTarget || 3) - 1],
              language: prefs.language, notes: prefs.notes,
            },
            ai_scan: payload.ai ? {
              narrative: payload.ai.narrative, confidence: payload.ai.confidence,
              concerns_detected: payload.ai.concerns, metrics: payload.ai.metrics, regions: payload.ai.regions,
            } : null,
            synth: null,
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

  // Admin gets its own chrome (no Header/Footer) and doesn't need the public
  // catalog — it fetches RDS directly via /api/admin/* with its own auth.
  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  if (bootState === 'loading') return <BootSplash />;
  if (bootState === 'error')   return <BootError message={bootError} onRetry={() => window.location.reload()} />;

  return (
    <ScanContext.Provider value={flow}>
      <SiteShell>
        <SiteRoutes />
      </SiteShell>
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onSubmit={onScanSubmit} />
      <PartnerFloating />
    </ScanContext.Provider>
  );
}
