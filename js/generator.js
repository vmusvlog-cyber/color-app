/* =========================================================================
   generator.js — "العقل" الذي يصنع اللوحات ويشرحها
   - يصنع 3 لوحات من إجابات الاستبيان
   - يصنع 3 لوحات حول ألوان يختارها المستخدم
   - يخمّن أسلوب أي لوحة (بسيط، فاخر، ...)
   - يعرف "عائلة" كل لون (أزرق، بني...) ليشرح معناه
   - يقترح لوناً يميّزك عن ألوان المنافسين في مجالك
   ========================================================================= */

/*
  المزاج: كل مزاج له مجال درجات لون (hue) ومقدار حيوية (sat).
  hue: رقم من 0 إلى 360 على عجلة الألوان (0 أحمر، 120 أخضر، 240 أزرق)
  sat: 1 = عادي، أكبر من 1 = ألوان أقوى، أصغر من 1 = ألوان أهدأ
  colors: الألوان المستخدمة في رسم صورة المزاج في الاستبيان
*/
const MOODS = {
  calm:      { hue: [185, 225], sat: 0.9,  colors: ['#E3EFF3', '#9CC3D5', '#4F7C8A'] },
  energetic: { hue: [0, 40],    sat: 1.15, colors: ['#FFE08A', '#FF7A3D', '#D7263D'] },
  warm:      { hue: [15, 45],   sat: 1.0,  colors: ['#F6E3C6', '#E9A46A', '#B5552C'] },
  elegant:   { hue: [220, 290], sat: 0.8,  colors: ['#1B1B2F', '#C9A227', '#EDE6D6'] },
  natural:   { hue: [80, 150],  sat: 0.95, colors: ['#E4EDD9', '#8A9A5B', '#3E5A3C'] },
  playful:   { hue: [300, 350], sat: 1.2,  colors: ['#FFE5EC', '#FF8FAB', '#5BC0EB'] },
};

/* الأنواع الثلاثة للتناسق، ومقدار الدوران على عجلة الألوان لكل نوع */
const HARMONIES = [
  { id: 'analogous', shift: 30 },      // متقاربة: ألوان متجاورة
  { id: 'complementary', shift: 180 }, // متباينة: ألوان متقابلة
  { id: 'split', shift: 150 },         // متوازنة: قريبة من المقابل
];

/*
  "قوالب" الأساليب. كل قالب يصنع 5 ألوان بالترتيب:
  [0] خلفية فاتحة   [1] اللون الرئيسي (ملوّن وقوي)   [2] لون التمييز
  [3] داكن للنصوص    [4] لون مساعد فاتح
  لذلك لوحة من 3 ألوان تكون كلها ملوّنة وواضحة، والداكن يأتي رابعاً فقط.
  (الفاخر وحده خلفيته داكنة، بقرار صاحب التطبيق)
  h = درجة اللون الأساسية، shift = دوران التناسق، c = دالة تصنع اللون
*/
const STYLE_TEMPLATES = {
  minimal: (h, shift, c) => [c(h, 14, 97), c(h, 62, 46), c(h + shift, 78, 55), c(h, 18, 20), c(h, 40, 84)],

  luxury: (h, shift, c) => [
    c(h, 35, 10),                                                 // خلفية داكنة جداً (الفاخر فقط)
    shift === 30 ? c(43, 65, 52) : c(h + shift, 55, 48),          // ذهبي أو لون جوهري
    c(h, 45, 38),                                                 // لون عميق من نفس الدرجة
    c(40, 35, 93),                                                // كريمي
    c(h + shift, 40, 30),
  ],

  bold: (h, shift, c) => [c(h, 25, 97), c(h, 90, 50), c(h + shift, 95, 55), c(h, 45, 13), c(h + shift + 60, 88, 60)],

  earthy: (h, shift, c) => {
    const e = 20 + (h / 360) * 60;          // نحوّل أي درجة إلى مجال الألوان الترابية (بني، زيتوني، تيراكوتا)
    const e2 = e + shift / 5;               // اختلاف بسيط حسب نوع التناسق
    return [c(38, 42, 94), c(e - 5, 62, 50), c(e2 + 45, 38, 40), c(e, 35, 22), c(e + 25, 40, 72)];
  },

  retro: (h, shift, c) => [c(40, 60, 92), c(h, 58, 50), c(h + shift, 66, 56), c(h, 30, 24), c(40, 72, 70)],
};

/* يرجع رقماً عشوائياً داخل مجال [من، إلى] */
function randIn(range) {
  return rand(range[0], range[1]);
}

