/* =========================================================================
   brand.js — خاصية "ابنِ هويتك البصرية" (#/brand)
   4 خطوات في شاشة واحدة:
     1) ألوانك: 3 أسئلة سهلة، أو صورة (شعارك، منتجك، محلك...) ← 3 لوحات يختار واحدة
     2) خطّك: 6 أزواج خطوط بألوان لوحته
     3) معلوماتك: اسم البراند (مطلوب) + نص حتى 4 أسطر + التواصل والسوشيال (اختياري)
     4) دليلك: 12 صفحة (ترسمها brandpages.js) + تحميل PDF واحد + أوامر صور للنسخ
   الخطوات محفوظة في state.brand (وليست في الرابط)، وزر "رجوع" يرجع خطوة.
   ========================================================================= */

/* الأسئلة الثلاثة: كل خيار يحدد الإحساس وقوة الألوان والأسلوب (مثل sections.js) */
const BRAND_QUESTIONS = [
  { key: 'who', options: { personal: {}, business: {} } },
  { key: 'field', options: {
    fashion: { ind: 'fashion' }, beauty: { ind: 'fashion' }, food: { ind: 'food' }, tech: { ind: 'tech' },
    health: { ind: 'health' }, education: { ind: 'education' }, realestate: { ind: 'home' },
    creative: { ind: 'creative' }, finance: { ind: 'finance' }, retail: { ind: 'fashion' },
  } },
  { key: 'trait', options: {
    trusted:  { feel: 'trust', mood: 'calm', style: 'minimal' },
    luxury:   { feel: 'luxury', mood: 'elegant', style: 'luxury' },
    modern:   { feel: 'pro', mood: 'calm', style: 'minimal' },
    bold:     { feel: 'energy', mood: 'energetic', style: 'bold' },
    friendly: { feel: 'joy', mood: 'warm', style: 'earthy' },
    creative: { feel: 'creative', mood: 'playful', style: 'bold' },
    calm:     { feel: 'calm', mood: 'calm', style: 'minimal' },
    youthful: { feel: 'joy', mood: 'playful', style: 'bold' },
    natural:  { feel: 'nature', mood: 'natural', style: 'earthy' },
    expert:   { feel: 'pro', mood: 'elegant', style: 'minimal' },
  } },
];

/* خانات المعلومات. name مطلوب، والباقي اختياري (ما يُترك فارغاً لا يظهر في الدليل) */
const BRAND_FIELDS = ['person', 'title', 'phone', 'email', 'web', 'instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'];
const BRAND_DESC_MAX = 250; // حوالي 4 أسطر

function newBrandState() {
  return {
    step: 'colors', q: 0, answers: {}, options: [], fromPhoto: false,
    colors: null, style: 'minimal', fontIndex: 0,
    info: Object.fromEntries(['name', 'desc', ...BRAND_FIELDS].map((k) => [k, ''])),
    pages: null, pagesKey: '',
  };
}

/* ---------- الشاشة ---------- */
function renderBrand() {
  if (!state.brand) state.brand = newBrandState();
  const b = state.brand;
  const steps = ['colors', 'font', 'info', 'guide'];
  const current = steps.indexOf(b.step);

  app.innerHTML = `
    <a class="back-link" href="#/" id="brand-back"><span class="back-arrow" aria-hidden="true">←</span> ${t('common.back')}</a>
    <header class="page-head">
      <h1>${t('brand.title')}</h1>
      <p class="lead">${t('brand.subtitle')}</p>
    </header>
    <ol class="brand-steps">
      ${steps.map((s, i) => `<li class="${i === current ? 'on' : i < current ? 'done' : ''}">${i + 1}. ${t('brand.step.' + s)}</li>`).join('')}
    </ol>
    <div id="brand-body"></div>
  `;

  // "رجوع": خطوة للخلف داخل الخاصية، ومن أول خطوة للواجهة الأولى
  document.getElementById('brand-back').addEventListener('click', (e) => {
    if (b.step === 'colors' && !b.options.length && b.q === 0) return; // نترك الرابط يعمل (للواجهة)
    e.preventDefault();
    if (b.step === 'colors') { if (b.options.length) b.options = []; else b.q--; }
    else b.step = steps[current - 1];
    renderBrand();
  });

  if (b.step === 'colors') renderBrandColors();
  else if (b.step === 'font') renderBrandFont();
  else if (b.step === 'info') renderBrandInfo();
  else renderBrandGuide();
}

