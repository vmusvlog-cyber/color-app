/* =========================================================================
   branddesigns.js — خطوة "تصاميمك" في "ابنِ هويتك البصرية"
   - زر لكل مكان اختاره العميل (إنستغرام، سناب شات، موقع...)، و3 تصاميم لكل مكان.
   - كل تصميم مرسوم على لوحة رسم (canvas)، وكل جزء فيه له "منطقة":
     الضغط على جزء يختاره، ثم يختار العميل لونه من ألوان هويته + الأبيض والأسود.
   - لكل تصميم: رجوع (للتعديل السابق)، الألوان الأصلية، وتحميل PNG.
   - التصاميم بألوانها المعدّلة تدخل في دليل PDF (brandpages.js).
   التعديلات محفوظة في state.brand.dz = { [رقم التصميم]: { over: {جزء: لون}, undo: [...] } }
   ========================================================================= */

/* كل مكان ← 3 تصاميم: [الشكل، النسخة] */
const DZ_CHANNELS = {
  instagram: [['post', 0], ['story', 1], ['highlights', 0]],
  tiktok: [['story', 2], ['caption', 0], ['post', 1]],
  youtube: [['thumb', 0], ['thumb', 2], ['banner', 1]],
  snapchat: [['story', 0], ['story', 2], ['post', 2]],
  facebook: [['banner', 0], ['post', 1], ['post', 2]],
  linkedin: [['banner', 2], ['post', 1], ['card', 1]],
  website: [['web', 0], ['web', 1], ['web', 2]],
  app: [['phone', 0], ['phone', 1], ['phone', 2]],
  shop: [['sign', 0], ['flyer', 1], ['box', 0]],
  packaging: [['box', 0], ['box', 1], ['box', 2]],
  print: [['card', 0], ['card', 1], ['flyer', 0]],
  signage: [['sign', 0], ['sign', 2], ['rollup', 0]],
  uniform: [['shirt', 0], ['shirt', 2], ['card', 2]],
  events: [['rollup', 0], ['rollup', 1], ['banner', 1]],
};
const DZ_DEFAULT_CHANNELS = ['instagram', 'website', 'print'];

/* مقاس كل شكل (بالبكسل) */
const DZ_SIZES = {
  post: [1080, 1080], story: [1080, 1920], highlights: [1080, 420], banner: [1640, 624], thumb: [1280, 720],
  web: [1200, 900], card: [1050, 600], flyer: [900, 1270], sign: [1600, 500], box: [1000, 1000],
  shirt: [1000, 1000], rollup: [800, 2000], phone: [720, 1440], caption: [1080, 1920],
};

/* الأماكن التي اختارها العميل في سؤال "أين ستستخدم هويتك؟" (أو 3 افتراضية) */
function brandChannels(answers) {
  const picked = (answers.use || []).filter((u) => DZ_CHANNELS[u]);
  return picked.length ? picked : DZ_DEFAULT_CHANNELS;
}

/* الألوان الأصلية لكل جزء حسب النسخة: 0 خلفية بالرئيسي، 1 فاتحة، 2 داكنة */
function dzDefaults(k, v) {
  const ink = (c) => readableOn(c, k.colors);
  if (v === 1) return { bg: k.light, shape: k.main, title: k.dark, text: k.dark, logo: k.main, logoText: ink(k.main),
    button: k.main, buttonText: ink(k.main), band: k.accent, frame: k.support };
  if (v === 2) return { bg: k.dark, shape: k.main, title: k.light, text: k.light, logo: k.accent, logoText: ink(k.accent),
    button: k.accent, buttonText: ink(k.accent), band: k.main, frame: k.main };
  return { bg: k.main, shape: k.accent, title: ink(k.main), text: ink(k.main), logo: k.light, logoText: k.main,
    button: k.accent, buttonText: ink(k.accent), band: k.dark, frame: k.light };
}

/* قائمة التصاميم لكل مكان مع أرقامها (مثل "instagram-0") */
function dzDesigns(channels) {
  return channels.flatMap((ch) => DZ_CHANNELS[ch].map(([layout, v], i) => ({ id: `${ch}-${i}`, ch, layout, v, i })));
}

