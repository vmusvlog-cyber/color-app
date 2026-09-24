/* =========================================================================
   prompts.js — برومبتات جاهزة لصنع صور حقيقية بألوان المستخدم
   المستخدم ينسخ البرومبت ويلصقه في ChatGPT أو Gemini (أو أي أداة صور)
   فيحصل على صورة حقيقية لمكانه أو منشوره أو تغليفه... بألوانه بالضبط.

   البرومبتات بالإنجليزية دائماً (بقرار صاحب التطبيق)، لأن أدوات الصور
   تفهمها أدق. لذلك هي هنا وليست في ملف الترجمة. أما عناوين النسخ
   والشرح العربي فهي في i18n.js تحت 'prompt.*'.
   ========================================================================= */

/* كلمات إنجليزية تصف كل أسلوب */
const STYLE_WORDS = {
  minimal: 'minimalist modern style, clean lines, lots of breathing space',
  luxury: 'luxurious elegant style, premium materials such as marble, velvet and brushed brass',
  bold: 'bold contemporary style, strong contrast, energetic and confident',
  earthy: 'earthy natural style, wood, linen, clay and plants',
  retro: 'retro vintage 1970s style, warm faded tones, nostalgic mood',
};

/* كلمات إنجليزية لكل إحساس (من لوحة "دقّق") */
const FEEL_WORDS = {
  trust: 'trustworthy and reliable', pro: 'professional and polished', calm: 'calm and serene',
  energy: 'energetic and dynamic', excite: 'exciting and lively', warm: 'warm and welcoming',
  luxury: 'luxurious and exclusive', creative: 'creative and artistic', joy: 'joyful and cheerful',
  nature: 'natural and fresh', health: 'healthy and clean',
};

/* أسماء الأماكن بالإنجليزية (من سؤال "أي مكان؟") */
const SPACE_WORDS = {
  apartment: 'modern apartment', living: 'living room', bedroom: 'bedroom', kitchen: 'kitchen',
  kidsroom: "children's bedroom", office: 'office workspace', restaurant: 'restaurant dining room',
  cafe: 'coffee shop', shop: 'retail boutique store', facade: 'house facade',
};

/* أسماء الألوان بالإنجليزية (من ملف الترجمة، لأن البرومبت إنجليزي دائماً) */
function colorNameEn(hex) {
  const saved = currentLang;
  currentLang = 'en';
  const name = colorName(hex).toLowerCase();
  currentLang = saved;
  return name;
}

/* يصف الألوان بدورها: "walls in off-white (#F7F7F5), ..." */
function colorPhrase(hex) {
  return `${colorNameEn(hex)} (${hex})`;
}

