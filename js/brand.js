/* =========================================================================
   brand.js — خاصية "ابنِ هويتك البصرية" (#/brand)
   4 خطوات في شاشة واحدة:
     1) ألوانك: 12 سؤالاً بضغطات (brandquiz.js)، أو صورة ← 3 لوحات يختار واحدة
        ← ثم يراجع لوحته ويبدّل أي لون لا يعجبه
     2) خطّك: 6 أزواج خطوط بألوان لوحته
     3) معلوماتك: اسم البراند (مطلوب) + نص حتى 4 أسطر + التواصل والسوشيال (اختياري)
     4) دليلك: 12 صفحة (ترسمها brandpages.js) + تحميل PDF واحد + أوامر صور للنسخ
   الخطوات محفوظة في state.brand (وليست في الرابط)، وزر "رجوع" يرجع خطوة.
   ========================================================================= */

/* خانات المعلومات. name مطلوب، والباقي اختياري (ما يُترك فارغاً لا يظهر في الدليل) */
const BRAND_FIELDS = ['person', 'title', 'phone', 'email', 'web', 'instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'];
const BRAND_DESC_MAX = 250; // حوالي 4 أسطر

function newBrandState() {
  return {
    step: 'colors', q: 0, answers: {}, options: [], fromPhoto: false, review: false,
    shown: {},        // الدوائر الظاهرة في سؤالي "لون تحبه" و"لون لا تريده"
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
    if (b.step === 'colors') {
      if (b.review) b.review = false;          // من مراجعة اللوحة إلى اللوحات الثلاث
      else if (b.options.length) b.options = [];
      else b.q--;
    }
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
  if (b.review) return renderBrandReview();
  if (b.options.length) return renderBrandOptions();
  const body = document.getElementById('brand-body');
  const q = BRAND_STEPS[b.q];
  const total = BRAND_STEPS.length;
  const picked = b.answers[q.key];
  const isOn = (v) => (Array.isArray(picked) ? picked.includes(v) : picked === v);

  // شكل الخيارات حسب نوع السؤال
  let choices;
  if (q.type === 'colors') {
    choices = `
      <div class="swatch-grid">
        ${swatchesShown(b, q.key).map((c, i) => `
          <div class="swatch-cell">
            <button type="button" class="swatch-pick ${isOn(c) ? 'selected' : ''}" data-swatch="${i}" style="background:${c}"
                    aria-pressed="${isOn(c)}" title="${t('famname.' + colorFamily(c))}"></button>
            <small class="swatch-name">${t('famname.' + colorFamily(c))}</small>
            <button type="button" class="swatch-skip" data-skip="${i}">${t('bq.skip')}</button>
          </div>`).join('')}
      </div>`;
  } else {
    choices = `
      <div class="choice-chips">
        ${q.options.map((opt) => `
          <button type="button" class="choice-chip ${isOn(opt) ? 'selected' : ''}" data-value="${opt}"
                  aria-pressed="${isOn(opt)}">${t('bq.' + q.key + '.' + opt)}</button>`).join('')}
      </div>`;
  }
  const multi = q.type !== 'single';

  body.innerHTML = `
    ${b.q === 0 ? `
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
      </section>` : ''}

    <div class="quiz">
      <p class="eyebrow">${b.q === 0 ? t('brand.orAnswer') + ' · ' : ''}${t('quiz.step', { n: b.q + 1, total })}</p>
      <div class="progress"><span style="width:${((b.q + 1) / total) * 100}%"></span></div>
      <h1>${t('bq.' + q.key)}</h1>
      <p class="small-hint">${t(multi ? 'bq.multiHint' : 'bq.singleHint')}</p>
      ${choices}
      <div class="quiz-nav">
        ${b.q > 0 ? `<button type="button" class="btn btn-small" id="bq-prev"><span class="back-arrow" aria-hidden="true">←</span> ${t('quiz.prev')}</button>` : '<span></span>'}
        ${multi ? `<button type="button" class="btn btn-primary" id="bq-next">${picked && picked.length ? t('brand.next') : t('bq.any')}</button>` : ''}
      </div>
    </div>
  `;

  const next = () => {
    if (b.q < total - 1) b.q++;
    else {
      const made = brandOptionsFromAnswers(b.answers);
      b.options = made.options;
      b.style = made.style;
      b.fromPhoto = false;
    }
    renderBrand();
    window.scrollTo(0, 0);
  };

  // جواب واحد: نحفظ وننتقل. أكثر من جواب: نضيف أو نزيل (بلا حد)
  body.querySelectorAll('[data-value]').forEach((btn) => btn.addEventListener('click', () => {
    const v = btn.dataset.value;
    if (!multi) { b.answers[q.key] = v; next(); return; }
    const list = b.answers[q.key] || [];
    b.answers[q.key] = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    renderBrandColors();
  }));

  // الدوائر: الضغط يختار، و"بدّل" يزحلق لوناً جديداً مكانه
  body.querySelectorAll('[data-swatch]').forEach((btn) => btn.addEventListener('click', () => {
    const c = swatchesShown(b, q.key)[Number(btn.dataset.swatch)];
    const list = b.answers[q.key] || [];
    b.answers[q.key] = list.includes(c) ? list.filter((x) => x !== c) : [...list, c];
    renderBrandColors();
  }));
  body.querySelectorAll('[data-skip]').forEach((btn) => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.skip);
    const shown = swatchesShown(b, q.key);
    const old = shown[i];
    const fresh = nextSwatch(shown);
    const cell = btn.closest('.swatch-cell');
    slideSwap(cell.querySelector('.swatch-pick'), () => {
      shown[i] = fresh;
      b.answers[q.key] = (b.answers[q.key] || []).filter((x) => x !== old); // المُبدَّل لم يعد مختاراً
      const pick = cell.querySelector('.swatch-pick');
      pick.style.background = fresh;
      pick.classList.remove('selected');
      pick.title = t('famname.' + colorFamily(fresh));
      cell.querySelector('.swatch-name').textContent = t('famname.' + colorFamily(fresh));
    });
  }));

  const nextBtn = document.getElementById('bq-next');
  if (nextBtn) nextBtn.addEventListener('click', next);
  const prev = document.getElementById('bq-prev');
  if (prev) prev.addEventListener('click', () => { b.q--; renderBrand(); });

  ['brand-camera', 'brand-file'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('change', (e) => { if (e.target.files[0]) brandFromPhoto(e.target.files[0]); });
  });
}

