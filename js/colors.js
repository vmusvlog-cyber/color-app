/* =========================================================================
   colors.js — أدوات الألوان
   - التحويل بين صيغة HEX (مثل #3A86FF) وصيغة HSL (درجة/تشبّع/إضاءة)
   - إيجاد أقرب اسم للون
   - توليد ألوان عشوائية جميلة، وتوليد بديل متناسق للون
   ========================================================================= */

/* قائمة الألوان المعروفة: [مفتاح الاسم في ملف الترجمة، كود اللون] */
const NAMED_COLORS = [
  ['white', '#FFFFFF'], ['offwhite', '#F5F5F0'], ['ivory', '#FFFFF0'], ['cream', '#F5F0E1'],
  ['beige', '#E8DCC4'], ['sand', '#D4B996'], ['tan', '#C8A27A'], ['camel', '#B5835A'],
  ['caramel', '#C68E4E'], ['brown', '#7B4B2A'], ['chocolate', '#4E2E1E'], ['coffee', '#5C4033'],
  ['black', '#111111'], ['charcoal', '#333333'], ['darkgray', '#555555'], ['gray', '#8D8D8D'],
  ['silver', '#C0C0C0'], ['lightgray', '#DCDCDC'], ['navy', '#1D3557'], ['midnight', '#0B1D3A'],
  ['royalblue', '#0047AB'], ['blue', '#3A86FF'], ['skyblue', '#87CEEB'], ['babyblue', '#A8DADC'],
  ['teal', '#2F6F73'], ['turquoise', '#00B4B4'], ['cyan', '#00E5FF'], ['mint', '#A8E6CF'],
  ['sage', '#9CAF88'], ['olive', '#6B705C'], ['olivegreen', '#556B2F'], ['moss', '#8A9A5B'],
  ['forest', '#2E5A3C'], ['emerald', '#1E7D5A'], ['green', '#4CAF50'], ['lime', '#A4DE02'],
  ['neongreen', '#39FF14'], ['yellow', '#FFD23F'], ['mustard', '#E3B448'], ['gold', '#C9A227'],
  ['orange', '#FF8C42'], ['burntorange', '#D9822B'], ['terracotta', '#C66B3D'], ['rust', '#A0522D'],
  ['coral', '#FF6F61'], ['peach', '#F4B393'], ['salmon', '#E8907A'], ['pink', '#FF8FAB'],
  ['hotpink', '#FF2E88'], ['rose', '#D98E9A'], ['red', '#E63946'], ['crimson', '#C8102E'],
  ['burgundy', '#5E1224'], ['wine', '#722F37'], ['maroon', '#7A2E2E'], ['purple', '#7209B7'],
  ['lavender', '#B8A9E0'], ['plum', '#6A3E6E'], ['mauve', '#9C6B6B'], ['dustyblue', '#6C8A94'],
  ['slate', '#475569'], ['stone', '#A89F91'], ['taupe', '#8B7D6B'], ['darkgreen', '#1E3A2B'],
];

/* يحوّل "#3a86ff" أو "3A86FF" إلى صيغة موحدة "#3A86FF" (أو null إن كان غير صالح) */
function normalizeHex(value) {
  let hex = String(value).trim().replace('#', '').toUpperCase();
  if (/^[0-9A-F]{3}$/.test(hex)) hex = hex.split('').map((c) => c + c).join(''); // F0A → FF00AA
  return /^[0-9A-F]{6}$/.test(hex) ? '#' + hex : null;
}

/* HEX → {r, g, b} بقيم من 0 إلى 255 */
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* HEX → {h, s, l}   (h من 0 إلى 360، و s و l من 0 إلى 100) */
function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/* {h, s, l} → HEX */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;           // نُبقي الدرجة بين 0 و 360
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return ('#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4))).toUpperCase();
}

/* يحصر رقماً بين حدّين */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/* رقم عشوائي بين min و max */
function rand(min, max) {
  return min + Math.random() * (max - min);
}

/* هل اللون فاتح؟ (نستخدمها لنختار كتابة سوداء أو بيضاء فوقه) */
function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/* يرجع اسم أقرب لون معروف باللغة الحالية */
function colorName(hex) {
  const c = hexToRgb(hex);
  let bestKey = 'gray', bestDist = Infinity;
  for (const [key, namedHex] of NAMED_COLORS) {
    const n = hexToRgb(namedHex);
    // مسافة بسيطة بين لونين (العين أحسّ بالأخضر، لذلك وزنه أكبر)
    const dist = 2 * (c.r - n.r) ** 2 + 4 * (c.g - n.g) ** 2 + 3 * (c.b - n.b) ** 2;
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  }
  return t('color.' + bestKey);
}

/* لون عشوائي "لطيف": لا باهت جداً ولا صارخ جداً */
function randomNiceColor() {
  return hslToHex(rand(0, 360), rand(30, 75), rand(30, 80));
}

/**
 * يولّد بديلاً متناسقاً للون رقم index داخل اللوحة.
 * الفكرة: نأخذ اللون الحالي ونغيّره قليلاً بإحدى ثلاث طرق،
 * حتى يبقى قريباً من روح اللوحة ولا يصبح غريباً عنها.
 */
function regenerateColor(palette, index) {
  const current = hexToHsl(palette[index]);
  const main = hexToHsl(palette[0]);

  const ways = [
    // 1) تحريك الدرجة قليلاً (مثلاً من أزرق إلى أزرق مخضر)
    () => hslToHex(current.h + rand(15, 35) * (Math.random() < 0.5 ? -1 : 1), current.s, current.l),
    // 2) تغيير التشبّع والإضاءة مع إبقاء نفس الدرجة
    () => hslToHex(current.h, current.s + rand(-20, 20), current.l + rand(-15, 15)),
    // 3) لون متناسق مع اللون الأساسي (مجاور أو مكمّل له في عجلة الألوان)
    () => {
      const steps = [30, -30, 150, 180, 210];
      const shift = steps[Math.floor(Math.random() * steps.length)];
      return hslToHex(main.h + shift, Math.max(current.s, 25), current.l);
    },
  ];

  // اللون الأساسي (الخلفية) نغيّره بلطف فقط، حتى لا تتغير اللوحة كلها
  const choices = index === 0 ? ways.slice(0, 2) : ways;
  let next = palette[index];
  // نحاول عدة مرات حتى نحصل على لون مختلف فعلاً وغير مكرر
  for (let i = 0; i < 10 && (next === palette[index] || palette.includes(next)); i++) {
    next = choices[Math.floor(Math.random() * choices.length)]();
  }
  return next;
}