/* ---------- الخطوة 1: الألوان ---------- */
function renderBrandColors() {
  const b = state.brand;
  const body = document.getElementById('brand-body');

  // 3 لوحات جاهزة للاختيار
  if (b.options.length) {
    body.innerHTML = `
      <h2 class="section-title">${t(b.fromPhoto ? 'brand.pickPhoto' : 'brand.pick')}</h2>
      <div class="options-list">
        ${b.options.map((colors, i) => `
          <button type="button" class="option-card brand-option" data-pick="${i}">
            <div class="option-strip">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
            <div class="option-info">
              <p dir="ltr" class="brand-hexes">${colors.join('  ')}</p>
              <span class="btn btn-small btn-primary">${t('options.choose')}</span>
            </div>
          </button>`).join('')}
      </div>
      <div class="actions"><button type="button" class="btn" id="brand-restart">${t('brand.restart')}</button></div>
    `;
    body.querySelectorAll('[data-pick]').forEach((btn) => btn.addEventListener('click', () => {
      b.colors = b.options[Number(btn.dataset.pick)];
      if (b.fromPhoto) b.style = detectStyle(b.colors);
      b.fontIndex = 0;
      b.step = 'font';
      renderBrand();
      window.scrollTo(0, 0);
    }));
    document.getElementById('brand-restart').addEventListener('click', () => {
      state.brand = { ...newBrandState(), info: b.info };
      renderBrand();
    });
    return;
  }

  // سؤال واحد في كل مرة، وفوقه خيار الصورة
  const q = BRAND_QUESTIONS[b.q];
  body.innerHTML = `
    <section class="brand-photo">
      <div>
        <h2>${t('brand.photo.title')}</h2>
        <p class="small-hint">${t('brand.photo.hint')}</p>
      </div>
      <div class="upload-buttons">
        <label class="btn" for="brand-camera">${t('upload.camera')}</label>
        <label class="btn" for="brand-file">${t('upload.pick')}</label>
        <input type="file" id="brand-camera" accept="image/*" capture="environment" hidden>
        <input type="file" id="brand-file" accept="image/*" hidden>
      </div>
    </section>

    <div class="quiz">
      <p class="eyebrow">${t('brand.orAnswer')} · ${t('quiz.step', { n: b.q + 1, total: BRAND_QUESTIONS.length })}</p>
      <div class="progress"><span style="width:${((b.q + 1) / BRAND_QUESTIONS.length) * 100}%"></span></div>
      <h1>${t('brand.q.' + q.key)}</h1>
      <div class="choice-chips">
        ${Object.keys(q.options).map((opt) => `
          <button type="button" class="choice-chip ${b.answers[q.key] === opt ? 'selected' : ''}" data-value="${opt}">${t('brand.q.' + q.key + '.' + opt)}</button>`).join('')}
      </div>
    </div>
  `;

  body.querySelectorAll('[data-value]').forEach((btn) => btn.addEventListener('click', () => {
    b.answers[q.key] = btn.dataset.value;
    if (b.q < BRAND_QUESTIONS.length - 1) b.q++;
    else makeBrandOptions();
    renderBrand();
    window.scrollTo(0, 0);
  }));

  ['brand-camera', 'brand-file'].forEach((id) => {
    document.getElementById(id).addEventListener('change', (e) => {
      if (e.target.files[0]) brandFromPhoto(e.target.files[0]);
    });
  });
}

