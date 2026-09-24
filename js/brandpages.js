/* =========================================================================
   brandpages.js — رسم صفحات "دليل الهوية" الـ12 على لوحات رسم (canvas)
   كل صفحة بحجم A4 (بضعف الدقة)، ثم تتحول كلها إلى ملف PDF واحد (download.js).
   الرسم كله بألوان العميل وخطّيه واسمه ومعلوماته.

   ترتيب الألوان في اللوحة: [0] خلفية فاتحة [1] رئيسي [2] تمييز [3] داكن [4] مساعد
   ========================================================================= */

const PAGE_W = 1190;  // A4 = 595 × 842 نقطة، ونرسم بضعف الدقة
const PAGE_H = 1684;
const PAGE_M = 90;    // الهامش
const HAS_AR = /[؀-ۿ]/;

/* يرسم كل الصفحات ويرجعها قائمة لوحات رسم */
async function drawBrandPages(kit, prompts) {
  const k = brandDrawKit(kit);
  await waitForFonts([k.head, k.body, k.enHead, k.enBody]);
  const pages = [pageCover, pageLogo, pageColors, pageFonts, pageCard, pageStationery,
    pageSignature, pageInstagram, pageFacebook, pageVideo, pageWebsite, pagePrompts];
  return pages.map((draw, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    if (i > 0) pageFrame(ctx, k, i + 1);
    draw(ctx, k, prompts);
    return canvas;
  });
}

/* ينتظر تحميل الخطوط (حتى 4 ثوانٍ) لأن لوحة الرسم لا تنتظرها وحدها */
function waitForFonts(fonts) {
  const loads = [...new Set(fonts)].flatMap((f) => [`400 40px "${f}"`, `700 40px "${f}"`]
    .map((spec) => document.fonts.load(spec, 'Aa أب').catch(() => null)));
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 4000))]);
}

/* نجهز الألوان والخطوط والنصوص مرة واحدة */
function brandDrawKit(kit) {
  const c = kit.colors;
  const byLum = [...c].sort((a, b) => luminance(a) - luminance(b));
  const ar = kit.lang === 'ar';
  const fonts = ar ? kit.pair.ar : kit.pair.en;
  return {
    ...kit, ar,
    bg: c[0], main: c[1], accent: c[2] || c[1], support: c[4] || c[0],
    dark: luminance(byLum[0]) < 0.08 ? byLum[0] : '#1C1C1E',   // أغمق لون للنصوص
    light: luminance(byLum[byLum.length - 1]) > 0.8 ? byLum[byLum.length - 1] : '#FFFFFF',
    head: fonts[0], body: fonts[1], enHead: kit.pair.en[0], enBody: kit.pair.en[1],
    name: kit.info.name,
    initials: brandInitials(kit.info.name),
    // سطر التواصل: الموجود فقط
    contacts: ['phone', 'email', 'web'].map((f) => kit.info[f]).filter(Boolean),
    socials: ['instagram', 'tiktok', 'linkedin', 'facebook', 'youtube']
      .filter((f) => kit.info[f]).map((f) => ({ f, v: handle(kit.info[f]) })),
  };
}

/* الحرفان الأولان من الاسم (أو من أول كلمتين) */
function brandInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : [...(words[0] || 'B')].slice(0, 2).join('');
  return HAS_AR.test(letters) ? letters : letters.toUpperCase();
}

/* الحساب يظهر دائماً بـ @ (إلا إن كان رابطاً) */
function handle(v) {
  return /^https?:|\./.test(v) || v.startsWith('@') ? v : '@' + v;
}

/* لون كتابة واضح فوق خلفية */
function onColor(k, bg) {
  return readableOn(bg, k.colors);
}

/* ---------- أدوات الكتابة ---------- */
function setFont(ctx, size, family, weight = 400) {
  const w = SINGLE_WEIGHT_FONTS.includes(family) ? 400 : weight;
  ctx.font = `${w} ${size}px "${family}", "Tajawal", "Inter", sans-serif`;
}

/*
  يكتب نصاً (بسطر واحد أو عدة أسطر).
  align: 'left' | 'right' | 'center'. العربي يُكتب من اليمين تلقائياً.
  يرجع مكان y بعد آخر سطر.
*/
function drawText(ctx, text, x, y, o) {
  if (!text) return y;
  const { size = 28, font, weight = 400, color = '#111', align = 'left', maxW = 0, lineH = size * 1.4, maxLines = 99, baseline = 'alphabetic', dir } = o;
  setFont(ctx, size, font, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  // الاتجاه: من النص نفسه (العربي من اليمين)، إلا إذا حددناه (مثل الأوامر الإنجليزية)
  ctx.direction = dir || (HAS_AR.test(text) ? 'rtl' : 'ltr');
  const lines = maxW ? wrapLines(ctx, String(text), maxW).slice(0, maxLines) : [String(text)];
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineH));
  ctx.direction = 'ltr';
  return y + lines.length * lineH;
}

function wrapLines(ctx, text, maxW) {
  const out = [];
  text.split('\n').forEach((para) => {
    let line = '';
    para.split(/\s+/).forEach((word) => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    });
    out.push(line);
  });
  return out;
}

