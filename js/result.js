/* =========================================================================
   result.js — شاشة النتيجة
   الأقسام بالترتيب:
     0) أيقونة الثقافة (اختياري)
     1) بطاقات البولارويد + قاعدة 60-30-10
     1ب) خيارات العرض: تدرجات، نسخة داكنة، للطباعة
     2) زر "لماذا هذه الألوان؟"
     3) تميّز عن منافسيك (إذا عرفنا مجالك من الاستبيان)
     4) الخطوط المقترحة
     5) المعاينات: منشور، بطاقة عمل، شعار، رأس موقع
   ========================================================================= */

let resultParams = {}; // معلومات النتيجة الحالية (تحتاجها المعاينات لاختيار المكان المناسب)

function renderResult(audience, params) {
  resultParams = params;
  // إذا فتح المستخدم نتيجة لمجال أو مكان مختلف، نرجع للمعاينة المناسبة تلقائياً
  const previewFor = [params.ind, params.space, params.use, params.pv, params.q1, params.q2].join('|');
  if (state.previewFor !== previewFor) { state.previewFor = previewFor; state.previewKind = null; }
  const colors = paramToColors(params.c);
  if (colors.length === 0) { location.hash = '#/quiz/' + audience.id; return; }

  // colors = الألوان الأصلية (من الرابط)
  // shown  = ما نعرضه فعلاً بعد تطبيق "نسخة داكنة" أو "للطباعة"
  // تقنية تسويق؟ ألوانها الأصلية لا تتغير بالحار/البارد
  const technique = getTechnique(params.tech);
  const shown = applyView(colors, !!technique);
  syncColorHistory(colors); // سجل الألوان السابقة لكل بطاقة (للسهمين)
  const hist = state.colorHistory; // (ليس history — هذا الاسم يستخدمه المتصفح)
  const title = params.p ? t('pal.' + params.p) : t('result.title');
  const style = STYLES.includes(params.s) ? params.s : detectStyle(colors);
  const industry = params.ind && INDUSTRY_COLORS[params.ind] ? params.ind : null;

  // عند تغيير الأسلوب نرجع لأول زوج خطوط
  if (state.fontStyle !== style) { state.fontStyle = style; state.fontIndex = 0; }
  loadFontsForStyle(style);

  // إلى أين يرجع زر "رجوع"
  let backHref = '#/ready/' + audience.id;
  if (params.from === 'free') backHref = '#/free/' + audience.id;
  if (params.from === 'options') backHref = state.lastOptionsHash || '#/quiz/' + audience.id;
  if (params.from === 'upload') backHref = '#/upload/' + audience.id;

  app.innerHTML = `
    ${backLink(backHref)}
    <header class="page-head">
      <div class="title-row">
        <h1>${title}</h1>
        <button type="button" class="culture-btn" id="culture-btn" aria-expanded="${state.cultureOpen}">
          <span>${state.culture ? t('culture.' + state.culture) : t('culture.button')}</span>
        </button>
      </div>
      <p class="lead">${t('result.subtitle')}</p>
    </header>

    ${technique ? `
      <!-- التقنية المختارة: اسمها وشرح قصير و"المزيد" -->
      <section class="tech-note">
        <p><strong>${t('tech.label')}: ${t('tech.' + technique.id + '.name')}</strong> — ${t('tech.' + technique.id + '.short')}</p>
        <button type="button" class="btn btn-small" id="tech-more" aria-expanded="${state.techMore}">${state.techMore ? t('tech.less') : t('tech.more')}</button>
        ${state.techMore ? techniqueDetailsHtml(technique) : ''}
      </section>` : ''}

    <!-- 0) الثقافة -->
    <section class="culture-box" id="culture-box" ${state.cultureOpen ? '' : 'hidden'}>
      ${cultureHtml(colors)}
    </section>

    <!-- 1) شريط الألوان الكبير: كل لون عمود طويل، وفيه اسمه وكوده وسهما التغيير -->
    <div class="color-strip">
      ${shown.map((c, i) => `
        <div class="strip-col" style="background:${c}; color:${isLight(c) ? '#1a1a1a' : '#ffffff'}">
          <span class="strip-role">${roleName(i, c)}</span>
          <div class="strip-info">
            <strong class="color-name">${colorName(c)}</strong>
            <button type="button" class="hex-btn" data-hex="${c}" dir="ltr">${c}</button>
            ${state.view.print ? `<span class="cmyk" dir="ltr">${cmykText(c)}</span>` : ''}
          </div>
          <!-- سهمان: السابق يرجعك للون قبله، والتالي يعطيك لوناً آخر -->
          <div class="regen-nav">
            <button type="button" class="regen-arrow" data-prev="${i}" ${hist.pos[i] === 0 ? 'disabled' : ''}
                    aria-label="${t('result.prevColor')}" title="${t('result.prevColor')}">
              <span class="back-arrow" aria-hidden="true">←</span>
            </button>
            <span class="regen-count" dir="ltr" ${hist.lists[i].length > 1 ? '' : 'style="visibility:hidden"'}>
              ${hist.pos[i] + 1}/${hist.lists[i].length}
            </span>
            <button type="button" class="regen-arrow" data-next="${i}"
                    aria-label="${t('result.regenerate')}" title="${t('result.regenerate')}">
              <span class="fwd-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- أزرار: تحميل، حفظ، مشاركة -->
    <div class="action-bar">
      <button type="button" class="btn btn-primary" id="download-btn">${t('action.download')}</button>
      <button type="button" class="btn" id="save-btn">${t('action.save')}</button>
      <button type="button" class="btn" id="share-btn">${t('action.share')}</button>
      <button type="button" class="btn" id="fonts-btn">${t('fonts.button')}</button>
      ${cloudEnabled() ? `<button type="button" class="btn" id="publish-btn">${t('action.publish')}</button>` : ''}
    </div>

    <!-- 1ب) خيارات العرض -->
    <section class="view-box">
      <div class="view-toggles" role="group" aria-label="${t('view.title')}">
        ${['gradients', 'dark', 'print'].map((key) => `
          <button type="button" class="toggle ${state.view[key] ? 'on' : ''}" role="switch"
                  aria-checked="${state.view[key]}" data-view="${key}">
            <span class="toggle-track"><span class="toggle-knob"></span></span>
            ${t('view.' + key)}
          </button>
        `).join('')}
      </div>
      ${state.view.dark ? `<p class="view-note">${t('view.darkNote')}</p>` : ''}
      ${state.view.print ? `<p class="view-note">${t('view.printNote')}</p>` : ''}
      ${state.view.gradients ? gradientsHtml(shown) : ''}
    </section>

    <!-- 2) لماذا هذه الألوان؟ -->
    <section class="why-box">
      <button type="button" class="btn" id="why-btn" aria-expanded="${state.whyOpen}">
        ${state.whyOpen ? t('why.hide') : t('why.button')}
      </button>
      <div id="why-panel" class="why-panel" ${state.whyOpen ? '' : 'hidden'}>${whyHtml(shown, industry)}</div>
    </section>

    <!-- 3) تميّز عن منافسيك -->
    ${industry ? competitorHtml(industry) : ''}

    <!-- 4) الخطوط: صارت في نافذة خاصة تفتح من زر "الخطوط" بالأعلى -->

    <!-- 5) المعاينات -->
    <section class="result-section">
      <h2 class="section-title">${t('preview.title')}</h2>
      <label class="field-label" for="project-name">${t('preview.nameLabel')}</label>
      <input type="text" id="project-name" class="name-input" maxlength="30"
             value="${escapeHtml(state.projectName)}" placeholder="${t('preview.defaultName')}">
      <h3 class="preview-pick-title">${t('preview.pick')}</h3>
      <div id="preview-picker" class="preview-picker" role="group" aria-label="${t('preview.pick')}"></div>
      <div id="previews" class="previews"></div>
    </section>

    <div class="actions">
      <a class="btn btn-primary" href="#/free/${audience.id}?c=${colorsToParam(shown)}">${t('result.edit')}</a>
      <a class="btn" href="#/ready/${audience.id}">${t('result.backReady')}</a>
    </div>
  `;

  renderPreviews(shown, style);

  /* يغيّر الألوان ويحدّث الرابط بدون إضافة خطوة جديدة لزر الرجوع */
  const updateColors = (newColors) => {
    const next = new URLSearchParams(params);
    next.set('c', colorsToParam(newColors));
    next.delete('p');                     // لم تعد اللوحة الجاهزة الأصلية
    next.set('s', style);                 // نثبّت الأسلوب حتى لا تتغير الخطوط فجأة
    history.replaceState(null, '', `#/result/${audience.id}?${next.toString()}`);
    render(true);                         // true = لا تقفز لأعلى الصفحة
  };

  // تحميل: نحمّل الألوان كما تظهر الآن (مع النسخة الداكنة أو للطباعة إن كانت مفعّلة)
  document.getElementById('download-btn').addEventListener('click', () => openDownload(shown, title));
  const techMore = document.getElementById('tech-more');
  if (techMore) techMore.addEventListener('click', () => { state.techMore = !state.techMore; render(true); });
  // الخطوط: نافذة فيها 6 أزواج بألوان اللوحة
  document.getElementById('fonts-btn').addEventListener('click', () => openFonts(shown, style));

  // حفظ في "لوحاتي" على هذا الجهاز
  // بيانات اللوحة كما نحفظها أو ننشرها
  const paletteData = { colors: shown, title: params.p || null, style, industry, audience: audience.id };

  // حفظ: في الحساب إن كان مسجلاً، وإلا في هذا الجهاز
  document.getElementById('save-btn').addEventListener('click', async () => {
    try {
      if (isSignedIn()) await cloudSavePalette(paletteData);
      else savePalette(paletteData);
      renderTopbar(); // لتحديث العدد بجانب "لوحاتي"
      toast(t('action.saved'));
    } catch (e) {
      toast(t('cloud.error'));
    }
  });

  // نشر في المعرض العام (يحتاج تسجيل دخول)
  const publishBtn = document.getElementById('publish-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      if (!isSignedIn()) { openSignIn(t('auth.forPublish')); return; }
      publishBtn.disabled = true;
      try {
        await publishPalette(paletteData);
        toast(t('action.published'));
      } catch (e) {
        toast(t('cloud.error'));
        publishBtn.disabled = false;
      }
    });
  }

  // مشاركة الرابط: في الجوال تظهر قائمة المشاركة، وإلا ننسخ الرابط
  document.getElementById('share-btn').addEventListener('click', () => {
    const url = location.href.split('#')[0] + `#/result/${audience.id}?c=${colorsToParam(shown)}&s=${style}`;
    sharePaletteLink(url, title);
  });

  // نسخ كود اللون
  app.querySelectorAll('.hex-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const hex = btn.dataset.hex;
      if (navigator.clipboard) navigator.clipboard.writeText(hex).catch(() => {});
      toast(t('result.copied', { n: hex }));
    });
  });

  // السهم التالي: إن كنا رجعنا للخلف نتقدم للون الذي رأيناه، وإلا نصنع لوناً جديداً
  app.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.next);
      const list = hist.lists[i];
      if (hist.pos[i] === list.length - 1) list.push(regenerateColor(colors, i));
      hist.pos[i]++;
      colors[i] = list[hist.pos[i]];
      updateColors(colors);
    });
  });

  // السهم السابق: يرجعنا للون الذي كان قبله
  app.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.prev);
      if (hist.pos[i] === 0) return;
      hist.pos[i]--;
      colors[i] = hist.lists[i][hist.pos[i]];
      updateColors(colors);
    });
  });

  // فتح وإغلاق الشرح
  document.getElementById('why-btn').addEventListener('click', () => {
    state.whyOpen = !state.whyOpen;
    render(true);
  });

  // استخدام لون المنافسين المقترح كلون تمييز (المكان الثالث)
  const useBtn = document.getElementById('use-standout');
  if (useBtn) {
    useBtn.addEventListener('click', () => {
      const hex = useBtn.dataset.hex;
      if (colors.length > 2) colors[2] = hex; else colors.push(hex);
      toast(t('comp.done'));
      updateColors(colors);
    });
  }

  // أزرار خيارات العرض (تشغيل/إيقاف)
  app.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view[btn.dataset.view] = !state.view[btn.dataset.view];
      render(true);
    });
  });

  // نسخ كود التدرج
  app.querySelectorAll('.grad-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = 'background: ' + btn.dataset.css + ';';
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
      toast(t('grad.copied'));
    });
  });

  // الثقافة: فتح/إغلاق، اختيار منطقة، وتعديل الألوان
  document.getElementById('culture-btn').addEventListener('click', () => {
    state.cultureOpen = !state.cultureOpen;
    render(true);
  });
  app.querySelectorAll('[data-culture]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.culture = btn.dataset.culture || null;
      render(true);
    });
  });
  const adjustBtn = document.getElementById('culture-adjust');
  if (adjustBtn) {
    adjustBtn.addEventListener('click', () => {
      const adjusted = cultureAdjust(colors, state.culture);
      if (adjusted) { toast(t('culture.adjusted')); updateColors(adjusted); }
    });
  }

  // اسم المشروع: نحدّث المعاينات فقط أثناء الكتابة
  document.getElementById('project-name').addEventListener('input', (e) => {
    state.projectName = e.target.value;
    renderPreviews(shown, style);
  });
}

