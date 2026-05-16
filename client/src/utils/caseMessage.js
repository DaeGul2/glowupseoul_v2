// Format an anonymized scan/match case into a structured WhatsApp message.
// Designed for the on-call concierge (Romie) to skim in <10 seconds and
// understand exactly what the patient asked for + what the AI proposed.
//
// Two language variants — EN and ZH. The field LABELS translate; user-provided
// free text (e.g., the AI narrative, the user's notes) stays in whichever
// language they were originally written, since that's the authentic voice.

const I18N = {
  en: {
    title: '[Glow Up Seoul · AI Scan Inquiry]',
    section: {
      patient:        '━━━ PATIENT ━━━',
      brief:          '━━━ THEIR BRIEF ━━━',
      scan:           '━━━ AI FACE SCAN ━━━',
      recommendation: '━━━ AI RECOMMENDATION ━━━',
      ask:            '━━━ ASK ━━━',
    },
    label: {
      initial:    'Initial',
      country:    'Country',
      language:   'Language',
      submitted:  'Submitted',
      outcome:    'Outcome',
      concerns:   'Concerns',
      budget:     'Budget',
      downtime:   'Max downtime',
      pain:       'Pain tolerance',
      style:      'Style preference',
      devicePref: 'Preferred device(s)',
      notes:      'Notes',
      confidence: 'Confidence',
      observed:   'AI observed',
      metrics:    'Metrics (0–100)',
      regions:    'Flagged regions',
      overall:    "Romie's overall read",
      topMatch:   'Top match',
      hospital:   'Hospital',
      device:     'Device',
      price:      'Price',
      whyFit:     'Why this fit',
      closing:    'Closing note',
    },
    metric: {
      skin_clarity:        'Skin clarity',
      tone_evenness:       'Tone evenness',
      under_eye_darkness:  'Under-eye darkness',
      jawline_definition:  'Jawline definition',
      symmetry:            'Symmetry',
      youthful_volume:     'Youthful volume',
    },
    painScale: ['—', 'very low', 'low', 'moderate', 'high', 'very high'],
    skipped:   'No face scan in this case (patient skipped).',
    askLine:   "Please confirm doctor availability for the patient's trip dates, and any pre-treatment requirements.",
    days:      'days',
    of:        'of',
    orig:      'orig',
  },
  zh: {
    title: '[Glow Up Seoul · AI 扫描咨询]',
    section: {
      patient:        '━━━ 客户 ━━━',
      brief:          '━━━ 客户需求 ━━━',
      scan:           '━━━ AI 面部扫描 ━━━',
      recommendation: '━━━ AI 推荐 ━━━',
      ask:            '━━━ 咨询请求 ━━━',
    },
    label: {
      initial:    '昵称',
      country:    '国家',
      language:   '语言',
      submitted:  '提交时间',
      outcome:    '状态',
      concerns:   '关注问题',
      budget:     '预算',
      downtime:   '最大恢复期',
      pain:       '疼痛耐受',
      style:      '风格偏好',
      devicePref: '偏好设备',
      notes:      '备注',
      confidence: '置信度',
      observed:   'AI 观察',
      metrics:    '指标 (0–100)',
      regions:    '标记区域',
      overall:    'Romie 总评',
      topMatch:   '首选推荐',
      hospital:   '医院',
      device:     '设备',
      price:      '价格',
      whyFit:     '匹配原因',
      closing:    '结语',
    },
    metric: {
      skin_clarity:        '皮肤清晰度',
      tone_evenness:       '肤色均匀度',
      under_eye_darkness:  '黑眼圈',
      jawline_definition:  '下颌线轮廓',
      symmetry:            '对称性',
      youthful_volume:     '面部饱满度',
    },
    painScale: ['—', '极低', '低', '中等', '高', '极高'],
    skipped:   '此客户跳过了 AI 面部扫描。',
    askLine:   '请根据客户的访韩日期确认医生可用时间和术前注意事项。',
    days:      '天',
    of:        '/',
    orig:      '原价',
  },
};

function fmtSubmitted(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(d) + ' KST';
  } catch { return iso; }
}

function fmtKRW(n) {
  if (n == null) return '—';
  return `₩${n.toLocaleString('en-US')}`;
}

/**
 * Build a WhatsApp-ready message string from a case-shaped entry.
 *
 * @param {object} args
 * @param {object} args.entry        publicFeed entry (with .case sub-object)
 * @param {string} [args.lang='en']  'en' | 'zh'
 * @returns {string}                 plain text, newline separated, no markdown
 */
