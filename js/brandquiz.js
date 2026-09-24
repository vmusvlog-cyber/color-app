/* =========================================================================
   brandquiz.js — أسئلة "ابنِ هويتك البصرية" الـ12 وطريقة تحويل الإجابات إلى ألوان
   أنواع الأسئلة:
     single = جواب واحد (ينتقل فوراً)      multi = أي عدد من الأجوبة ثم "التالي"
     colors = دوائر ملوّنة (مع زر "بدّل")   (النصوص في i18n.js تحت 'bq.*')
   ========================================================================= */

const BRAND_STEPS = [
  { key: 'who', type: 'single', options: ['personal', 'smallbiz', 'company', 'onlinestore', 'freelancer', 'creator', 'nonprofit', 'event'] },
  { key: 'field', type: 'multi', options: ['fashion', 'beauty', 'food', 'cafe', 'bakery', 'tech', 'health', 'fitness', 'medical',
    'education', 'kids', 'realestate', 'decor', 'creative', 'photo', 'finance', 'law', 'retail', 'travel', 'auto', 'events', 'agri'] },
  { key: 'audience', type: 'multi', options: ['youth', 'women', 'men', 'kids', 'families', 'business', 'students', 'seniors', 'luxury', 'everyone'] },
  { key: 'trait', type: 'multi', options: ['trusted', 'luxury', 'modern', 'bold', 'friendly', 'creative', 'calm', 'youthful',
    'natural', 'expert', 'elegant', 'playful', 'minimal', 'warm', 'innovative', 'classic'] },
  { key: 'feeling', type: 'multi', options: ['trust', 'happy', 'calm', 'energy', 'luxury', 'safe', 'curious', 'warm', 'fresh', 'inspired', 'confident', 'nostalgic'] },
  { key: 'use', type: 'multi', options: ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'snapchat', 'website', 'app',
    'shop', 'packaging', 'print', 'signage', 'uniform', 'events'] },
  { key: 'price', type: 'single', options: ['budget', 'mid', 'premium', 'luxury'] },
  { key: 'compete', type: 'single', options: ['standout', 'blend', 'unsure'] },
  { key: 'love', type: 'colors' },
  { key: 'avoid', type: 'colors' },
  { key: 'look', type: 'multi', options: ['solid', 'grad2', 'grad3', 'glass'] },
  { key: 'count', type: 'single', options: ['3', '4', '5', '6'] },
];

/* المجال → مجالات ألوان المنافسين (generator.js) */
const BQ_FIELD_IND = {
  fashion: 'fashion', beauty: 'fashion', food: 'food', cafe: 'food', bakery: 'food', tech: 'tech', health: 'health',
  fitness: 'health', medical: 'health', education: 'education', kids: 'kids', realestate: 'home', decor: 'home',
  creative: 'creative', photo: 'creative', finance: 'finance', law: 'finance', retail: 'fashion', travel: 'creative',
  auto: 'tech', events: 'creative', agri: 'health',
};

/* الصفة → الإحساس + قوة الألوان + الأسلوب */
const BQ_TRAITS = {
  trusted: ['trust', 'calm', 'minimal'], luxury: ['luxury', 'elegant', 'luxury'], modern: ['pro', 'calm', 'minimal'],
  bold: ['energy', 'energetic', 'bold'], friendly: ['joy', 'warm', 'earthy'], creative: ['creative', 'playful', 'bold'],
  calm: ['calm', 'calm', 'minimal'], youthful: ['joy', 'playful', 'bold'], natural: ['nature', 'natural', 'earthy'],
  expert: ['pro', 'elegant', 'minimal'], elegant: ['luxury', 'elegant', 'minimal'], playful: ['joy', 'playful', 'bold'],
  minimal: ['calm', 'calm', 'minimal'], warm: ['warm', 'warm', 'earthy'], innovative: ['creative', 'energetic', 'bold'],
  classic: ['trust', 'elegant', 'retro'],
};

/* الإحساس بعد التعامل معك → الإحساس في لوحة "دقّق" */
const BQ_FEELINGS = {
  trust: 'trust', happy: 'joy', calm: 'calm', energy: 'energy', luxury: 'luxury', safe: 'trust', curious: 'creative',
  warm: 'warm', fresh: 'health', inspired: 'creative', confident: 'pro', nostalgic: 'warm',
};

/* مستوى الأسعار → أسلوب */
const BQ_PRICE_STYLE = { budget: 'bold', mid: 'minimal', premium: 'minimal', luxury: 'luxury' };

/* ألوان الدوائر: 16 تظهر أولاً (لون من كل عائلة)، والباقي بدائل لزر "بدّل" */
const BQ_SWATCHES = [
  '#E53935', '#FB8C00', '#FDD835', '#43A047', '#6B7B3A', '#00A6A6', '#1E88E5', '#1B2A4A',
  '#8E24AA', '#EC407A', '#795548', '#E8D8B8', '#C9A227', '#9E9E9E', '#1A1A1A', '#FFFFFF',
  // بدائل
  '#B71C1C', '#FF7043', '#FFB300', '#7CB342', '#2E7D32', '#26A69A', '#4FC3F7', '#3949AB', '#5E35B1', '#BA68C8',
  '#F48FB1', '#D81B60', '#A1887F', '#5D4037', '#F5E6CC', '#B8860B', '#607D8B', '#CFD8DC', '#FF8A65', '#AED581',
  '#80DEEA', '#90CAF9', '#CE93D8', '#FFCC80', '#E6EE9C', '#004D40', '#880E4F', '#263238', '#FFE082', '#C5E1A5',
];