/* أكبر حجم خط (حتى max) يجعل النص يتسع في العرض المتاح */
function fitSize(ctx, text, font, weight, maxW, max) {
  let size = max;
  setFont(ctx, size, font, weight);
  while (size > 14 && ctx.measureText(text).width > maxW) {
    size -= 2;
    setFont(ctx, size, font, weight);
  }
  return size;
}

/* مستطيل بزوايا دائرية (مع ظل اختياري) */
function box(ctx, x, y, w, h, r, fill, shadow = false) {
  ctx.save();
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; }
  ctx.fillStyle = fill;
  roundedRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function circle(ctx, cx, cy, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/* شريط الألوان */
function paletteStrip(ctx, colors, x, y, w, h) {
  const cw = w / colors.length;
  colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * cw, y, cw + 1, h); });
}

/*
  يلوّن مساحة حسب "شكل الألوان" الذي اختاره العميل:
    solid = لون صافٍ، grad2 = تدرج لونين، grad3 = تدرج 3 ألوان، glass = دوائر شفافة خلف المحتوى
  i = رقم المساحة، حتى تتنوع الأشكال إن اختار أكثر من شكل.
  يرجع لون الكتابة الأوضح فوق هذه المساحة.
*/
function paintArea(ctx, k, x, y, w, h, r, i = 0, shadow = false) {
  const effect = k.effects[i % k.effects.length];
  let stops = [k.main];
  let fill = k.main;
  if (effect === 'grad2' || effect === 'grad3') {
    stops = effect === 'grad2' ? [k.main, k.accent] : [k.main, k.accent, k.support];
    fill = ctx.createLinearGradient(x, y, x + w, y + h);
    stops.forEach((c, j) => fill.addColorStop(j / (stops.length - 1), c));
  }
  box(ctx, x, y, w, h, r, fill, shadow);
  if (effect === 'glass') {
    // دوائر شفافة بألوان اللوحة خلف المحتوى
    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.globalAlpha = 0.35;
    circle(ctx, x + w * 0.85, y + h * 0.18, Math.min(w, h) * 0.42, k.accent);
    circle(ctx, x + w * 0.12, y + h * 0.9, Math.min(w, h) * 0.36, k.light);
    ctx.globalAlpha = 0.25;
    circle(ctx, x + w * 0.55, y + h * 0.6, Math.min(w, h) * 0.22, k.support);
    ctx.restore();
  }
  return inkFor(k, stops);
}

/* لون كتابة يُقرأ فوق كل ألوان التدرج */
function inkFor(k, stops) {
  const candidates = [k.light, k.dark, '#FFFFFF', '#111111'];
  let best = candidates[0], bestScore = 0;
  candidates.forEach((ink) => {
    const score = Math.min(...stops.map((c) => contrastRatio(ink, c)));
    if (score > bestScore) { bestScore = score; best = ink; }
  });
  return best;
}

/* الشعار الكامل: الاسم بخط العناوين (يصغر حتى يتسع) */
function wordmark(ctx, k, cx, cy, maxW, max, color) {
  const size = fitSize(ctx, k.name, k.head, 700, maxW, max);
  drawText(ctx, k.name, cx, cy, { size, font: k.head, weight: 700, color, align: 'center', baseline: 'middle' });
  return size;
}

/* الشعار المختصر: الحرفان داخل دائرة */
function monogram(ctx, k, cx, cy, r, fill, color) {
  circle(ctx, cx, cy, r, fill);
  const size = fitSize(ctx, k.initials, k.head, 700, r * 1.35, r * 0.95);
  drawText(ctx, k.initials, cx, cy + size * 0.05, { size, font: k.head, weight: 700, color, align: 'center', baseline: 'middle' });
}

/* علامة الحرف الواحد: مربع دائري فيه أول حرف */
function letterMark(ctx, k, cx, cy, s, fill, color) {
  box(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.24, fill);
  const letter = [...k.initials][0];
  drawText(ctx, letter, cx, cy + s * 0.03, { size: s * 0.58, font: k.head, weight: 700, color, align: 'center', baseline: 'middle' });
}

/* نص الصفحة: من اليمين في العربي ومن اليسار في الإنجليزي */
function sideX(k, left = PAGE_M) { return k.ar ? PAGE_W - left : left; }
function sideAlign(k) { return k.ar ? 'right' : 'left'; }

/* إطار الصفحات (ما عدا الغلاف): رقم الصفحة، العنوان، اسم البراند، شريط الألوان في الأسفل */
function pageFrame(ctx, k, n) {
  const num = String(n).padStart(2, '0');
  drawText(ctx, num, sideX(k), 130, { size: 30, font: k.enHead, weight: 700, color: k.main, align: sideAlign(k) });
  drawText(ctx, t('brand.pageName.' + n), sideX(k), 190, { size: 52, font: k.head, weight: 700, color: k.dark, align: sideAlign(k) });
  drawText(ctx, k.name, k.ar ? PAGE_M : PAGE_W - PAGE_M, 130, { size: 24, font: k.head, weight: 700, color: '#8A8A8E', align: k.ar ? 'left' : 'right' });
  paletteStrip(ctx, k.colors, k.ar ? PAGE_W - PAGE_M - 110 : PAGE_M, 220, 110, 8);
  paletteStrip(ctx, k.colors, 0, PAGE_H - 18, PAGE_W, 18);
}