export function buildCaseMessage({ entry, lang = 'en' }) {
  const t = I18N[lang] || I18N.en;
  const c = entry?.case || {};
  const prefs = c.prefs || {};
  const ai = c.ai_scan;
  const synth = c.synth;
  const top = c.top_match;
  const out = [];
  const push = (s) => out.push(s);
  const pushKV = (label, value) => { if (value || value === 0) out.push(`• ${label}: ${value}`); };

  push(t.title);
  push('');

  // ============ PATIENT ============
  push(t.section.patient);
  pushKV(t.label.initial,  entry?.display_initial);
  pushKV(t.label.country,  entry?.country_label_en);
  pushKV(t.label.language, (prefs.language || lang).toUpperCase());
  pushKV(t.label.submitted, fmtSubmitted(entry?.displayed_at));
  if (entry?.outcome) pushKV(t.label.outcome, entry.outcome);
  push('');

  // ============ BRIEF ============
  push(t.section.brief);
  if (entry?.concern_labels_en) pushKV(t.label.concerns, entry.concern_labels_en);
  if (prefs.budget_label)       pushKV(t.label.budget,   prefs.budget_label);
  if (prefs.downtime_max != null) pushKV(t.label.downtime, `${prefs.downtime_max} ${t.days}`);
  if (prefs.pain_max != null) {
    const painWord = t.painScale[prefs.pain_max] || '—';
    pushKV(t.label.pain, `${painWord} (${prefs.pain_max}/5)`);
  }
  if (prefs.style_target != null) {
    pushKV(t.label.style, `${prefs.style_label || ''} (${prefs.style_target}/5)`.trim());
  }
  if (Array.isArray(prefs.device_pref_labels) && prefs.device_pref_labels.length) {
    pushKV(t.label.devicePref, prefs.device_pref_labels.join(', '));
  }
  if (prefs.notes) {
    push(`• ${t.label.notes}:`);
    push(`  "${prefs.notes}"`);
  }
  push('');

  // ============ AI FACE SCAN ============
  push(t.section.scan);
  if (!ai) {
    push(t.skipped);
  } else {
    if (ai.confidence)  pushKV(t.label.confidence, ai.confidence);
    if (ai.narrative) {
      push(`• ${t.label.observed}:`);
      push(`  "${ai.narrative}"`);
    }
    if (ai.metrics) {
      push('');
      push(`• ${t.label.metrics}:`);
      for (const [k, v] of Object.entries(ai.metrics)) {
        push(`    – ${t.metric[k] || k}: ${v}`);
      }
    }
    if (ai.regions?.length) {
      push('');
      push(`• ${t.label.regions}:`);
      for (const r of ai.regions) {
        push(`    – ${r.label.replace('_', ' ')} — ${r.note}`);
      }
    }
  }
  push('');

  // ============ AI RECOMMENDATION ============
  push(t.section.recommendation);
  if (synth?.overall) {
    push(`• ${t.label.overall}:`);
    push(`  "${synth.overall}"`);
    push('');
  }
  if (top) {
    push(`• ${t.label.topMatch}: ${top.procedure_name_en}`);
    if (top.hospital_name_en) pushKV(`  ${t.label.hospital}`, top.hospital_name_en);
    if (top.device_brands?.length) pushKV(`  ${t.label.device}`, top.device_brands.join(', '));
    if (top.price_krw != null) {
      const discount = top.discount_pct ? ` (${t.orig} ${fmtKRW(top.original_price_krw)}, −${top.discount_pct}%)` : '';
      pushKV(`  ${t.label.price}`, `${fmtKRW(top.price_krw)}${discount}`);
    }
    if (synth?.rationale) {
      push(`  ${t.label.whyFit}:`);
      push(`    "${synth.rationale}"`);
    }
  }
  if (synth?.closing) {
    push('');
    push(`• ${t.label.closing}:`);
    push(`  "${synth.closing}"`);
  }
  push('');

  // ============ ASK ============
  push(t.section.ask);
  push(t.askLine);

  return out.join('\n');
}

/**
 * Build a case-shaped entry from live scan state (snapshot, ai analyze result, prefs, matches).
 * Used by ResultsPage where we have these inputs but no publicFeed entry yet.
 */
export function buildEntryFromLive({ ai, prefs, matches, synth, devices = [] }) {
  const top = matches?.[0]?.offering;
  if (!top) return null;
  const { hp, procedure, hospital, brand, discount_pct } = top;
  const BUDGET_LABELS = { under_300: 'Under ₩300k', '300_800': '₩300k – ₩800k', '800_2000': '₩800k – ₩2M', '2000_5000': '₩2M – ₩5M', over_5000: 'Over ₩5M' };
  const STYLE_LABELS = ['Subtle', 'Soft', 'Balanced', 'Bold', 'Dramatic'];

  // Resolve preferred device slugs to display labels (e.g. "Ulthera · Shurink").
  const deviceBySlug = Object.fromEntries((devices || []).map((d) => [d.slug, d]));
  const devicePrefLabels = (prefs.devicePrefSlugs || [])
    .map((slug) => {
      const d = deviceBySlug[slug];
      if (!d) return slug;
      return d.name_en && d.name_ko ? `${d.name_en} (${d.name_ko})` : (d.name_en || d.name_ko || slug);
    });

  return {
    display_initial: 'You',
    country_label_en: prefs.language === 'zh' ? 'CN/HK/TW' : prefs.language === 'ja' ? 'Japan' : (prefs.language || '').toUpperCase(),
    displayed_at: new Date().toISOString(),
    outcome: 'matched',
    outcome_note_en: matches.length ? `${matches.length} candidates ranked` : null,
    concern_labels_en: (prefs.concern_labels || []).join(' · '),
    case: {
      prefs: {
        budget_tier: prefs.budget_tier,
        budget_label: BUDGET_LABELS[prefs.budget_tier] || `Up to ₩${(prefs.budgetMax || 0).toLocaleString()}`,
        downtime_max: prefs.downtimeMax,
        pain_max: prefs.painMax,
        style_target: prefs.styleTarget,
        style_label: STYLE_LABELS[(prefs.styleTarget || 3) - 1],
        device_pref_labels: devicePrefLabels,
        language: prefs.language,
        notes: prefs.notes,
      },
      ai_scan: ai ? {
        narrative: ai.narrative,
        confidence: ai.confidence,
        concerns_detected: ai.concerns,
        metrics: ai.metrics,
        regions: ai.regions,
      } : null,
      synth: synth ? {
        overall: synth.overall,
        rationale: synth.top_picks?.[0]?.rationale || null,
        closing: synth.closing,
      } : null,
      top_match: {
        procedure_name_en: procedure.name_en,
        hospital_name_en: `${brand.name_en || brand.name_ko} · ${hospital.neighborhood}`,
        price_krw: hp.starting_price_krw,
        original_price_krw: hp.original_price_krw,
        discount_pct: discount_pct || 0,
        device_brands: hp.device_brands || [],
      },
    },
  };
}
