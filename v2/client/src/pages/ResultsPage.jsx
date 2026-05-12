import { useEffect, useMemo, useState } from 'react';
import db from '../data/db.js';
import { matchOfferings } from '../utils/matching.js';
import { synthesizeMatch, getClinicReviews } from '../utils/api.js';
import { navigate } from '../App.jsx';
import { buildWhatsAppLinks } from '../components/WhatsAppCTA.jsx';
import AiSynthLoading, { AiPickSkeleton } from '../components/AiSynthLoading.jsx';
import ReviewAvatar from '../components/ReviewAvatar.jsx';

const LANG_FLAGS_R = { en:'🇬🇧', 'en-US':'🇺🇸', ko:'🇰🇷', zh:'🇨🇳', 'zh-CN':'🇨🇳', 'zh-TW':'🇹🇼', ja:'🇯🇵' };
function StarBar({ rating, size = 11 }) {
  if (rating == null) return null;
  const full = Math.floor(rating), half = rating - full >= 0.5;
  return <span className="gs-stars" style={{ fontSize: size }}>{'★'.repeat(full)}{half ? '⯨' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}</span>;
}

function fmtKRW(n) { return n == null ? '—' : `₩${n.toLocaleString()}`; }

// Compact shape sent to /api/synthesize — keep tokens low.
function toApiMatch(rankedRow) {
  const { hp, procedure, hospital, brand, discount_pct } = rankedRow.offering;
  return {
    match_id: hp.id,
    procedure_en: procedure.name_en,
    intensity: procedure.intensity,
    downtime_days: procedure.downtime_days,
    hospital_ko: brand.name_ko,
    hospital_en: brand.name_en,
    neighborhood: hospital.neighborhood,
    price_krw: hp.price_disclosed ? hp.starting_price_krw : null,
    discount_pct: discount_pct || 0,
    is_signature: !!hp.is_signature,
    has_event: !!hp.has_active_event,
    rule_score: rankedRow.score,
  };
}

function toApiPrefs(prefs) {
  return {
    concern_labels: (prefs.concernIds || []).map((id) => db.concernById[id]?.name_en).filter(Boolean),
    budgetMax: prefs.budgetMax,
    downtimeMax: prefs.downtimeMax,
    painMax: prefs.painMax,
    styleTarget: prefs.styleTarget,
    language: prefs.language,
    tripStart: prefs.tripStart,
    tripEnd: prefs.tripEnd,
    notes: prefs.notes,
  };
}

function buildPrefilledMessage({ matches, prefs, ai, synth }) {
  const concernLabels = (prefs.concernIds || []).map((id) => db.concernById[id]?.name_ko).filter(Boolean);
  const lines = [
    '[Glow Up Seoul · AI scan + match]',
    '',
    synth?.overall && `▸ Romie\'s overall read:\n  "${synth.overall}"`,
    ai?.narrative && `▸ Scan: ${ai.narrative}`,
    ai?.metrics && `▸ Metrics — clarity ${ai.metrics.skin_clarity} · symmetry ${ai.metrics.symmetry} · under-eye ${ai.metrics.under_eye_darkness}`,
    `▸ Concerns: ${concernLabels.join(', ') || '—'}`,
    `▸ Budget: up to ₩${(prefs.budgetMax || 0).toLocaleString()}`,
    `▸ Max downtime: ${prefs.downtimeMax} days`,
    `▸ Pain tolerance: ${prefs.painMax}/5`,
    `▸ Style: ${prefs.styleTarget}/5`,
    `▸ Language: ${prefs.language?.toUpperCase()}`,
    prefs.tripStart && `▸ Trip: ${prefs.tripStart} → ${prefs.tripEnd || '?'}`,
    prefs.notes && `▸ Notes: ${prefs.notes}`,
    '',
    'Top matches:',
    ...matches.slice(0, 5).map((m, i) => {
      const { hospital, brand, procedure, hp, discount_pct } = m.offering;
      const price = hp.price_disclosed ? `₩${hp.starting_price_krw.toLocaleString()}${discount_pct > 0 ? ` (-${discount_pct}%)` : ''}` : 'consultation';
      const pick = synth?.top_picks?.find((p) => p.match_id === hp.id);
      const why = pick ? `\n   why: ${pick.rationale}` : '';
      return `${i + 1}. ${brand.name_ko} — ${hp.local_name_ko} · ${price}${why}`;
    }),
    '',
    synth?.closing || 'Could you help me prioritize and confirm availability?',
  ].filter(Boolean);
  return lines.join('\n');
}

