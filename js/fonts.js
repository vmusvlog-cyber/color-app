/* =========================================================================
   fonts.js — أزواج الخطوط المقترحة لكل أسلوب (كلها مجانية من Google Fonts)
   كل زوج فيه: خط للعناوين + خط للنص، بالعربية وبالإنجليزية،
   ونصيحة قصيرة (نصها موجود في ملف الترجمة: 'font.adv.' + advice)
   ========================================================================= */

const FONT_PAIRS = {
  minimal: [
    { ar: ['IBM Plex Sans Arabic', 'IBM Plex Sans Arabic'], en: ['Inter', 'Inter'], advice: 'clean' },
    { ar: ['Readex Pro', 'Tajawal'], en: ['DM Sans', 'DM Sans'], advice: 'modern' },
    { ar: ['Almarai', 'Almarai'], en: ['Montserrat', 'Karla'], advice: 'classic' },
  ],
  luxury: [
    { ar: ['El Messiri', 'Tajawal'], en: ['Playfair Display', 'Inter'], advice: 'elegant' },
    { ar: ['Amiri', 'Noto Naskh Arabic'], en: ['Cormorant Garamond', 'Lora'], advice: 'classic' },
    { ar: ['Reem Kufi', 'Almarai'], en: ['Libre Baskerville', 'Work Sans'], advice: 'clean' },
  ],
  bold: [
    { ar: ['Lalezar', 'Cairo'], en: ['Bebas Neue', 'Poppins'], advice: 'strong' },
    { ar: ['Changa', 'Cairo'], en: ['Archivo Black', 'Inter'], advice: 'modern' },
    { ar: ['Lemonada', 'Tajawal'], en: ['Space Grotesk', 'DM Sans'], advice: 'playful' },
  ],
  earthy: [
    { ar: ['Markazi Text', 'Tajawal'], en: ['Fraunces', 'Karla'], advice: 'warm' },
    { ar: ['El Messiri', 'Almarai'], en: ['Lora', 'Nunito'], advice: 'classic' },
    { ar: ['Reem Kufi', 'Cairo'], en: ['Josefin Sans', 'Work Sans'], advice: 'clean' },
  ],
  retro: [
    { ar: ['Rakkas', 'Tajawal'], en: ['Abril Fatface', 'Karla'], advice: 'vintage' },
    { ar: ['Lemonada', 'Almarai'], en: ['Fraunces', 'Nunito'], advice: 'playful' },
    { ar: ['Aref Ruqaa', 'Markazi Text'], en: ['Playfair Display', 'Josefin Sans'], advice: 'elegant' },
  ],
};

/* خطوط لها وزن واحد فقط (لا يوجد منها "عريض")، فلا نطلب لها الوزن 700 */
const SINGLE_WEIGHT_FONTS = ['Lalezar', 'Rakkas', 'Bebas Neue', 'Abril Fatface', 'Archivo Black'];

/* وزن العنوان المناسب لكل خط */
function headingWeight(font) {
  return SINGLE_WEIGHT_FONTS.includes(font) ? 400 : 700;
}

/*
  الأزواج الستة التي تظهر في نافذة "الخطوط":
  أول 3 = تناسب أسلوب الألوان، وآخر 3 = "جرّب أيضاً" (أول زوج من 3 أساليب أخرى).
  كل زوج يحمل اسم أسلوبه (style) حتى نعرف من أين جاء.
*/
function fontPairsFor(style) {
  const own = (FONT_PAIRS[style] || FONT_PAIRS.minimal).map((p) => ({ ...p, style }));
  const order = Object.keys(FONT_PAIRS);
  const start = order.indexOf(style);
  const others = [1, 2, 3].map((k) => order[(start + k) % order.length])
    .map((s) => ({ ...FONT_PAIRS[s][0], style: s }));
  return [...own, ...others];
}

/*
  يحمّل خطوط الأسلوب (والأزواج الثلاثة الإضافية) من Google Fonts (مرة واحدة لكل أسلوب).
  نضيف رابط <link> في رأس الصفحة، والمتصفح يحمّل الخطوط تلقائياً.
*/
function loadFontsForStyle(style) {
  const pairs = fontPairsFor(style);
  const names = new Set();
  pairs.forEach((p) => [...p.ar, ...p.en].forEach((f) => names.add(f)));

  const families = [...names].map((f) => {
    const name = f.replace(/ /g, '+');
    return SINGLE_WEIGHT_FONTS.includes(f) ? 'family=' + name : 'family=' + name + ':wght@400;700';
  });
  const href = 'https://fonts.googleapis.com/css2?' + families.join('&') + '&display=swap';

  const id = 'fonts-' + style;
  if (document.getElementById(id)) return; // حُمّلت من قبل
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