/* يصنع 3 لوحات من إجابات الأسئلة */
function makeBrandOptions() {
  const b = state.brand;
  const p = { mood: 'calm', style: 'minimal' };
  BRAND_QUESTIONS.forEach((q) => Object.assign(p, q.options[b.answers[q.key]] || {}));
  const temp = state.refine.temp; // زر حار/بارد في الأعلى يُحترم هنا أيضاً
  const refine = { ...defaultRefine(), temp, feel: p.feel && feelingsFor(temp).includes(p.feel) ? p.feel : '' };
  b.style = p.style;
  b.fromPhoto = false;
  b.options = generateFromAnswers({ industry: p.ind, mood: p.mood, style: p.style }, refine)
    .map((o) => applyRefine(o.colors, refine, [], { skipFeeling: true, style: p.style }).slice(0, 5));
}

/* من صورة: نستخرج ألوانها (داخل الجهاز فقط) ونقترح 3 لوحات منها */
function brandFromPhoto(file) {
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const hexes = extractColors(img, IMAGE_COLORS).map((c) => c.hex);
      const b = state.brand;
      b.options = generateFromImage(hexes).map((o) => o.colors.slice(0, 5));
      b.fromPhoto = true;
      renderBrand();
    } catch (err) {
      toast(t('upload.error'));
    }
    URL.revokeObjectURL(src);
  };
  img.onerror = () => toast(t('upload.error'));
  img.src = src;
}

/* ---------- الخطوة 2: الخط ---------- */
function renderBrandFont() {
  const b = state.brand;
  loadFontsForStyle(b.style);
  const pairs = fontPairsFor(b.style);
  const body = document.getElementById('brand-body');
  body.innerHTML = `
    <h2 class="section-title">${t('brand.fontTitle')}</h2>
    <p class="small-hint">${t('brand.fontHint')}</p>
    <div class="font-list brand-fonts">${pairs.map((p, i) => fontCardHtml(p, i, b.colors, b.fontIndex)).join('')}</div>
    <div class="actions"><button type="button" class="btn btn-primary" id="brand-next">${t('brand.next')}</button></div>
  `;
  body.querySelectorAll('.font-card').forEach((btn) => btn.addEventListener('click', () => {
    b.fontIndex = Number(btn.dataset.index);
    renderBrandFont();
  }));
  document.getElementById('brand-next').addEventListener('click', () => { b.step = 'info'; renderBrand(); window.scrollTo(0, 0); });
}

/* ---------- الخطوة 3: المعلومات ---------- */
function renderBrandInfo() {
  const b = state.brand;
  const field = (k, type = 'text', extra = '') => `
    <label class="brand-field">
      <span>${t('brand.f.' + k)}</span>
      <input type="${type}" name="${k}" value="${escapeHtml(b.info[k])}" maxlength="60" ${extra}
             ${['email', 'web', 'phone', 'instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'].includes(k) ? 'dir="ltr"' : ''}
             placeholder="${t('brand.ph.' + k)}">
    </label>`;
  const body = document.getElementById('brand-body');
  body.innerHTML = `
    <form id="brand-form" class="brand-form" novalidate>
      <label class="brand-field">
        <span>${t('brand.f.name')} <b class="req">*</b></span>
        <input type="text" name="name" value="${escapeHtml(b.info.name)}" maxlength="40" required placeholder="${t('brand.ph.name')}">
      </label>
      <label class="brand-field">
        <span>${t('brand.f.desc')}</span>
        <textarea name="desc" rows="4" maxlength="${BRAND_DESC_MAX}" placeholder="${t('brand.ph.desc')}">${escapeHtml(b.info.desc)}</textarea>
        <small class="char-count" id="desc-count">${b.info.desc.length} / ${BRAND_DESC_MAX}</small>
      </label>

      <h2 class="section-title">${t('brand.contact')}</h2>
      <p class="small-hint">${t('brand.optional')}</p>
      <div class="brand-grid">
        ${field('person')}${field('title')}${field('phone', 'tel')}${field('email', 'email')}${field('web', 'url')}
      </div>
      <h2 class="section-title">${t('brand.social')}</h2>
      <div class="brand-grid">
        ${field('instagram')}${field('tiktok')}${field('linkedin')}${field('facebook')}${field('youtube')}
      </div>
      <p class="form-error" id="brand-error" hidden>${t('brand.nameRequired')}</p>
      <div class="actions"><button type="submit" class="btn btn-primary">${t('brand.make')}</button></div>
    </form>
  `;
  const form = document.getElementById('brand-form');
  // نحفظ ما يكتبه أولاً بأول (حتى لا يضيع عند الرجوع خطوة)
  form.addEventListener('input', (e) => {
    if (e.target.name) b.info[e.target.name] = e.target.value;
    document.getElementById('desc-count').textContent = `${b.info.desc.length} / ${BRAND_DESC_MAX}`;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!b.info.name.trim()) {
      document.getElementById('brand-error').hidden = false;
      form.elements.name.focus();
      return;
    }
    b.step = 'guide';
    renderBrand();
    window.scrollTo(0, 0);
  });
}