/* عنوان صغير داخل الصفحة */
function label(ctx, k, text, y, x) {
  return drawText(ctx, text, x === undefined ? sideX(k) : x, y, { size: 24, font: k.body, weight: 700, color: '#6B6B70', align: x === undefined ? sideAlign(k) : 'center' });
}

/* ============================ الصفحات ============================ */

/* 1) الغلاف */
function pageCover(ctx, k) {
  const ink = paintArea(ctx, k, 0, 0, PAGE_W, PAGE_H - 220, 0, 0);
  drawText(ctx, t('brand.guideName'), PAGE_W / 2, 200, { size: 30, font: k.body, weight: 700, color: ink, align: 'center' });
  monogram(ctx, k, PAGE_W / 2, 560, 130, k.light, k.main);
  wordmark(ctx, k, PAGE_W / 2, 820, PAGE_W - 2 * PAGE_M, 130, ink);
  drawText(ctx, k.info.desc, PAGE_W / 2, 960, { size: 34, font: k.body, color: ink, align: 'center', maxW: PAGE_W - 3 * PAGE_M, lineH: 52, maxLines: 5 });
  paletteStrip(ctx, k.colors, 0, PAGE_H - 220, PAGE_W, 220);
}

/* 2) الشعار: 3 أشكال على خلفية فاتحة ثم داكنة */
function pageLogo(ctx, k) {
  const gap = 30, w = (PAGE_W - 2 * PAGE_M - 2 * gap) / 3, h = 330;
  const rows = [
    { y: 320, bg: k.light, border: true },
    { y: 320 + h + 110, bg: k.dark },
  ];
  rows.forEach((row) => {
    const ink = row.bg === k.dark ? k.light : k.dark;
    const mark = row.bg === k.dark ? k.accent : k.main;
    [0, 1, 2].forEach((i) => {
      const x = PAGE_M + i * (w + gap);
      box(ctx, x, row.y, w, h, 24, row.bg);
      if (row.border) { ctx.strokeStyle = '#E5E5EA'; ctx.lineWidth = 2; roundedRect(ctx, x, row.y, w, h, 24); ctx.stroke(); }
      const cx = x + w / 2, cy = row.y + h / 2;
      if (i === 0) wordmark(ctx, k, cx, cy, w - 50, 64, ink);
      if (i === 1) monogram(ctx, k, cx, cy, 90, mark, onColor(k, mark));
      if (i === 2) letterMark(ctx, k, cx, cy, 170, mark, onColor(k, mark));
    });
  });
  ['full', 'short', 'mark'].forEach((key, i) => label(ctx, k, t('brand.logo.' + key), 320 + h + 50, PAGE_M + i * (w + gap) + w / 2));
  let y = 320 + 2 * h + 200;
  drawText(ctx, t('brand.logo.rules'), sideX(k), y, { size: 30, font: k.head, weight: 700, color: k.dark, align: sideAlign(k) });
  ['1', '2', '3', '4'].forEach((n) => {
    y = drawText(ctx, '— ' + t('brand.logo.rule' + n), sideX(k), y + 60, { size: 26, font: k.body, color: '#3A3A3C', align: sideAlign(k), maxW: PAGE_W - 2 * PAGE_M, lineH: 38 }) - 38;
  });
}

/* 3) الألوان: كل لون مع أكواده واستخدامه */
function pageColors(ctx, k) {
  const n = k.colors.length;
  const rowH = Math.min(230, (PAGE_H - 330 - 120) / n);
  k.colors.forEach((c, i) => {
    const y = 300 + i * rowH;
    const sw = 340;
    const sx = k.ar ? PAGE_W - PAGE_M - sw : PAGE_M;
    box(ctx, sx, y, sw, rowH - 30, 20, c);
    if (luminance(c) > 0.85) { ctx.strokeStyle = '#E5E5EA'; ctx.lineWidth = 2; roundedRect(ctx, sx, y, sw, rowH - 30, 20); ctx.stroke(); }
    const tx = k.ar ? sx - 40 : sx + sw + 40;
    const al = sideAlign(k);
    const rgb = hexToRgb(c), cm = toCmyk(c);
    drawText(ctx, `${brandRole(i)} ${k.ar ? '٪' + brandShare(i, n) : brandShare(i, n) + '%'} · ${colorName(c)}`, tx, y + 40, { size: 32, font: k.head, weight: 700, color: k.dark, align: al });
    drawText(ctx, `HEX ${c}   RGB ${rgb.r} ${rgb.g} ${rgb.b}   CMYK ${cm.c} ${cm.m} ${cm.y} ${cm.k}`, tx, y + 88, { size: 22, font: k.enBody, color: '#3A3A3C', align: al });
    drawText(ctx, t('brand.use.' + Math.min(i, 4)), tx, y + 134, { size: 23, font: k.body, color: '#6B6B70', align: al, maxW: PAGE_W - 2 * PAGE_M - sw - 40, lineH: 32, maxLines: 2 });
  });
}

