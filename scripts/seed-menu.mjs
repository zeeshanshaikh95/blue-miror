#!/usr/bin/env node
/**
 * Seed the salon service menu through the admin API.
 *
 * Uses the same endpoints as the admin dashboard (POST /api/admin/categories and
 * POST /api/admin/services), so everything it creates is fully editable in the
 * dashboard afterwards. Idempotent: existing categories and services (matched by
 * slug) are skipped, so it can be re-run safely after edits.
 *
 * Usage:
 *   BM_API=https://blue-miror-api.onrender.com/api \
 *   BM_EMAIL=admin@example.com \
 *   BM_PASSWORD=... \
 *   node scripts/seed-menu.mjs
 */
const API = (process.env.BM_API || 'http://localhost:4000/api').replace(/\/+$/, '');
const EMAIL = process.env.BM_EMAIL;
const PASSWORD = process.env.BM_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set BM_EMAIL and BM_PASSWORD (and optionally BM_API).');
  process.exit(1);
}

const publishedAt = new Date().toISOString();
const visuals = ['arch', 'orbit', 'drape', 'horizon', 'bloom', 'column'];

const categories = [
  {
    slug: 'threading',
    name: 'Threading & Brow Grooming',
    description: 'Eyebrow shaping and facial threading, priced per area.',
  },
  {
    slug: 'waxing',
    name: 'Waxing & Smooth Skin',
    description: 'Face and body waxing in Rica, Korean and roll-on options.',
  },
  {
    slug: 'nails',
    name: 'Manicure & Pedicure',
    description: 'Classic and luxury hands and feet, gel polish and extensions.',
  },
  {
    slug: 'detan',
    name: 'Bleach & D-Tan',
    description: 'Face, body and area bleach and D-Tan services. Clean-ups are charged ₹300 less.',
  },
  {
    slug: 'facials',
    name: 'Facials & Advanced Skin Care',
    description: 'Signature facials and advanced skin services. Clean-ups are charged ₹300 less.',
  },
  {
    slug: 'body-care',
    name: 'Body Polishing & Spa',
    description: 'Full body polishing, rejuvenation and spa services.',
  },
  {
    slug: 'hair-styling',
    name: 'Hair Wash, Blow-Dry & Cuts',
    description: 'Wash, dry, styling, curling, ironing and haircut services.',
  },
  {
    slug: 'hair-spa',
    name: 'Hair Spa & Ayurvedic Care',
    description: 'Spa rituals, protein care, scalp care and Ayurvedic treatments.',
  },
  {
    slug: 'hair-treatments',
    name: 'Hair Treatments',
    description: 'Smoothening, keratin, botox and protein treatments.',
  },
  {
    slug: 'hair-colour',
    name: 'Hair Colouring',
    description: 'Touch-ups, global colour, highlights, balayage and illuminage.',
  },
  {
    slug: 'makeup',
    name: 'Makeup & Draping',
    description: 'Party to bridal makeup, airbrush and draping services.',
  },
  {
    slug: 'permanent-makeup',
    name: 'Permanent Makeup',
    description: 'Permanent brow and lip services.',
  },
  {
    slug: 'aesthetic',
    name: 'Aesthetic Treatments',
    description: 'Face peels and advanced facial services, charged per sitting.',
  },
];