/*
  يصنع 3 لوحات من إجابات الاستبيان.
  answers = { industry, who, use, mood, style }
  refine  = اختيارات "دقّق النتيجة" (الإحساس ونظام التناسق يُستخدمان هنا مباشرة)
  يرجع: [{ harmony: 'analogous', colors: [...] }, ...]
*/
function generateFromAnswers(answers, refine = defaultRefine()) {
  const mood = MOODS[answers.mood] || MOODS.calm;
  const feeling = FEELINGS[refine.feel];
  const template = STYLE_TEMPLATES[answers.style] || STYLE_TEMPLATES.minimal;

  // تعديلات حسب الجمهور والاستخدام
  let satMul = mood.sat * (feeling && feeling.sat ? feeling.sat : 1);
  if (answers.who === 'kids') satMul *= 1.2;                 // الأطفال: ألوان أقوى
  if (answers.who === 'professionals') satMul *= 0.8;        // الشركات: ألوان أهدأ
  const maxSat = answers.use === 'print' ? 80 : 100;         // الطباعة: نتجنب الألوان الفسفورية
  // الأماكن (سكن وديكور): الجدران والمساحات الكبيرة تحتاج ألواناً أهدأ، وغرفة الأطفال أكثر مرحاً
  if (answers.space) satMul *= answers.space === 'kidsroom' ? 1.15 : answers.space === 'facade' ? 0.7 : 0.85;
  if (answers.use === 'walls') satMul *= 0.85;

  // c = تصنع لوناً مع تطبيق التعديلات السابقة
  const c = (h, s, l) => hslToHex(h, Math.min(s * satMul, maxSat), l);

  // الإحساس (إن اختاره المستخدم) يحدد درجة اللون، وإلا نأخذها من صورة المزاج
  const baseHue = randIn(feeling ? feeling.hue : mood.hue);

  // إذا اختار نظام تناسق: الثلاث بنفس النظام، مع اختلاف بسيط في الدرجة بينها
  if (refine.harmony) {
    const shift = HARMONY_SHIFTS[refine.harmony];
    // 3 نسخ: الأصلية، ونسخة أغمق وأهدأ، ونسخة أفتح وأقوى (حتى لا تتشابه)
    const variants = [
      { d: 0, l: 0, s: 1 },
      { d: rand(12, 25), l: -12, s: 0.8 },
      { d: -rand(12, 25), l: 12, s: 1.2 },
    ];
    return variants.map((v) => ({
      harmony: refine.harmony,
      colors: uniqueColors(template(baseHue + v.d, shift, c).map((hex, i) => {
        if (i < 2) return hex; // الرئيسي والثانوي كما هما
        const x = hexToHsl(hex);
        return hslToHex(x.h, clamp(x.s * v.s, 5, 100), clamp(x.l + v.l, 10, 90));
      })),
    }));
  }
  return HARMONIES.map((harmony) => ({
    harmony: harmony.id,
    colors: uniqueColors(template(baseHue, harmony.shift, c)),
  }));
}

/*
  يصنع 3 لوحات حول ألوان اختارها المستخدم (من 1 إلى 3 ألوان).
  ألوان المستخدم تبقى كما هي، ونضيف حولها ألواناً متناسقة.
*/
function generateAroundColors(bases) {
  const b = hexToHsl(bases[0]);
  const lightBase = bases.find((x) => hexToHsl(x).l > 85);

  return HARMONIES.map((harmony) => {
    const h = b.h + rand(-12, 12); // تغيير بسيط حتى تختلف الاقتراحات في كل مرة
    const main = lightBase || hslToHex(h, Math.min(b.s, 20), 96);   // خلفية فاتحة
    const candidates = [
      hslToHex(h + harmony.shift, clamp(b.s, 45, 85), clamp(b.l, 40, 60)), // لون التمييز
      hslToHex(h, Math.min(b.s, 35), 16),                                   // داكن للنصوص
      hslToHex(h, b.s * 0.6, 75),                                           // درجة فاتحة من لونك
      hslToHex(h + harmony.shift, 30, 80),                                  // لون مساعد ناعم
      hslToHex(h - 30, clamp(b.s, 30, 70), 45),                             // احتياط
    ];
    const colors = [main, ...bases.filter((x) => x !== main)];
    for (const cand of candidates) {
      if (colors.length >= 5) break;
      if (!colors.includes(cand)) colors.push(cand);
    }
    return { harmony: harmony.id, colors: colors.slice(0, 5) };
  });
}

/* يمنع تكرار نفس اللون داخل اللوحة (يعدّل الإضاءة قليلاً إن تكرر) */
function uniqueColors(colors) {
  const out = [];
  for (let col of colors) {
    while (out.includes(col)) {
      const { h, s, l } = hexToHsl(col);
      col = hslToHex(h, s, l > 50 ? l - 6 : l + 6);
    }
    out.push(col);
  }
  return out;
}

/* المسافة بين درجتين على عجلة الألوان (من 0 إلى 180) */
function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/*
  يخمّن أسلوب اللوحة من ألوانها (نحتاجه لاقتراح الخطوط المناسبة).
  هي قواعد بسيطة، وليست ذكاءً اصطناعياً.
*/
function detectStyle(colors) {
  const hsl = colors.map(hexToHsl);
  const main = hsl[0];
  const colorful = hsl.filter((c) => c.l > 10 && c.l < 92);
  const avgSat = colorful.length ? colorful.reduce((sum, c) => sum + c.s, 0) / colorful.length : 0;
  const hasGold = hsl.some((c) => c.h >= 35 && c.h <= 55 && c.s >= 40 && c.l >= 35 && c.l <= 65);
  const warmShare = hsl.filter((c) => (c.h < 95 || c.h > 340) && c.s > 10).length / hsl.length;

  if (main.l < 25 && (hasGold || avgSat < 45)) return 'luxury';
  if (avgSat > 70) return 'bold';
  if (warmShare >= 0.6) return avgSat < 45 ? 'earthy' : 'retro';
  return 'minimal';
}