/* 4) الخطوط: العربي والإنجليزي */
function pageFonts(ctx, k) {
  const block = (y, lang, headF, bodyF, sampleHead, sampleBody) => {
    const x = sideX(k), al = sideAlign(k);
    label(ctx, k, lang, y);
    drawText(ctx, `${t('fonts.heading')}: ${headF}`, x, y + 60, { size: 26, font: k.enBody, weight: 700, color: k.main, align: al });
    drawText(ctx, sampleHead, x, y + 150, { size: 76, font: headF, weight: 700, color: k.dark, align: al, maxW: PAGE_W - 2 * PAGE_M, lineH: 90, maxLines: 1 });
    drawText(ctx, `${t('fonts.body')}: ${bodyF}`, x, y + 230, { size: 26, font: k.enBody, weight: 700, color: k.main, align: al });
    drawText(ctx, sampleBody, x, y + 285, { size: 30, font: bodyF, color: '#3A3A3C', align: al, maxW: PAGE_W - 2 * PAGE_M, lineH: 46, maxLines: 3 });
  };
  const arBody = HAS_AR.test(k.info.desc) ? k.info.desc : 'نص قصير يوضح كيف سيبدو المحتوى للقارئ بهذا الخط الواضح والمريح.';
  const enBody = k.info.desc && !HAS_AR.test(k.info.desc) ? k.info.desc : 'A short line of text showing how your content will look to readers.';
  block(320, t('fonts.arabic'), k.pair.ar[0], k.pair.ar[1], HAS_AR.test(k.name) ? k.name : 'أبجد هوز حطي', arBody);
  block(820, t('fonts.english'), k.pair.en[0], k.pair.en[1], HAS_AR.test(k.name) ? 'Aa Bb Cc 123' : k.name, enBody);
  drawText(ctx, t('brand.fontSizes'), sideX(k), 1360, { size: 26, font: k.body, color: '#6B6B70', align: sideAlign(k), maxW: PAGE_W - 2 * PAGE_M, lineH: 40 });
}

/* بطاقة العمل (وجه وظهر) */
function drawCardFront(ctx, k, x, y, w, h) {
  box(ctx, x, y, w, h, 18, k.main, true);
  const ink = onColor(k, k.main);
  monogram(ctx, k, x + w / 2, y + h * 0.38, h * 0.17, k.light, k.main);
  wordmark(ctx, k, x + w / 2, y + h * 0.7, w * 0.8, h * 0.13, ink);
}
function drawCardBack(ctx, k, x, y, w, h) {
  box(ctx, x, y, w, h, 18, k.light, true);
  ctx.fillStyle = k.accent;
  ctx.fillRect(k.ar ? x + w - 16 : x, y + 40, 16, h - 80);
  const tx = k.ar ? x + w - 60 : x + 60, al = sideAlign(k);
  let ty = y + h * 0.26;
  drawText(ctx, k.info.person || k.name, tx, ty, { size: h * 0.085, font: k.head, weight: 700, color: k.dark, align: al });
  drawText(ctx, k.info.title || (k.info.person ? k.name : ''), tx, ty + h * 0.1, { size: h * 0.052, font: k.body, color: k.main, align: al });
  ty += h * 0.26;
  [...k.contacts, ...k.socials.slice(0, 2).map((s) => s.v)].slice(0, 5).forEach((line, i) => {
    drawText(ctx, line, tx, ty + i * h * 0.095, { size: h * 0.048, font: k.enBody, color: '#3A3A3C', align: al });
  });
}

/* 5) بطاقة العمل */
function pageCard(ctx, k) {
  const w = 900, h = 514, x = (PAGE_W - w) / 2;
  label(ctx, k, t('brand.card.front'), 320);
  drawCardFront(ctx, k, x, 350, w, h);
  label(ctx, k, t('brand.card.back'), 350 + h + 90);
  drawCardBack(ctx, k, x, 350 + h + 120, w, h);
  drawText(ctx, t('brand.card.size'), PAGE_W / 2, 350 + 2 * h + 200, { size: 24, font: k.body, color: '#6B6B70', align: 'center' });
}