/** Shared copy, kept factual and non-committal. */
const templates = {
  threading: {
    short: (n) => `${n} for a clean, defined finish.`,
    description: [
      'Threading uses a twisted cotton thread to remove hair with precision, shaping the brow line and clearing facial areas.',
      'A quick service performed by trained professionals, finished with a soothing application.',
    ],
    steps: ['Your preferred shape and area are confirmed.', 'The area is cleansed and prepared.', 'Hair is removed with thread and the skin is soothed afterwards.'],
    benefits: ['Clean, defined lines and an even shape.', 'Precise control on smaller facial areas.', 'A quick appointment with minimal product use.'],
    considerations: ['Mild redness can occur and usually settles quickly.', 'Avoid make-up and heat on the area for a few hours.'],
    faqs: [
      { question: 'How long do results last?', answer: 'Results vary from person to person; most guests find the smoothness lasts a few weeks depending on hair growth.' },
      { question: 'Can I book threading before an event?', answer: 'Yes. If your skin is sensitive, we suggest booking a day or two beforehand so any redness has time to settle.' },
    ],
  },
  waxing: {
    short: (n) => `${n} using skin-friendly wax, with a smooth, even finish.`,
    description: [
      'Warm wax removes hair from the root, leaving skin smooth for longer than shaving.',
      'We offer Rica, Korean and roll-on wax options. Your therapist will explain the best choice for your skin and hair type before starting.',
    ],
    steps: ['The area and wax type are confirmed.', 'Skin is cleansed and prepared.', 'Wax is applied and removed in sections.', 'A soothing aftercare product is applied.'],
    benefits: ['Smoother finish that lasts longer than shaving.', 'Choice of wax types for different skin sensitivities.', 'Aftercare included to calm the skin.'],
    considerations: ['Some redness is normal and settles shortly.', 'Avoid heat, tight clothing and fragranced products on the area for 24 hours.', 'Hair should be a few millimetres long for best results.'],
    faqs: [
      { question: 'How long should hair be before waxing?', answer: 'Around two to three weeks of growth works best, so the wax can grip the hair properly.' },
      { question: 'How long does waxing last?', answer: 'It varies by person, but most guests return every three to five weeks.' },
    ],
  },
  nails: {
    short: (n) => `${n} for hands and feet that look and feel cared for.`,
    description: [
      'Our nail services cover everything from a quick tidy-up to a full luxury experience with soak, exfoliation, massage and finish.',
      'Products and shades are chosen with you before the service begins.',
    ],
    steps: ['Nails and cuticles are assessed.', 'Shaping, cuticle care and buffing are completed.', 'Massage and mask are included where the service specifies.', 'Polish or finish is applied and cured as needed.'],
    benefits: ['Neat, well-shaped nails and tidy cuticles.', 'Relaxing massage for hands or feet.', 'Long-lasting finish options including gel and extensions.'],
    considerations: ['Tell us about any nail or skin condition before the service.', 'Gel and extensions require professional removal to protect the natural nail.'],
    faqs: [
      { question: 'How long does gel polish last?', answer: 'Most guests get two to three weeks of wear, depending on nail growth and daily activity.' },
      { question: 'How are extensions removed?', answer: 'Please book a removal rather than peeling them off, so the natural nail stays healthy.' },
    ],
  },
  detan: {
    short: (n) => `${n} to brighten the appearance of tanned, dull skin.`,
    description: [
      'Bleach and D-Tan services work on the surface of the skin to lift the look of tan and leave the complexion looking brighter and more even.',
      'The product and timing are chosen to suit the area being treated and your skin sensitivity.',
    ],
    steps: ['The area and skin sensitivity are checked.', 'Product is applied evenly and timed for your skin.', 'The product is removed and a calming lotion is applied.'],
    benefits: ['Brighter, more even-looking skin.', 'Treatments available for face, body and smaller areas.', 'Quick service with a soothing finish.'],
    considerations: ['Avoid sun exposure and heat treatments for 24 hours afterwards.', 'Not recommended on broken or irritated skin.', 'A patch test may be advised for sensitive skin.'],
    faqs: [
      { question: 'How often can I book a D-Tan?', answer: 'It depends on your skin type and tanning; your therapist will suggest a suitable gap between sessions.' },
      { question: 'Is there anything I should avoid afterwards?', answer: 'Skip direct sun, steam and scrubs for a day or two, and use a gentle moisturiser.' },
    ],
  },
  facials: {
    short: (n) => `${n}, tailored to your skin on the day of your appointment.`,
    description: [
      'Every facial begins with a short skin assessment so the products, massage and mask can be chosen for how your skin looks and feels that day.',
      'Clean-ups are charged ₹300 less than the facial price listed.',
    ],
    steps: ['Skin is assessed and the routine is explained.', 'Cleansing, exfoliation and extraction as required.', 'Massage and a mask suited to your skin.', 'Toning, moisturising and SPF finish.'],
    benefits: ['A refreshed, brighter-looking complexion.', 'Deep cleansing and relaxation in one session.', 'Routine advice for home care.'],
    considerations: ['Mild redness or sensitivity can occur after active products.', 'Tell us about allergies, prescriptions or recent treatments before your facial.', 'Clean-ups are charged ₹300 less than the listed price.'],
    faqs: [
      { question: 'How often should I have a facial?', answer: 'For most skin types once a month works well; we will suggest a rhythm based on your skin.' },
      { question: 'Can I have a facial before an event?', answer: 'Yes, but we suggest booking a week before so your skin has time to settle.' },
    ],
  },
  'body-care': {
    short: (n) => `${n} for smooth, cared-for skin across the full body.`,
    description: [
      'Full body polishing and spa services combine exfoliation, massage and nourishing products to leave skin feeling soft and looking more even.',
      'Services with bleach include a full body bleach step; others focus purely on polishing and relaxation.',
    ],
    steps: ['Your skin type and preferences are confirmed.', 'Full body exfoliation and polish.', 'Massage and nourishing products.', 'Body bleach step where the service includes it.'],
    benefits: ['Smoother, softer-feeling skin.', 'Full body relaxation and a more even appearance.', 'Options available with or without bleach.'],
    considerations: ['Avoid sun exposure and heat treatments for 24 hours.', 'Not recommended on broken or irritated skin.'],
    faqs: [
      { question: 'How long does the service take?', answer: 'Plan for around two hours for full body polishing and spa services.' },
      { question: 'What is the difference between the two options?', answer: 'The full service includes a body bleach step; the body spa is polishing and massage only.' },
    ],
  },
  'hair-styling': {
    short: (n) => `${n}, finished exactly the way you like it.`,
    description: [
      'Wash, dry, styling and cut services, from a quick blast dry to a full set or a precision haircut.',
      'Length-based services are priced for mid-length hair; longer or more voluminous hair is quoted at the appointment.',
    ],
    steps: ['Your desired finish is discussed.', 'Hair is washed with products suited to your hair type.', 'Drying, styling or cutting is completed.', 'Finishing products are applied and the look is checked with you.'],
    benefits: ['A polished finish that lasts.', 'Cutting and styling by trained stylists.', 'Options for every length and hair type.'],
    considerations: ['Charges are adjusted for extra volume or length where noted.', 'Bring reference images if you have a particular style in mind.'],
    faqs: [
      { question: 'How often should I have a haircut?', answer: 'Most guests return every six to twelve weeks depending on the style and hair growth.' },
      { question: 'Do I need to wash my hair beforehand?', answer: 'Not needed — wash and dry services are included where listed.' },
    ],
  },
  'hair-spa': {
    short: (n) => `${n} to restore softness, shine and comfort to hair and scalp.`,
    description: [
      'Spa and Ayurvedic services combine nourishing products, massage and steam to condition hair and care for the scalp.',
      'Treatments are chosen after a quick consultation about your hair type and concerns.',
    ],
    steps: ['Hair and scalp are assessed.', 'Cleansing wash.', 'Treatment product applied section by section.', 'Massage, steam and a final rinse.'],
    benefits: ['Softer, more manageable-looking hair.', 'Relaxing scalp massage.', 'Targeted care for dryness or dandruff concerns.'],
    considerations: ['Charges are adjusted for extra volume or length where noted.', 'Avoid washing for 24 hours to let the treatment settle.'],
    faqs: [
      { question: 'How often should I book a hair spa?', answer: 'Every three to four weeks is a good rhythm for most hair types.' },
      { question: 'Is Ayurvedic treatment suitable for all hair?', answer: 'It suits most hair types; we will check for any sensitivities before starting.' },
    ],
  },
  'hair-treatments': {
    short: (n) => `${n} for smoother, stronger-looking hair.`,
    description: [
      'Advanced hair treatments address dryness, frizz and damage with professional-grade products and a structured application process.',
      'The treatment is chosen after assessing your hair, and the price is confirmed before we begin.',
    ],
    steps: ['Hair condition is assessed and the treatment is selected.', 'Hair is cleansed.', 'Treatment is applied section by section.', 'Processing, sealing and styling finish.'],
    benefits: ['Smoother, softer-looking hair.', 'Reduced appearance of frizz and breakage.', 'Results that last for several weeks with good aftercare.'],
    considerations: ['Charges are adjusted for extra volume or length.', 'Colour and chemical services may need to be spaced apart; tell us about recent treatments.'],
    faqs: [
      { question: 'How long do treatments last?', answer: 'It depends on the treatment and home care; most last between four and twelve weeks.' },
      { question: 'Can I colour my hair after a treatment?', answer: 'We will advise on timing so the colour and treatment both work their best.' },
    ],
  },
  'hair-colour': {
    short: (n) => `${n}, matched and applied by our colourists.`,
    description: [
      'Colour services range from a simple root touch-up to global colour, highlights, balayage and dimensional techniques.',
      'The shade is matched in consultation, and the price is confirmed based on hair length and volume before we begin.',
    ],
    steps: ['Consultation and shade matching.', 'Strand or allergy check where required.', 'Colour application and processing.', 'Rinse, treatment and styling finish.'],
    benefits: ['Even, long-lasting colour.', 'Techniques for grey coverage or a full change.', 'Aftercare guidance to protect your colour.'],
    considerations: ['Charges are adjusted for extra volume or length.', 'Bring reference images for fashion shades; some tones need more than one sitting.'],
    faqs: [
      { question: 'How long does hair colour last?', answer: 'Permanent colour grows out rather than fades; most guests refresh every four to eight weeks.' },
      { question: 'Do I need a patch test?', answer: 'We recommend a patch test before colour services, especially if it is your first time with us.' },
    ],
  },
  makeup: {
    short: (n) => `${n}, designed to photograph beautifully and last the day.`,
    description: [
      'Makeup services are planned in consultation with you, from a quick party look to full bridal or airbrush makeup.',
      'Draping for saree and lehenga is available as a standalone service.',
    ],
    steps: ['A look consultation, including any reference images.', 'Skin preparation and base application.', 'Eyes, lips and finishing touches.', 'Setting spray and a final check in natural light.'],
    benefits: ['Long-lasting, camera-ready finish.', 'Looks tailored to your outfit and occasion.', 'Airbrush and HD options available.'],
    considerations: ['Please share any skin sensitivities before the appointment.', 'Book bridal and engagement dates early to secure your slot.'],
    faqs: [
      { question: 'How far in advance should I book bridal makeup?', answer: 'As early as possible — a trial in the weeks before the event is always a good idea.' },
      { question: 'Do you travel for makeup services?', answer: 'Please contact us with the date and location so we can confirm availability.' },
    ],
  },
  'permanent-makeup': {
    short: (n) => `${n} for definition that stays put.`,
    description: [
      'Permanent makeup enhances brows and lips with pigments applied by a trained technician.',
      'Every appointment includes a consultation about shape, shade and expectations before anything begins.',
    ],
    steps: ['Consultation and shape mapping.', 'Numbing preparation.', 'Pigment application.', 'Aftercare briefing and a follow-up appointment where needed.'],
    benefits: ['Soft, defined brows and lips every day.', 'Saves time on daily make-up.', 'Shades chosen to suit your skin tone.'],
    considerations: ['Some tenderness and settling of colour is normal in the days after.', 'Follow the aftercare instructions carefully for best results.'],
    faqs: [
      { question: 'How long does permanent makeup last?', answer: 'It varies with skin type and lifestyle; most clients plan a refresh every one to two years.' },
      { question: 'Is a follow-up needed?', answer: 'A follow-up appointment is usually recommended after healing to perfect shape and colour.' },
    ],
  },
  aesthetic: {
    short: (n) => `${n}, priced per sitting.`,
    description: [
      'Aesthetic services use professional peels and advanced facial techniques, carried out by trained professionals.',
      'A consultation is completed first, and a course of sittings may be recommended depending on your skin.',
    ],
    steps: ['Skin assessment and consultation.', 'Preparation and protection of the treatment area.', 'Peel or needling treatment applied.', 'Calming products and aftercare advice.'],
    benefits: ['Smoother, brighter-looking skin.', 'Targeted care for texture and dullness.', 'Course plans available.'],
    considerations: ['Some flaking or sensitivity can occur after active treatments.', 'Sun protection is essential after peels and needling.', 'Treatments are charged per sitting.'],
    faqs: [
      { question: 'How many sittings will I need?', answer: 'It depends on your skin and the concern being treated; we will suggest a plan at your consultation.' },
      { question: 'Is there downtime?', answer: 'Most guests return to normal activity straight away, though sensitivity and flaking can occur for a few days.' },
    ],
  },
};

