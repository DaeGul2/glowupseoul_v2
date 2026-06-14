// Update ONLY the `description` (Markdown) of each procedure by slug.
// Doesn't touch other fields, so it's safe to re-run after admin edits.
//   node scripts/seed-v3-descriptions.js
import 'dotenv/config';
import { Treatment, Surgery } from '../db/modelsV3.js';

const T = {
  ulthera: `## What it is
Ulthera is the original FDA-cleared HIFU (high-intensity focused ultrasound) lift. It reaches the **SMAS layer** — the same deep support layer a surgeon tightens in a facelift — without a single cut.

## How it works
Focused ultrasound creates tiny coagulation points deep under the skin. Over the following weeks your body answers with fresh collagen, gradually lifting and firming the area.

| At a glance | |
| --- | --- |
| Mechanism | Focused ultrasound (SMAS) |
| Best for | Early jowls, cheek and brow softening |
| Sensation | Brief deep warmth in pulses |
| Downtime | None |
| Results build | 2–3 months, peak around 3 |

## What to expect
The session is quick and you walk out looking normal — perhaps a little flushed. The lift reveals itself slowly and naturally over the next few months.

> One well-done Ulthera a year keeps most people ahead of gravity.`,

  thermage: `## What it is
Thermage FLX is a monopolar **radiofrequency** treatment that tightens skin and smooths texture in a single session, with no downtime.

## How it works
RF energy heats the deep dermis to a precise temperature, contracting existing collagen immediately and stimulating new collagen for months afterward.

| At a glance | |
| --- | --- |
| Mechanism | Monopolar radiofrequency |
| Best for | Overall firmness, pores, fine crepiness |
| Sensation | Warm with a brief cooling pulse |
| Downtime | None |
| Results last | Around 1–2 years |

## Ulthera or Thermage?
| | Ulthera | Thermage |
| --- | --- | --- |
| Targets | Deep SMAS — lifting | Dermis — tightening |
| Feels like | Deep pulses | Surface warmth |
| Best for | Sagging | Skin quality + firmness |

## What to expect
Comfortable, even relaxing for most. Skin looks a touch tighter right away, then continues to improve over two to three months.`,

  rejuran: `## What it is
Rejuran is a **polynucleotide (PN) skin booster** derived from purified salmon DNA. It repairs the skin from within rather than simply adding volume.

## How it works
Micro-injections deliver PN across the skin, calming inflammation and rebuilding the skin barrier — so texture, pores and fine lines improve over a short course.

| At a glance | |
| --- | --- |
| Mechanism | Polynucleotide skin repair |
| Best for | Texture, pores, dullness, fine lines |
| Sensation | Light pricks; numbing cream used |
| Downtime | Tiny bumps/marks for 1–2 days |
| Course | 3 sessions, 2–4 weeks apart |

## What to expect
Small raised bumps settle within a day or two. The glow appears gradually and builds with each session.`,

  shurink: `## What it is
Shurink Universe is Korea's most popular HIFU lift — known for a **comfortable** experience and fast, no-downtime results.

## How it works
Like Ulthera, it uses focused ultrasound to stimulate deep collagen, with a refined applicator that many find gentler.

| At a glance | |
| --- | --- |
| Mechanism | Focused ultrasound |
| Best for | A cautious first HIFU; maintenance |
| Sensation | Mild, manageable pulses |
| Downtime | None |
| Results build | 1–3 months |

## What to expect
A relaxed session with little to no marks. A great entry point if you're nervous about HIFU but want a genuine lift.`,

  inmode: `## What it is
InMode combines **radiofrequency micro-needling (FX)** with surface RF tightening (Forma) to sharpen the lower face and reduce a soft jawline.

## How it works
RF energy remodels the deeper layers while heating the surface, improving both contour and skin quality together.

| At a glance | |
| --- | --- |
| Mechanism | RF micro-needling + RF tightening |
| Best for | Soft jawline, double chin, texture |
| Sensation | Warm, mild pricking |
| Downtime | Slight redness 1–2 days |
| Course | Usually 3–4 sessions |

## What to expect
A short course delivers a tighter, more defined lower face that keeps improving between sessions.`,

  botox: `## What it is
Botox is a purified protein that relaxes targeted muscles — to **slim a square jaw** or **soften** forehead, frown and eye lines.

## How it works
A few precise micro-injections temporarily ease muscle pull, so overworked muscles slim and dynamic wrinkles smooth out.

| At a glance | |
| --- | --- |
| Mechanism | Neuromodulator (muscle relaxing) |
| Best for | Jaw slimming, expression lines |
| Sensation | Quick pinches |
| Downtime | None |
| Results last | 3–6 months |

## What to expect
Takes effect over 3–7 days. Jaw slimming softens gradually over a few weeks. Effects are temporary, so a top-up keeps the look consistent.`,

  filler: `## What it is
Hyaluronic-acid filler restores **volume and contour** — cheeks, chin, lips, temples or under-eyes — and is reversible if needed.

## How it works
A soft gel of hyaluronic acid (a sugar your skin already makes) is placed precisely to rebuild structure and smooth hollows.

| At a glance | |
| --- | --- |
| Mechanism | Hyaluronic-acid volumiser |
| Best for | Volume loss, contour, lip shape |
| Sensation | Mild; numbing included |
| Downtime | Possible swelling/bruise 1–2 days |
| Results last | Around 1–2 years |

## What to expect
Results are immediate and settle over a week. Choosing an experienced injector is the difference between "refreshed" and "overdone".`,

  juvelook: `## What it is
Juvelook is a **PDLA collagen biostimulator** that prompts your own collagen for firmer, finer skin over time.

## How it works
Micro-droplets of PDLA are delivered into the skin; as they're absorbed, they stimulate steady new collagen — improving fine lines, pores and overall firmness.

| At a glance | |
| --- | --- |
| Mechanism | PDLA collagen stimulation |
| Best for | Fine lines, pores, lasting glow |
| Sensation | Light pricks; numbing used |
| Downtime | Tiny marks 1–2 days |
| Course | 2–3 sessions, a month apart |

## What to expect
Improvement is gradual and natural — this builds your collagen rather than masking the surface.`,

  pico_laser: `## What it is
A **picosecond laser** that shatters pigment and refreshes tone with ultra-short pulses — gentler on surrounding skin than older lasers.

## How it works
Pulses measured in trillionths of a second break pigment into fine dust your body clears away, while a focused mode refines pores and texture.

| At a glance | |
| --- | --- |
| Mechanism | Picosecond laser |
| Best for | Spots, freckles, dullness, pores |
| Sensation | Light snapping |
| Downtime | Mild redness, same day |
| Course | Several sessions for pigment |

## What to expect
Tone looks clearer within days. Pigment fades over a course, and strict sun protection afterward is essential to keep results.`,

  co2_laser: `## What it is
CO2 fractional laser **resurfaces** the skin to smooth acne scars and rough texture — the most powerful texture treatment we offer.

## How it works
Microscopic columns of laser energy trigger deep repair and collagen remodeling, replacing scarred tissue with smoother skin.

| At a glance | |
| --- | --- |
| Mechanism | Ablative fractional CO2 |
| Best for | Acne scars, deep texture |
| Sensation | Warm; numbing used |
| Downtime | Redness + light peeling ~1 week |
| Results last | Long-lasting |

## Important
This one has real downtime. Plan it for the start of a longer trip, not the day before an event.

> Strong results, but respect the recovery — skin needs about a week to settle.`,

  aqua_peel: `## What it is
A gentle **deep-cleanse and hydration facial** that clears pores and leaves skin instantly fresh — perfect before an event.

## How it works
A vortex tip exfoliates, extracts debris from pores and infuses hydrating serums in one pass.

| At a glance | |
| --- | --- |
| Mechanism | Hydradermabrasion |
| Best for | Congested pores, instant glow |
| Sensation | Relaxing, mild suction |
| Downtime | None |
| Results | Immediate; short-lived |

## What to expect
Skin looks clean and luminous straight away. It pairs beautifully with lasers or boosters as part of a plan.`,

  thread_lift: `## What it is
Dissolvable **PDO threads** placed under the skin give an immediate lift and keep working as they dissolve.

## How it works
Fine barbed threads gently reposition soft tissue for an instant lift, then stimulate collagen along their path over the following months.

| At a glance | |
| --- | --- |
| Mechanism | PDO threads + collagen |
| Best for | Mild–moderate sagging, jowls |
| Sensation | Local anesthesia used |
| Downtime | Tightness/bruising a few days |
| Results last | Around 1–2 years |

## What to expect
You'll see a lift immediately, with some tightness as it settles. Best for those who want more than HIFU but less than surgery.`,

  iv_glow: `## What it is
A **glutathione and vitamin IV** for brightness, recovery and an energy reset — a relaxing add-on to any visit.

## How it works
Antioxidants and vitamins are delivered straight into the bloodstream for full absorption, supporting brighter skin and recovery.

| At a glance | |
| --- | --- |
| Mechanism | IV antioxidants + vitamins |
| Best for | Brightening, jet-lag recovery |
| Sensation | A small needle, then rest |
| Downtime | None |
| Best as | A short series |

## What to expect
Sit back for 30–40 minutes. Most enjoy it as a wellness ritual alongside their skin treatments.`,

  tear_trough: `## What it is
**Under-eye filler** that softens hollows and the shadows they cast — for a brighter, less tired look.

## How it works
A soft hyaluronic-acid filler is placed precisely into the tear-trough hollow to smooth the transition between lid and cheek.

| At a glance | |
| --- | --- |
| Mechanism | Hyaluronic-acid filler |
| Best for | Hollow-type dark circles |
| Sensation | Mild; numbing included |
| Downtime | Possible bruise/swelling 1–2 days |
| Results last | Around 1–2 years |

## Important
The under-eye is delicate and technique-sensitive — this is one to do only with a specialist.`,
};

