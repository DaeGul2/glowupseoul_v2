import { useEffect, useRef, useState } from 'react';
import { useScanFlow } from '../App.jsx';
import WhatsAppCTA from './WhatsAppCTA.jsx';

// Multi-source video. Tries Pexels stable URLs first, falls back to local public/hero.mp4,
// finally to a pure-CSS animated gradient if all video sources fail.
const VIDEO_SOURCES = [
  // Pexels — slow-mo woman portrait, stable since 2021
  'https://videos.pexels.com/video-files/4940099/4940099-uhd_2732_1440_25fps.mp4',
  // Local override — drop your own clip into v2/client/public/hero.mp4 to use it.
  '/hero.mp4',
];

const POSTER = 'https://images.unsplash.com/photo-1614102073832-030967418971?auto=format&fit=crop&w=2400&q=85';

export default function Hero() {
  const flow = useScanFlow();
  const videoRef = useRef(null);
  const [videoOk, setVideoOk] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onError = () => setVideoOk(false);
    v.addEventListener('error', onError, true);
    return () => v.removeEventListener('error', onError, true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className={`gs-hero-v2 ${videoOk ? '' : 'gs-hero-v2--novideo'}`}>
      <video
        ref={videoRef}
        className="gs-hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={POSTER}
      >
        {VIDEO_SOURCES.map((src) => <source key={src} src={src} type="video/mp4" />)}
      </video>

      <div className="gs-hero-tint" />
      <div className="gs-hero-grain" aria-hidden="true" />

      <header className="gs-hero-top">
        <span className="gs-hero-eyebrow">✦  Glow Up Seoul</span>
        <span className="gs-hero-eyebrow gs-hero-eyebrow--right">SEOUL · 강남 · 청담 · BUSAN · 해운대</span>
      </header>

      <div className="gs-hero-stage">
        <div className="gs-hero-content">
          <span className="gs-hero-kicker">A medical-beauty <em>concierge</em></span>
          <h1 className="gs-hero-title">
            Your Skin.<br />
            <em>Your Story.</em><br />
            Seoul.
          </h1>
          <p className="gs-hero-lede">
            One coordinator. One journey.<br />
            Entirely yours — across 22 partner clinics in Gangnam &amp; Busan.
          </p>
          <div className="gs-hero-cta-row">
            <button className="gs-cta gs-cta--lg" onClick={flow?.openScan}>
              <span>✦ Start your AI face analysis</span>
              <span className="gs-cta-tail">→</span>
            </button>
            <WhatsAppCTA label="Talk to your Concierge" />
          </div>
        </div>
      </div>

      {/* Marquee bottom — trust signals */}
      <div className="gs-hero-marquee" aria-hidden="true">
        <div className="gs-marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="gs-marquee-row">
              <span><em>500+</em> patients matched</span>
              <span className="dot">·</span>
              <span><em>98%</em> satisfaction</span>
              <span className="dot">·</span>
              <span><em>10,000+</em> clinics evaluated</span>
              <span className="dot">·</span>
              <span><em>25+</em> countries</span>
              <span className="dot">·</span>
              <span>Ministry of Health &amp; Welfare registered</span>
              <span className="dot">·</span>
              <span><em>24h</em> WhatsApp reply</span>
              <span className="dot">·</span>
              <span>EN · 中文 · 日本語 · Bahasa</span>
              <span className="dot">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className={`gs-hero-scrollcue ${scrolled ? 'gs-hero-scrollcue--hidden' : ''}`} aria-hidden="true">
        <span>SCROLL</span>
        <span className="line" />
      </div>
    </section>
  );
}