/**
 * Services. `prices` lines become the published price list; `price` is the short
 * summary shown on cards. `note` is appended to the considerations.
 */
const services = [
  // Threading & Brow Grooming
  ['eyebrow-threading', 'Eyebrow Threading', 'threading', '₹125', ['Eyebrow ₹125']],
  ['upper-lip-threading', 'Upper Lip Threading', 'threading', '₹100', ['Upper lip ₹100']],
  ['chin-threading', 'Chin Threading', 'threading', '₹100', ['Chin ₹100']],
  ['forehead-threading', 'Forehead Threading', 'threading', '₹100', ['Forehead ₹100']],
  ['side-locks-threading', 'Side Locks Threading', 'threading', '₹150', ['Side locks ₹150']],
  ['full-face-threading', 'Full Face Threading', 'threading', '₹350', ['Full face ₹350']],

  // Waxing
  ['eyebrow-wax', 'Eyebrow Wax', 'waxing', '₹200', ['Eyebrow ₹200']],
  ['upper-lip-wax', 'Upper Lip Wax', 'waxing', '₹120', ['Upper lip ₹120']],
  ['chin-wax', 'Chin Wax', 'waxing', '₹150', ['Chin ₹150']],
  ['side-locks-wax', 'Side Locks Wax', 'waxing', '₹350', ['Side locks ₹350']],
  ['full-face-wax', 'Full Face Wax', 'waxing', '₹600', ['Full face ₹600']],
  ['full-hand-rica-wax', 'Full Hand Rica Wax', 'waxing', '₹800', ['Full hand (Rica) ₹800']],
  ['full-leg-rica-wax', 'Full Leg Rica Wax', 'waxing', '₹1000', ['Full leg (Rica) ₹1000']],
  ['underarm-rica-wax', 'Underarm Rica Wax', 'waxing', '₹200', ['Underarms (Rica) ₹200']],
  ['stomach-rica-wax', 'Stomach Rica Wax', 'waxing', '₹800', ['Stomach (Rica) ₹800']],
  ['full-back-rica-wax', 'Full Back Rica Wax', 'waxing', '₹1000', ['Full back (Rica) ₹1000']],
  ['half-back-rica-wax', 'Half Back Rica Wax', 'waxing', '₹600', ['Half back (Rica) ₹600']],
  ['buttocks-rica-wax', 'Buttocks Rica Wax', 'waxing', '₹800', ['Buttocks (Rica) ₹800']],
  ['full-body-rica-wax', 'Full Body Rica Wax', 'waxing', '₹2500', ['Full body (Rica) ₹2500']],
  ['full-hand-korean-wax', 'Full Hand Korean Wax', 'waxing', '₹1000', ['Full hand (Korean) ₹1000']],
  ['full-leg-korean-wax', 'Full Leg Korean Wax', 'waxing', '₹1500', ['Full leg (Korean) ₹1500']],
  ['underarm-korean-wax', 'Underarm Korean Wax', 'waxing', '₹300', ['Underarms (Korean) ₹300']],
  ['stomach-korean-wax', 'Stomach Korean Wax', 'waxing', '₹1000', ['Stomach (Korean) ₹1000']],
  ['full-back-korean-wax', 'Full Back Korean Wax', 'waxing', '₹1400', ['Full back (Korean) ₹1400']],
  ['half-back-korean-wax', 'Half Back Korean Wax', 'waxing', '₹800', ['Half back (Korean) ₹800']],
  ['buttocks-korean-wax', 'Buttocks Korean Wax', 'waxing', '₹1000', ['Buttocks (Korean) ₹1000']],
  ['full-body-korean-wax', 'Full Body Korean Wax', 'waxing', '₹3500', ['Full body (Korean) ₹3500']],
  ['roll-on-wax', 'Roll-On Wax (Full Hands & Legs)', 'waxing', '₹1800', ['Full hands and full legs (roll-on) ₹1800']],
  ['brazilian-bikini-wax', 'Brazilian Bikini Wax', 'waxing', '₹2000', ['Brazilian bikini wax ₹2000']],

  // Manicure & Pedicure
  ['basic-manicure', 'Basic Manicure', 'nails', '₹1000', ['Basic manicure ₹1000']],
  ['basic-pedicure', 'Basic Pedicure', 'nails', '₹1250', ['Basic pedicure ₹1250']],
  ['premium-manicure', 'Premium Manicure', 'nails', '₹1500', ['Premium manicure ₹1500']],
  ['premium-pedicure', 'Premium Pedicure', 'nails', '₹1800', ['Premium pedicure ₹1800']],
  ['luxury-manicure', 'Luxury Manicure', 'nails', '₹2500', ['Luxury manicure ₹2500']],
  ['luxury-pedicure', 'Luxury Pedicure', 'nails', '₹2800', ['Luxury pedicure ₹2800']],
  ['gel-polish', 'Gel Polish – Single Solid Colour', 'nails', '₹600', ['Gel polish, single solid colour ₹600']],
  ['cateye-polish', 'Cateye Gel Polish', 'nails', '₹750', ['Cateye polish ₹750']],
  ['gel-nail-extension', 'Gel Nail Extension', 'nails', '₹1800', ['Gel extension ₹1800']],
  ['acrylic-nail-extension', 'Acrylic Nail Extension', 'nails', '₹1800', ['Acrylic extension ₹1800']],
  ['gel-x-extension', 'Gel-X Extension with Polish', 'nails', '₹1800', ['Gel-X extension with polish ₹1800']],
  ['nail-art', 'Nail Art (per finger)', 'nails', 'From ₹50 per finger', ['Nail art ₹50 per finger']],
  ['press-on-nails', 'Press-On Nails', 'nails', 'From ₹800', ['Press-on nails from ₹800']],

  // Bleach & D-Tan
  ['fruit-bleach', 'Fruit Bleach (Face & Neck)', 'detan', '₹300', ['Fruit bleach, face and neck ₹300']],
  ['oxylife-bleach', 'Oxylife Bleach (Face & Neck)', 'detan', '₹450', ['Oxylife, face and neck ₹450']],
  ['face-neck-dtan', 'Face & Neck D-Tan', 'detan', '₹450', ['Face and neck D-Tan ₹450']],
  ['gold-bleach', 'Gold Bleach (Face & Neck)', 'detan', '₹600', ['Gold bleach ₹600']],
  ['korean-bleach', 'Korean Bleach (Face & Neck)', 'detan', '₹750', ['Korean bleach ₹750']],
  ['body-bleach', 'Body Bleach', 'detan', '₹3500', ['Body bleach ₹3500']],
  ['body-dtan', 'Body D-Tan', 'detan', '₹3500', ['Body D-Tan ₹3500']],
  ['half-back-bleach', 'Half Back Bleach', 'detan', '₹500', ['Half back ₹500']],
  ['full-back-bleach', 'Full Back Bleach', 'detan', '₹700', ['Full back ₹700']],
  ['full-hand-bleach', 'Full Hand Bleach', 'detan', '₹600', ['Full hand ₹600']],
  ['full-leg-bleach', 'Full Leg Bleach', 'detan', '₹1000', ['Full leg ₹1000']],
  ['feet-bleach', 'Feet Bleach', 'detan', '₹400', ['Only feet ₹400']],

  // Facials & Advanced Skin Care
  ['fruit-facial', 'Fruit Facial', 'facials', '₹1650', ['Fruit facial ₹1650']],
  ['gold-facial', 'Gold Facial', 'facials', '₹2000', ['Gold facial ₹2000']],
  ['glow-shine-facial', 'Glow & Shine Facial', 'facials', '₹2200', ['Glow & Shine ₹2200']],
  ['wine-facial', 'Wine Facial', 'facials', '₹2400', ['Wine facial ₹2400']],
  ['anti-ageing-mummy-mask', 'Anti-Ageing Mummy Mask', 'facials', '₹2500', ['Anti-ageing mummy mask ₹2500']],
  ['aha-polish-facial', 'AHA Polish Facial', 'facials', '₹2800', ['AHA polish facial ₹2800']],
  ['paraffin-facial', 'Paraffin Facial', 'facials', '₹3000', ['Paraffin facial ₹3000']],
  ['anti-acne-facial', 'Anti-Acne Facial', 'facials', '₹2500', ['Anti-acne facial ₹2500']],
  ['o3-brightening-facial', 'O3+ Brightening Facial', 'facials', '₹2500', ['O3+ brightening ₹2500']],
  ['o3-bridal-facial', 'O3+ Bridal Facial', 'facials', '₹4000', ['O3+ bridal ₹4000']],
  ['hydra-facial', 'Hydra Facial', 'facials', '₹4000', ['Hydra facial ₹4000']],
  ['medi-facial', 'Medi Facial', 'facials', '₹5000', ['Medi facial ₹5000']],
  ['bb-glow-facial', 'BB Glow Facial', 'facials', '₹5000', ['BB glow facial ₹5000']],
  ['dermaplaning', 'Dermaplaning', 'facials', '₹5000', ['Dermaplaning ₹5000']],

  // Body Polishing & Spa
  ['body-polishing-rejuvenation', 'Body Polishing & Skin Rejuvenation with Body Bleach', 'body-care', '₹7500', ['Body polishing and rejuvenation with body bleach ₹7500']],
  ['body-spa', 'Body Spa (without bleach)', 'body-care', '₹5000', ['Body spa, without bleach ₹5000']],

  // Hair Wash, Blow-Dry & Cuts
  ['hair-wash-blast-dry', 'Hair Wash with Blast Dry', 'hair-styling', '₹400', ['Hair wash with blast dry ₹400']],
  ['wash-blowdry-setting', 'Wash & Blow-Dry with Setting', 'hair-styling', '₹900', ['Wash and blow-dry with setting ₹900']],
  ['straight-blowdry', 'Straight Blow-Dry', 'hair-styling', '₹600 mid-length · ₹700 up to waist', ['Mid length ₹600', 'Up to waist ₹700'], 'Charges are adjusted for extra volume.'],
  ['outcurls-blowdry', 'Out-Curls Blow-Dry', 'hair-styling', '₹650 mid-length · ₹900 up to waist', ['Mid length ₹650', 'Up to waist ₹900'], 'Charges are adjusted for extra volume.'],
  ['hair-ironing', 'Hair Ironing (Straightening)', 'hair-styling', '₹700 mid-length · ₹1000 up to waist · ₹1500 below hips', ['Up to mid length ₹700', 'Up to waist ₹1000', 'Below hips ₹1500']],
  ['soft-curls', 'Soft Curls', 'hair-styling', '₹900 mid-length · ₹1200 up to waist · ₹1700 below hips', ['Mid length ₹900', 'Up to waist ₹1200', 'Below hips ₹1700'], 'Charges are adjusted for extra volume.'],
  ['haircut', 'Haircut (without styling)', 'hair-styling', '₹750', ['Haircut without setting ₹750']],
  ['haircut-with-styling', 'Haircut with Styling', 'hair-styling', '₹1000', ['Haircut with styling ₹1000']],
  ['haircut-wash-style', 'Haircut with Wash & Style', 'hair-styling', '₹1500', ['Haircut with wash and style ₹1500']],
  ['haircut-wash-dry-set', 'Haircut Wash, Blow-Dry & Set', 'hair-styling', '₹1400', ['Haircut wash, dry and set ₹1400']],

  // Hair Spa & Ayurvedic Care
  ['plex-treatment', 'Plex Treatment', 'hair-spa', 'From ₹2500', ['Plex treatment from ₹2500'], 'Charges are adjusted for extra volume or length.'],
  ['loreal-hair-spa', 'L’Oréal Hair Spa', 'hair-spa', '₹1500', ['L’Oréal spa ₹1500'], 'Charges are adjusted for extra volume or length.'],
  ['moroccan-hair-spa', 'Moroccan Hair Spa', 'hair-spa', '₹1800', ['Moroccan spa ₹1800'], 'Charges are adjusted for extra volume or length.'],
  ['silk-protein-treatment', 'Silk Protein Treatment', 'hair-spa', '₹2000', ['Silk protein treatment ₹2000'], 'Charges are adjusted for extra volume or length.'],
  ['anti-dandruff-treatment', 'Anti-Dandruff Treatment', 'hair-spa', '₹2500', ['Anti-dandruff treatment ₹2500'], 'Charges are adjusted for extra volume or length.'],
  ['ayurvedic-head-massage', 'Ayurvedic Head Massage', 'hair-spa', '₹550', ['Head massage ₹550']],
  ['ayurvedic-spa-treatment', 'Ayurvedic Spa Treatment', 'hair-spa', '₹2500', ['Ayurvedic spa treatment ₹2500'], 'Charges are adjusted for extra volume or length.'],

  // Hair Treatments
  ['hair-smoothening', 'Hair Smoothening', 'hair-treatments', '₹4500 mid-length · ₹7000 up to waist', ['Mid length ₹4500', 'Up to waist ₹7000'], 'Voluminous or long hair is charged accordingly.'],
  ['hair-botox', 'Hair Botox', 'hair-treatments', 'From ₹6000', ['Mid length from ₹6000'], 'Voluminous or long hair is charged accordingly.'],
  ['nanoplastia', 'Nanoplastia', 'hair-treatments', 'From ₹7500', ['Mid length from ₹7500'], 'Voluminous or long hair is charged accordingly.'],
  ['vegan-keratin', 'Vegan Keratin Treatment', 'hair-treatments', 'From ₹7000', ['Mid length from ₹7000'], 'Voluminous or long hair is charged accordingly.'],
  ['elastin-protein', 'Elastin Protein Treatment', 'hair-treatments', 'From ₹8000', ['Mid length from ₹8000'], 'Voluminous or long hair is charged accordingly.'],

  // Hair Colouring
  ['root-touch-up', 'Root Touch-Up', 'hair-colour', '₹1250', ['Root touch-up ₹1250'], 'Charges are adjusted for extra volume or length.'],
  ['ammonia-free-touch-up', 'Ammonia-Free Touch-Up', 'hair-colour', '₹1500', ['Ammonia-free touch-up, for 1 to 2 inch monthly growth ₹1500'], 'Charges are adjusted for extra volume or length.'],
  ['half-global-colour', 'Half Global Colour', 'hair-colour', '₹2000', ['Half global ₹2000'], 'Charges are adjusted for extra volume or length.'],
  ['full-global-colour', 'Full Global Colour', 'hair-colour', '₹4000', ['Full global ₹4000'], 'Charges are adjusted for extra volume or length.'],
  ['fashion-global-colour', 'Fashion Global Colour', 'hair-colour', '₹5000', ['Fashion global ₹5000'], 'Charges are adjusted for extra volume or length.'],
  ['highlights-10-foils', 'Highlights – 10 Foils', 'hair-colour', '₹4000 (up to mid-length)', ['10 foils, up to mid length ₹4000'], 'Charges are adjusted for extra volume or length.'],
  ['highlights-full-head', 'Highlights – Full Head (25–30 foils)', 'hair-colour', '₹6000 (up to mid-length)', ['25 to 30 foils, up to mid length ₹6000'], 'Charges are adjusted for extra volume or length.'],
  ['balayage', 'Balayage', 'hair-colour', '₹6000 mid-length · ₹8000 up to waist', ['Mid length ₹6000', 'Up to waist ₹8000'], 'Charges are adjusted for extra volume or length.'],
  ['illuminage', 'Illuminage', 'hair-colour', '₹7500 mid-length · ₹9000 up to waist', ['Mid length ₹7500', 'Up to waist ₹9000'], 'Charges are adjusted for extra volume or length.'],

  // Makeup & Draping
  ['simple-party-makeup', 'Simple Party Makeup', 'makeup', '₹2000', ['Simple party makeup ₹2000']],
  ['sider-makeup', 'Sider (Bridesmaid) Makeup', 'makeup', '₹4000', ['Sider makeup ₹4000']],
  ['engagement-makeup', 'Engagement Makeup', 'makeup', '₹12000', ['Engagement makeup ₹12000']],
  ['bridal-makeup', 'Bridal Makeup', 'makeup', '₹18000', ['Bridal makeup ₹18000']],
  ['airbrush-makeup', 'Airbrush Makeup', 'makeup', '₹25000', ['Airbrush makeup ₹25000']],
  ['saree-draping', 'Saree Draping', 'makeup', '₹700', ['Saree draping (simple) ₹700']],
  ['lehenga-draping', 'Lehenga Draping', 'makeup', '₹700', ['Lehenga draping ₹700']],

  // Permanent Makeup
  ['permanent-eyebrow', 'Permanent Eyebrow Makeup', 'permanent-makeup', '₹25000', ['Permanent eyebrow ₹25000']],
  ['lip-blush', 'Lip Blush', 'permanent-makeup', '₹25000', ['Lip blush ₹25000']],
  ['lip-neutralisation', 'Lip Neutralisation', 'permanent-makeup', '₹15000', ['Lip neutralise ₹15000']],

  // Aesthetic Treatments
  ['aha-face-peel', 'AHA Face Peel', 'aesthetic', '₹2500 per sitting', ['AHA peel ₹2500 per sitting']],
  ['yellow-peel', 'Yellow Peel', 'aesthetic', '₹4500 per sitting', ['Yellow peel ₹4500 per sitting']],
  ['party-peel', 'Party Peel', 'aesthetic', '₹2500', ['Party peel ₹2500']],
  ['derma-nano-needling-facial', 'Derma Nano-Needling Facial', 'aesthetic', '₹4500 per sitting', ['Derma nano needling facial ₹4500 per sitting']],
];