/* 6) الورق الرسمي: ورقة رسائل + ظرف */
function pageStationery(ctx, k) {
  const lw = 620, lh = 877, lx = k.ar ? PAGE_W - PAGE_M - lw : PAGE_M, ly = 300;
  box(ctx, lx, ly, lw, lh, 8, '#FFFFFF', true);
  // رأس الورقة: الشعار المختصر والاسم
  const hx = k.ar ? lx + lw - 60 : lx + 60;
  monogram(ctx, k, k.ar ? hx - 36 : hx + 36, ly + 80, 36, k.main, onColor(k, k.main));
  drawText(ctx, k.name, k.ar ? hx - 90 : hx + 90, ly + 92, { size: 30, font: k.head, weight: 700, color: k.dark, align: sideAlign(k) });
  ctx.fillStyle = k.accent;
  ctx.fillRect(lx + 60, ly + 150, lw - 120, 4);
  // أسطر رمادية بدل النص
  ctx.fillStyle = '#E5E5EA';
  for (let i = 0; i < 14; i++) {
    const lwid = (lw - 120) * (i % 4 === 3 ? 0.6 : 1);
    ctx.fillRect(k.ar ? lx + lw - 60 - lwid : lx + 60, ly + 210 + i * 38, lwid, 12);
  }
  // التذييل: التواصل
  ctx.fillStyle = k.main;
  ctx.fillRect(lx, ly + lh - 70, lw, 70);
  drawText(ctx, k.contacts.join('   ') || k.name, lx + lw / 2, ly + lh - 26, { size: 18, font: k.enBody, color: onColor(k, k.main), align: 'center' });

  // الظرف
  const ew = 380, eh = 190, ex = k.ar ? PAGE_M : PAGE_W - PAGE_M - ew, ey = ly + 80;
  box(ctx, ex, ey, ew, eh, 8, k.light, true);
  ctx.strokeStyle = k.support; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + ew / 2, ey + eh * 0.55); ctx.lineTo(ex + ew, ey); ctx.stroke();
  monogram(ctx, k, ex + 50, ey + eh - 50, 26, k.main, onColor(k, k.main));
  drawText(ctx, k.name, ex + 90, ey + eh - 42, { size: 22, font: k.head, weight: 700, color: k.dark, align: 'left' });
  label(ctx, k, t('brand.stationery.letter'), ly + lh + 60, lx + lw / 2);
  label(ctx, k, t('brand.stationery.envelope'), ey + eh + 60, ex + ew / 2);
  // ختم بلون التمييز
  letterMark(ctx, k, ex + ew / 2, ey + eh + 260, 150, k.accent, onColor(k, k.accent));
  label(ctx, k, t('brand.stationery.stamp'), ey + eh + 400, ex + ew / 2);
}

/* 7) الإمضاء (توقيع الإيميل) */
function pageSignature(ctx, k) {
  const x = PAGE_M, y = 300, w = PAGE_W - 2 * PAGE_M, h = 760;
  box(ctx, x, y, w, h, 20, '#FFFFFF', true);
  box(ctx, x, y, w, 70, 20, '#F2F2F7');
  ctx.fillStyle = '#F2F2F7'; ctx.fillRect(x, y + 40, w, 30);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => circle(ctx, x + 40 + i * 30, y + 35, 9, c));
  ctx.fillStyle = '#E5E5EA';
  for (let i = 0; i < 5; i++) ctx.fillRect(x + 60, y + 120 + i * 36, (w - 120) * (i === 4 ? 0.5 : 1), 12);
  // الإمضاء
  const sy = y + 360;
  ctx.fillStyle = k.accent; ctx.fillRect(x + 60, sy, w - 120, 4);
  const mx = k.ar ? x + w - 130 : x + 130;
  monogram(ctx, k, mx, sy + 130, 70, k.main, onColor(k, k.main));
  const tx = k.ar ? mx - 110 : mx + 110, al = sideAlign(k);
  drawText(ctx, k.info.person || k.name, tx, sy + 100, { size: 38, font: k.head, weight: 700, color: k.dark, align: al });
  drawText(ctx, [k.info.title, k.info.person ? k.name : ''].filter(Boolean).join(' · '), tx, sy + 145, { size: 26, font: k.body, color: k.main, align: al });
  drawText(ctx, k.contacts.join('  |  '), tx, sy + 200, { size: 22, font: k.enBody, color: '#3A3A3C', align: al });
  drawText(ctx, k.socials.map((s) => s.v).join('   '), tx, sy + 245, { size: 22, font: k.enBody, weight: 700, color: k.main, align: al });
  paletteStrip(ctx, k.colors, k.ar ? tx - 200 : tx, sy + 280, 200, 10);
  drawText(ctx, t('brand.signature.hint'), PAGE_W / 2, y + h + 80, { size: 24, font: k.body, color: '#6B6B70', align: 'center', maxW: w, lineH: 36 });
}