function openWhatsApp(text) {
  const links = buildWhatsAppLinks({});
  const phone = links.native.match(/phone=(\d+)/)[1];
  const native = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const web = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isMobile) { window.location.href = native; return; }
  let opened = false;
  const blur = () => { opened = true; };
  window.addEventListener('blur', blur, { once: true });
  window.location.href = native;
  setTimeout(() => { window.removeEventListener('blur', blur); if (!opened) window.open(web, '_blank'); }, 1500);
}

export default function ResultsPage({ snapshot, ai, prefs, onRestart }) {
  const matches = useMemo(() => prefs ? matchOfferings(prefs) : [], [prefs]);
  const [synth, setSynth] = useState(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState(null);

  // Kick the GPT 2nd-call when results page mounts with valid inputs.
  useEffect(() => {
    if (!prefs || matches.length === 0) return;
    let cancelled = false;
    const ctl = new AbortController();
    setSynthLoading(true);
    setSynthError(null);
    synthesizeMatch({
      ai,
      prefs: toApiPrefs(prefs),
      matches: matches.map(toApiMatch),
    }, { signal: ctl.signal })
      .then((res) => { if (!cancelled) setSynth(res); })
      .catch((e) => { if (!cancelled) setSynthError(e.message); })
      .finally(() => { if (!cancelled) setSynthLoading(false); });
    return () => { cancelled = true; ctl.abort(); };
  }, [prefs, ai, matches.length]);

  const message = useMemo(
    () => (prefs ? buildPrefilledMessage({ matches, prefs, ai, synth }) : ''),
    [matches, prefs, ai, synth]
  );

  if (!prefs) {
    return (
      <section className="gs-section">
        <div className="gs-empty">No scan in this session.<br /><button className="gs-cta" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Start your scan</button></div>
      </section>
    );
  }

  const pickById = (id) => synth?.top_picks?.find((p) => p.match_id === id);

  // Split matches into AI-picked (top section) and the rest (bottom section).
  const aiPickedMatches = synth?.top_picks
    ?.map((p) => matches.find((m) => m.offering.hp.id === p.match_id))
    .filter(Boolean) || [];
  const aiPickedIds = new Set(aiPickedMatches.map((m) => m.offering.hp.id));
  const otherMatches = matches.filter((m) => !aiPickedIds.has(m.offering.hp.id));

  const showMatches = !synthLoading && !synthError;
  const showAllAsFallback = synthError && matches.length > 0;

  // ===== Fetch Google reviews for AI-picked clinics in parallel =====
  const [reviewsByHospital, setReviewsByHospital] = useState({});
  useEffect(() => {
    if (!showMatches || aiPickedMatches.length === 0) return;
    const slugs = [...new Set(aiPickedMatches.map((m) => m.offering.hospital.slug))];
    let cancelled = false;
    const ctl = new AbortController();
    Promise.all(
      slugs.map((slug) =>
        getClinicReviews(slug, { signal: ctl.signal })
          .then((data) => [slug, data])
          .catch(() => [slug, null])
      )
    ).then((entries) => {
      if (cancelled) return;
      setReviewsByHospital(Object.fromEntries(entries));
    });
    return () => { cancelled = true; ctl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMatches, aiPickedMatches.map((m) => m.offering.hospital.slug).join('|')]);

  function pickedReview(hospitalSlug) {
    const r = reviewsByHospital[hospitalSlug];
    if (!r || !r.reviews?.length) return null;
    // Prefer EN, then ZH, then anything; pick highest rating among that pool
    const en = r.reviews.filter((x) => (x.language || '').startsWith('en'));
    const zh = r.reviews.filter((x) => (x.language || '').startsWith('zh'));
    const pool = en.length ? en : zh.length ? zh : r.reviews;
    return pool.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }

  return (
    <>
      <section className="gs-section" style={{ paddingBottom: 24 }}>
        <button className="gs-back" onClick={() => navigate('/')}>← Home</button>
        <div className="gs-result-hero">
          {snapshot ? (
            <div className="gs-result-portrait">
              <img src={snapshot} alt="Your scan" />
              <div className="gs-result-portrait-meta">
                <div className="gs-eyebrow">✦ Your Scan</div>
                <div>Analysis complete · <em>your story</em> mapped</div>
              </div>
            </div>
          ) : (
            <div className="gs-result-portrait gs-result-portrait--noscan">
              <div className="gs-eyebrow">No scan</div>
              <div>Working from your preferences only.</div>
            </div>
          )}
          <div>
            <div className="gs-eyebrow">◈ {matches.length} matches</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, lineHeight: 1.1, margin: '8px 0 12px' }}>
              Your <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>shortlist.</em>
            </h1>

            {/* Romie's overall narrative — shown after synth resolves; loading state below uses AiSynthLoading panel separately */}
            {synth?.overall && (
              <div className="gs-synth-card gs-reveal gs-revealed">
                <div className="gs-synth-head">
                  <div className="gs-synth-avatar">R</div>
                  <div>
                    <div className="gs-eyebrow">✦ Romie's overall read</div>
                    <div className="gs-synth-sub">Synthesized from your scan &amp; preferences</div>
                  </div>
                </div>
                <blockquote className="gs-synth-quote">"{synth.overall}"</blockquote>
                {synth.closing && <p className="gs-synth-closing">{synth.closing}</p>}
                {synth._mock && (
                  <p style={{ marginTop: 8, fontSize: 11, color: 'var(--rose)' }}>
                    ⚠ mock — set OPENAI_API_KEY in server/.env for real synthesis
                  </p>
                )}
              </div>
            )}
            {synthError && (
              <div className="gs-synth-error" style={{ marginBottom: 16 }}>
                Romie's read couldn't load ({synthError}). Showing pref-based matches below.
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <button className="gs-cta" onClick={() => openWhatsApp(message)} disabled={synthLoading}>
                Send all to WhatsApp →
              </button>
              <button className="gs-cta gs-cta--outline" onClick={onRestart}>Refine my answers</button>
            </div>
          </div>
        </div>
      </section>

      {matches.length === 0 && (
        <section className="gs-section gs-empty">
          No offerings match all your hard limits.<br />Try raising downtime or budget tolerance.
          <div style={{ marginTop: 24 }}><button className="gs-cta gs-cta--outline" onClick={onRestart}>Adjust answers</button></div>
        </section>
      )}

      {/* ============ AI SELECTION — synth top_picks ============ */}
      {matches.length > 0 && (
        <section className="gs-section gs-ai-selection">
          <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 48, maxWidth: '100%', margin: '0 auto 48px' }}>
            <div className="gs-eyebrow">✦ AI Selection · gpt-4o-mini</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
              Romie's <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>three picks</em>{' '}
              <span style={{ color: 'var(--text-muted)' }}>— with why.</span>
            </h2>
            <p style={{ color: 'var(--text-soft)', maxWidth: 560, marginTop: 16, fontWeight: 300 }}>
              The concierge AI synthesizes your scan, preferences, and active offers — and writes a one-line rationale for each pick. Not a generic "best seller" list.
            </p>
          </div>

          {synthLoading && (
            <>
              <AiSynthLoading />
              <div className="gs-ai-pick-grid" style={{ marginTop: 40 }}>
                {[1, 2, 3].map((i) => <AiPickSkeleton key={i} rank={i} />)}
              </div>
            </>
          )}

          {showAllAsFallback && (
            <div className="gs-empty" style={{ padding: 40 }}>
              Synthesis offline — showing rule-based ranking below.
            </div>
          )}

          {showMatches && aiPickedMatches.length > 0 && (
            <div className="gs-ai-pick-grid gs-reveal gs-revealed">
              {aiPickedMatches.map((m, idx) => {
                const { hp, procedure, hospital, brand, discount_pct } = m.offering;
                const pick = pickById(hp.id);
                const single = `Hi Romie — I'm interested in ${hp.local_name_ko} at ${brand.name_ko} (₩${hp.starting_price_krw?.toLocaleString() || 'consult'}).${pick ? ` You said: "${pick.rationale}"` : ''}`;
                return (
                  <article key={hp.id} className="gs-ai-pick">
                    <div className="gs-ai-pick-rank">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="gs-ai-pick-thumb" style={{ backgroundImage: `url(${procedure.thumbnail_url})` }} onClick={() => navigate(`/treatment/${procedure.slug}`)} />
                    <div className="gs-ai-pick-body">
                      <div className="gs-eyebrow" style={{ marginBottom: 8 }}>Why Romie chose this</div>
                      <blockquote className="gs-ai-pick-rationale">"{pick?.rationale}"</blockquote>

                      <button className="gs-ai-pick-name" onClick={() => navigate(`/treatment/${procedure.slug}`)}>
                        {hp.local_name_ko}
                      </button>
                      <button className="gs-ai-pick-clinic" onClick={() => navigate(`/clinic/${hospital.slug}`)}>
                        at {brand.name_ko} · {hospital.neighborhood}
                      </button>

                      <div className="gs-ai-pick-meta">
                        <span>Pain {procedure.pain_level}/5</span>
                        <span>{procedure.downtime_days}d downtime</span>
                        <span>{procedure.intensity}</span>
                      </div>

                      {(() => {
                        const rev = reviewsByHospital[hospital.slug];
                        const review = pickedReview(hospital.slug);
                        if (!rev) {
                          return (
                            <div className="gs-ai-pick-reviews gs-ai-pick-reviews--loading">
                              <span className="gs-dot-pulse"><span /><span /><span /></span>
                              <span>Pulling Google reviews for {brand.name_en}…</span>
                            </div>
                          );
                        }
                        return (
                          <div className="gs-ai-pick-reviews">
                            <div className="gs-ai-pick-reviews-head">
                              <div className="gs-ai-pick-reviews-rating">
                                <span className="gs-ai-pick-reviews-num">{rev.rating?.toFixed(1) ?? '—'}</span>
                                <StarBar rating={rev.rating} size={13} />
                              </div>
                              <div className="gs-ai-pick-reviews-count">
                                {rev.rating_count?.toLocaleString() || 0} Google reviews
                                {rev.review_lang_breakdown && (
                                  <span style={{ marginLeft: 8 }}>
                                    {Object.entries(rev.review_lang_breakdown).map(([l, n]) => `${n} ${LANG_FLAGS_R[l] || l}`).join(' · ')}
                                  </span>
                                )}
                              </div>
                              {rev.google_url && (
                                <a className="gs-ai-pick-reviews-more" href={rev.google_url} target="_blank" rel="noreferrer">
                                  More on Google ↗
                                </a>
                              )}
                            </div>
                            {review && (
                              <figure className="gs-ai-pick-review">
                                <ReviewAvatar src={review.photo} name={review.author} size={36} className="gs-ai-pick-review-avatar" />
                                <figcaption>
                                  <div className="gs-ai-pick-review-meta">
                                    <strong>{review.author}</strong>
                                    <StarBar rating={review.rating} size={10} />
                                    <span>· {review.relative || ''}</span>
                                    {review.language && <span>· {LANG_FLAGS_R[review.language] || review.language}</span>}
                                  </div>
                                  <blockquote>{review.text}</blockquote>
                                </figcaption>
                              </figure>
                            )}
                          </div>
                        );
                      })()}

                      <div className="gs-ai-pick-foot">
                        <div>
                          <div className="gs-ai-pick-price-from">From</div>
                          <div className="gs-ai-pick-price-amt">{hp.price_disclosed ? fmtKRW(hp.starting_price_krw) : '상담'}</div>
                          {discount_pct > 0 && <div className="gs-ai-pick-price-orig">{fmtKRW(hp.original_price_krw)} · -{discount_pct}%</div>}
                        </div>
                        <button className="gs-cta gs-cta--mini" onClick={() => openWhatsApp(single)}>WhatsApp →</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============ OTHER MATCHES — remaining rule-based candidates ============ */}
      {showMatches && otherMatches.length > 0 && (
        <section className="gs-section" style={{ background: 'var(--bg-soft)', maxWidth: 'none' }}>
          <div style={{ maxWidth: 1480, margin: '0 auto' }}>
            <div className="gs-section-head" style={{ textAlign: 'left', marginBottom: 32, maxWidth: '100%', margin: '0 0 32px' }}>
              <div className="gs-eyebrow">◇ Other candidates</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 400, lineHeight: 1.1 }}>
                Also <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>worth a look.</em>
              </h2>
              <p style={{ color: 'var(--text-soft)', maxWidth: 540, marginTop: 12, fontWeight: 300 }}>
                Rule-based matches — passed your hard limits but didn't make Romie's top 3.
              </p>
            </div>
            <div className="gs-match-grid">
              {otherMatches.map((m) => {
                const { hp, procedure, hospital, brand, discount_pct } = m.offering;
                const idx = matches.indexOf(m);
                const single = `Hi Romie — I'm interested in ${hp.local_name_ko} at ${brand.name_ko} (₩${hp.starting_price_krw?.toLocaleString() || 'consult'}).`;
                return (
                  <article key={hp.id} className="gs-match-card">
                    <div className="rank">#{idx + 1}</div>
                    <div className="thumb" style={{ backgroundImage: `url(${procedure.thumbnail_url})` }} />
                    <div className="body">
                      <button className="gs-link" onClick={() => navigate(`/treatment/${procedure.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500 }}>{hp.local_name_ko}</h3>
                      </button>
                      <button onClick={() => navigate(`/clinic/${hospital.slug}`)} style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: 'var(--text-soft)', fontSize: 13 }}>
                        at {brand.name_ko} · {hospital.neighborhood}
                      </button>
                      <div className="meta">
                        <span>Pain {procedure.pain_level}/5</span>
                        <span>{procedure.downtime_days}d downtime</span>
                        <span>{procedure.intensity}</span>
                      </div>
                      {m.reasons.length > 0 && (
                        <ul className="reasons">
                          {m.reasons.slice(0, 3).map((r) => <li key={r}>· {r}</li>)}
                        </ul>
                      )}
                      <div className="price-row">
                        <div>
                          <div className="price-from">From</div>
                          <div className="price-amt">{hp.price_disclosed ? fmtKRW(hp.starting_price_krw) : '상담'}</div>
                          {discount_pct > 0 && <div className="price-orig">{fmtKRW(hp.original_price_krw)} · -{discount_pct}%</div>}
                        </div>
                        <div className="actions">
                          <button className="gs-cta gs-cta--mini" onClick={() => openWhatsApp(single)}>WhatsApp</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showAllAsFallback && (
        <section className="gs-section">
          <div className="gs-match-grid">
            {matches.map((m, idx) => {
              const { hp, procedure, hospital, brand, discount_pct } = m.offering;
              const single = `Hi Romie — I'm interested in ${hp.local_name_ko} at ${brand.name_ko}.`;
              return (
                <article key={hp.id} className="gs-match-card">
                  <div className="rank">#{idx + 1}</div>
                  <div className="thumb" style={{ backgroundImage: `url(${procedure.thumbnail_url})` }} />
                  <div className="body">
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500 }}>{hp.local_name_ko}</h3>
                    <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>at {brand.name_ko} · {hospital.neighborhood}</div>
                    <div className="meta"><span>Pain {procedure.pain_level}/5</span><span>{procedure.downtime_days}d</span></div>
                    <div className="price-row">
                      <div>
                        <div className="price-from">From</div>
                        <div className="price-amt">{hp.price_disclosed ? fmtKRW(hp.starting_price_krw) : '상담'}</div>
                      </div>
                      <button className="gs-cta gs-cta--mini" onClick={() => openWhatsApp(single)}>WhatsApp</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="gs-cta-strip">
        <h2>Romie reads <em>every</em> shortlist personally.</h2>
        <p>Send your AI synthesis + match to WhatsApp and you'll hear back within 24 hours in your language.</p>
        <button className="gs-cta" onClick={() => openWhatsApp(message)}>Talk to your Concierge</button>
      </section>
    </>
  );
}