/* ---------- 2) الشرح: معنى كل لون + لماذا تنجح اللوحة ---------- */
function whyHtml(colors, industry) {
  // نعرض كل "عائلة" لون مرة واحدة فقط
  const seen = new Set();
  const items = [];
  colors.forEach((c) => {
    const fam = colorFamily(c);
    if (seen.has(fam)) return;
    seen.add(fam);
    items.push(`<li><span class="dot" style="background:${c}"></span><strong>${colorName(c)}:</strong> ${t('fam.' + fam)}</li>`);
  });

  const harmony = detectHarmony(colors);
  const ratioKey = hexToHsl(colors[0]).l < 40 ? 'why.ratio.dark' : 'why.ratio.light';
  return `
    <ul class="why-list">${items.join('')}</ul>
    <p>${t('why.harmony.' + harmony)}</p>
    <p>${t(ratioKey)}</p>
    ${industry ? `<p>${t('why.ind.' + industry)}</p>` : ''}
  `;
}

/* ---------- 3) ألوان المنافسين ولون مقترح للتميز ---------- */
function competitorHtml(industry) {
  const standout = standoutColor(industry);
  if (!standout) return '';
  return `
    <section class="result-section comp-box">
      <h2 class="section-title">${t('comp.title')}</h2>
      <p>${t('comp.common', { industry: t('ind.' + industry) })}</p>
      <div class="comp-row">
        ${INDUSTRY_COLORS[industry].map((c) => `<span class="comp-chip" style="background:${c}" title="${colorName(c)}"></span>`).join('')}
      </div>
      <p>${t('comp.suggest')}</p>
      <div class="comp-row">
        <span class="comp-chip big" style="background:${standout}"></span>
        <span><strong>${colorName(standout)}</strong> <code dir="ltr">${standout}</code></span>
        <button type="button" class="btn btn-small" id="use-standout" data-hex="${standout}">${t('comp.use')}</button>
      </div>
    </section>
  `;
}