/* 8) إنستغرام: الملف الشخصي، أغلفة الستوريز المميزة، بوست، ستوري */
function pageInstagram(ctx, k) {
  // رأس الملف الشخصي
  const ax = k.ar ? PAGE_W - PAGE_M - 90 : PAGE_M + 90;
  monogram(ctx, k, ax, 380, 80, k.main, onColor(k, k.main));
  ctx.strokeStyle = k.accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(ax, 380, 92, 0, Math.PI * 2); ctx.stroke();
  const tx = k.ar ? ax - 130 : ax + 130, al = sideAlign(k);
  drawText(ctx, k.name, tx, 360, { size: 38, font: k.head, weight: 700, color: k.dark, align: al });
  drawText(ctx, k.info.desc || t('brand.ig.bio'), tx, 405, { size: 22, font: k.body, color: '#3A3A3C', align: al, maxW: 720, lineH: 32, maxLines: 2 });

  // أغلفة الستوريز المميزة: 5 دوائر بألوان اللوحة
  label(ctx, k, t('brand.ig.highlights'), 540);
  const fills = [k.main, k.accent, k.dark, k.support, k.main];
  [1, 2, 3, 4, 5].forEach((n, i) => {
    const cx = PAGE_M + 90 + i * ((PAGE_W - 2 * PAGE_M - 180) / 4);
    const pos = k.ar ? PAGE_W - cx : cx;
    ctx.strokeStyle = '#D1D1D6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(pos, 660, 86, 0, Math.PI * 2); ctx.stroke();
    // مع التدرج: كل دائرة تدرج من لونها إلى لون التمييز
    if (k.effects.some((e) => e.startsWith('grad'))) {
      const g = ctx.createLinearGradient(pos - 78, 582, pos + 78, 738);
      g.addColorStop(0, fills[i]); g.addColorStop(1, fills[i] === k.accent ? k.main : k.accent);
      circle(ctx, pos, 660, 78, g);
    } else circle(ctx, pos, 660, 78, fills[i]);
    const word = t('brand.hl.' + n);
    const size = fitSize(ctx, word, k.head, 700, 120, 30);
    drawText(ctx, word, pos, 662, { size, font: k.head, weight: 700, color: onColor(k, fills[i]), align: 'center', baseline: 'middle' });
    drawText(ctx, word, pos, 790, { size: 22, font: k.body, color: '#3A3A3C', align: 'center' });
  });

  // بوست مربع + ستوري
  const py = 880, ps = 560;
  const postX = k.ar ? PAGE_W - PAGE_M - ps : PAGE_M;
  const ink = paintArea(ctx, k, postX, py, ps, ps, 16, 0, true);
  drawText(ctx, k.info.desc || k.name, postX + ps / 2, py + 170, { size: 40, font: k.head, weight: 700, color: ink, align: 'center', maxW: ps - 90, lineH: 56, maxLines: 5 });
  box(ctx, postX + ps / 2 - 110, py + ps - 130, 220, 64, 32, k.accent);
  drawText(ctx, t('brand.ig.cta'), postX + ps / 2, py + ps - 90, { size: 24, font: k.body, weight: 700, color: onColor(k, k.accent), align: 'center' });
  const sw = 315, sh = 560, sx = k.ar ? PAGE_M : PAGE_W - PAGE_M - sw;
  // الستوري: بشكل ألوان آخر (إن اختار أكثر من شكل)، وإلا خلفية فاتحة
  const storyInk = k.effects.length > 1 || k.effects[0] !== 'solid' ? paintArea(ctx, k, sx, py, sw, sh, 16, 1, true) : (box(ctx, sx, py, sw, sh, 16, k.light, true), k.dark);
  paletteStrip(ctx, k.colors, sx + 20, py + 20, sw - 40, 6);
  monogram(ctx, k, k.ar ? sx + sw - 50 : sx + 50, py + 70, 22, k.main, onColor(k, k.main));
  drawText(ctx, t('brand.hook.1', { brand: k.name }), sx + sw / 2, py + 220, { size: 34, font: k.head, weight: 700, color: storyInk, align: 'center', maxW: sw - 50, lineH: 46, maxLines: 5 });
  circle(ctx, sx + sw - 70, py + sh - 80, 42, k.accent);
  label(ctx, k, t('brand.ig.post'), py + ps + 50, postX + ps / 2);
  label(ctx, k, t('brand.ig.story'), py + sh + 50, sx + sw / 2);
}

/* 9) فيسبوك ولينكد إن */
function pageFacebook(ctx, k) {
  const w = PAGE_W - 2 * PAGE_M, x = PAGE_M;
  // غلاف فيسبوك (2.63 : 1)
  const fh = Math.round(w / 2.63), fy = 330;
  const fbInk = paintArea(ctx, k, x, fy, w, fh, 16, 2, true);
  wordmark(ctx, k, x + w / 2, fy + fh * 0.42, w * 0.7, 76, fbInk);
  drawText(ctx, k.info.desc, x + w / 2, fy + fh * 0.65, { size: 26, font: k.body, color: fbInk, align: 'center', maxW: w * 0.7, lineH: 36, maxLines: 2 });
  monogram(ctx, k, k.ar ? x + w - 110 : x + 110, fy + fh, 70, k.light, k.main);
  label(ctx, k, t('brand.fb.cover'), fy - 25);

  // بانر لينكد إن (4 : 1)
  const lh = Math.round(w / 4), ly = fy + fh + 140;
  box(ctx, x, ly, w, lh, 16, k.dark, true);
  ctx.fillStyle = k.accent; ctx.fillRect(k.ar ? x + 60 : x + w - 260, ly + lh - 50, 200, 8);
  drawText(ctx, k.info.person || k.name, k.ar ? x + w - 60 : x + 60, ly + lh * 0.45, { size: 50, font: k.head, weight: 700, color: k.light, align: sideAlign(k) });
  drawText(ctx, [k.info.title, k.info.person ? k.name : ''].filter(Boolean).join(' · ') || k.info.desc, k.ar ? x + w - 60 : x + 60, ly + lh * 0.72,
    { size: 26, font: k.body, color: k.light, align: sideAlign(k), maxW: w * 0.7, maxLines: 1 });
  label(ctx, k, t('brand.li.banner'), ly - 25);

  // بوستان: لينكد إن (اقتباس) وفيسبوك (عرض)
  const py = ly + lh + 70, pw = (w - 40) / 2, ph = pw * 0.62;
  [0, 1].forEach((i) => {
    const px = x + i * (pw + 40);
    const fill = i === 0 ? k.light : k.main;
    box(ctx, px, py, pw, ph, 16, fill, true);
    const ink = onColor(k, fill);
    drawText(ctx, t(i === 0 ? 'brand.li.quote' : 'brand.fb.offer', { brand: k.name }), px + pw / 2, py + 110, { size: 32, font: k.head, weight: 700, color: ink, align: 'center', maxW: pw - 80, lineH: 46, maxLines: 3 });
    paletteStrip(ctx, k.colors, px + pw / 2 - 90, py + ph - 50, 180, 8);
    label(ctx, k, t(i === 0 ? 'brand.li.post' : 'brand.fb.post'), py + ph + 45, px + pw / 2);
  });
}

