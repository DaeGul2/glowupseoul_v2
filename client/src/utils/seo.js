// Lightweight per-page SEO. No react-helmet — direct DOM head manipulation
// on mount + cleanup on unmount. Renders:
//   • <title>
//   • <meta name="description">
//   • <meta name="keywords">              (optional)
//   • <link rel="canonical">
//   • Open Graph (og:title/description/url/image/type)
//   • Twitter (summary_large_image)
//   • <link rel="alternate" hreflang="…">  (when alts provided)
//   • <script type="application/ld+json">  (structured data)
//   • <meta name="robots">                 (override per-page when needed)
//
// Public site origin used for canonical/og:url construction.
export const SITE_ORIGIN = 'https://glowupseoul.com';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-cover.jpg`;

import { useEffect } from 'react';

function setMeta(selector, attrName, attrValue, content) {
  if (content == null) return null;
  let el = document.head.querySelector(selector);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (prev != null) el.setAttribute('content', prev);
  };
}

function setLink(rel, href, hreflang) {
  if (!href) return null;
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector(sel);
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('href');
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else if (prev != null) el.setAttribute('href', prev);
  };
}

function setJsonLd(id, json) {
  if (!json) return null;
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.dataset.seoId = id;
  tag.text = JSON.stringify(json);
  document.head.appendChild(tag);
  return () => tag.remove();
}

export function useSeo(opts) {
  useEffect(() => {
    if (!opts) return;
    const {
      title,
      description,
      keywords,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      ogType = 'website',
      noindex,
      alternates,        // { en: '/path', zh: '/zh/path', ... }
      jsonLd,            // single object or array
    } = opts;

    const cleanups = [];
    const prevTitle = document.title;

    if (title) document.title = `${title} · Glow Up Seoul`;

    cleanups.push(setMeta('meta[name="description"]', 'name', 'description', description));
    cleanups.push(setMeta('meta[name="keywords"]',    'name', 'keywords',    keywords));
    cleanups.push(setMeta('meta[name="robots"]',      'name', 'robots',      noindex ? 'noindex, nofollow' : null));

    const url = canonical ? new URL(canonical, SITE_ORIGIN).toString() : window.location.href.split('#')[0];
    cleanups.push(setLink('canonical', url));

    cleanups.push(setMeta('meta[property="og:title"]',       'property', 'og:title',       ogTitle       || title));
    cleanups.push(setMeta('meta[property="og:description"]', 'property', 'og:description', ogDescription || description));
    cleanups.push(setMeta('meta[property="og:url"]',         'property', 'og:url',         url));
    cleanups.push(setMeta('meta[property="og:image"]',       'property', 'og:image',       ogImage || DEFAULT_OG_IMAGE));
    cleanups.push(setMeta('meta[property="og:type"]',        'property', 'og:type',        ogType));

    cleanups.push(setMeta('meta[name="twitter:title"]',       'name', 'twitter:title',       ogTitle       || title));
    cleanups.push(setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', ogDescription || description));
    cleanups.push(setMeta('meta[name="twitter:image"]',       'name', 'twitter:image',       ogImage || DEFAULT_OG_IMAGE));

    if (alternates) {
      for (const [lang, href] of Object.entries(alternates)) {
        cleanups.push(setLink('alternate', new URL(href, SITE_ORIGIN).toString(), lang));
      }
    }

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((j, i) => cleanups.push(setJsonLd(`seo-${i}`, j)));
    }

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => { try { fn && fn(); } catch {} });
    };
  // We deliberately want to fire whenever opts changes — pages pass new objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(opts)]);
}

// -- Common JSON-LD builders -----------------------------------------

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.url, SITE_ORIGIN).toString(),
    })),
  };
}

export function medicalProcedureLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: p.name_en || p.name_ko,
    alternateName: [p.name_ko, p.name_zh, p.name_ja].filter(Boolean),
    description: p.description_en || p.description_ko,
    image: p.hero_image_url || p.thumbnail_url,
    procedureType: (p.body_area || []).join(', '),
    bodyLocation: (p.body_area || []).join(', '),
    preparation: p.is_surgical ? 'Consultation, blood work, anesthesia review' : undefined,
    followup: p.downtime_days ? `Typical downtime ${p.downtime_days} day(s)` : undefined,
  };
}

export function medicalBusinessLd(h) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: h.name_en || h.name_ko,
    alternateName: [h.name_ko, h.name_zh, h.name_ja].filter(Boolean),
    image: h.hero_image_url || h.thumbnail_url,
    description: h.safety_claim,
    address: {
      '@type': 'PostalAddress',
      streetAddress: h.full_address_en || h.full_address_ko,
      addressLocality: h.city,
      addressRegion: h.district,
      addressCountry: h.country || 'KR',
    },
    telephone: h.phone,
    url: h.website_url,
    geo: h.lat && h.lng ? { '@type': 'GeoCoordinates', latitude: h.lat, longitude: h.lng } : undefined,
    availableLanguage: h.languages_supported,
    medicalSpecialty: h.brand?.specialization_depth,
  };
}

export function faqPageLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}
