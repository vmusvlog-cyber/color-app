/* =========================================================================
   variants.js — نسخ مختلفة من نفس اللوحة
   - نسخة داكنة (Dark mode)
   - نسخة للطباعة + قيم CMYK
   - تدرجات لونية
   - ملاحظات الثقافة وتعديل الألوان لجمهور بلد معين
   ========================================================================= */

/*
  النسخة الداكنة: نقلب أدوار الإضاءة.
  الخلفية تصبح داكنة جداً من نفس درجة اللون، والثانوي (النصوص) يصبح فاتحاً،
  ولون التمييز يصبح أوضح قليلاً حتى يلمع على الخلفية الداكنة.
*/
function darkPalette(colors) {
  return colors.map((hex, i) => {
    const { h, s, l } = hexToHsl(hex);
    if (i === 0) return hslToHex(h, Math.min(Math.max(s, 12), 30), 11);   // خلفية داكنة
    if (i === 1) return hslToHex(h, Math.min(s, 25), 90);                 // نص فاتح
    if (i === 2) return hslToHex(h, Math.max(s, 50), clamp(l, 55, 68));   // تمييز أوضح
    return hslToHex(h, s * 0.85, clamp(100 - l, 25, 75));                 // الباقي: إضاءة معكوسة
  });
}

/*
  نسخة للطباعة: الحبر لا يستطيع إظهار الألوان الفسفورية القوية جداً،
  لذلك نخفف التشبّع العالي، ونتجنب البياض الناصع جداً في الألوان الملونة.
*/
function printPalette(colors) {
  return colors.map((hex) => {
    const { h, s, l } = hexToHsl(hex);
    let s2 = s, l2 = l;
    if (s > 75) s2 = 75 + (s - 75) * 0.3;   // نخفف الألوان الزاهية جداً
    if (s2 > 60 && l > 60) l2 = l - 5;      // والفاتحة الزاهية نغمّقها قليلاً
    return hslToHex(h, s2, l2);
  });
}

/* تحويل تقريبي من ألوان الشاشة (RGB) إلى ألوان الحبر (CMYK) */
function toCmyk(hex) {
  const { r, g, b } = hexToRgb(hex);
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const f = (v) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100);
  return { c: f(r), m: f(g), y: f(b), k: Math.round(k * 100) };
}

/* تدرجات جاهزة من ألوان اللوحة (كل تدرج = كود CSS يمكن نسخه) */
function paletteGradients(colors) {
  const c = (i) => colors[i % colors.length];
  return [
    `linear-gradient(135deg, ${c(0)}, ${c(1)})`,
    `linear-gradient(135deg, ${c(1)}, ${c(2)})`,
    `linear-gradient(90deg, ${c(2)}, ${c(3)})`,
    `linear-gradient(160deg, ${c(0)} 0%, ${c(2)} 50%, ${c(1)} 100%)`,
    `radial-gradient(circle at 30% 30%, ${c(2)}, ${c(1)})`,
    `linear-gradient(45deg, ${c(3)}, ${c(0)})`,
  ];
}

/*
  الثقافات: لكل منطقة ألوان "مناسبة" وألوان "انتبه".
  good / caution = عائلات ألوان (من colorFamily في generator.js)
  نص الملاحظة في ملف الترجمة: 'cn.' + المنطقة + '.' + العائلة
*/
const CULTURES = {
  arab:  { good: ['green', 'gold', 'blue'], caution: [] },
  china: { good: ['red', 'gold', 'yellow'], caution: ['white', 'green'] },
  india: { good: ['orange', 'red', 'yellow', 'green'], caution: ['black'] },
  japan: { good: ['red', 'navy', 'purple', 'white'], caution: [] },
  latam: { good: ['red', 'green', 'yellow'], caution: ['purple'] },
  west:  { good: ['blue', 'green', 'black'], caution: [] },
};

/* درجة لون (hue) تمثل كل عائلة، لنستبدل بها الألوان "الحساسة" */
const FAMILY_HUES = { red: 0, orange: 28, gold: 45, yellow: 50, green: 130, teal: 180, blue: 215, navy: 220, purple: 275, pink: 330 };

/* ملاحظات الثقافة على ألوان اللوحة: [{ hex, type: 'good'|'caution', key }] */
function cultureNotes(colors, culture) {
  const data = CULTURES[culture];
  const notes = [];
  const seen = new Set();
  colors.forEach((hex) => {
    const fam = colorFamily(hex);
    if (seen.has(fam)) return;
    seen.add(fam);
    if (data.caution.includes(fam)) notes.push({ hex, type: 'caution', key: 'cn.' + culture + '.' + fam });
    else if (data.good.includes(fam)) notes.push({ hex, type: 'good', key: 'cn.' + culture + '.' + fam });
  });
  return notes;
}

/*
  يعدّل الألوان "الحساسة" لهذا الجمهور:
  نحرّك درجة اللون نحو لون محبوب في تلك الثقافة، مع إبقاء قوته وإضاءته.
  الخلفية (المكان الأول) والأبيض والأسود والرمادي لا نغيّرها،
  لأنها محايدة ونكتفي بالملاحظة عليها.
*/
function cultureAdjust(colors, culture) {
  const data = CULTURES[culture];
  const target = data.good.find((f) => FAMILY_HUES[f] !== undefined);
  let changed = false;
  const result = colors.map((hex, i) => {
    const fam = colorFamily(hex);
    if (i === 0 || !data.caution.includes(fam) || FAMILY_HUES[fam] === undefined || !target) return hex;
    const { s, l } = hexToHsl(hex);
    changed = true;
    return hslToHex(FAMILY_HUES[target], s, l);
  });
  return changed ? result : null; // null = لا يوجد ما يُعدَّل
}