/* ---------- 4) نافذة الخطوط: 3 أزواج تناسب الأسلوب + 3 للتجربة ---------- */
function openFonts(colors, style) {
  let overlay = document.getElementById('fonts-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fonts-overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    // الضغط خارج النافذة أو زر Esc يغلقها
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFonts(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFonts(); });
  }
  overlay.hidden = false;
  document.body.classList.add('no-scroll');
  renderFontsModal(colors, style);
}

function closeFonts() {
  const overlay = document.getElementById('fonts-overlay');
  if (overlay && !overlay.hidden) {
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
  }
}

function renderFontsModal(colors, style) {
  const pairs = fontPairsFor(style);
  const overlay = document.getElementById('fonts-overlay');
  const card = (pair, i) => fontCardHtml(pair, i, colors);
  overlay.innerHTML = `
    <div class="modal fonts-modal" role="dialog" aria-modal="true" aria-labelledby="fonts-heading">
      <div class="modal-head">
        <h2 id="fonts-heading">${t('fonts.title')}</h2>
        <button type="button" class="modal-close" id="fonts-close" aria-label="${t('dl.close')}">✕</button>
      </div>
      <p class="small-hint">${t('fonts.subtitle')}</p>
      <h3 class="fonts-group">${t('fonts.forStyle')}</h3>
      <div class="font-list">${pairs.slice(0, 3).map((p, i) => card(p, i)).join('')}</div>
      <h3 class="fonts-group">${t('fonts.tryMore')}</h3>
      <div class="font-list">${pairs.slice(3).map((p, i) => card(p, i + 3)).join('')}</div>
    </div>
  `;
  document.getElementById('fonts-close').addEventListener('click', closeFonts);
  overlay.querySelectorAll('.font-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.fontIndex = Number(btn.dataset.index);
      renderFontsModal(colors, style);  // نحدّث علامة "مختار"
      renderPreviews(colors, style);    // والبرومبتات تستخدم الخط الجديد
    });
  });
}