/* يعرف "عائلة" اللون (نستخدمها لشرح معنى اللون) */
function colorFamily(hex) {
  const { h, s, l } = hexToHsl(hex);
  if ((l >= 92 && s < 60) || (s < 10 && l > 80)) return 'white';
  if (l <= 14) return 'black';
  if (s < 12) return 'gray';
  if (h >= 20 && h < 55 && l >= 72 && s < 60) return 'beige';
  if (h >= 15 && h < 45 && l < 45 && s < 75) return 'brown';
  if (h >= 38 && h < 55 && s >= 40 && l >= 35 && l < 65) return 'gold';
  if (h >= 45 && h < 75 && (l < 45 || s < 35)) return 'green';   // الزيتوني يُحسب من عائلة الأخضر
  if (h < 12 || h >= 345) return 'red';
  if (h < 38) return 'orange';
  if (h < 65) return 'yellow';
  if (h < 160) return 'green';
  if (h < 195) return 'teal';
  if (h < 250) return l < 30 ? 'navy' : 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

/* نوع التناسق في لوحة جاهزة: متقاربة، متباينة، أو مختلطة */
function detectHarmony(colors) {
  const hues = colors.map(hexToHsl).filter((c) => c.s >= 20 && c.l > 12 && c.l < 90).map((c) => c.h);
  if (hues.length < 2) return 'mixed';
  let maxDist = 0;
  for (const a of hues) for (const b of hues) maxDist = Math.max(maxDist, hueDistance(a, b));
  if (maxDist <= 60) return 'analogous';
  if (maxDist >= 120) return 'complementary';
  return 'mixed';
}

/* الألوان الشائعة عند المنافسين في كل مجال */
const INDUSTRY_COLORS = {
  food:      ['#E53935', '#FFC107', '#FB8C00'],
  fashion:   ['#111111', '#F8BBD0', '#D4AF37'],
  tech:      ['#1E88E5', '#5E35B1', '#00BCD4'],
  health:    ['#1976D2', '#43A047', '#26A69A'],
  education: ['#1565C0', '#FB8C00', '#FDD835'],
  finance:   ['#0D47A1', '#2E7D32', '#546E7A'],
  home:      ['#D7C4A3', '#6D4C41', '#9E9E9E'],
  kids:      ['#E53935', '#FDD835', '#1E88E5'],
  creative:  ['#8E24AA', '#EC407A', '#212121'],
};

/*
  يقترح لوناً بعيداً عن ألوان المنافسين على عجلة الألوان.
  نجرب كل الدرجات، ونختار الأبعد عن أقرب لون منافس.
*/
function standoutColor(industry) {
  const taken = (INDUSTRY_COLORS[industry] || [])
    .map(hexToHsl)
    .filter((c) => c.s >= 20)   // نتجاهل الأسود والرمادي
    .map((c) => c.h);
  if (taken.length === 0) return null;
  let bestHue = 0, bestDist = -1;
  for (let h = 0; h < 360; h += 5) {
    const d = Math.min(...taken.map((x) => hueDistance(h, x)));
    if (d > bestDist) { bestDist = d; bestHue = h; }
  }
  return hslToHex(bestHue, 65, 48);
}

/*
  يبحث عن لون من اسمه (بالعربية أو الإنجليزية) أو من كوده.
  مثال: "olive green" أو "أخضر زيتوني" أو "#6B705C"
*/
function findColorByText(text) {
  const hex = normalizeHex(text);
  if (hex) return hex;

  // نوحّد طريقة الكتابة: حروف صغيرة، وبدون تشكيل، وأ/إ/آ = ا، ة = ه، ى = ي
  const clean = (str) => String(str).toLowerCase()
    .replace(/[ً-ْ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const query = clean(text);
  if (!query) return null;

  let best = null, bestLen = 0;
  for (const [key, namedHex] of NAMED_COLORS) {
    for (const lang of Object.keys(TRANSLATIONS)) {
      const name = clean(TRANSLATIONS[lang]['color.' + key]);
      // تطابق كامل = أفضل نتيجة
      if (name === query) return namedHex;
      // الاسم موجود داخل ما كتبه المستخدم (نختار أطول اسم لأنه أدق)
      if (query.includes(name) && name.length > bestLen) { best = namedHex; bestLen = name.length; }
    }
  }
  // إن لم نجد، نجرب العكس: ما كتبه جزء من اسم لون ("زيتو" ← زيتوني)
  if (!best && query.length >= 3) {
    for (const [key, namedHex] of NAMED_COLORS) {
      for (const lang of Object.keys(TRANSLATIONS)) {
        if (clean(TRANSLATIONS[lang]['color.' + key]).includes(query)) return namedHex;
      }
    }
  }
  return best;
}