/*
  يرسم تصميماً واحداً. يرجع قائمة المناطق [{part, x, y, w, h}] (للضغط عليها).
  over = الألوان التي غيّرها العميل. sel = الجزء المختار (نرسم حوله إطاراً متقطعاً).
*/
function drawDesign(ctx, k, d, over = {}, sel = null) {
  const [W, H] = DZ_SIZES[d.layout];
  const base = dzDefaults(k, d.v);
  const col = (part) => over[part] || base[part];
  const regions = [];
  const reg = (part, x, y, w, h) => regions.push({ part, x, y, w, h });
  const dd = { ctx, k, W, H, col, reg, over, d };
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  (DZ_LAYOUTS[d.layout] || DZ_LAYOUTS.post)(dd);
  // إطار حول الجزء المختار
  if (sel) {
    ctx.setLineDash([18, 12]);
    ctx.lineWidth = Math.max(4, W / 220);
    regions.filter((r) => r.part === sel).forEach((r) => {
      ctx.strokeStyle = '#FFFFFF'; ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
      ctx.strokeStyle = '#111111'; ctx.lineDashOffset = 15; ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
      ctx.lineDashOffset = 0;
    });
  }
  ctx.restore();
  return regions;
}

/* الخلفية: إن لم يغيّرها العميل وكان اختار تدرجاً أو شفافية، نرسمها بذلك الشكل */
function dzBackground(dd, x, y, w, h, r = 0) {
  const { ctx, k, col, over, d } = dd;
  dd.reg('bg', x, y, w, h);
  const color = col('bg');
  if (!over.bg && color === k.main && k.effects.some((e) => e !== 'solid')) {
    paintArea(ctx, k, x, y, w, h, r, d.i);
  } else {
    box(ctx, x, y, w, h, r, color);
  }
}

/* أدوات صغيرة: الشعار (دائرة + حرفان)، زر، نص */
function dzLogo(dd, cx, cy, r) {
  const { ctx, k, col } = dd;
  dd.reg('logo', cx - r, cy - r, r * 2, r * 2);
  circle(ctx, cx, cy, r, col('logo'));
  const size = fitSize(ctx, k.initials, k.head, 700, r * 1.35, r * 0.95);
  drawText(ctx, k.initials, cx, cy + size * 0.05, { size, font: k.head, weight: 700, color: col('logoText'), align: 'center', baseline: 'middle' });
}
function dzButton(dd, cx, cy, w, h, text) {
  const { ctx, k, col } = dd;
  dd.reg('button', cx - w / 2, cy - h / 2, w, h);
  box(ctx, cx - w / 2, cy - h / 2, w, h, h / 2, col('button'));
  drawText(ctx, text, cx, cy + 2, { size: h * 0.4, font: k.body, weight: 700, color: col('buttonText'), align: 'center', baseline: 'middle', maxW: w - 20, maxLines: 1 });
}
function dzTitle(dd, text, x, y, o) {
  const { ctx, k, col } = dd;
  const lineH = o.size * 1.25;
  const lines = Math.min(o.maxLines || 3, (() => { setFont(ctx, o.size, k.head, 700); return wrapLines(ctx, text, o.maxW).length; })());
  const left = o.align === 'center' ? x - o.maxW / 2 : o.align === 'right' ? x - o.maxW : x;
  dd.reg('title', left, y - o.size, o.maxW, lines * lineH + o.size * 0.3);
  return drawText(ctx, text, x, y, { font: k.head, weight: 700, color: col('title'), lineH, ...o });
}
function dzText(dd, text, x, y, o) {
  const { ctx, k, col } = dd;
  if (!text) return y;
  const lineH = o.size * 1.45;
  setFont(ctx, o.size, k.body, 400);
  const lines = Math.min(o.maxLines || 3, wrapLines(ctx, text, o.maxW).length);
  const left = o.align === 'center' ? x - o.maxW / 2 : o.align === 'right' ? x - o.maxW : x;
  dd.reg('text', left, y - o.size, o.maxW, lines * lineH + o.size * 0.3);
  return drawText(ctx, text, x, y, { font: k.body, color: col('text'), lineH, ...o });
}
/* شكل زخرفي (دائرة كبيرة) */
function dzShape(dd, cx, cy, r) {
  dd.reg('shape', cx - r, cy - r, r * 2, r * 2);
  circle(dd.ctx, cx, cy, r, dd.col('shape'));
}
/* نص البداية (x) وجهة الكتابة حسب اللغة */
function dzSide(dd, margin) { return dd.k.ar ? dd.W - margin : margin; }
function dzAlign(dd) { return dd.k.ar ? 'right' : 'left'; }

