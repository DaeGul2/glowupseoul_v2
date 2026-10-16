/* Glow Up Seoul — 시안 공용 콘텐츠 (2026-10-16)
 * 출처: 인스타 @glowupseoul (캡션·릴스 자막·DM 캡처·댓글), Threads, 현 운영 사이트 glowupseoul.com.
 * 새롬님 컨텐츠 리스트가 오면 이 파일만 고치면 세 시안 전부 바뀐다.
 * 시술/수술 카탈로그는 여기 없음 → /api/v3/catalog (라이브) → 실패 시 shared/catalog.json 스냅샷.
 */
window.GUS = window.GUS || {};
window.GUS.data = {
  contact: {
    wa: '821064871060',
    waDisplay: '+82 10 6487 1060',
    email: 'glowupinseoul@gmail.com',
    instagram: 'glowupseoul',
    wechat: 'glowupseoul',          // TODO 새롬님: 실제 WeChat ID 확인
    hoursKST: [9, 23],              // 답장 시간대 (KST)
    regNo: '',                      // TODO 새롬님: 외국인환자 유치업 등록번호
    bizNo: '',                      // TODO 새롬님: 사업자등록번호
    address: 'Gangnam-gu, Seoul',   // TODO 새롬님: 상세 주소
  },

  // 첫 화면 "이게 뭐 하는 서비스인지" — 세 시안 공통
  service: {
    label: 'Medical beauty concierge · Seoul',
    line: 'We match international patients with verified skin and plastic surgery clinics in Seoul, go with you on the day, and look after you once you’re home.',
    points: [
      { ico: 'match', t: 'Clinic matching', d: '2–3 verified clinics for your concern, with honest prices' },
      { ico: 'with', t: 'With you on the day', d: 'Booking, interpreting and a coordinator by your side' },
      { ico: 'care', t: 'Aftercare', d: 'Check-ins on day 1, 7 and 30, even back home' },
      { ico: 'free', t: 'Free for patients', d: 'Clinics pay us, only after your treatment' },
    ],
    trust: 'Registered with Korea’s Ministry of Health & Welfare · 500+ patients from 25+ countries',
  },

  // 인스타 릴스에서 뽑은 실사 (자막 없는 프레임). 고화질 원본 받으면 assets/ 에서 같은 이름으로 교체.
  photos: [
    { id: 'mic', src: 'romie-mic.jpg', cap: 'Street interviews in Gangnam', alt: 'Romie holding a microphone on a Gangnam street', pos: '50% 25%' },
    { id: 'airport', src: 'airport2.jpg', cap: 'Airport pickup', alt: 'Romie hugging a patient at the airport', pos: '50% 35%' },
    { id: 'desk', src: 'romie-desk.jpg', cap: 'Building your clinic shortlist', alt: 'Romie working at a desk', pos: '50% 30%' },
    { id: 'lobby', src: 'clinic-lobby.jpg', cap: 'A partner clinic, Gangnam', alt: 'A bright clinic lobby', pos: '50% 50%' },
    { id: 'street', src: 'street-ep1.jpg', cap: 'Seoul Skin Talk, episode 1', alt: 'Romie interviewing a woman on the street', pos: '50% 40%' },
    { id: 'red', src: 'romie-red.jpg', cap: 'This or that, with Romie', alt: 'Romie in a red cardigan answering questions', pos: '50% 35%' },
    { id: 'window', src: 'romie-window.jpg', cap: 'Q&A from the office', alt: 'Romie answering questions by the window', pos: '50% 40%' },
    { id: 'men', src: 'street-men2.jpg', cap: 'Asking Korean men about skincare', alt: 'Romie interviewing two men on a bench', pos: '50% 50%' },
    { id: 'closeup', src: 'romie-closeup.jpg', cap: 'Romie, founder', alt: 'Portrait of Romie', pos: '50% 25%' },
    { id: 'profile', src: 'romie-profile.jpg', cap: 'Checking clinics before you do', alt: 'Romie looking around a clinic', pos: '50% 30%' },
    { id: 'wow', src: 'romie-wow.jpg', cap: 'Me reading your DMs', alt: 'Romie with a surprised cat sticker', pos: '50% 30%' },
    { id: 'netflix', src: 'romie-netflix.jpg', cap: '“Preparing for my Netflix documentary”', alt: 'Romie striking a pose', pos: '50% 30%' },
    { id: 'seated', src: 'romie-seated.jpg', cap: 'Hi, I’m Romie', alt: 'Romie smiling on a sofa', pos: '50% 30%' },
  ],

  marquee: ['Free for you', 'Verified clinics only', 'I come with you', 'Replies within 24h', 'Aftercare on WhatsApp', 'English · 中文 · Bahasa'],

  stats: [
    { n: '500+', l: 'international patients' },
    { n: '25+', l: 'countries' },
    { n: '50+', l: 'verified partner clinics' },
    { n: '24h', l: 'personal reply' },
  ],

  trust: [
    'Registered with Korea’s Ministry of Health & Welfare',
    'Free for patients',
    'Personal reply within 24 hours',
  ],

  steps: [
    { t: 'Message Romie', send: 'Your concern, a few photos if you like, and the month you’re coming.', get: 'A personal reply with first thoughts and the right questions.', time: 'Within 24 hours' },
    { t: 'Get your shortlist', send: 'Budget range and anything you care about in a doctor.', get: '2–3 verified clinics, why each fits, price range and downtime. A written quote before anything is booked.', time: '2–3 days' },
    { t: 'Your days in Seoul', send: 'Just yourself. Coming alone is completely fine.', get: 'Booking, translation, someone next to you at consultation and treatment, the pharmacy run.', time: '1–2 days skin · 7–10 days surgery' },
    { t: 'After you fly home', send: 'Photos and questions, any time.', get: 'Check-ins on day 1, 7 and 30, and clinic coordination if anything feels off.', time: 'As long as you need' },
  ],

  quickFacts: [
    { k: 'Days in Seoul', v: '1–2 days for skin · 7–10 days for surgery' },
    { k: 'Message us', v: '2–4 weeks before your trip' },
    { k: 'We talk on', v: 'WhatsApp, WeChat or email, in English' },
    { k: 'Cost to you', v: '₩0, always' },
  ],

  itinerary: {
    skin: [
      { d: 'Before', t: 'Message & consultation', p: 'We talk through your skin, match you with the right clinic and send a full written quote.', tags: ['WhatsApp / email', 'Clinic match', 'Written quote'] },
      { d: 'Day 1', t: 'Treatment day', p: 'Your coordinator meets you, comes to the clinic with you, translates throughout and walks you to the pharmacy.', tags: ['Accompanied', 'Interpretation', 'Pharmacy'] },
      { d: 'Day 2', t: 'Check & skincare shopping', p: 'Some treatments need a next-day check. Then we point you to the best skincare shops in Seoul.', tags: ['Optional'] },
      { d: '+7 days', t: 'We check in', p: 'Wherever you are, we message to see how your skin is settling.', tags: ['Remote'] },
    ],
    surgery: [
      { d: 'Before', t: 'Planning', p: 'Recovery timeline, how long to stay, surgeon matching and verification, pre-op consultation booked.', tags: ['Surgeon vetting'] },
      { d: 'Day 1', t: 'Airport pickup', p: 'We meet you at Incheon or Gimpo and help you settle in.', tags: ['Premium Care'] },
      { d: 'Day 2', t: 'Pre-op consultation', p: 'The surgeon explains everything. All your questions answered before you agree to anything.', tags: ['Accompanied'] },
      { d: 'Day 3', t: 'Surgery day', p: 'Support before, liaison during, and someone waiting for you when you come out.', tags: ['Never alone'] },
      { d: 'Day 4', t: 'Pharmacy', p: 'Medication explained in English and covered as part of Premium Care.', tags: ['Covered'] },
      { d: 'Days 5–7', t: 'Recovery', p: 'Daily check-ins and accompanied follow-up appointments.', tags: ['Daily check-ins'] },
      { d: '+7 days', t: 'Back home', p: 'We keep checking on your recovery from wherever you are.', tags: ['Remote'] },
    ],
  },

  checklist: {
    skin: [
      ['Send clear photos of your concern', 'Natural light, no filters, front and side'],
      ['List the skincare you use now', 'Especially retinoids, acids or prescription creams'],
      ['Note allergies or past reactions', ''],
      ['Stop retinoids 5–7 days before laser', 'We’ll remind you when'],
      ['Confirm your travel dates', 'So we can book around your schedule'],
    ],
    surgery: [
      ['Send photos from several angles', 'Front, side and 3/4 in natural light'],
      ['Share your medical history', 'Past surgeries, medication, conditions'],
      ['Stop blood thinners 2 weeks before', 'We’ll confirm the full list'],
      ['Plan 7–10 days in Seoul', 'We’ll advise the exact length'],
      ['Book your return flight carefully', 'Most surgeries: no flying for 48–72h after'],
    ],
  },

  tiers: {
    cols: ['Care', 'Premium Care'],
    sub: ['Skin & non-surgical', 'Surgery & major treatments'],
    rows: [
      ['1:1 coordinator from your first message', 1, 1],
      ['Clinic & doctor matching, verified', 1, 1],
      ['Malpractice record check', 1, 1],
      ['Coordinator with you on the day + interpretation', 1, 1],
      ['Follow-up after you fly home', '1 week', 'Day 1 · 7 · 30'],
      ['Airport pickup', 0, 1],
      ['Pharmacy run, medication covered', 0, 1],
      ['Recovery & stay planning', 0, 1],
      ['Cost to you', 'Free', 'Free'],
    ],
  },

  checks: [
    ['Board certification', 'Every doctor’s specialist credentials, verified.'],
    ['Malpractice records', 'Checked before any clinic joins the network.'],
    ['Hygiene', 'Visited in person. We’d only send you where we’d go ourselves.'],
    ['English & communication', 'Doctors who actually listen and explain.'],
    ['Real outcomes', 'Patient results and reviews from Korean communities, not just ads.'],
    ['Honest pricing', 'The same price as a walk-in. No markup from us.'],
  ],

  timeline: [
    { y: '2014', t: 'London', p: 'Studying in the UK, Romie keeps getting the same question from friends: “Which clinic in Korea should I go to?” She starts researching properly: forums, clinic staff communities, doctor credentials, malpractice records.' },
    { y: '2014–21', t: 'Seoul', p: 'Back in Seoul, she tries treatments herself, builds relationships with clinics and becomes the friend everyone asks, Korean friends included.' },
    { y: '2022', t: 'Glow Up Seoul opens', p: 'Registered with the Ministry of Health & Welfare as a foreign patient attraction agency.' },
    { y: 'Today', t: '500+ patients, 25+ countries', p: 'The messages patients send afterwards are still the best part of the job.' },
  ],

  principles: [
    ['We’re obsessed with research', 'We screen 10,000+ clinics and verify malpractice records and board certifications.'],
    ['Honesty over upselling', 'We will never push a trend on you. If it’s not right for you, we’ll say so.'],
    ['We stay by your side', 'Most agencies drop you at the clinic door. We translate, advocate and hold your hand.'],
    ['We try it first', 'Romie has had the treatments she recommends. Sometimes on camera.'],
  ],

  reels: [
    { id: 'DbXgZs9BYgr', cover: 'cover-qa-concierge.jpg', t: 'What does a beauty concierge do?', k: 'Q&A', dur: '0:52' },
    { id: 'DcIzInAh49R', cover: 'cover-qa-trust.jpg', t: 'How do you know a clinic is trustworthy?', k: 'Q&A', dur: '0:57' },
    { id: 'DbvLWIuh8kj', cover: 'cover-qa-mistakes.jpg', t: 'The biggest mistake foreigners make', k: 'Q&A', dur: '1:35' },
    { id: 'DbA-y2eh02k', cover: 'cover-thisorthat.jpg', t: 'Botox or skin boosters?', k: 'This or that', dur: '1:34' },
    { id: 'DbHTuuaBNYt', cover: 'cover-qa-take.jpg', t: 'Is the cheapest clinic worth it?', k: 'Hot take', dur: '0:51' },
    { id: 'DacMHY4hqbU', cover: 'cover-street1.jpg', t: 'What do Koreans actually get done?', k: 'Street', dur: '1:49' },
    { id: 'DauBo70hiDR', cover: 'cover-street-men.jpg', t: 'Korean men’s skincare secrets', k: 'Street', dur: '1:33' },
    { id: 'Da9yI06h4-i', cover: 'cover-street-girls.jpg', t: 'Would Korean girls recommend clinics?', k: 'Street', dur: '1:47' },
  ],

  local: [
    { q: 'There are over three thousand clinics in Gangnam. The only thing I do regularly is botox. Among my friends? Ulthera.', who: 'Woman in her 40s, Gangnam', ep: 'DacMHY4hqbU' },
    { q: 'Something simple like laser hair removal, I go to a factory clinic. Anything skill-dependent, I go somewhere more expensive.', who: 'Man in his 20s, Gangnam', ep: 'DauBo70hiDR' },
    { q: 'Compare them thoroughly. Read the reviews carefully and take your time choosing what you need.', who: 'Man, 33, Gangnam', ep: 'DauBo70hiDR' },
  ],

  reviews: [
    { name: 'Vanessa', meta: 'Austria · surgery', q: 'She was there at every consultation, stayed with me during the surgery, and was there again when I woke up. I felt safe and cared for even though I came to Korea without my parents.', src: 'Instagram review', note: true },
    { name: 'Vanessa', meta: 'Austria · after returning home', q: 'Even after coming back from Korea, she keeps checking on me and my healing. I genuinely couldn’t imagine anyone better than her.', src: 'Instagram review', note: true },
    { name: 'N.', meta: 'Returning patient', q: 'Thanks for all your help during my previous trip and my upcoming one, Romie. You are very sincere and kind and helpful.', src: 'Instagram comment', note: true },
    { name: 'Sarah L.', meta: 'London · laser + Rejuran', q: 'Having a personal coordinator with me at every appointment made all the difference. I never felt lost or alone.', src: 'glowupseoul.com' },
    { name: 'Michelle K.', meta: 'Sydney · acne scars', q: 'Glow Up Seoul found exactly the right doctor for my acne scars. It truly felt like being a VIP patient.', src: 'glowupseoul.com' },
    { name: 'Alysa N.', meta: 'Singapore · pigmentation + filler', q: 'From the airport to my follow-up calls after I got home, everything was taken care of.', src: 'glowupseoul.com' },
  ],

  dms: [
    { when: '3 days after treatment', m: [['them', 'Romieeee is it normal that I still have some bumps on my skin? 😭'], ['me', 'Ohh it depends on your skin type, but sometimes it takes 1–2 weeks!'], ['them', 'Oh okay good!!!! Thanks haha ❤️']] },
    { when: 'Treatment day', m: [['them', 'They gave me little stickers to replace every two days, said only moisturizer on my neck and no running'], ['me', 'It looks amazing 😍 I’m so happy everything went well'], ['them', 'Me too!!! Couldn’t have done it without you']] },
    { when: 'Surgery, night 1', m: [['them', 'I’m doing well! A bit sore, strong headache, but just icing and elevating. 10am is perfect tomorrow!'], ['me', 'Keep icing and resting well tonight. I’ll schedule the cab for 10am tomorrow as planned. Let me know if you need anything at all!']] },
    { when: 'Flight home', m: [['me', 'I was so happy to have you as my first client from Austria 😊 Safe travels back home'], ['them', 'Thank you, it was really nice to meet you in person. I hope we can ski together next year in Austria!']] },
    { when: 'Last day', m: [['them', 'Thank you so much lovie. It was so nice with you. Hopefully see you soon 💗'], ['me', 'It was my pleasure! Hope everything else you planned went well']] },
    { when: 'Pickup day', m: [['them', 'I definitely could not have done it without you 🥹 Thank you so much!']] },
  ],

  faqCats: ['Getting started', 'Clinics & safety', 'Treatments', 'Price', 'Your trip', 'Aftercare'],
  faq: [
    { id: 'what', c: 'Getting started', q: 'What does a beauty concierge actually do?', a: 'Think of me as a bridge between you and clinics in Seoul. If you’re unsure about pricing, or there’s something you’d like to work on, I can help you find doctors and clinics that suit you, and stay with you through it.', reel: 'DbXgZs9BYgr' },
    { id: 'free', c: 'Getting started', q: 'Is it really free? How do you make money?', a: 'It’s free for you. Partner clinics pay us a referral fee, and only after your treatment is done. You’d pay the clinic directly, at the same price as any walk-in patient.', note: '현 glowupseoul.com 문구 기준 ("completely free for you… compensated by partner clinics"). 실제 과금 구조 확인 필요' },
    { id: 'know', c: 'Getting started', q: 'Do I need to know what treatment I want?', a: 'Not at all. It can help to have a rough idea, since most clinics have someone whose job is to sell and their advice can pull you in different directions. If you’re not sure yet, just tell me your concern and we can figure it out together.', reel: 'DbvLWIuh8kj' },
    { id: 'when', c: 'Getting started', q: 'How far in advance should I message you?', a: 'If you can, messaging 2–4 weeks before your trip usually gives us enough time for skin treatments, and a little earlier for surgery. Already in Seoul? Feel free to message anyway and I’ll see what’s possible.' },
    { id: 'trust', c: 'Clinics & safety', q: 'How do you know a clinic is trustworthy?', a: 'Certifications, how many cases a clinic has done and government recognition are good places to start. Personally, I look for clinics where the doctors listen, explain things and genuinely want to solve your problem rather than treat you as a one-time customer. Those are the clinics I’d suggest to you.', reel: 'DcIzInAh49R' },
    { id: 'tiktok', c: 'Clinics & safety', q: 'Can’t I just pick the clinic I saw on TikTok?', a: 'You can, but I’d suggest comparing a few options too. A clinic that’s everywhere online usually has a big marketing budget. That doesn’t make it a bad clinic, but it might not be the best fit for what you need.', reel: 'DbXgZs9BYgr' },
    { id: 'wrong', c: 'Clinics & safety', q: 'What if something goes wrong?', a: 'Please message me first. I can contact the clinic for you in Korean, help arrange a follow-up and stay with it until it’s sorted, even after you’ve left Korea.' },
    { id: 'start', c: 'Treatments', q: 'It’s my first treatment in Korea. What would you suggest?', a: 'It really depends on your skin and what you’d like to change, so I’d love to hear your concern first. If you’d like a gentle start, many first-timers enjoy a skin booster. It suits most skin types and people often notice a glow within two to three weeks.', reel: 'DcIzInAh49R' },
    { id: 'skinbotox', c: 'Treatments', q: 'Isn’t botox just for wrinkles?', a: 'Not always. Outside Korea most people know botox for wrinkles, but here you’ll also hear about “skin botox”, which is used more like a skin booster for pores and a smoother, glassy look. It’s worth asking your doctor which kind they mean.', reel: 'DbvLWIuh8kj' },
    { id: 'botoxbooster', c: 'Treatments', q: 'Botox or skin boosters?', a: 'They do different jobs, so some people end up choosing both. Botox is often used to soften or prevent wrinkles, while a skin booster gives your skin more nourishment. Your doctor can help you decide based on your concern.', reel: 'DbA-y2eh02k' },
    { id: 'laser', c: 'Treatments', q: 'Skin booster or laser?', a: 'As a rough guide, skin boosters work on your skin overall, so they can be a nice choice if you’re not sure what you need. Lasers usually target something specific, so I’d suggest deciding on those after talking with a doctor.', reel: 'DbA-y2eh02k' },
    { id: 'copy', c: 'Treatments', q: 'Can I just copy an influencer’s treatment list?', a: 'I’d gently suggest not following someone else’s list too closely. Everyone’s skin reacts differently, so a consultation can help you build a plan that fits you.', reel: 'DbHTuuaBNYt' },
    { id: 'cheap', c: 'Price', q: 'Why not book the cheapest clinic?', a: 'It’s worth looking beyond the lowest price. Sometimes the cheapest option on a menu is there to bring you in, and once other treatments are added the total can end up similar or higher. Comparing the total for everything you’d actually get usually gives a fairer picture.', reel: 'DbHTuuaBNYt' },
    { id: 'prices', c: 'Price', q: 'Are the prices on this site final?', a: 'They’re reference prices from partner clinics to help you plan. You’d get a full written quote before anything is booked.' },
    { id: 'pay', c: 'Price', q: 'How do I pay?', a: 'Usually you’d pay the clinic directly, by card or cash, on the day. You won’t pay us anything.', note: '예치금/결제 정책 확인' },
    { id: 'area', c: 'Your trip', q: 'Gangnam or Apgujeong?', a: 'As a general rule, Gangnam has more skin clinics and Apgujeong has more plastic surgeons. For skin treatments Gangnam is a good place to start, and for surgery you might look at Apgujeong. I’m happy to suggest an area once I know your goal.', reel: 'DbA-y2eh02k' },
    { id: 'alone', c: 'Your trip', q: 'Can I come alone?', a: 'Yes, many patients come on their own. Your coordinator can be with you at the consultation and treatment, and there when you wake up from surgery.' },
    { id: 'days', c: 'Your trip', q: 'How many days do I need in Seoul?', a: 'For most skin treatments, 1–2 days in Seoul is often enough. For surgery, around 7–10 days is a safer plan, and most surgeons advise not flying for 48–72 hours afterwards. Your doctor will confirm what applies to you.' },
    { id: 'lang', c: 'Your trip', q: 'I don’t speak Korean. Is that a problem?', a: 'Not at all. Your coordinator can interpret for you before, during and after your treatment. We speak English, 中文 and Bahasa.' },
    { id: 'visa', c: 'Your trip', q: 'Do I need a medical visa?', a: 'For short skin treatments, a regular tourist entry is often enough. For a longer surgical stay, it’s worth checking with us first and we’ll look at what applies to your passport.', note: '비자 안내 문구 확인' },
    { id: 'bumps', c: 'Aftercare', q: 'Is it normal to still have bumps after treatment?', a: 'It can depend on your skin type, and it sometimes takes 1–2 weeks to settle. If you’re worried, send me a photo and I can check with the clinic.' },
    { id: 'home', c: 'Aftercare', q: 'Do you still help after I fly home?', a: 'Yes. We like to check in on day 1, 7 and 30, and you’re welcome to message any time, even after you’ve left Korea.' },
  ],
};