/* 10) تيك توك ويوتيوب: غلاف، صورة مصغّرة، الكتابة على الفيديو، الهوكس */
function pageVideo(ctx, k) {
  // غلاف تيك توك 9:16
  const tw = 330, th = 587, tx = k.ar ? PAGE_W - PAGE_M - tw : PAGE_M, ty = 300;
  box(ctx, tx, ty, tw, th, 18, k.dark, true);
  const hookInk = paintArea(ctx, k, tx + 24, ty + 150, tw - 48, 170, 12, 1);
  drawText(ctx, t('brand.hook.2', { brand: k.name }), tx + tw / 2, ty + 215, { size: 34, font: k.head, weight: 700, color: hookInk, align: 'center', maxW: tw - 80, lineH: 44, maxLines: 3 });
  drawText(ctx, k.name, tx + tw / 2, ty + th - 50, { size: 24, font: k.head, weight: 700, color: k.light, align: 'center' });
  label(ctx, k, t('brand.video.tiktok'), ty + th + 45, tx + tw / 2);

  // صورة يوتيوب المصغّرة 16:9
  const yw = PAGE_W - 2 * PAGE_M - tw - 40, yh = Math.round(yw * 9 / 16), yx = k.ar ? PAGE_M : PAGE_M + tw + 40;
  box(ctx, yx, ty, yw, yh, 16, k.light, true);
  ctx.fillStyle = k.main; ctx.fillRect(k.ar ? yx : yx + yw * 0.62, ty, yw * 0.38, yh);
  monogram(ctx, k, k.ar ? yx + yw * 0.19 : yx + yw * 0.81, ty + yh / 2, 60, k.light, k.main);
  drawText(ctx, t('brand.hook.3', { brand: k.name }), k.ar ? yx + yw - 30 : yx + 30, ty + 90, { size: 38, font: k.head, weight: 700, color: k.dark, align: sideAlign(k), maxW: yw * 0.55, lineH: 48, maxLines: 4 });
  box(ctx, k.ar ? yx + yw * 0.62 - 190 : yx + 30, ty + yh - 80, 160, 48, 10, k.accent);
  drawText(ctx, 'NEW', k.ar ? yx + yw * 0.62 - 110 : yx + 110, ty + yh - 47, { size: 24, font: k.enHead, weight: 700, color: onColor(k, k.accent), align: 'center' });
  label(ctx, k, t('brand.video.youtube'), ty + yh + 45, yx + yw / 2);

  // الكتابة على الفيديو (ترجمة أسفل الشاشة)
  const vy = ty + yh + 100, vh = th - yh - 100;
  const g = ctx.createLinearGradient(0, vy, 0, vy + vh);
  g.addColorStop(0, '#8E8E93'); g.addColorStop(1, '#3A3A3C');
  box(ctx, yx, vy, yw, vh, 16, g);
  box(ctx, yx + 40, vy + vh - 100, yw - 80, 64, 12, k.main);
  drawText(ctx, t('brand.video.caption'), yx + yw / 2, vy + vh - 58, { size: 26, font: k.body, weight: 700, color: onColor(k, k.main), align: 'center', maxW: yw - 120, maxLines: 1 });
  label(ctx, k, t('brand.video.overlay'), vy + vh + 45, yx + yw / 2);

  // أمثلة هوكس (جمل البداية) بشكل علامات ملوّنة
  let hy = ty + th + 150;
  drawText(ctx, t('brand.video.hooks'), sideX(k), hy, { size: 32, font: k.head, weight: 700, color: k.dark, align: sideAlign(k) });
  const fills = [k.main, k.accent, k.dark];
  [4, 5, 6].forEach((n, i) => {
    hy += 110;
    const text = t('brand.hook.' + n, { brand: k.name });
    setFont(ctx, 30, k.head, 700);
    const w = Math.min(ctx.measureText(text).width + 70, PAGE_W - 2 * PAGE_M);
    box(ctx, k.ar ? PAGE_W - PAGE_M - w : PAGE_M, hy - 55, w, 76, 38, fills[i]);
    drawText(ctx, text, k.ar ? PAGE_W - PAGE_M - w / 2 : PAGE_M + w / 2, hy - 5, { size: 30, font: k.head, weight: 700, color: onColor(k, fills[i]), align: 'center', maxW: w - 60, maxLines: 1 });
  });
}