const S = {
  rhinoplasty: `## What it is
Rhinoplasty reshapes the nose — height, tip, bridge and balance — for a refined profile that suits your face.

## How it works
Through hidden incisions, the surgeon refines cartilage and, where needed, adds support (your own cartilage or an implant) to build a natural line.

| At a glance | |
| --- | --- |
| Type | Surgery |
| Anesthesia | Sedation / general |
| Downtime | Splint ~1 week; swelling 1–2 weeks |
| Results | Semi-permanent |

## What to expect
A cast protects the nose for about a week. Most of the swelling settles within two weeks, with the final refined shape emerging over months.

> Plan a consultation first — the right plan depends on your skin, cartilage and goals.`,

  cleft_lip: `## What it is
Specialised reconstruction for **cleft lip and palate**, restoring both function and a natural appearance.

## How it works
Each case is individual. Our team plans the procedure around the patient's anatomy and history, often across stages.

| At a glance | |
| --- | --- |
| Type | Reconstructive surgery |
| Approach | Individually planned |
| Downtime | Varies by scope |
| Results | Permanent |

## Important
These cases are referred to a specially partnered hospital with deep cleft experience. A detailed specialist consultation comes first.`,

  double_eyelid: `## What it is
Double-eyelid surgery creates a defined upper-lid crease for brighter, larger-looking eyes — tailored to be natural for your face.

## How it works
Depending on your lid, a non-incisional (buried suture) or incisional method forms a clean, lasting crease at the right height.

| At a glance | |
| --- | --- |
| Type | Surgery |
| Methods | Non-incisional / incisional |
| Downtime | Swelling 1–2 weeks; stitches ~day 5–7 |
| Results | Long-lasting |

## What to expect
Early swelling makes the crease look higher than the final result; it softens into a natural fold over a few months.`,

  ptosis_correction: `## What it is
Ptosis correction tightens the muscle that lifts the eyelid, opening up **sleepy, heavy eyes** — often combined with double-eyelid surgery.

## How it works
The surgeon adjusts the levator muscle so the lid sits at the right height, balancing both eyes.

| At a glance | |
| --- | --- |
| Type | Surgery (functional + aesthetic) |
| Downtime | Swelling/bruising ~2 weeks |
| Results | Long-lasting |

## What to expect
Precise height-tuning is the art here. Eyes look more awake and symmetrical once swelling settles.`,

  liposuction: `## What it is
Liposuction removes **stubborn, diet-resistant fat** to smooth and refine the body line — abdomen, thighs, arms and more.

## How it works
Through small incisions, fat cells are loosened and suctioned away. Because the cells are removed, results are permanent with a stable weight.

| At a glance | |
| --- | --- |
| Type | Surgery |
| Anesthesia | Sedation / general |
| Downtime | Compression + swelling several weeks |
| Results | Permanent (fat-cell removal) |

## What to expect
You'll wear a compression garment and see the final contour emerge as swelling resolves over weeks. Commit to the recovery for the best line.`,

  facelift: `## What it is
A surgical facelift repositions deeper tissue (the SMAS) to correct **advanced sagging** — the strongest, longest-lasting lift available.

## How it works
The surgeon lifts and secures the deep support layer and removes excess skin, for a result that looks natural rather than "pulled".

| At a glance | |
| --- | --- |
| Type | Surgery (SMAS lift) |
| Anesthesia | General |
| Downtime | Swelling/bruising 2–3 weeks |
| Results | Many years |

## What to expect
The most involved option here, and the most transformative for significant sagging. A full consultation and planning come first.`,
};

async function apply(M, map) {
  let n = 0;
  for (const [slug, description] of Object.entries(map)) {
    const [count] = await M.update({ description }, { where: { slug } });
    if (count) { n += 1; console.log(`   updated ${slug}`); }
    else console.log(`   (no row) ${slug}`);
  }
  return n;
}

(async () => {
  console.log('-> treatment descriptions');
  await apply(Treatment, T);
  console.log('-> surgery descriptions');
  await apply(Surgery, S);
  console.log('\n done.');
  process.exit(0);
})().catch((e) => { console.error('failed:', e.message); process.exit(1); });