/* نصوص التصاميم */
function dzHook(k, n) { return t('brand.hook.' + n, { brand: k.name }); }
function dzDesc(k) { return k.info.desc || t('brand.web.tagline'); }

/* ============================ الأشكال ============================ */
const DZ_LAYOUTS = {
  /* بوست مربع */
  post(dd) {
    const { W, H, k, d } = dd;
    dzBackground(dd, 0, 0, W, H);
    // الشكل في الزاوية المقابلة للشعار حتى لا يغطي الكتابة
    dzShape(dd, k.ar ? W * 0.08 : W * 0.92, H * 0.08, W * 0.22);
    dzLogo(dd, dzSide(dd, 130), 130, 62);
    const title = [dzHook(k, 1), k.info.desc || k.name, t('brand.fb.offer', { brand: k.name })][d.v];
    dzTitle(dd, title, W / 2, H * 0.42, { size: 78, align: 'center', maxW: W - 180, maxLines: 4 });
    dzButton(dd, W / 2, H * 0.84, 380, 96, t(d.v === 2 ? 'dz.shop' : 'brand.ig.cta'));
  },
  /* ستوري 9:16 */
  story(dd) {
    const { W, H, k, d } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('band', 60, 70, W - 120, 14);
    paletteStrip(dd.ctx, [dd.col('band'), ...k.colors.slice(1, 4)], 60, 70, W - 120, 14);
    dzShape(dd, k.ar ? W * 0.05 : W * 0.95, H * 0.06, W * 0.26);
    dzLogo(dd, dzSide(dd, 150), 210, 70);
    const title = [dzHook(k, 2), dzHook(k, 1), dzHook(k, 5)][d.v];
    dzTitle(dd, title, W / 2, H * 0.4, { size: 104, align: 'center', maxW: W - 160, maxLines: 5 });
    dzText(dd, k.name, W / 2, H * 0.66, { size: 48, align: 'center', maxW: W - 200, maxLines: 1 });
    dzButton(dd, W / 2, H * 0.88, 480, 110, t('dz.swipe'));
  },
  /* أغلفة الستوريز المميزة */
  highlights(dd) {
    const { ctx, W, H, k, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    const labels = [1, 2, 3, 4, 5].map((n) => t('brand.hl.' + n));
    labels.forEach((word, i) => {
      const cx = 120 + i * ((W - 240) / 4);
      const pos = k.ar ? W - cx : cx;
      dd.reg('band', pos - 92, 110 - 92 + 60, 184, 184);
      ctx.strokeStyle = col('band'); ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(pos, 170, 90, 0, Math.PI * 2); ctx.stroke();
      dd.reg('shape', pos - 80, 90, 160, 160);
      circle(ctx, pos, 170, 80, col('shape'));
      const size = fitSize(ctx, word, k.head, 700, 130, 36);
      drawText(ctx, word, pos, 172, { size, font: k.head, weight: 700, color: readableOn(col('shape'), [col('title'), '#FFFFFF', '#111111']), align: 'center', baseline: 'middle' });
      dd.reg('title', pos - 90, 300, 180, 50);
      drawText(ctx, word, pos, 340, { size: 32, font: k.body, color: col('title'), align: 'center' });
    });
  },
  /* بانر عريض (غلاف فيسبوك، بانر لينكد إن، قناة يوتيوب، خلفية معرض) */
  banner(dd) {
    const { W, H, k, d } = dd;
    dzBackground(dd, 0, 0, W, H);
    dzShape(dd, k.ar ? W * 0.1 : W * 0.9, H * 0.5, H * 0.42);
    const x = dzSide(dd, 110);
    dzTitle(dd, d.v === 2 && k.info.person ? k.info.person : k.name, x, H * 0.42, { size: 96, align: dzAlign(dd), maxW: W * 0.62, maxLines: 1 });
    dzText(dd, d.v === 2 && k.info.title ? k.info.title : dzDesc(k), x, H * 0.62, { size: 38, align: dzAlign(dd), maxW: W * 0.6, maxLines: 2 });
    dzLogo(dd, k.ar ? W * 0.1 : W * 0.9, H * 0.5, H * 0.2);
  },
  /* صورة يوتيوب المصغّرة 16:9 */
  thumb(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    const px = k.ar ? 0 : W * 0.6;
    dd.reg('band', px, 0, W * 0.4, H);
    ctx.fillStyle = col('band'); ctx.fillRect(px, 0, W * 0.4, H);
    dzLogo(dd, px + W * 0.2, H / 2, 120);
    const x = k.ar ? W - 70 : 70;
    dzTitle(dd, d.v === 2 ? dzHook(k, 6) : dzHook(k, 3), x, 170, { size: 84, align: dzAlign(dd), maxW: W * 0.52, maxLines: 4 });
    dzButton(dd, k.ar ? W * 0.52 : W * 0.16, H - 110, 220, 80, 'NEW');
  },
  /* فيديو عمودي مع كتابة (تيك توك) */
  caption(dd) {
    const { ctx, W, H, k, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    // مكان الفيديو: تدرج رمادي خفيف فوق الخلفية
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    dzLogo(dd, dzSide(dd, 120), 150, 60);
    dd.reg('band', 70, H * 0.68, W - 140, 200);
    box(ctx, 70, H * 0.68, W - 140, 200, 24, col('band'));
    dd.reg('title', 90, H * 0.68 + 30, W - 180, 140);
    drawText(ctx, t('brand.video.caption'), W / 2, H * 0.68 + 118, { size: 60, font: k.head, weight: 700, color: col('title'), align: 'center', maxW: W - 200, maxLines: 2, lineH: 70 });
    dzText(dd, '@' + (k.info.tiktok || k.name).replace(/^@/, '').replace(/\s+/g, ''), W / 2, H * 0.9, { size: 44, align: 'center', maxW: W - 200, maxLines: 1, dir: 'ltr' });
  },
  /* صفحة موقع: الرئيسية، من نحن، تواصل */
  web(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('band', 0, 0, W, 110);
    ctx.fillStyle = col('band'); ctx.fillRect(0, 0, W, 110);
    dzLogo(dd, dzSide(dd, 80), 55, 34);
    drawText(ctx, k.name, dzSide(dd, 135), 67, { size: 34, font: k.head, weight: 700, color: readableOn(col('band'), [col('bg'), '#FFFFFF', '#111111']), align: dzAlign(dd) });
    const titles = [k.name, t('dz.web.about'), t('dz.web.contact')];
    const x = dzSide(dd, 80);
    dzTitle(dd, titles[d.v], x, 280, { size: 76, align: dzAlign(dd), maxW: W * 0.5, maxLines: 2 });
    const body = d.v === 2 ? [...k.contacts, ...k.socials.map((s) => s.v)].join('\n') || dzDesc(k) : dzDesc(k);
    dzText(dd, body, x, 400, { size: 30, align: dzAlign(dd), maxW: W * 0.48, maxLines: 5 });
    dzButton(dd, k.ar ? W - 80 - 150 : 80 + 150, 680, 300, 84, t(d.v === 2 ? 'dz.send' : 'brand.web.cta'));
    // صورة أو بطاقات
    const ix = k.ar ? 60 : W * 0.56;
    dd.reg('shape', ix, 170, W * 0.4, 560);
    box(ctx, ix, 170, W * 0.4, 560, 30, col('shape'));
    dd.reg('frame', ix + 40, 640, W * 0.4 - 80, 60);
    box(ctx, ix + 40, 640, W * 0.4 - 80, 60, 14, col('frame'));
  },
  /* بطاقة عمل (وجه، ظهر، بطاقة موظف) */
  card(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H, 0);
    if (d.v === 0) {
      dzLogo(dd, W / 2, H * 0.38, 100);
      dzTitle(dd, k.name, W / 2, H * 0.8, { size: 70, align: 'center', maxW: W - 120, maxLines: 1 });
      return;
    }
    dd.reg('band', k.ar ? W - 30 : 0, 0, 30, H);
    ctx.fillStyle = col('band'); ctx.fillRect(k.ar ? W - 30 : 0, 0, 30, H);
    const x = dzSide(dd, 90);
    dzTitle(dd, k.info.person || k.name, x, 150, { size: 64, align: dzAlign(dd), maxW: W - 300, maxLines: 1 });
    dzText(dd, [k.info.title || (d.v === 2 ? t('dz.staff') : ''), ...k.contacts].filter(Boolean).join('\n'), x, 240, { size: 34, align: dzAlign(dd), maxW: W - 300, maxLines: 5 });
    dzLogo(dd, k.ar ? 130 : W - 130, H - 130, 70);
  },
  /* منشور / بوستر A5 */
  flyer(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('band', 0, 0, W, 260);
    ctx.fillStyle = col('band'); ctx.fillRect(0, 0, W, 260);
    dzLogo(dd, W / 2, 260, 90);
    dzTitle(dd, d.v === 1 ? t('brand.fb.offer', { brand: k.name }) : k.name, W / 2, 520, { size: 76, align: 'center', maxW: W - 140, maxLines: 3 });
    dzText(dd, dzDesc(k), W / 2, 820, { size: 34, align: 'center', maxW: W - 180, maxLines: 4 });
    dzButton(dd, W / 2, H - 140, 420, 100, k.info.web || t('brand.web.cta'));
  },
  /* لافتة محل */
  sign(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H, 30);
    dd.reg('frame', 20, 20, W - 40, H - 40);
    ctx.strokeStyle = col('frame'); ctx.lineWidth = 14; roundedRect(ctx, 30, 30, W - 60, H - 60, 24); ctx.stroke();
    dzLogo(dd, k.ar ? W - 230 : 230, H / 2, 140);
    dzTitle(dd, k.name, k.ar ? W - 420 : 420, H / 2 + 40, { size: 130, align: dzAlign(dd), maxW: W - 560, maxLines: 1 });
  },
  /* تغليف: علبة */
  box(dd) {
    const { ctx, W, H, k, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('shape', 210, 170, 580, 700);
    box(ctx, 210, 170, 580, 700, 24, col('shape'), true);
    dd.reg('band', 210, 430, 580, 180);
    ctx.fillStyle = col('band'); ctx.fillRect(210, 430, 580, 180);
    dzLogo(dd, W / 2, 330, 90);
    dd.reg('title', 230, 470, 540, 110);
    drawText(ctx, k.name, W / 2, 540, { size: fitSize(ctx, k.name, k.head, 700, 520, 76), font: k.head, weight: 700, color: col('title'), align: 'center', baseline: 'middle' });
  },
  /* تيشيرت الموظفين */
  shirt(dd) {
    const { ctx, W, H, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('shape', 170, 150, 660, 760);
    ctx.fillStyle = col('shape');
    ctx.beginPath();
    ctx.moveTo(380, 150); ctx.lineTo(620, 150); ctx.lineTo(830, 290); ctx.lineTo(740, 420); ctx.lineTo(690, 390);
    ctx.lineTo(690, 910); ctx.lineTo(310, 910); ctx.lineTo(310, 390); ctx.lineTo(260, 420); ctx.lineTo(170, 290); ctx.closePath();
    ctx.fill();
    dzLogo(dd, W / 2, 470, 95);
  },
  /* رول أب للمعارض */
  rollup(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H);
    dd.reg('band', 0, H - 380, W, 380);
    ctx.fillStyle = col('band'); ctx.fillRect(0, H - 380, W, 380);
    dzLogo(dd, W / 2, 260, 130);
    dzTitle(dd, d.v === 1 ? dzHook(k, 3) : k.name, W / 2, 620, { size: 88, align: 'center', maxW: W - 120, maxLines: 4 });
    dzText(dd, dzDesc(k), W / 2, 1100, { size: 38, align: 'center', maxW: W - 140, maxLines: 5 });
    dzButton(dd, W / 2, H - 190, 520, 110, k.info.web || k.info.instagram || t('brand.web.cta'));
  },
  /* شاشة تطبيق */
  phone(dd) {
    const { ctx, W, H, k, d, col } = dd;
    dzBackground(dd, 0, 0, W, H, 60);
    if (d.v === 2) { // شاشة البداية
      dzLogo(dd, W / 2, H * 0.42, 150);
      dzTitle(dd, k.name, W / 2, H * 0.62, { size: 64, align: 'center', maxW: W - 100, maxLines: 2 });
      return;
    }
    dd.reg('band', 0, 0, W, 220);
    box(ctx, 0, 0, W, 220, 60, col('band'));
    dzLogo(dd, dzSide(dd, 90), 130, 44);
    dzTitle(dd, d.v === 0 ? t('dz.app.hello') : k.name, dzSide(dd, 60), 360, { size: 56, align: dzAlign(dd), maxW: W - 120, maxLines: 1 });
    [0, 1, 2].forEach((i) => {
      dd.reg('frame', 60, 440 + i * 230, W - 120, 190);
      box(ctx, 60, 440 + i * 230, W - 120, 190, 30, col('frame'));
    });
    dzButton(dd, W / 2, H - 150, W - 160, 110, t(d.v === 0 ? 'brand.web.btn' : 'dz.shop'));
  },
};

/* ============================ الشاشة ============================ */
function renderBrandDesigns() {
  const b = state.brand;
  if (!b.dz) b.dz = {};
  const kit = brandKit();
  const k = brandDrawKit(kit);
  const channels = kit.channels;
  if (!channels.includes(b.dzTab)) b.dzTab = channels[0];
  const designs = dzDesigns([b.dzTab]);
  const body = document.getElementById('brand-body');
  const swatches = [...new Set([...k.colors, '#FFFFFF', '#111111'])];

  body.innerHTML = `
    <h2 class="section-title">${t('dz.title')}</h2>
    <p class="small-hint">${t('dz.hint')}</p>
    <div class="choice-chips dz-tabs">
      ${channels.map((ch) => `<button type="button" class="choice-chip small ${ch === b.dzTab ? 'selected' : ''}" data-tab="${ch}">${t('bq.use.' + ch)}</button>`).join('')}
    </div>
    <div class="dz-list">
      ${designs.map((d) => {
        const st = b.dz[d.id] || { over: {}, undo: [] };
        const sel = b.dzSel && b.dzSel.id === d.id ? b.dzSel.part : null;
        return `
        <div class="dz-card" data-dz="${d.id}">
          <p class="dz-name">${t('dz.' + d.layout)} ${d.i + 1}</p>
          <canvas class="dz-canvas" data-canvas="${d.id}"></canvas>
          <div class="dz-edit" ${sel ? '' : 'hidden'}>
            <p class="small-hint">${t('dz.editing')} <b>${sel ? t('dz.part.' + sel) : ''}</b></p>
            <div class="dz-swatches">
              ${swatches.map((c) => `<button type="button" class="swatch-pick small" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
            </div>
          </div>
          <div class="dz-actions">
            <button type="button" class="btn btn-small" data-undo="${d.id}" ${st.undo.length ? '' : 'disabled'}><span class="back-arrow" aria-hidden="true">←</span> ${t('dz.undo')}</button>
            <button type="button" class="btn btn-small" data-reset="${d.id}" ${Object.keys(st.over).length ? '' : 'disabled'}>${t('dz.reset')}</button>
            <button type="button" class="btn btn-small btn-primary" data-png="${d.id}">${t('dz.png')}</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="actions"><button type="button" class="btn btn-primary" id="brand-next">${t('brand.make')}</button></div>
  `;

  // نرسم كل تصميم بعد تحميل الخطوط
  const regionsOf = {};
  const paint = () => designs.forEach((d) => {
    const canvas = body.querySelector(`[data-canvas="${d.id}"]`);
    if (!canvas) return;
    const [W, H] = DZ_SIZES[d.layout];
    canvas.width = W; canvas.height = H;
    const st = b.dz[d.id] || { over: {} };
    const sel = b.dzSel && b.dzSel.id === d.id ? b.dzSel.part : null;
    regionsOf[d.id] = drawDesign(canvas.getContext('2d'), k, d, st.over, sel);
  });
  paint();
  waitForFonts([k.head, k.body, k.enHead, k.enBody]).then(() => { if (document.body.contains(body)) paint(); });

  body.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
    b.dzTab = btn.dataset.tab; b.dzSel = null; renderBrandDesigns();
  }));

  // الضغط على التصميم: نختار الجزء الذي تحت الإصبع (آخر منطقة مرسومة فوقه)
  body.querySelectorAll('[data-canvas]').forEach((canvas) => canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    const id = canvas.dataset.canvas;
    const hit = [...(regionsOf[id] || [])].reverse().find((g) => x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h);
    b.dzSel = hit ? { id, part: hit.part } : null;
    renderBrandDesigns();
  }));

  // اختيار لون للجزء المختار (ونحفظ القديم حتى نستطيع الرجوع)
  body.querySelectorAll('[data-color]').forEach((btn) => btn.addEventListener('click', () => {
    const { id, part } = b.dzSel;
    const st = b.dz[id] || (b.dz[id] = { over: {}, undo: [] });
    st.undo.push({ part, prev: st.over[part] });
    st.over[part] = btn.dataset.color;
    renderBrandDesigns();
  }));
  body.querySelectorAll('[data-undo]').forEach((btn) => btn.addEventListener('click', () => {
    const st = b.dz[btn.dataset.undo];
    const last = st && st.undo.pop();
    if (!last) return;
    if (last.reset) st.over = last.prevAll;                      // تراجع عن "الألوان الأصلية"
    else if (last.prev) st.over[last.part] = last.prev;
    else delete st.over[last.part];
    renderBrandDesigns();
  }));
  body.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', () => {
    const st = b.dz[btn.dataset.reset];
    if (!st) return;
    st.undo.push({ reset: true, prevAll: { ...st.over } });
    st.over = {};
    renderBrandDesigns();
  }));
  body.querySelectorAll('[data-png]').forEach((btn) => btn.addEventListener('click', () => {
    const d = designs.find((x) => x.id === btn.dataset.png);
    const [W, H] = DZ_SIZES[d.layout];
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    drawDesign(c.getContext('2d'), k, d, (b.dz[d.id] || {}).over || {});
    const slug = k.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'brand';
    triggerDownload(c.toDataURL('image/png'), `${slug}-${d.id}.png`);
  }));
  document.getElementById('brand-next').addEventListener('click', () => {
    b.dzSel = null;
    b.step = 'guide';
    renderBrand();
    window.scrollTo(0, 0);
  });
}