const featuredSlugs = new Set([
  'hydra-facial',
  'bridal-makeup',
  'body-polishing-rejuvenation',
  'balayage',
  'luxury-pedicure',
  'full-body-rica-wax',
]);

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const message = body?.error?.message ?? `${response.status}`;
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${message}`);
  }

  return body?.data;
}

async function login() {
  const data = await api('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  return data.token;
}

function servicePayload([slug, name, category, price, prices, note]) {
  const template = templates[category] ?? templates.facials;

  return {
    slug,
    name,
    category,
    shortDescription: template.short(name),
    description: [...template.description, ...prices.map((line) => `• ${line}`)],
    steps: template.steps,
    benefits: template.benefits,
    considerations: [...template.considerations, ...(note ? [note] : [])],
    faqs: template.faqs,
    isFeatured: featuredSlugs.has(slug),
    visual: visuals[slug.length % visuals.length],
    publishedAt,
    price,
    duration: null,
    seo: {
      title: `${name} | Blue Miror`,
      description: template.short(name).slice(0, 155),
    },
    relatedSlugs: [],
    image: null,
  };
}

async function main() {
  console.log(`Seeding against ${API}`);
  const token = await login();
  console.log('Logged in');

  const existingCategories = await api('/admin/categories', { token });
  const categorySlugs = new Set(existingCategories.items.map((c) => c.slug));

  for (const [index, category] of categories.entries()) {
    if (categorySlugs.has(category.slug)) {
      console.log(`skip category ${category.slug}`);
      continue;
    }
    await api('/admin/categories', {
      method: 'POST',
      token,
      body: JSON.stringify({ ...category, order: index + 1, isPublished: true }),
    });
    console.log(`created category ${category.slug}`);
  }

  // The admin list is paginated (48 per page); walk it to know what already exists.
  const existingSlugs = new Set();
  for (let page = 1; page <= 10; page += 1) {
    const data = await api(`/admin/services?page=${page}&limit=48`, { token });
    for (const item of data.items) existingSlugs.add(item.slug);
    if (page >= (data.totalPages ?? 1)) break;
  }

  let created = 0;
  for (const entry of services) {
    const [slug, name, category] = entry;
    if (existingSlugs.has(slug)) {
      console.log(`skip service ${slug}`);
      continue;
    }
    await api('/admin/services', {
      method: 'POST',
      token,
      body: JSON.stringify(servicePayload(entry)),
    });
    created += 1;
    console.log(`created service ${slug} (${name}) [${category}]`);
  }

  console.log(`Done. Categories: ${categories.length}, services created: ${created}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