/* 11) الموقع: شكل الصفحة الرئيسية */
function pageWebsite(ctx, k) {
  const x = PAGE_M, y = 290, w = PAGE_W - 2 * PAGE_M, h = 1250;
  box(ctx, x, y, w, h, 18, '#FFFFFF', true);
  box(ctx, x, y, w, 60, 18, '#F2F2F7'); ctx.fillStyle = '#F2F2F7'; ctx.fillRect(x, y + 30, w, 30);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => circle(ctx, x + 36 + i * 28, y + 30, 8, c));
  box(ctx, x + 150, y + 14, w - 300, 32, 16, '#FFFFFF');
  drawText(ctx, k.info.web || 'www.' + (k.name.replace(/\s+/g, '').toLowerCase() || 'brand') + '.com', x + w / 2, y + 38, { size: 18, font: k.enBody, color: '#6B6B70', align: 'center' });

  // القائمة العلوية
  const ny = y + 60;
  ctx.fillStyle = k.light; ctx.fillRect(x, ny, w, 90);
  const lx = k.ar ? x + w - 50 : x + 50;
  monogram(ctx, k, k.ar ? lx - 26 : lx + 26, ny + 45, 26, k.main, onColor(k, k.main));
  drawText(ctx, k.name, k.ar ? lx - 70 : lx + 70, ny + 55, { size: 28, font: k.head, weight: 700, color: k.dark, align: sideAlign(k) });
  const links = t('brand.web.nav').split('|');
  links.forEach((l, i) => drawText(ctx, l, k.ar ? x + 330 - i * 110 : x + w - 330 + i * 110, ny + 55, { size: 20, font: k.body, color: '#3A3A3C', align: 'center' }));
  box(ctx, k.ar ? x + 30 : x + w - 170, ny + 25, 140, 42, 21, k.main);
  drawText(ctx, t('brand.web.btn'), k.ar ? x + 100 : x + w - 100, ny + 53, { size: 18, font: k.body, weight: 700, color: onColor(k, k.main), align: 'center' });

  // القسم الرئيسي (Hero)
  const hy = ny + 90, hh = 520;
  ctx.fillStyle = k.bg; ctx.fillRect(x, hy, w, hh);
  const cx = k.ar ? x + w - 60 : x + 60, al = sideAlign(k);
  drawText(ctx, k.name, cx, hy + 150, { size: fitSize(ctx, k.name, k.head, 700, w * 0.5, 72), font: k.head, weight: 700, color: onColor(k, k.bg), align: al });
  drawText(ctx, k.info.desc || t('brand.web.tagline'), cx, hy + 220, { size: 26, font: k.body, color: onColor(k, k.bg), align: al, maxW: w * 0.48, lineH: 38, maxLines: 5 });
  box(ctx, k.ar ? cx - 240 : cx, hy + hh - 130, 240, 64, 32, k.main);
  drawText(ctx, t('brand.web.cta'), k.ar ? cx - 120 : cx + 120, hy + hh - 88, { size: 22, font: k.body, weight: 700, color: onColor(k, k.main), align: 'center' });
  // مكان الصورة: تدرج من ألوان اللوحة
  const ix = k.ar ? x + 50 : x + w * 0.56, iw = w * 0.4;
  paintArea(ctx, k, ix, hy + 60, iw, hh - 120, 24, 2);
  circle(ctx, ix + iw * 0.7, hy + 180, 50, k.light);

  // 3 بطاقات مميزات
  const fy = hy + hh + 50, fw = (w - 160) / 3;
  [0, 1, 2].forEach((i) => {
    const fx = x + 50 + i * (fw + 30);
    box(ctx, fx, fy, fw, 260, 16, '#F7F7F9');
    circle(ctx, k.ar ? fx + fw - 60 : fx + 60, fy + 70, 30, [k.main, k.accent, k.support][i]);
    ctx.fillStyle = '#D1D1D6';
    [0, 1, 2].forEach((j) => ctx.fillRect(fx + 30, fy + 140 + j * 34, fw - 60 - (j === 2 ? 80 : 0), 12));
  });

  // التذييل
  const fty = y + h - 150;
  ctx.fillStyle = k.dark; ctx.fillRect(x, fty, w, 150);
  drawText(ctx, k.name, x + w / 2, fty + 60, { size: 26, font: k.head, weight: 700, color: k.light, align: 'center' });
  drawText(ctx, [...k.contacts, ...k.socials.map((s) => s.v)].join('   '), x + w / 2, fty + 105, { size: 18, font: k.enBody, color: k.light, align: 'center', maxW: w - 80, maxLines: 1 });
}

/* 12) أوامر الصور الجاهزة (بالإنجليزية) */
function pagePrompts(ctx, k, prompts) {
  drawText(ctx, t('brand.promptsHint'), sideX(k), 300, { size: 24, font: k.body, color: '#6B6B70', align: sideAlign(k), maxW: PAGE_W - 2 * PAGE_M, lineH: 34 });
  let y = 390;
  prompts.forEach((p) => {
    if (y > PAGE_H - 180) return;
    drawText(ctx, t('brand.pr.' + p.key), sideX(k), y, { size: 24, font: k.head, weight: 700, color: k.main, align: sideAlign(k) });
    y = drawText(ctx, p.short, PAGE_M, y + 32, { size: 16, font: 'Inter', color: '#3A3A3C', align: 'left', maxW: PAGE_W - 2 * PAGE_M, lineH: 22, maxLines: 4, dir: 'ltr' }) + 22;
  });
}