/*
  يصنع 4 برومبتات لمكان معيّن.
  kind  = room / social / logo / web / app / card / packaging / menu
  ctx   = { colors, style, feel, temp, space, name, headFont, technique, section, answers }
          (answers = إجابات أسئلة القسم بالإنجليزية، مثل ['Café', 'Luxury'])
  يرجع: [{ key, text }]  (key = اسم النسخة في ملف الترجمة)
*/
function buildPrompts(kind, ctx) {
  const [bg, main, accent, dark, support] = ctx.colors;
  const c = (hex, fallback) => colorPhrase(hex || fallback);
  const style = STYLE_WORDS[ctx.style] || STYLE_WORDS.minimal;
  const feel = ctx.feel ? `, the mood feels ${FEEL_WORDS[ctx.feel]}` : '';
  const temp = ctx.temp ? `, overall ${ctx.temp} color temperature` : '';
  const name = ctx.name ? `"${ctx.name}"` : '"Brand"';
  const font = ctx.headFont ? `, headline typeface similar to ${ctx.headFont}` : '';
  // قائمة الألوان الدقيقة في آخر كل برومبت، حتى تلتزم الأداة بها
  const palette = `Use exactly this color palette: ${ctx.colors.map(colorPhrase).join(', ')}.`;
  const quality = 'Photorealistic, high detail, professional photography, no watermark.';
  // تقنية التسويق (إن اختارها المستخدم): نضيف اسمها وطريقة تطبيقها
  const tech = ctx.technique
    ? ` Apply the "${techniqueNameEn(ctx.technique)}" marketing technique: ${ctx.technique.prompt}.`
    : '';
  const make = (key, body) => ({ key, text: `${body}${about}${feel}${temp}.${tech} ${palette} ${quality}` });
  // إجابات القسم: السؤال الأول والثاني (بأحرف صغيرة لتندمج في الجملة)
  const [a1 = '', a2 = ''] = (ctx.answers || []).map((x) => x.toLowerCase());
  const about = aboutPhrase(ctx.section, a1, a2, kind);

  if (kind === 'video') {
    const type = a1 || 'social media';
    const shot = a2 || 'medium shot';
    return [
      make('vframe', `Video frame still from ${an(type)} video, ${shot}, set design and wardrobe in ${c(main)} and ${c(accent)}, background wall ${c(bg)}, ${style}`),
      make('vthumb', `Eye-catching thumbnail for ${an(type)} video by ${name}, ${c(bg)} background, big bold title in ${c(dark, main)}, highlight shape in ${c(accent)}, creator face on one side, ${style}${font}`),
      make('vset', `Behind-the-scenes photo of a content creator studio set for ${an(type)} video, backdrop painted ${c(bg)}, furniture and props in ${c(main)}, light accents in ${c(accent)}, ${style}`),
      make('vcover', `Vertical 9:16 video cover for ${name}, ${shot} framing, caption bars in ${c(main)} with text in ${c(bg)}, stickers and arrows in ${c(accent)}, ${style}${font}`),
    ];
  }

  if (kind === 'photo') {
    const subject = a1 || 'lifestyle';
    const mood = a2 || 'natural';
    return [
      make('pshoot', `Professional ${mood} ${subject} photograph, color grading built on ${c(main)} and ${c(accent)} with ${c(bg)} tones, ${style}`),
      make('pstudio', `Studio ${subject} photo shoot, seamless backdrop in ${c(bg)}, props and styling in ${c(main)}, rim light accent ${c(accent)}, ${mood} mood`),
      make('poutdoor', `On-location ${subject} photo, ${mood} atmosphere, environment and wardrobe in ${c(main)} and ${c(support, bg)}, small pops of ${c(accent)}`),
      make('pgrade', `Editorial ${subject} photo with a cinematic film color grade, shadows toward ${c(dark, main)}, midtones ${c(main)}, highlights ${c(bg)}, ${mood} look`),
    ];
  }

  if (kind === 'expo') {
    const field = a1 || 'business';
    const place = a2 || 'booth';
    return [
      make('emain', `Photo of ${an(field)} exhibition ${place} for ${name}, main panels in ${c(main)}, background surfaces ${c(bg)}, headline and logo in ${c(dark, main)}, accent lighting and details in ${c(accent)}, ${style}${font}`),
      make('ehall', `Wide photo of a busy ${field} trade show hall, the ${name} ${place} stands out in ${c(main)} and ${c(accent)} with ${c(bg)} walls, visitors walking by, ${style}`),
      make('egraphics', `Close-up of the ${place} graphics for ${name} at ${an(field)} exhibition, large typography in ${c(dark, main)} on ${c(bg)}, color blocks in ${c(main)} and ${c(accent)}, ${style}${font}`),
      make('enight', `Evening event photo of ${an(field)} exhibition ${place} for ${name}, warm spotlights, surfaces in ${c(main)} and ${c(bg)}, glowing accents in ${c(accent)}, ${style}`),
    ];
  }

  if (kind === 'room') {
    if (ctx.space === 'facade') {
      return [
        make('front', `Photo of a house facade, ${style}, front view in daylight, exterior walls painted ${c(bg)}, window frames and trim in ${c(dark, main)}, front door in ${c(main)}, small details in ${c(accent)}`),
        make('evening', `Photo of a villa exterior at golden hour, ${style}, walls in ${c(bg)}, door and shutters in ${c(main)}, warm entrance lights, planters in ${c(accent)}`),
        make('detail', `Close-up architectural photo of an entrance, ${style}, wall texture in ${c(bg)}, door in ${c(main)}, handle and house number in ${c(accent)}`),
        make('street', `Wide street view photo of a building facade, ${style}, walls ${c(bg)}, balconies and frames in ${c(dark, main)}, awnings in ${c(accent)}`),
      ];
    }
    const place = SPACE_WORDS[ctx.space] || 'living room';
    return [
      make('wide', `Wide-angle interior photo of a ${place}, ${style}, walls painted ${c(bg)}, main furniture upholstered in ${c(main)}, cushions and decor accents in ${c(accent)}, details in ${c(support, bg)}, natural daylight`),
      make('evening', `Cozy evening interior photo of a ${place}, ${style}, walls ${c(bg)}, sofa or main furniture in ${c(main)}, warm lamp light, small accessories in ${c(accent)}`),
      make('detail', `Close-up detail photo of textiles and materials in a ${place}, ${style}, fabrics in ${c(main)} and ${c(accent)}, background wall ${c(bg)}`),
      make('magazine', `Editorial interior design magazine photo of a ${place}, ${style}, color scheme of ${c(bg)} walls, ${c(main)} furniture and ${c(accent)} accents, balanced composition`),
    ];
  }

  if (kind === 'social') {
    return [
      make('post', `Instagram post design for the brand ${name}, square format, background ${c(bg)}, large headline in ${c(dark, main)}, graphic shape in ${c(main)}, call-to-action button in ${c(accent)}, ${style}${font}`),
      make('story', `Instagram story design (9:16) for ${name}, full background ${c(main)}, bold text in ${c(bg)}, sticker and highlights in ${c(accent)}, ${style}${font}`),
      make('phone', `Realistic photo of a hand holding a smartphone showing an Instagram post by ${name}, post colors ${c(bg)}, ${c(main)} and ${c(accent)}, ${style}`),
      make('flatlay', `Flat-lay product photo for a social media post of ${name}, props and background in ${c(bg)} and ${c(main)}, accent objects in ${c(accent)}, ${style}`),
    ];
  }

  if (kind === 'logo') {
    return [
      make('sign', `Photo of a storefront sign with the logo ${name}, logo mark in ${c(main)}, text in ${c(dark, main)} on a ${c(bg)} sign board, small accent in ${c(accent)}, ${style}${font}`),
      make('mug', `Branding mockup photo: coffee cup, tote bag and notebook with the logo ${name}, items in ${c(bg)} and ${c(main)}, logo accents in ${c(accent)}, ${style}${font}`),
      make('flat', `Clean flat vector logo design for ${name} centered on a ${c(bg)} background, symbol in ${c(main)} with a detail in ${c(accent)}, ${style}${font}`),
      make('wall', `Photo of a 3D logo ${name} mounted on an office reception wall painted ${c(bg)}, logo in ${c(main)}, lighting accent ${c(accent)}, ${style}${font}`),
    ];
  }

  if (kind === 'web') {
    return [
      make('laptop', `Realistic photo of a laptop on a desk showing the homepage of ${name}, website background ${c(bg)}, header and headings in ${c(main)}, buttons in ${c(accent)}, text in ${c(dark, main)}, ${style}${font}`),
      make('hero', `Website hero section design for ${name}, ${c(bg)} background, big headline in ${c(dark, main)}, illustration in ${c(main)}, primary button in ${c(accent)}, ${style}${font}`),
      make('devices', `Responsive website mockup for ${name} on laptop, tablet and phone, colors ${c(bg)}, ${c(main)} and ${c(accent)}, ${style}`),
      make('dashboard', `Clean web dashboard UI for ${name}, ${c(bg)} background, cards and charts in ${c(main)}, highlights in ${c(accent)}, ${style}`),
    ];
  }

  if (kind === 'app') {
    return [
      make('hand', `Realistic photo of a hand holding an iPhone showing the ${name} mobile app, app background ${c(bg)}, top bar in ${c(main)}, buttons in ${c(accent)}, ${style}${font}`),
      make('screens', `Three mobile app screens for ${name} side by side, onboarding, home and profile, colors ${c(bg)}, ${c(main)} and ${c(accent)}, ${style}${font}`),
      make('icon', `App icon design for ${name}, rounded square, background ${c(main)}, symbol in ${c(bg)} with a small ${c(accent)} detail, ${style}`),
      make('store', `App Store screenshots for ${name}, backgrounds ${c(main)} and ${c(bg)}, highlight badges in ${c(accent)}, ${style}${font}`),
    ];
  }

  if (kind === 'card') {
    return [
      make('desk', `Photo of business cards for ${name} on a desk, card front in ${c(main)} with the logo in ${c(bg)}, back side in ${c(bg)} with text in ${c(dark, main)}, accent line ${c(accent)}, ${style}${font}`),
      make('stack', `Close-up photo of a stack of premium business cards for ${name}, colors ${c(bg)} and ${c(main)}, edge painted ${c(accent)}, ${style}`),
      make('stationery', `Stationery branding set for ${name}: business card, letterhead and envelope, colors ${c(bg)}, ${c(main)} and ${c(accent)}, ${style}${font}`),
      make('hand', `Photo of a hand holding a business card of ${name}, card in ${c(bg)} with the name in ${c(main)} and details in ${c(accent)}, ${style}${font}`),
    ];
  }

  if (kind === 'packaging') {
    return [
      make('box', `Studio product photo of a packaging box for ${name}, box in ${c(main)}, label band in ${c(bg)}, logo in ${c(accent)}, soft shadows, ${style}${font}`),
      make('bag', `Photo of a shopping paper bag and tissue paper for ${name}, bag in ${c(bg)}, logo in ${c(main)}, ribbon in ${c(accent)}, ${style}`),
      make('range', `Product range photo: bottles, jars and boxes of ${name} in ${c(main)}, ${c(bg)} and ${c(accent)}, on a ${c(support, bg)} surface, ${style}`),
      make('unboxing', `Unboxing photo from above of a ${name} package, outer box ${c(main)}, inside ${c(bg)}, stickers and cards in ${c(accent)}, ${style}`),
    ];
  }

  // menu
  return [
    make('table', `Photo of a printed restaurant menu for ${name} on a wooden table, menu paper ${c(bg)}, titles in ${c(main)}, prices and dividers in ${c(accent)}, ${style}${font}`),
    make('board', `Café wall menu board for ${name}, background ${c(main)}, text in ${c(bg)}, highlights in ${c(accent)}, ${style}${font}`),
    make('folded', `Folded menu brochure for ${name} with food photos, cover in ${c(main)}, inner pages ${c(bg)}, accents ${c(accent)}, ${style}${font}`),
    make('qr', `Table tent card with a QR code menu for ${name}, card in ${c(bg)}, logo in ${c(main)}, QR frame in ${c(accent)}, ${style}`),
  ];
}