/* بطاقة زوج خطوط واحد، مكتوبة بألوان اللوحة نفسها */
function fontCardHtml(pair, i, colors) {
  const bg = colors[0];
  const headColor = readableOn(bg, colors);
  // لون النص: لون آخر من اللوحة يُقرأ على الخلفية، وإلا نفس لون العنوان
  const bodyColor = colors.slice(1).find((c) => c !== headColor && contrastRatio(c, bg) >= 4.5) || headColor;
  const fonts = currentLang === 'ar' ? pair.ar : pair.en; // نعرض المثال بلغة الواجهة
  const selected = i === state.fontIndex;
  return `
    <button type="button" class="font-card ${selected ? 'selected' : ''}" data-index="${i}" aria-pressed="${selected}">
      <span class="font-sample" style="background:${bg}">
        <span class="font-head" style="font-family:'${fonts[0]}', sans-serif; font-weight:${headingWeight(fonts[0])}; color:${headColor}">${t('fonts.sampleHead')}</span>
        <span class="font-body" style="font-family:'${fonts[1]}', sans-serif; color:${bodyColor}">${t('fonts.sampleBody')}</span>
        <span class="font-dots" aria-hidden="true">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
      </span>
      <span class="font-meta">
        ${selected ? `<span class="badge-inline">${t('fonts.selected')}</span>` : ''}
        <span><b>${t('fonts.arabic')}:</b> ${pair.ar[0]} + ${pair.ar[1]}</span>
        <span dir="ltr" class="en-names"><b>${t('fonts.english')}:</b> ${pair.en[0]} + ${pair.en[1]}</span>
        <span class="font-advice">${t('font.adv.' + pair.advice)}</span>
      </span>
    </button>
  `;
}

