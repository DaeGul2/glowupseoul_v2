import { useEffect, useState } from 'react';
import { getClinicReviews } from '../utils/api.js';
import ReviewAvatar from './ReviewAvatar.jsx';

function StarRow({ rating, size = 14 }) {
  if (rating == null) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="gs-stars" style={{ fontSize: size }}>
      {'★'.repeat(full)}{half ? '⯨' : ''}{'☆'.repeat(empty)}
    </span>
  );
}

function fmtRelative(iso, fallback) {
  if (fallback) return fallback;
  if (!iso) return '';
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.round(days / 7)}w ago`;
  if (days < 720) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

const LANG_FLAGS = { en:'🇬🇧', 'en-US':'🇺🇸', ko:'🇰🇷', zh:'🇨🇳', 'zh-CN':'🇨🇳', 'zh-TW':'🇹🇼', ja:'🇯🇵', th:'🇹🇭', vi:'🇻🇳', id:'🇮🇩', ru:'🇷🇺' };

export default function ClinicReviews({ slug, hospitalNameEn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ctl = new AbortController();
    setLoading(true);
    setError(null);
    getClinicReviews(slug, { signal: ctl.signal })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ctl.abort(); };
  }, [slug]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const fresh = await getClinicReviews(slug, { refresh: true });
      setData(fresh);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <section className="gs-section gs-reviews-section">
        <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 12 }}>
          <div className="gs-eyebrow">◇ Reviews</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500 }}>What patients <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>say.</em></h2>
        </div>
        <div className="gs-reviews-skel">
          <div className="gs-dot-pulse"><span /><span /><span /></div>
          <span>Fetching {hospitalNameEn || slug} reviews…</span>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="gs-section gs-reviews-section">
        <div className="gs-empty">Reviews couldn't load right now ({error}).</div>
      </section>
    );
  }
  if (!data) return null;

  const isMock = data._mock || data._source === 'mock' || data._source === 'mock_fallback';

  return (
    <section className="gs-section gs-reviews-section">
      <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 16 }}>
        <div className="gs-eyebrow">◇ Reviews · Google</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500 }}>
          What patients <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>say.</em>
        </h2>
      </div>

      <div className="gs-reviews-summary">
        <div className="gs-reviews-summary-left">
          <div className="gs-reviews-rating">
            <strong>{data.rating?.toFixed(1) ?? '—'}</strong>
            <StarRow rating={data.rating} size={18} />
          </div>
          <div className="gs-reviews-count">
            Based on <strong>{data.rating_count?.toLocaleString() || 0}</strong> Google reviews
            {data.review_lang_breakdown && Object.keys(data.review_lang_breakdown).length > 0 && (
              <div className="gs-reviews-langmix">
                Showing {Object.entries(data.review_lang_breakdown).map(([lang, n], i, arr) => (
                  <span key={lang}><strong>{n}</strong> {LANG_FLAGS[lang] || lang}{i < arr.length - 1 ? ' · ' : ''}</span>
                ))}
              </div>
            )}
            {data.address && <div className="gs-reviews-addr">{data.address}</div>}
          </div>
        </div>
        <div className="gs-reviews-summary-right">
          {data.google_url && (
            <a className="gs-cta gs-cta--outline gs-cta--mini" href={data.google_url} target="_blank" rel="noreferrer">
              Open in Google Maps ↗
            </a>
          )}
          <button className="gs-cta gs-cta--mini gs-cta--ghost" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {isMock && (
        <div className="gs-reviews-banner">
          ⚠ Showing sample reviews — set <code>GOOGLE_PLACES_API_KEY</code> in <code>server/.env</code> for live Google data.
          {data._error && <div style={{ marginTop: 4, fontSize: 11 }}>API error: {data._error}</div>}
        </div>
      )}

      {data.reviews.length === 0 ? (
        <div className="gs-empty">No reviews on Google yet.</div>
      ) : (
        <div className="gs-reviews-grid">
          {data.reviews.map((rv, i) => (
            <article key={i} className="gs-review-card">
              <header className="gs-review-head">
                <ReviewAvatar src={rv.photo} name={rv.author} size={40} />
                <div>
                  <div className="gs-review-author">{rv.author}</div>
                  <div className="gs-review-meta">
                    <StarRow rating={rv.rating} />
                    <span>· {fmtRelative(rv.publishedAt, rv.relative)}</span>
                    {rv.language && <span title={rv.language}>· {LANG_FLAGS[rv.language] || rv.language}</span>}
                  </div>
                </div>
              </header>
              <p className="gs-review-text">{rv.text}</p>
            </article>
          ))}
        </div>
      )}

      <div className="gs-reviews-footer">
        {data._cache === 'hit' ? 'cached' : 'fresh'} · source <strong>{data._source || 'google'}</strong>
        {data._fetchedAt && <span> · {new Date(data._fetchedAt).toLocaleString()}</span>}
      </div>
    </section>
  );
}