/* أكثر قيمة تكراراً في قائمة (عند التعادل: أولها) */
function mostCommon(list) {
  const count = {};
  list.forEach((v) => { count[v] = (count[v] || 0) + 1; });
  return list.reduce((best, v) => (count[v] > (count[best] || 0) ? v : best), list[0]);
}

/* يحوّل كل الإجابات إلى "ملف" للألوان */
function brandProfile(a) {
  const traits = (a.trait || []).map((x) => BQ_TRAITS[x]).filter(Boolean);
  const feels = [...(a.feeling || []).map((x) => BQ_FEELINGS[x]), ...traits.map((x) => x[0])].filter(Boolean);
  const styles = [...traits.map((x) => x[2]), BQ_PRICE_STYLE[a.price]].filter(Boolean);
  const moods = traits.map((x) => x[1]);
  const audience = a.audience || [];
  const use = a.use || [];
  // قوة الألوان حسب الجمهور: الأطفال والشباب أقوى، والشركات وكبار السن أهدأ
  let sat = '';
  if (audience.some((x) => ['kids', 'youth'].includes(x))) sat = 'vivid';
  if (audience.some((x) => ['business', 'seniors', 'luxury'].includes(x)) && !sat) sat = 'soft';
  return {
    feel: feels.length ? mostCommon(feels) : '',
    style: a.price === 'luxury' ? 'luxury' : styles.length ? mostCommon(styles) : 'minimal',
    mood: moods.length ? mostCommon(moods) : 'calm',
    ind: BQ_FIELD_IND[(a.field || [])[0]] || '',
    sat,
    // اللافتات والمطبوعات تحتاج تبايناً أوضح
    contrast: use.some((x) => ['signage', 'print', 'events'].includes(x)) ? 'clear' : '',
    count: Number(a.count) || 5,
  };
}

/* يصنع 3 لوحات من الإجابات، ثم يطبّق: المنافسين، الألوان المحبوبة والممنوعة، والعدد */
function brandOptionsFromAnswers(a) {
  const p = brandProfile(a);
  const temp = state.refine.temp; // زر حار/بارد في الأعلى يُحترم
  const refine = { ...defaultRefine(), temp, sat: p.sat, contrast: p.contrast,
    feel: p.feel && feelingsFor(temp).includes(p.feel) ? p.feel : '' };
  const avoid = (a.avoid || []).map(colorFamily);
  const love = a.love || [];
  const standout = a.compete === 'standout' && p.ind ? standoutColor(p.ind) : null;

  const list = generateFromAnswers({ industry: p.ind, mood: p.mood, style: p.style }, refine)
    .map((o) => applyRefine(o.colors, refine, [], { skipFeeling: true, style: p.style }));

  return {
    style: p.style,
    options: list.map((colors, i) => {
      let out = [...colors];
      // "أريد أن أتميّز": اللون الرئيسي بدرجة بعيدة عن ألوان المنافسين
      if (standout) {
        const m = hexToHsl(out[1]);
        out[1] = hslToHex(hexToHsl(standout).h, Math.max(m.s, 45), m.l);
      }
      // الألوان المحبوبة: في كل لوحة بمكان مختلف (رئيسي، تمييز، مساعد) حتى تتنوع
      love.forEach((hex, j) => {
        const slot = [1, 2, 4][(i + j) % 3];
        out[slot] = hex;
      });
      // الألوان الممنوعة: ندوّر درجة اللون حتى يخرج من العائلة الممنوعة
      out = out.map((hex) => (love.includes(hex) ? hex : avoidFamilies(hex, avoid)));
      return fitCount(uniqueColors(out), p.count);
    }),
  };
}

/* يغيّر اللون حتى لا يكون من العائلات الممنوعة */
function avoidFamilies(hex, avoid) {
  if (!avoid.length) return hex;
  let c = hexToHsl(hex);
  for (let i = 0; i < 12 && avoid.includes(colorFamily(hslToHex(c.h, c.s, c.l))); i++) {
    // الأبيض والأسود والرمادي: نلوّنها قليلاً، والملوّن: ندوّر الدرجة
    if (c.s < 15) c = { h: c.h + 25, s: 25, l: clamp(c.l, 18, 90) };
    else c = { ...c, h: c.h + 35 };
  }
  return hslToHex(c.h, c.s, c.l);
}

/* عدد الألوان الذي اختاره (3 إلى 6) */
function fitCount(colors, n) {
  const out = colors.slice(0, n);
  while (out.length < n) {
    const m = hexToHsl(out[1] || out[0]);
    out.push(hslToHex(m.h + 30 * out.length, clamp(m.s * 0.7, 20, 70), out.length % 2 ? 75 : 40));
  }
  return out;
}

/* ---------- الدوائر الملوّنة (مع "بدّل") ---------- */

/* الألوان الظاهرة الآن في سؤال (أول مرة: أول 16) */
function swatchesShown(b, key) {
  if (!b.shown[key]) b.shown[key] = BQ_SWATCHES.slice(0, 16);
  return b.shown[key];
}

/* لون بديل ليس ظاهراً الآن */
function nextSwatch(shown) {
  const pool = BQ_SWATCHES.filter((c) => !shown.includes(c));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : randomNiceColor();
}

/*
  حركة "بدّل": الدائرة القديمة تنزلق للأعلى وتختفي، والجديدة تصعد من الأسفل.
  el = العنصر الملوّن، setColor = دالة تضع اللون الجديد (تُستدعى في منتصف الحركة)
*/
function slideSwap(el, setColor) {
  el.classList.add('swap-out');
  setTimeout(() => {
    setColor();
    el.classList.remove('swap-out');
    el.classList.add('swap-in');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('swap-in')));
  }, 220);
}