/* صفحة في دليل PDF لكل مكان: التصاميم الثلاثة بألوانها المعدّلة */
function pageDesigns(ctx, k, ch, dz) {
  const designs = dzDesigns([ch]);
  const areaW = PAGE_W - 2 * PAGE_M, areaTop = 290, areaH = PAGE_H - areaTop - 120;
  const sizes = designs.map((d) => DZ_SIZES[d.layout]);
  // نجرب 3 ترتيبات ونختار الذي يُظهر التصاميم أكبر: صف واحد، أو تحت بعضها، أو اثنان فوق وواحد تحت
  const gap = 40;
  const fitRow = (list, y, maxH) => {         // صف: كل التصاميم بنفس الارتفاع
    const sumA = list.reduce((t, [w, h]) => t + w / h, 0);
    const h = Math.min(maxH, (areaW - gap * (list.length - 1)) / sumA);
    let x = PAGE_M + (areaW - (sumA * h + gap * (list.length - 1))) / 2;
    return list.map(([w, hh]) => { const b = [x, y, (w / hh) * h, h]; x += (w / hh) * h + gap; return b; });
  };
  const layouts = [];
  layouts.push(fitRow(sizes, areaTop, areaH));
  // تحت بعضها
  { const h = (areaH - 2 * gap) / 3; let y = areaTop;
    layouts.push(sizes.map(([sw, sh]) => { const sc = Math.min(areaW / sw, h / sh); const b = [PAGE_M + (areaW - sw * sc) / 2, y, sw * sc, sh * sc]; y += sh * sc + gap; return b; })); }
  // اثنان في صف وواحد تحته
  { const top = fitRow(sizes.slice(0, 2), areaTop, areaH * 0.62);
    const y2 = areaTop + top[0][3] + gap;
    const bottom = fitRow(sizes.slice(2), y2, areaTop + areaH - y2);
    layouts.push([...top, ...bottom]); }
  const area = (L) => L.reduce((t, b) => t + b[2] * b[3], 0);
  const boxes = layouts.reduce((best, L) => (area(L) > area(best) ? L : best));
  designs.forEach((d, i) => {
    const [W, H] = DZ_SIZES[d.layout];
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    drawDesign(c.getContext('2d'), k, d, (dz[d.id] || {}).over || {});
    const [x, y, w, h] = boxes[i];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.14)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.drawImage(c, x, y, w, h);
    ctx.restore();
  });
}