/* ---------- 5) المعاينات: "أين تريد أن ترى ألوانك؟" ----------
   أيقونات للاختيار، وتظهر معاينة المكان المختار فقط.
   إذا لم يختر المستخدم بعد، نختار المعاينة المناسبة من إجاباته
   (مثلاً: سكن وديكور ← غرفة، قائمة الطعام ← قائمة). */
const PREVIEW_KINDS = [
  { id: 'logo' }, { id: 'social' }, { id: 'room' },
  { id: 'web' }, { id: 'app' }, { id: 'card' },
  { id: 'packaging' }, { id: 'menu' },
  { id: 'video' }, { id: 'photo' }, { id: 'expo' }, // صناعة المحتوى، التصوير، المعارض
];

/* أي معاينة تناسب إجابات المستخدم؟ */
function defaultPreviewKind(params) {
  if (params.pv && PREVIEW_KINDS.some((k) => k.id === params.pv)) return params.pv; // من أسئلة القسم
  if (params.space || params.ind === 'home') return 'room';
  const byUse = {
    menu: 'menu', sign: 'logo', packaging: 'packaging', interior: 'room', app: 'app', store: 'room',
    clothing: 'packaging', social: 'social', brand: 'logo', web: 'web', print: 'card', slides: 'web',
    walls: 'room', furniture: 'room', floors: 'room', accessories: 'room', whole: 'room',
  };
  return byUse[params.use] || 'logo';
}

