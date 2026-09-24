/* =========================================================================
   scenes.js — رسومات بسيطة بالكود (SVG) بدل الصور
   SVG = طريقة لرسم أشكال (دوائر، مستطيلات، خطوط) بكتابة نص.
   ميزتها: خفيفة جداً، واضحة على كل الشاشات، ولا تحتاج إنترنت.
   ========================================================================= */

/* الإطار العام لكل رسمة: مساحة 160×120 */
function svgFrame(content) {
  return `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${content}</svg>`;
}

/* رسومات المزاج — كل مزاج له منظر مختلف بألوانه */
function moodScene(mood) {
  const [a, b, c] = MOODS[mood].colors;
  const scenes = {
    // هادئ: شمس ناعمة وأمواج
    calm: `
      <rect width="160" height="120" fill="${a}"/>
      <circle cx="112" cy="38" r="16" fill="#FFFFFF" opacity=".8"/>
      <path d="M0 78 Q20 68 40 78 T80 78 T120 78 T160 78 V120 H0Z" fill="${b}"/>
      <path d="M0 94 Q20 84 40 94 T80 94 T120 94 T160 94 V120 H0Z" fill="${c}"/>`,
    // حيوي: شمس كبيرة وأشعة
    energetic: `
      <rect width="160" height="120" fill="${a}"/>
      <g stroke="${c}" stroke-width="6" stroke-linecap="round">
        <line x1="80" y1="8" x2="80" y2="24"/><line x1="80" y1="96" x2="80" y2="112"/>
        <line x1="26" y1="60" x2="42" y2="60"/><line x1="118" y1="60" x2="134" y2="60"/>
        <line x1="42" y1="22" x2="53" y2="33"/><line x1="107" y1="87" x2="118" y2="98"/>
        <line x1="118" y1="22" x2="107" y2="33"/><line x1="53" y1="87" x2="42" y2="98"/>
      </g>
      <circle cx="80" cy="60" r="26" fill="${b}"/>`,
    // دافئ: غروب فوق التلال
    warm: `
      <rect width="160" height="120" fill="${a}"/>
      <circle cx="80" cy="72" r="30" fill="${b}"/>
      <path d="M0 84 Q40 62 80 84 T160 80 V120 H0Z" fill="${c}"/>
      <path d="M0 100 Q50 86 100 100 T160 98 V120 H0Z" fill="${c}" opacity=".7"/>`,
    // أنيق: أقواس رفيعة ذهبية على خلفية داكنة
    elegant: `
      <rect width="160" height="120" fill="${a}"/>
      <path d="M52 110 V58 A28 28 0 0 1 108 58 V110" fill="none" stroke="${b}" stroke-width="2.5"/>
      <path d="M62 110 V62 A18 18 0 0 1 98 62 V110" fill="none" stroke="${b}" stroke-width="1.2" opacity=".7"/>
      <circle cx="80" cy="30" r="4" fill="${c}"/>`,
    // طبيعي: أوراق شجر
    natural: `
      <rect width="160" height="120" fill="${a}"/>
      <ellipse cx="60" cy="62" rx="16" ry="40" fill="${b}" transform="rotate(-30 60 62)"/>
      <ellipse cx="100" cy="62" rx="16" ry="40" fill="${c}" transform="rotate(25 100 62)"/>
      <ellipse cx="80" cy="70" rx="12" ry="34" fill="${b}" opacity=".7"/>
      <line x1="80" y1="104" x2="80" y2="40" stroke="${c}" stroke-width="2"/>`,
    // مرح: دوائر ملونة متناثرة
    playful: `
      <rect width="160" height="120" fill="${a}"/>
      <circle cx="42" cy="40" r="20" fill="${b}"/>
      <circle cx="110" cy="76" r="26" fill="${c}"/>
      <circle cx="120" cy="28" r="9" fill="${b}"/>
      <circle cx="54" cy="92" r="11" fill="${c}"/>
      <circle cx="84" cy="44" r="6" fill="${c}"/>`,
  };
  return svgFrame(scenes[mood]);
}

/* رسومات الأساليب الخمسة — "ملصق" صغير بألوان أول لوحة جاهزة من الأسلوب */
function styleScene(style) {
  const p = READY_PALETTES.find((x) => x.style === style).colors;
  const scenes = {
    // بسيط: مساحة بيضاء، خط رفيع، ونقطة لون واحدة
    minimal: `
      <rect width="160" height="120" fill="${p[0]}"/>
      <rect x="24" y="30" width="60" height="7" rx="3" fill="${p[1]}"/>
      <rect x="24" y="44" width="40" height="4" rx="2" fill="${p[4]}"/>
      <rect x="24" y="53" width="48" height="4" rx="2" fill="${p[4]}"/>
      <line x1="24" y1="80" x2="136" y2="80" stroke="${p[3]}" stroke-width="1.5"/>
      <circle cx="124" cy="40" r="12" fill="${p[2]}"/>`,
    // فاخر: خلفية داكنة وإطار ذهبي
    luxury: `
      <rect width="160" height="120" fill="${p[0]}"/>
      <rect x="14" y="12" width="132" height="96" fill="none" stroke="${p[2]}" stroke-width="1.5"/>
      <rect x="70" y="36" width="20" height="20" fill="none" stroke="${p[2]}" stroke-width="2" transform="rotate(45 80 46)"/>
      <rect x="50" y="72" width="60" height="5" rx="2" fill="${p[1]}"/>
      <rect x="62" y="83" width="36" height="3" rx="1.5" fill="${p[2]}"/>`,
    // جريء: أشكال كبيرة متداخلة وتباين قوي
    bold: `
      <rect width="160" height="120" fill="${p[0]}"/>
      <rect x="-10" y="54" width="120" height="44" fill="${p[1]}" transform="rotate(-10 50 76)"/>
      <circle cx="116" cy="42" r="30" fill="${p[2]}"/>
      <rect x="18" y="16" width="34" height="34" fill="${p[3]}"/>`,
    // ترابي: قوس وشمس وأرض
    earthy: `
      <rect width="160" height="120" fill="${p[0]}"/>
      <path d="M40 120 V70 A40 40 0 0 1 120 70 V120Z" fill="${p[3]}"/>
      <circle cx="80" cy="66" r="16" fill="${p[2]}"/>
      <rect x="0" y="100" width="160" height="20" fill="${p[1]}"/>`,
    // قديم: غروب بخطوط السبعينات
    retro: `
      <rect width="160" height="120" fill="${p[0]}"/>
      <circle cx="80" cy="84" r="46" fill="${p[3]}"/>
      <circle cx="80" cy="84" r="34" fill="${p[1]}"/>
      <circle cx="80" cy="84" r="22" fill="${p[2]}"/>
      <rect x="0" y="84" width="160" height="36" fill="${p[0]}"/>
      <rect x="0" y="90" width="160" height="5" fill="${p[1]}"/>
      <rect x="0" y="100" width="160" height="5" fill="${p[2]}"/>`,
  };
  return svgFrame(scenes[style]);
}
