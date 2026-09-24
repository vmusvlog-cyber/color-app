/* =========================================================================
   techniques.js — تقنيات التسويق العشر (من صاحب التطبيق)
   كل تقنية لها ألوانها الأصلية الثابتة (لا نغيّرها أبداً، حتى مع حار/بارد).
   ترتيب الألوان: [0] الخلفية  [1] اللون الرئيسي  [2] التمييز/النص
   (هذا نفس ترتيب "الأدوار" في التطبيق، لذلك نرتبها حسب فكرة كل تقنية).

   الأسماء والشرح بالعربي والإنجليزي في i18n.js تحت 'tech.<id>.*'.
   أما وصف البرومبت (prompt) فهو إنجليزي دائماً مثل prompts.js.
   style = أسلوب الخطوط المناسب لها (من الأساليب الخمسة).
   ========================================================================= */
const TECHNIQUES = [
  {
    id: 'pattern-interruption',
    colors: ['#1A1A1A', '#FFD700', '#F5F5F7'],
    style: 'bold',
    prompt: 'place one contrasting, high-saturation focal element amidst a uniform grid of neutral items; uniform repeating grid with a single off-axis breakout element',
  },
  {
    id: 'selective-color',
    colors: ['#FFFFFF', '#FF2A00', '#000000'],
    style: 'bold',
    prompt: 'desaturate the background completely (black and white) and apply a vibrant fire-red exclusively to the key product or call-to-action; monochrome layered backdrop with a high-impact focal point dead-center',
  },
  {
    id: 'guided-color-harmony',
    colors: ['#2B2D42', '#FF6B6B', '#FFE66D'],
    style: 'luxury',
    prompt: 'smooth diagonal or radial gradient flow from warm tones into a deep dark tone, directing the gaze toward clean, balanced central typography',
  },
  {
    id: '3d-primary-colors',
    colors: ['#0055FF', '#FFCC00', '#FF0055'],
    style: 'bold',
    prompt: 'layered primary-color geometric shapes with hard drop shadows that build dimensional depth, floating isometric elements casting distinct shadows',
  },
  {
    id: 'experimental-typography',
    colors: ['#FF007F', '#FFFFFF', '#0A0A0A'],
    style: 'bold',
    prompt: 'headline typography rotated 15 to 90 degrees on an aggressive saturated fuchsia background, asymmetrical text placement with vertical stacking and heavy scale contrast',
  },
  {
    id: 'high-contrast-palette',
    colors: ['#0D0D0D', '#00F0FF', '#FFFFFF'],
    style: 'minimal',
    prompt: 'clean color swatches with their exact hex codes shown as main graphic elements in monospace type, split grid of color blocks on a dark backdrop with neon accents',
  },
  {
    id: 'neon-electric',
    colors: ['#0B0F19', '#00FF66', '#00E5FF'],
    style: 'bold',
    prompt: 'dark interface illuminated by glowing neon green and electric blue borders and central glows, high-tech dashboard atmosphere',
  },
  {
    id: 'minimalist-conceptual',
    colors: ['#EAEAEA', '#333333', '#FFFFFF'],
    style: 'minimal',
    prompt: 'very few elements, soft directional shadows and vast negative space, centrally balanced composition with delicate drop shadows',
  },
  {
    id: 'typography-first-integration',
    colors: ['#FFC107', '#212121', '#FFFFFF'],
    style: 'bold',
    prompt: 'the product photo overlaps giant heavy-weight headline text on a warm golden-yellow background, the subject breaks the typographic boundary',
  },
  {
    id: 'anthropomorphism',
    colors: ['#FFF5EE', '#FF8C00', '#2D2D2D'],
    style: 'retro',
    prompt: 'an everyday product given simple playful human expressions (eyes, smile), centered character-driven layout with expressive focal points',
  },
];

/* يرجع التقنية من اسمها (أو null) */
function getTechnique(id) {
  return TECHNIQUES.find((tq) => tq.id === id) || null;
}

/* اسم التقنية بالإنجليزية (للبرومبت، لأنه إنجليزي دائماً) */
function techniqueNameEn(tq) {
  const saved = currentLang;
  currentLang = 'en';
  const name = t('tech.' + tq.id + '.name');
  currentLang = saved;
  return name;
}

/*
  مثال صغير مرسوم بـ CSS يوضح فكرة كل تقنية (بدل صور أو مكتبة Tailwind).
  نستخدم ألوان التقنية نفسها. الشكل كله في css/style.css تحت .tdemo-*
*/
function techniqueDemoHtml(tq) {
  const [a, b, c] = tq.colors;
  const cells = (n, special) => Array.from({ length: n }, (_, i) =>
    `<i${i === special ? ' class="hot"' : ''}></i>`).join('');
  const demos = {
    'pattern-interruption': `<div class="tdemo-grid">${cells(6, 1)}</div>`,
    'selective-color': `<div class="tdemo-dots">${cells(5, 2)}</div>`,
    'guided-color-harmony': `<span class="tdemo-word">Aa</span>`,
    '3d-primary-colors': `<span class="tdemo-block">Aa</span>`,
    'experimental-typography': `<span class="tdemo-tilt">BOLD</span>`,
    'high-contrast-palette': `<div class="tdemo-codes">${tq.colors.map((x) => `<span><i style="background:${x}"></i>${x}</span>`).join('')}</div>`,
    'neon-electric': `<span class="tdemo-neon">Aa</span>`,
    'minimalist-conceptual': `<span class="tdemo-card"></span>`,
    'typography-first-integration': `<span class="tdemo-big">BIG</span><i class="tdemo-product"></i>`,
    'anthropomorphism': `<span class="tdemo-face"><i></i><i></i><b></b></span>`,
  };
  return `
    <div class="tdemo tdemo-${tq.id}" style="--a:${a}; --b:${b}; --c:${c}" aria-hidden="true">
      ${demos[tq.id] || ''}
    </div>`;
}