function renderPreviews(colors, style) {
  const params = resultParams; // معلومات النتيجة الحالية (المجال ومكان الاستخدام)
  const kind = state.previewKind || defaultPreviewKind(params);
  const isFacade = kind === 'room' && params.space === 'facade';
  const label = isFacade ? t('preview.facade') : t('preview.' + kind);

  // أيقونات الاختيار
  document.getElementById('preview-picker').innerHTML = PREVIEW_KINDS.map((k) => `
    <button type="button" class="preview-kind ${k.id === kind ? 'selected' : ''}" data-kind="${k.id}" aria-pressed="${k.id === kind}">
      <span>${k.id === 'room' && params.space === 'facade' ? t('preview.facade') : t('preview.' + k.id)}</span>
    </button>`).join('');

  // معلومات البرومبت: الألوان، الأسلوب، الإحساس، المكان، الاسم، والخط (الإنجليزي لأن البرومبت إنجليزي)
  const pair = fontPairsFor(style)[state.fontIndex] || fontPairsFor(style)[0];
  const ctx = {
    colors: colors.slice(0, 5), style, feel: state.refine.feel, temp: state.refine.temp,
    space: params.space, name: state.projectName.trim(), headFont: pair.en[0],
    technique: getTechnique(params.tech),
    // إجابات أسئلة القسم بالإنجليزية، مثل ['Café', 'Luxury']
    section: parseHash().audience.id, answers: sectionAnswersEn(parseHash().audience.id, sectionAnswersFromParams(parseHash().audience.id, params)),
  };
  if (ctx.technique) ctx.temp = ''; // ألوان التقنية أصلية، فلا نطلب حرارة معيّنة
  const prompts = buildPrompts(kind, ctx);
  const query = inspirationQuery(kind, ctx);
  const pinQuery = `${colorNameEn(colors[1] || colors[0])} ${colorNameEn(colors[2] || colors[0])} ${query}`;

  document.getElementById('previews').innerHTML = `
    <div class="prompt-intro">
      <p>${t('prompt.intro', { place: label })}</p>
      <div class="ai-links">
        <a class="btn btn-small" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT ↗</a>
        <a class="btn btn-small" href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini ↗</a>
      </div>
    </div>
    <div class="prompt-list">
      ${prompts.map((pr, i) => `
        <div class="prompt-card">
          <div class="prompt-head">
            <strong>${i + 1}. ${t('prompt.v.' + pr.key)}</strong>
            <button type="button" class="btn btn-small btn-primary" data-copy-prompt="${i}">${t('prompt.copy')}</button>
          </div>
          <p class="prompt-text" dir="ltr" id="prompt-${i}">${escapeHtml(pr.text)}</p>
        </div>`).join('')}
    </div>

    <section class="inspo">
      <h3>${t('photo.title', { place: label })}</h3>
      <div id="inspo-photos">${unsplashEnabled() ? `<p class="small-hint">${t('photo.loading')}</p>` : ''}</div>
      <div class="actions">
        <a class="btn" href="${unsplashSearchUrl(query, unsplashColor(colors[1] || colors[0]))}" target="_blank" rel="noopener">${t('photo.openUnsplash')}</a>
        <a class="btn" href="${pinterestSearchUrl(pinQuery)}" target="_blank" rel="noopener">${t('photo.openPinterest')}</a>
      </div>
    </section>
  `;

  // نسخ البرومبت (وإن منع المتصفح النسخ، نحدد النص حتى ينسخه المستخدم بنفسه)
  document.querySelectorAll('[data-copy-prompt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.copyPrompt);
      const text = prompts[i].text;
      const selectText = () => {
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('prompt-' + i));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast(t('prompt.copyFail'));
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => toast(t('prompt.copied'))).catch(selectText);
      } else {
        selectText();
      }
    });
  });

  // اختيار مكان آخر
  document.querySelectorAll('[data-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.previewKind = btn.dataset.kind;
      renderPreviews(colors, style);
    });
  });

  // الصور الملهمة داخل التطبيق (فقط إن وُجد مفتاح Unsplash)
  if (unsplashEnabled()) {
    const box = document.getElementById('inspo-photos');
    unsplashPhotos(query, unsplashColor(colors[1] || colors[0]), 4)
      .then((photos) => {
        if (!document.body.contains(box)) return;
        box.innerHTML = photos.length ? photosGridHtml(photos) : `<p class="small-hint">${t('photo.none')}</p>`;
      })
      .catch(() => { if (document.body.contains(box)) box.innerHTML = `<p class="small-hint">${t('photo.error')}</p>`; });
  }
}

/* ---------- سجل الألوان (للسهمين تحت كل بطاقة) ----------
   لكل بطاقة قائمة بالألوان التي ظهرت فيها، ومكاننا الحالي في القائمة.
   إذا فتح المستخدم لوحة مختلفة تماماً نبدأ سجلاً جديداً. وإذا تغيّر لون
   بطريقة أخرى (مثل زر المنافسين أو الثقافة) نضيفه للسجل حتى يمكن الرجوع عنه. */
function syncColorHistory(colors) {
  const h = state.colorHistory;
  const sameSize = h && h.lists.length === colors.length;
  const matches = sameSize ? colors.filter((c, i) => h.lists[i][h.pos[i]] === c).length : 0;

  if (!sameSize || matches < colors.length / 2) {
    state.colorHistory = { lists: colors.map((c) => [c]), pos: colors.map(() => 0) };
    return;
  }
  colors.forEach((c, i) => {
    if (h.lists[i][h.pos[i]] !== c) {
      h.lists[i] = h.lists[i].slice(0, h.pos[i] + 1); // نحذف الألوان "الأمامية" القديمة
      h.lists[i].push(c);
      h.pos[i]++;
    }
  });
}

