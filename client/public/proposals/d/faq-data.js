/* 시안 D FAQ (10/18 개편) — WhatsApp CS 대화 112개방 · 질문 1,759문장 분석으로 다시 짠 질문과 짧은 답.
   근거·빈도: docs/CS분석_FAQ개편_2026-10-18.xlsx. 답은 로미가 실제로 한 답을 1~2문장으로 줄인 것.
   쓰는 곳: FAQ 페이지(목록·채팅·WhatsApp), 홈 FAQ, 모든 페이지의 "Ask Romie" 채팅 (d/faq.js), JSON-LD.
   (Journal 글 본문은 예전 긴 답 shared/data.js 의 faq 를 그대로 쓴다.)
   필드: c 분류 · q 질문 · a 짧은 답 · steps 단계 목록(선택) · tag 한눈에 보이는 칩(선택) · top 많이 묻는 질문
         k 채팅에서 직접 친 질문을 맞출 때 쓰는 단어 · tpl 이 질문의 "Ask Romie" 를 누르면 쓸 WhatsApp 문구 틀(선택) · reel */
(function () {
  const G = (window.GUS = window.GUS || {});
  G.dfaq = {
    cats: [
      ['plan', 'Planning'],
      ['price', 'Price & payment'],
      ['day', 'On the day'],
      ['tx', 'Treatments'],
      ['trust', 'Trust & safety'],
      ['after', 'After your treatment'],
    ],
    // WhatsApp 첫 메시지 틀. 로미가 첫 답장에서 매번 묻는 것(날짜·고민·해본 시술·예산·사진, 예약 시 이름·생년월일·국적)을 미리 넣어 한 번에 보내게 한다.
    tpl: {
      hello: { label: 'Just say hi', text: 'Hi Romie! 👋 ' },
      plan: { label: 'Plan my trip', text: 'Hi Romie! 👋 I’m planning a trip to Seoul.\n• Dates in Seoul: \n• What I’d like to improve: \n• Treatments I’m curious about: \n• Treatments I’ve had before: \n• Budget (optional): \nI’ll send 2–3 photos (daylight, no makeup, front and both sides).' },
      price: { label: 'Check a price', text: 'Hi Romie! 👋 Could you check prices for me?\n• Treatment(s): \n• My dates in Seoul: ' },
      book: { label: 'Book a date', text: 'Hi Romie! 👋 I’d like to book.\n• Clinic or treatment: \n• Preferred date and time: \n• Number of people: \n• Full name (as on passport): \n• Date of birth: \n• Nationality: ' },
      after: { label: 'After my treatment', text: 'Hi Romie! 👋 A question after my treatment.\n• Clinic and date: \n• What I had done: \n• My question: \nI’ll attach a photo.' },
    },
    items: [
      // ---------------- Planning
      { id: 'how', c: 'plan', q: 'How does it work?', a: 'Four simple steps, all on WhatsApp.',
        steps: ['Tell me your dates and what you’d like to change.', 'I suggest treatments and 2–3 vetted clinics, with prices.', 'I book everything for you.', 'I meet you at the clinic and translate.'],
        k: 'how does it work|process|what do you do|concierge|service|how it works|steps', reel: 'DbXgZs9BYgr' },
      { id: 'when', c: 'plan', top: 1, tag: '2–4 weeks', q: 'How early should I message you?', a: '2–4 weeks before your trip is ideal, as popular clinics fill up. I can often still find a slot within a few days. For surgery, allow at least 2 weeks.',
        k: 'how early|advance|ahead|last minute|book early|when should|weeks before|fully booked|tomorrow|availability|available|slot' },
      { id: 'send', c: 'plan', tag: 'Saves a day', q: 'What should I send you first?', a: 'Your dates in Seoul, what you’d like to improve and any treatments you’ve had before. Add 2–3 photos in daylight, no makeup: front and both sides.',
        k: 'what should i send|photos|photo|picture|what do you need|information|details|first message|start', tpl: 'plan' },
      { id: 'days', c: 'plan', q: 'How many days do I need in Seoul?', a: 'For skin treatments, one day is often enough. Book it early in your trip, not the day you fly, so you can see the doctor again if needed. For surgery, plan 7–10 days.',
        k: 'how many days|how long should i stay|how long to stay|stay in seoul|stay|days in seoul|trip length|first day|last day|before my flight|flight' },
      { id: 'decide', c: 'plan', q: 'Do I need to decide my treatments first?', a: 'No. The doctor checks your skin first and you decide together. My suggestions help you choose the right clinic.',
        k: 'decide|need to know|know what i want|know which|decide first|before i come|choose treatments' },
      { id: 'video', c: 'plan', q: 'Can I talk to the doctor before I fly?', a: 'Clinics don’t usually do video calls before booking. I send them your photos and questions and bring back their written advice.',
        k: 'video|online consultation|virtual|call the doctor|before i fly|before my trip|remote|zoom|talk to the doctor' },
      { id: 'group', c: 'plan', top: 1, q: 'Can my friend, partner or mum come too?', a: 'Of course. I book you in together, often at the same time. Men are very welcome too.',
        k: 'friend|friends|partner|husband|boyfriend|wife|mum|mom|mother|family|come together|group|two of us|men|male|man' },
      { id: 'other', c: 'plan', q: 'Can you help with anything besides clinics?', a: 'I focus on skin and aesthetic clinics, and I can also book health check-ups. Happy to share restaurant tips too.',
        k: 'restaurant|food|hair salon|salon|makeup class|colour analysis|color analysis|hotel|shopping|health check|check-up|checkup|teeth|whitening|spa' },

      // ---------------- Price & payment
      { id: 'free', c: 'price', tag: 'Free', q: 'Is your service free?', a: 'Yes. Partner clinics pay me a referral fee, the same at every clinic. You pay the clinic’s normal price, the same as walking in.',
        k: 'free|fee|charge|cost you|commission|how do you make money|service charge|concierge fee|markup|extra|pay you' },
      { id: 'price', c: 'price', top: 1, q: 'How much will my treatments cost?', a: 'It depends on the clinic and the dose. I send quotes from 2–3 clinics before you book, so you can compare.',
        k: 'how much|price|prices|cost|quote|price list|expensive|cheap|budget|krw|usd' },
      { id: 'tax', c: 'price', tag: 'VAT 10%', q: 'Can I get a tax refund?', a: 'Not anymore. Korea’s tax refund on cosmetic treatments ended on 31 December 2025, so 10% VAT now applies. Most price lists exclude it, so I always flag it in your quote.',
        k: 'tax|refund|vat|tax free|tax-free' },
      { id: 'pay', c: 'price', tag: 'Card OK', q: 'How do I pay?', a: 'At the clinic on the day, by card or cash. There’s no extra charge for cards. If a clinic needs a booking deposit, I’ll tell you first.',
        k: 'pay|payment|card|credit card|cash|deposit|paypal|transfer|wise|currency' },
      { id: 'consultfee', c: 'price', q: 'Is there a consultation fee?', a: 'Usually not, if you have your treatment the same day. Some clinics charge a small fee if a reserved consultation is cancelled.',
        k: 'consultation fee|consult fee|consultation cost|pay for consultation|consultation free|consultation' },
      { id: 'promo', c: 'price', q: 'Are there discounts or promotions?', a: 'Many clinics run monthly event prices and first-visit offers. I check what’s on for your dates and add it to your quote.',
        k: 'discount|promo|promotion|event|first timer|first-timer|first visit|deal|package|special price|cheaper' },
      { id: 'outside', c: 'price', q: 'I’ve already picked a clinic. Can you still help?', a: 'Yes. I can book it and come with you to translate. If it isn’t one of my partner clinics, there’s a support fee and I’ll tell you the amount upfront.',
        k: 'already booked|my own clinic|already picked|chosen a clinic|not your clinic|translator only|interpreter only|only translation' },

      // ---------------- On the day
      { id: 'with', c: 'day', q: 'Will you come with me?', a: 'Yes. I meet you at the clinic, translate the consultation and stay with you through the treatment.',
        k: 'come with|with me|accompany|be there|will you be|see you at|join me|alone|on my own' },
      { id: 'meet', c: 'day', q: 'Where do we meet? Can you pick me up?', a: 'We meet at the clinic. I send you the map pin and the Korean address for your taxi. Airport pickup comes with Premium Care.',
        k: 'meet|pick up|pickup|pick me up|hotel|taxi|uber|address|location|where is|how do i get|airport|directions' },
      { id: 'lang', c: 'day', tag: 'EN · 中文', q: 'Do the doctors speak English?', a: 'Most partner clinics have English-speaking doctors or staff, and I translate either way. Chinese-speaking help is available too.',
        k: 'english|chinese|mandarin|language|speak|translate|translation|translator|interpreter|korean' },
      { id: 'time', c: 'day', tag: '1–2 hours', q: 'How long will I be at the clinic?', a: 'Usually 1–2 hours for one or two treatments, including the consultation and numbing. A full plan can take 3–4 hours.',
        k: 'how long|how many hours|take|duration|time at the clinic|session length|set aside|long will it' },
      { id: 'pain', c: 'day', q: 'Will it hurt?', a: 'Most treatments feel like heat or a quick pinch. Numbing cream is standard, and many clinics offer laughing gas or sleep sedation for an extra fee. Tell me if you’re sensitive.',
        k: 'pain|painful|hurt|hurts|numbing|sedation|sleep|anaesthesia|anesthesia|air nox|airnox|nerve block|sensitive' },
      { id: 'open', c: 'day', q: 'Are clinics open at weekends?', a: 'Most are open on Saturdays and closed on Sundays. A few open on Sundays, and I plan around your days.',
        k: 'sunday|saturday|weekend|open|opening hours|closed|holiday|night|late|evening' },

      // ---------------- Treatments
      { id: 'first', c: 'tx', top: 1, q: 'It’s my first time. What should I try?', a: 'Start gentle. A skin booster like Rejuran or a no-downtime lifting device is a common first step. The doctor confirms what suits your skin.',
        k: 'first time|first treatment|never done|beginner|start with|what should i try|new to|gentle', reel: 'DcIzInAh49R' },
      { id: 'downtime', c: 'tx', top: 1, q: 'When can I wear makeup or go sightseeing?', a: 'After lifting devices, usually straight away. Injections can leave small bumps or bruises for 1–2 days, and microneedling like Potenza some redness for 1–2 days.',
        k: 'downtime|makeup|make up|sightseeing|go out|red|redness|bruise|bruising|swelling|swollen|public|recovery|tomato|work' },
      { id: 'oneday', c: 'tx', q: 'Can I do several treatments in one day?', a: 'Often, yes. Lifting devices and skin boosters are commonly done together. Your doctor decides what’s safe to combine.',
        k: 'one day|same day|combine|combination|together|several|multiple|at once|all in one' },
      { id: 'last', c: 'tx', q: 'How long do results last?', a: 'Lifting devices: around 6–12 months. Botox: 3–4 months. Skin boosters build up over a series. Your doctor suggests how often.',
        k: 'last|lasting|how long do results|how long does|how long do|last long|wear off|results|touch up|touch-up|how often|sessions|repeat|maintenance' },
      { id: 'avoid', c: 'tx', q: 'What should I avoid afterwards?', a: 'For a few days, skip alcohol, saunas and strong sun, and wear sunscreen. Your clinic gives you exact aftercare.',
        k: 'avoid|alcohol|drink|sauna|spa|sun|sunscreen|gym|exercise|skincare|after the treatment' },
      { id: 'health', c: 'tx', q: 'I’m pregnant, on medication or have a skin condition. Is that OK?', a: 'Tell me before we book. Some treatments aren’t suitable, so I check with the doctor first.',
        k: 'pregnant|pregnancy|breastfeeding|medication|medicine|roaccutane|accutane|isotretinoin|condition|allergy|ivf|lasik|retinol|eczema' },

      // ---------------- Trust & safety
      { id: 'trust', c: 'trust', q: 'How do you choose clinics?', a: 'I only recommend clinics I’ve visited or been treated at myself, where the doctor who consults you also treats you. No factory-style clinics.',
        k: 'trust|trustworthy|how do you choose|safe|safety|factory|vetted|reliable|legit|good clinics', reel: 'DcIzInAh49R' },
      { id: 'reviews', c: 'trust', q: 'Can I see reviews or before-and-after photos?', a: 'Most Korean reviews are on Naver, in Korean. I can share before-and-after examples from the clinics I suggest.',
        k: 'review|reviews|before and after|before-and-after|results photos|naver|google review' },
      { id: 'reg', c: 'trust', q: 'Are you a registered agency?', a: 'Yes. Glow Up Seoul is registered with Korea’s Ministry of Health and Welfare as a Foreign Patient Attraction Agency.',
        k: 'registered|licensed|license|licence|legal|government|agency|ministry' },

      // ---------------- After
      { id: 'home', c: 'after', top: 1, q: 'What if something feels off after I fly home?', a: 'Message me any time, even from home. Send a photo and I’ll check with your clinic and arrange a follow-up if needed.',
        k: 'wrong|problem|side effect|normal|bump|bumps|itch|itchy|lump|worried|after i fly|back home|fly home|follow up|aftercare|check in' },
    ],
  };
})();