/* كل ما يحتاجه الرسم: الألوان والخطوط والمعلومات */
function brandKit() {
  const b = state.brand;
  const info = Object.fromEntries(Object.entries(b.info).map(([k, v]) => [k, v.trim()]));
  return { colors: b.colors, style: b.style, pair: fontPairsFor(b.style)[b.fontIndex], info, answers: b.answers, lang: currentLang };
}

/* ---------- الخطوة 4: دليل الهوية ---------- */
async function renderBrandGuide() {
  const b = state.brand;
  const kit = brandKit();
  const prompts = brandPrompts(kit);
  const body = document.getElementById('brand-body');
  body.innerHTML = `
    <div class="brand-guide-head">
      <p class="small-hint" id="brand-status">${t('brand.working')}</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" id="brand-pdf" disabled>${t('brand.download')}</button>
        <button type="button" class="btn" id="brand-edit">${t('brand.edit')}</button>
      </div>
    </div>
    <div class="brand-pages" id="brand-pages"></div>

    <section class="result-section">
      <h2 class="section-title">${t('brand.prompts')}</h2>
      <p class="small-hint">${t('brand.promptsHint')}</p>
      <div class="prompt-list">
        ${prompts.map((p, i) => `
          <div class="prompt-card">
            <div class="prompt-head"><strong>${t('brand.pr.' + p.key)}</strong>
              <button type="button" class="btn btn-small btn-primary" data-brand-copy="${i}">${t('prompt.copy')}</button></div>
            <p class="prompt-text" dir="ltr">${escapeHtml(p.text)}</p>
          </div>`).join('')}
      </div>
    </section>
  `;
  document.getElementById('brand-edit').addEventListener('click', () => { b.step = 'info'; renderBrand(); });
  body.querySelectorAll('[data-brand-copy]').forEach((btn) => btn.addEventListener('click', () => {
    const text = prompts[Number(btn.dataset.brandCopy)].text;
    navigator.clipboard.writeText(text).then(() => toast(t('prompt.copied')), () => toast(t('prompt.copyFail')));
  }));

  // نرسم الصفحات مرة واحدة لكل مجموعة معلومات (ونعيد استخدامها عند التحميل)
  const key = JSON.stringify(kit);
  if (b.pagesKey !== key) {
    b.pages = await drawBrandPages(kit, prompts);
    b.pagesKey = key;
  }
  if (!document.body.contains(body)) return; // غادر الشاشة أثناء الرسم
  document.getElementById('brand-pages').innerHTML = b.pages.map((c, i) =>
    `<figure class="brand-page"><img src="${c.toDataURL('image/jpeg', 0.8)}" alt="${t('brand.page', { n: i + 1 })}"><figcaption>${i + 1}. ${t('brand.pageName.' + (i + 1))}</figcaption></figure>`).join('');
  document.getElementById('brand-status').textContent = t('brand.ready', { n: b.pages.length });
  const pdfBtn = document.getElementById('brand-pdf');
  pdfBtn.disabled = false;
  pdfBtn.addEventListener('click', () => {
    const bytes = makePdfFromCanvases(b.pages);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    // اسم الملف بحروف إنجليزية فقط (بعض المتصفحات لا تقبل العربي في اسم الملف)
    const safe = kit.info.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    triggerDownload(url, safe ? `${safe}-brand-guide.pdf` : 'brand-guide.pdf');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
}

/* ---------- أوامر صور جاهزة (إنجليزية دائماً، مثل prompts.js) ---------- */
function brandPrompts(kit) {
  const [bg, main, accent] = kit.colors;
  const dark = kit.colors[3] || main;
  const name = `"${kit.info.name}"`;
  const style = STYLE_WORDS[kit.style] || STYLE_WORDS.minimal;
  const font = `headline typeface similar to ${kit.pair.en[0]}`;
  const palette = `Use exactly this color palette: ${kit.colors.map(colorPhrase).join(', ')}.`;
  // وصف البراند (بدون نقطة زائدة في آخره)
  const desc = kit.info.desc.replace(/\s+/g, ' ').replace(/[.。!؟?]+$/, '');
  const about = desc ? ` The brand is about: ${desc}.` : '';
  // text = الأمر الكامل للنسخ. short = نفس الأمر بدون الوصف (للصفحة المطبوعة حتى تتسع كل الأوامر)
  const make = (key, body) => ({
    key,
    text: `${body}, ${style}.${about} ${palette} High detail, professional design, no watermark.`,
    short: `${body}, ${style}. ${palette}`,
  });
  return [
    make('logo', `Professional vector logo design for the brand ${name}, a simple memorable symbol in ${colorPhrase(main)} with a detail in ${colorPhrase(accent)} next to the wordmark in ${colorPhrase(dark)}, on ${an(colorPhrase(bg))} background, ${font}`),
    make('card', `Photorealistic mockup of business cards for ${name} on a desk, front in ${colorPhrase(main)} with the logo, back in ${colorPhrase(bg)} with contact details in ${colorPhrase(dark)}, ${font}`),
    make('stationery', `Brand stationery set for ${name}: letterhead, envelope and notebook, colors ${colorPhrase(bg)}, ${colorPhrase(main)} and ${colorPhrase(accent)}, ${font}`),
    make('instagram', `Grid of 9 Instagram posts for ${name} with a consistent look, backgrounds alternating ${colorPhrase(bg)} and ${colorPhrase(main)}, highlights in ${colorPhrase(accent)}, ${font}`),
    make('highlights', `Set of 5 Instagram story highlight cover icons for ${name}, simple line icons in ${colorPhrase(bg)} on round backgrounds of ${colorPhrase(main)} and ${colorPhrase(accent)}`),
    make('facebook', `Facebook cover photo design (1640x624) for ${name}, background ${colorPhrase(main)}, logo and short slogan in ${colorPhrase(bg)}, graphic accents in ${colorPhrase(accent)}, ${font}`),
    make('linkedin', `LinkedIn banner (1584x396) for ${name}, clean professional layout, background ${colorPhrase(dark)}, text in ${colorPhrase(bg)}, thin accent line in ${colorPhrase(accent)}, ${font}`),
    make('video', `YouTube thumbnail and TikTok cover for ${name}, bold hook text in ${colorPhrase(bg)} on ${colorPhrase(main)} shapes, highlight words in ${colorPhrase(accent)}, person on one side, ${font}`),
    make('website', `Modern website homepage design for ${name} shown on a laptop, ${colorPhrase(bg)} background, navigation and headings in ${colorPhrase(dark)}, buttons in ${colorPhrase(main)}, highlights in ${colorPhrase(accent)}, ${font}`),
  ];
}