/* ---------- المشاركة ---------- */
function sharePaletteLink(url, title) {
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    toast(t('action.shareCopied'));
  };
  if (navigator.share) {
    // قائمة المشاركة في الجوال (واتساب، رسائل...). إن أُلغيت أو لم تعمل ننسخ الرابط
    navigator.share({ title, url }).catch((err) => { if (err && err.name !== 'AbortError') copy(); });
  } else {
    copy();
  }
}

/* ---------- خيارات العرض ---------- */

/* يطبّق زر حار/بارد (من الشريط العلوي) و"نسخة داكنة" و"للطباعة" إن كانت مفعّلة */
function applyView(colors, keepOriginal) {
  let out = colors;
  if (state.refine.temp && !keepOriginal) out = applyTemperature(out, state.refine.temp);
  if (state.view.dark) out = darkPalette(out);
  if (state.view.print) out = printPalette(out);
  return out;
}

/* نص CMYK قصير للبطاقة: "C0 M45 Y80 K10" */
function cmykText(hex) {
  const v = toCmyk(hex);
  return `C${v.c} M${v.m} Y${v.y} K${v.k}`;
}

/* قسم التدرجات */
function gradientsHtml(colors) {
  return `
    <div class="gradients">
      <h2 class="section-title">${t('grad.title')}</h2>
      <div class="grad-grid">
        ${paletteGradients(colors).map((g) => `
          <figure class="grad-item">
            <div class="grad-swatch" style="background:${g}"></div>
            <button type="button" class="btn btn-small grad-copy" data-css="${g}">${t('grad.copy')}</button>
          </figure>
        `).join('')}
      </div>
    </div>
  `;
}

/* ---------- الثقافة ---------- */
function cultureHtml(colors) {
  const chips = [null, ...Object.keys(CULTURES)].map((key) => `
    <button type="button" class="choice-chip small ${state.culture === key ? 'selected' : ''}" data-culture="${key || ''}">
      ${key ? t('culture.' + key) : t('culture.none')}
    </button>
  `).join('');

  let notesHtml = '';
  if (state.culture) {
    const notes = cultureNotes(colors, state.culture);
    const canAdjust = cultureAdjust(colors, state.culture) !== null;
    const cautions = notes.filter((n) => n.type === 'caution');
    notesHtml = `
      <ul class="why-list culture-notes">
        ${notes.map((n) => `
          <li class="${n.type}">
            <span class="dot" style="background:${n.hex}"></span>
            <strong>${n.type === 'good' ? t('culture.good') : t('culture.caution')}:</strong>
            ${t(n.key)}
          </li>`).join('')}
      </ul>
      ${cautions.length === 0 ? `<p>${t('culture.allGood')}</p>` : ''}
      ${canAdjust ? `<button type="button" class="btn btn-small btn-primary" id="culture-adjust">${t('culture.adjust')}</button>` : ''}
    `;
  }

  return `
    <h2 class="section-title">${t('culture.title')}</h2>
    <p class="small-hint">${t('culture.hint')}</p>
    <div class="choice-chips">${chips}</div>
    ${notesHtml}
  `;
}

/* ---------- أدوات مساعدة ---------- */

/* مدى "سطوع" اللون كما تراه العين (من 0 إلى 1) */
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/* الفرق بين لونين (كلما كبر كان النص أوضح) */
function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/*
  يختار أوضح لون للكتابة فوق خلفية معينة:
  نفضّل لوناً من اللوحة نفسها، وإن لم يكن واضحاً بما يكفي نستخدم الأسود أو الأبيض.
*/
function readableOn(bg, colors) {
  let best = null, bestRatio = 0;
  colors.forEach((c) => {
    const r = contrastRatio(bg, c);
    if (r > bestRatio) { bestRatio = r; best = c; }
  });
  if (bestRatio >= 4.5) return best;
  return contrastRatio(bg, '#111111') > contrastRatio(bg, '#FFFFFF') ? '#111111' : '#FFFFFF';
}

/* يحمي الصفحة من الرموز الخاصة في النص الذي يكتبه المستخدم (مثل < و >) */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
