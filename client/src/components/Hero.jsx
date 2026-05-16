// Hero — full-bleed video + asymmetric editorial typography with
// Framer Motion line-stagger reveal. Inspired by Studio Kiiment + Loewe ed-spreads.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useScanFlow } from '../App.jsx';
import WhatsAppCTA from './WhatsAppCTA.jsx';

const VIDEO_SOURCES = [
  // Pexels — slow-mo woman portrait, stable since 2021
  'https://videos.pexels.com/video-files/4940099/4940099-uhd_2732_1440_25fps.mp4',
  // Local override — drop your own clip into client/public/hero.mp4 to use it.
  '/hero.mp4',
];

const POSTER = 'https://images.unsplash.com/photo-1614102073832-030967418971?auto=format&fit=crop&w=2400&q=85';

// — Framer Motion variants: title lines slide up from below the mask, staggered.
const titleStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
};
const lineRise = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

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
        <motion.span
          className="gs-hero-eyebrow"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Glow Up Seoul
        </motion.span>
        <motion.span
          className="gs-hero-eyebrow gs-hero-eyebrow--right"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          SEOUL · 강남 · 청담 · BUSAN · 해운대
        </motion.span>
      </header>

      <div className="gs-hero-stage">
        <div className="gs-hero-content">
          <motion.span
            className="gs-hero-kicker"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            A medical-beauty <em>concierge</em> — 강남 · 부산
          </motion.span>

          <motion.h1
            className="gs-hero-title gs-display"
            variants={titleStagger}
            initial="hidden"
            animate="visible"
          >
            <span className="gs-hero-line"><motion.span variants={lineRise}>Your skin.</motion.span></span>
            <span className="gs-hero-line"><motion.span variants={lineRise}><em>Your story.</em></motion.span></span>
            <span className="gs-hero-line"><motion.span variants={lineRise}>Seoul.</motion.span></span>
          </motion.h1>

          <motion.p
            className="gs-hero-lede"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.95 }}
          >
            One coordinator. One journey.<br />
            Entirely yours — across 22 partner clinics in Gangnam &amp; Busan.
          </motion.p>

          <motion.div
            className="gs-hero-cta-row"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.15 }}
          >
            <button className="gs-cta gs-cta--lg" onClick={flow?.openScan}>
              <span>Start your AI face analysis</span>
              <span className="gs-cta-tail">→</span>
            </button>
            <WhatsAppCTA label="Talk to your Concierge" />
          </motion.div>
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