/* 3 لوحات للاختيار */
function renderBrandOptions() {
  const b = state.brand;
  const body = document.getElementById('brand-body');
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
    <div class="actions">
      <button type="button" class="btn" id="brand-more">${t('options.more')}</button>
      <button type="button" class="btn" id="brand-restart">${t('brand.restart')}</button>
    </div>
  `;
  body.querySelectorAll('[data-pick]').forEach((btn) => btn.addEventListener('click', () => {
    b.colors = [...b.options[Number(btn.dataset.pick)]];
    if (b.fromPhoto) b.style = detectStyle(b.colors);
    b.review = true;
    renderBrand();
    window.scrollTo(0, 0);
  }));
  document.getElementById('brand-more').addEventListener('click', () => {
    if (!b.fromPhoto) b.options = brandOptionsFromAnswers(b.answers).options;
    renderBrandOptions();
  });
  document.getElementById('brand-restart').addEventListener('click', () => {
    state.brand = { ...newBrandState(), info: b.info };
    renderBrand();
  });
}

/* مراجعة اللوحة: كل لون له "بدّل" (ينزلق للأعلى ويأتي لون آخر) */
function renderBrandReview() {
  const b = state.brand;
  const avoid = (b.answers.avoid || []).map(colorFamily);
  const body = document.getElementById('brand-body');
  const col = (c, i) => `
    <div class="review-col">
      <div class="review-swatch" style="background:${c}; color:${isLight(c) ? '#1a1a1a' : '#fff'}">
        <span class="strip-role">${roleName(i, c)}</span>
        <strong>${colorName(c)}</strong>
        <code dir="ltr">${c}</code>
      </div>
      <button type="button" class="btn btn-small swatch-skip" data-swap="${i}">${t('bq.skip')}</button>
    </div>`;
  body.innerHTML = `
    <h2 class="section-title">${t('bq.review')}</h2>
    <p class="small-hint">${t('bq.reviewHint')}</p>
    <div class="review-strip">${b.colors.map(col).join('')}</div>
    <div class="actions"><button type="button" class="btn btn-primary" id="brand-next">${t('brand.next')}</button></div>
  `;
  body.querySelectorAll('[data-swap]').forEach((btn) => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.swap);
    let fresh = regenerateColor(b.colors, i);
    fresh = avoidFamilies(fresh, avoid);
    const sw = btn.closest('.review-col').querySelector('.review-swatch');
    slideSwap(sw, () => {
      b.colors[i] = fresh;
      sw.style.background = fresh;
      sw.style.color = isLight(fresh) ? '#1a1a1a' : '#fff';
      sw.querySelector('strong').textContent = colorName(fresh);
      sw.querySelector('code').textContent = fresh;
      sw.querySelector('.strip-role').textContent = roleName(i, fresh);
    });
  }));
  document.getElementById('brand-next').addEventListener('click', () => {
    b.fontIndex = 0;
    b.step = 'font';
    renderBrand();
    window.scrollTo(0, 0);
  });
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
  // شكل الألوان: صافية / تدرج لونين / تدرج 3 ألوان / شفافة (يمكن أكثر من واحد)
  const effects = (b.answers.look && b.answers.look.length) ? b.answers.look : ['solid'];
  return { colors: b.colors, style: b.style, pair: fontPairsFor(b.style)[b.fontIndex], info, answers: b.answers, effects, lang: currentLang };
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
  // شكل الألوان الذي اختاره (تدرج، شفافية...)
  const lookWords = {
    grad2: `smooth two-color gradients from ${colorPhrase(main)} to ${colorPhrase(accent)}`,
    grad3: `smooth three-color gradients of ${colorPhrase(main)}, ${colorPhrase(accent)} and ${colorPhrase(kit.colors[4] || bg)}`,
    glass: 'soft semi-transparent overlapping color shapes behind the content (glass effect)',
  };
  const looks = (kit.effects || []).map((e) => lookWords[e]).filter(Boolean);
  const look = looks.length ? `, using ${looks.join(' and ')}` : '';
  const make = (key, body) => ({
    key,
    text: `${body}${look}, ${style}.${about} ${palette} High detail, professional design, no watermark.`,
    short: `${body}${look}, ${style}. ${palette}`,
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