/* أداة التعريف الإنجليزية الصحيحة: "an art" و "a café" */
function an(word) {
  return (/^[aeiou]/i.test(word) ? 'an ' : 'a ') + word;
}

/*
  جملة قصيرة من إجابات القسم تُضاف لبرومبتات الأماكن الأخرى (الشعار، السوشيال...):
  مثل ", for a café business with a luxury look". أماكن الفيديو والتصوير والمعارض
  تستخدم الإجابات داخل جملها مباشرة، لذلك لا نكررها هناك.
*/
function aboutPhrase(section, a1, a2, kind) {
  if (!a1 || ['video', 'photo', 'expo'].includes(kind)) return '';
  if (section === 'business') return `, for ${an(a1)} business${a2 ? ` with ${an(a2)} look` : ''}`;
  if (section === 'identity') return `, personal brand of ${an(a1)} person${a2 ? ` working in ${a2}` : ''}`;
  if (section === 'creator') return `, for ${an(a1)} content creator`;
  if (section === 'photo') return `, inspired by ${a2 ? a2 + ' ' : ''}${a1} photography`;
  if (section === 'expo') return `, for ${an(a1)} exhibition`;
  if (section === 'beginner') return `, ${a1} colors`;
  return '';
}

/* كلمات بحث Unsplash لكل مكان (للصور الملهمة) */
function inspirationQuery(kind, ctx) {
  const [a1 = '', a2 = ''] = (ctx.answers || []).map((x) => x.toLowerCase());
  if (kind === 'video') return `${a1 || 'content creator'} video set`.trim();
  if (kind === 'photo') return `${a2} ${a1 || 'lifestyle'} photography`.trim();
  if (kind === 'expo') return `${a1} exhibition ${a2 || 'booth'}`.trim();
  const styleWord = { minimal: 'minimalist', luxury: 'luxury', bold: 'colorful', earthy: 'natural', retro: 'vintage' }[ctx.style] || '';
  const base = {
    room: ctx.space === 'facade' ? 'house facade' : (SPACE_WORDS[ctx.space] || 'living room') + ' interior',
    social: 'social media design', logo: 'brand identity', web: 'website design', app: 'mobile app design',
    card: 'business card', packaging: 'product packaging', menu: 'restaurant menu',
  }[kind];
  return `${styleWord} ${base}`.trim();
}

/* لون Unsplash الأقرب للون الرئيسي (Unsplash يقبل أسماء ألوان محددة فقط) */
function unsplashColor(hex) {
  return {
    white: 'white', black: 'black', gray: 'black_and_white', beige: 'white', brown: 'orange',
    gold: 'yellow', red: 'red', orange: 'orange', yellow: 'yellow', green: 'green', teal: 'teal',
    blue: 'blue', navy: 'blue', purple: 'purple', pink: 'magenta',
  }[colorFamily(hex)] || '';
}
