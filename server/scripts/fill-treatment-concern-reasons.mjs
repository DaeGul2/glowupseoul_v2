// Fill treatment_concerns.reason with detailed EN rationale for every mapping.
// LLM-authored (concierge-but-specific, mechanism-driven). Keyed by slug pairs.
//   node scripts/fill-treatment-concern-reasons.mjs [--dry]
import 'dotenv/config';
import { Treatment, Concern, TreatmentConcern, sequelize } from '../db/modelsV3.js';

const DRY = process.argv.includes('--dry');

// [treatmentSlug, concernSlug, reason]
const R = [
  ['ulthera', 'fine_lines', "Ulthera's focused ultrasound heats the deep dermis and SMAS layer, stimulating fresh collagen over the following 8-12 weeks. As that new collagen builds, fine lines on the cheeks and around the mouth soften from underneath, smoothing the skin without freezing any expression."],
  ['ulthera', 'neck_wrinkles', "The neck has thin skin and little structural support, so it creases early. Ulthera delivers ultrasound energy precisely to the neck's deeper layers, firming the support tissue and easing crepey horizontal neck lines that creams and surface lasers cannot reach."],
  ['ulthera', 'sagging', "Ulthera is the only HIFU device cleared to target the SMAS, the exact connective layer a surgeon lifts in a facelift. By contracting and rebuilding that layer non-surgically, it re-drapes a softening jawline and cheeks for a genuine lift with zero downtime."],

  ['thermage', 'pores', "Thermage's monopolar RF heats the dermis evenly, tightening the collagen scaffold that surrounds each pore. As the surrounding skin firms and contracts, enlarged pores are pulled taut and look visibly smaller."],
  ['thermage', 'fine_lines', "By bulk-heating the dermis, Thermage triggers immediate collagen contraction plus months of new collagen production. This thickens and firms the skin, easing fine crinkles and tired texture across the whole face in a single session."],
  ['thermage', 'sagging', "Thermage tightens existing collagen on contact and lays down new collagen over 2-6 months, restoring firmness to lax skin. It is ideal for early-to-moderate sagging that needs overall tightening rather than a deep structural lift."],

  ['rejuran', 'pores', "Rejuran's salmon-derived polynucleotides repair the skin from within, helping normalise oil flow and strengthen the dermis. As the skin grows healthier and denser, pore walls are better supported and openings appear refined."],
  ['rejuran', 'texture', "The polynucleotides in Rejuran accelerate skin-cell regeneration and boost the skin's own moisture-binding, remodeling rough, uneven texture into smoother, more resilient skin over a short course of sessions."],
  ['rejuran', 'fine_lines', "Rejuran rebuilds the dermal matrix and deeply hydrates from inside, plumping the skin so that superficial fine lines, especially crepey under-eye and cheek lines, fill in and soften naturally."],

  ['shurink', 'fine_lines', "Shurink's HIFU energy reaches multiple depths to stimulate collagen renewal. As the deeper layers firm and thicken, fine lines are smoothed from beneath, with the comfort and speed Korean patients prefer."],
  ['shurink', 'neck_wrinkles', "Shurink can be focused on the slack, thin skin of the neck, contracting and rebuilding its support layer. This tightens horizontal neck bands and crepey texture without surgery or meaningful downtime."],
  ['shurink', 'sagging', "Shurink delivers focused ultrasound to the SMAS and dermal layers to lift a softening jaw and cheeks. Its fast, comfortable protocol makes it Korea's go-to maintenance lift for early sagging."],

  ['inmode', 'fine_lines', "InMode's FX micro-needling RF drives heat into the dermis through tiny channels, sparking collagen and elastin renewal. The result is firmer, smoother skin where fine lines and crepiness on the lower face ease away."],
  ['inmode', 'sagging', "InMode pairs RF micro-needling (FX) with surface tightening (Forma) to firm lax skin and remodel the dermis. It is especially effective for early jowl and lower-face laxity that needs targeted tightening."],
  ['inmode', 'slimming', "The deep RF heat of InMode can reduce small pockets of fat while tightening the overlying skin, refining a heavy or full lower face into a slimmer, more defined contour."],

  ['botox', 'fine_lines', "Botox relaxes the specific muscles that fold the skin with expression, so dynamic lines on the forehead, between the brows and at the crow's-feet smooth out within days. Used early and lightly, it also helps stop those lines from etching in permanently."],
  ['botox', 'slimming', "Injected into the masseter (jaw) muscle, Botox gradually shrinks an over-developed muscle built up from clenching. Over a few weeks this slims a square, heavy jawline into a softer, more V-shaped face with no surgery required."],

  ['filler', 'volume', "Hyaluronic-acid filler instantly replaces lost volume in hollow cheeks, temples or lips, restoring youthful contour and lift. Because HA also binds water, results look soft and natural, and they can be precisely shaped or dissolved if needed."],

  ['juvelook', 'pores', "Juvelook's PDLA microspheres stimulate steady, natural collagen production in the dermis. As that collagen firms the skin around each pore, openings tighten and the surface looks smoother and more refined."],
  ['juvelook', 'texture', "By rebuilding the skin's collagen scaffold gradually, Juvelook thickens and smooths rough, uneven texture, improving the skin's glass-like quality from within rather than just on the surface."],
  ['juvelook', 'fine_lines', "The collagen Juvelook generates plumps the skin from the inside, gently filling fine lines and restoring bounce. The effect builds slowly, looks entirely natural, and can last well over a year."],

  ['pico_laser', 'pores', "Pico's ultra-short laser pulses gently stimulate collagen beneath the skin while refining the surface. This firms the skin around pores and smooths the surrounding texture so openings look tighter."],
  ['pico_laser', 'texture', "Picosecond energy creates micro-zones of controlled renewal with minimal heat damage, prompting the skin to rebuild smoother. It is an excellent low-downtime option for rough or uneven texture and shallow scarring."],
  ['pico_laser', 'pigmentation', "Pico's picosecond pulses shatter melanin into ultra-fine particles the body clears easily, making it a gold standard for stubborn pigment such as melasma, freckles and sun spots, with less risk of rebound darkening than older lasers."],

  ['co2_laser', 'texture', "The fractional CO2 laser ablates microscopic columns of damaged skin, triggering a deep wound-healing response that resurfaces the area. As new skin forms, rough texture, enlarged pores and shallow scarring are visibly smoothed."],
  ['co2_laser', 'acne', "For acne scarring, fractional CO2 reaches the depressed scar tissue and stimulates collagen to fill it from below while resurfacing the top. It remodels pitted, uneven acne scars more powerfully than non-ablative options."],

  ['aqua_peel', 'pores', "Aqua Peel uses gentle vortex suction and exfoliating solutions to lift sebum and debris out of congested pores. Clearing that build-up immediately makes pores look cleaner and smaller, with no irritation or downtime."],
  ['aqua_peel', 'texture', "By exfoliating dead surface cells and infusing hydration in one pass, Aqua Peel leaves the skin instantly smoother and more luminous, an easy reset for dull, rough texture before an event."],

  ['thread_lift', 'sagging', "Dissolvable threads are placed under the skin to physically reposition sagging tissue upward at once, anchoring it as the barbs grip. As the threads dissolve they also stimulate collagen along their path, so the lift is both immediate and self-reinforcing."],

  ['iv_glow', 'pigmentation', "The Glow IV delivers high-dose glutathione and vitamin C straight into the bloodstream, where they inhibit melanin formation and neutralise oxidative stress. Over a course of drips this brightens overall tone and supports a more even complexion from the inside out."],

  ['tear_trough', 'dark_circles', "Much of the dark-circle look comes from a hollow under-eye that casts a shadow. Placing fine hyaluronic-acid filler in the tear-trough lifts that hollow level with the cheek, erasing the shadow and instantly brightening the eye area."],
  ['tear_trough', 'under_eye', "Tear-trough filler precisely restores lost volume in the under-eye groove, smoothing the transition from lid to cheek. The result is a refreshed, less tired look, and the HA filler can be dissolved if any adjustment is wanted."],
];

const ts = await Treatment.findAll();
const cs = await Concern.findAll();
const tBy = new Map(ts.map((t) => [t.slug, t.id]));
const cBy = new Map(cs.map((c) => [c.slug, c.id]));

let ok = 0, miss = 0, notfound = 0;
for (const [tslug, cslug, reason] of R) {
  const tid = tBy.get(tslug), cid = cBy.get(cslug);
  if (tid == null || cid == null) { console.log(`SKIP slug ${tslug}/${cslug}`); miss++; continue; }
  const row = await TreatmentConcern.findOne({ where: { treatment_id: tid, concern_id: cid } });
  if (!row) { console.log(`NO LINK ${tslug}/${cslug}`); notfound++; continue; }
  if (!DRY) { row.reason = reason; await row.save(); }
  ok++;
}
console.log(`\n${DRY ? '[DRY] ' : ''}updated=${ok} slug-miss=${miss} link-missing=${notfound} (of ${R.length})`);
await sequelize.close();
process.exit(0);
