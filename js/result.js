/* =========================================================================
   result.js — شاشة النتيجة
   الأقسام بالترتيب:
     0) أيقونة الثقافة 🌍 (اختياري)
     1) بطاقات البولارويد + قاعدة 60-30-10
     1ب) خيارات العرض: تدرجات، نسخة داكنة، للطباعة
     2) زر "لماذا هذه الألوان؟"
     3) تميّز عن منافسيك (إذا عرفنا مجالك من الاستبيان)
     4) الخطوط المقترحة
     5) المعاينات: منشور، بطاقة عمل، شعار، رأس موقع
   ========================================================================= */

function renderResult(audience, params) {
  const colors = paramToColors(params.c);
  if (colors.length === 0) { location.hash = '#/methods/' + audience.id; return; }

  // colors = الألوان الأصلية (من الرابط)
  // shown  = ما نعرضه فعلاً بعد تطبيق "نسخة داكنة" أو "للطباعة"
  const shown = applyView(colors);
  const weights = ratioWeights(colors.length);
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
  if (params.from === 'options') backHref = state.lastOptionsHash || '#/describe/' + audience.id;
  if (params.from === 'upload') backHref = '#/upload/' + audience.id;

  app.innerHTML = `
    ${backLink(backHref)}
    <header class="page-head">
      <div class="title-row">
        <h1>${title}</h1>
        <button type="button" class="culture-btn" id="culture-btn" aria-expanded="${state.cultureOpen}">
          🌍 <span>${state.culture ? t('culture.' + state.culture) : t('culture.button')}</span>
        </button>
      </div>
      <p class="lead">${t('result.subtitle')}</p>
    </header>

    <!-- 0) الثقافة -->
    <section class="culture-box" id="culture-box" ${state.cultureOpen ? '' : 'hidden'}>
      ${cultureHtml(colors)}
    </section>

    <!-- 1) بطاقات البولارويد: إطار أبيض وأسفل أعرض فيه الاسم والكود -->
    <div class="polaroid-row">
      ${shown.map((c, i) => `
        <figure class="polaroid">
          <div class="polaroid-color" style="background:${c}; color:${isLight(c) ? '#1a1a1a' : '#ffffff'}">
            <span class="ratio-badge">${formatPercent(weights[i])}</span>
          </div>
          <figcaption>
            <strong class="color-name">${colorName(c)}</strong>
            <button type="button" class="hex-btn" data-hex="${c}" dir="ltr">${c}</button>
            ${state.view.print ? `<span class="cmyk" dir="ltr">${cmykText(c)}</span>` : ''}
            <span class="role">${roleName(i, c)}</span>
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
          </figcaption>
        </figure>
      `).join('')}
    </div>

    <section class="ratio-box">
      <h2>${t('result.ratioTitle')}</h2>
      <div class="ratio-bar">
        ${shown.map((c, i) => `<span style="flex:${weights[i]}; background:${c}" title="${roleName(i, c)} ${formatPercent(weights[i])}"></span>`).join('')}
      </div>
      <p>${t('result.ratioHint')}</p>
    </section>

    <!-- أزرار: تحميل، حفظ، مشاركة -->
    <div class="action-bar">
      <button type="button" class="btn btn-primary" id="download-btn">⬇ ${t('action.download')}</button>
      <button type="button" class="btn" id="save-btn">♡ ${t('action.save')}</button>
      <button type="button" class="btn" id="share-btn">🔗 ${t('action.share')}</button>
      ${cloudEnabled() ? `<button type="button" class="btn" id="publish-btn">📢 ${t('action.publish')}</button>` : ''}
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
      ${state.view.dark ? `<p class="view-note">🌙 ${t('view.darkNote')}</p>` : ''}
      ${state.view.print ? `<p class="view-note">🖨️ ${t('view.printNote')}</p>` : ''}
      ${state.view.gradients ? gradientsHtml(shown) : ''}
    </section>

    <!-- 2) لماذا هذه الألوان؟ -->
    <section class="why-box">
      <button type="button" class="btn" id="why-btn" aria-expanded="${state.whyOpen}">
        💡 ${state.whyOpen ? t('why.hide') : t('why.button')}
      </button>
      <div id="why-panel" class="why-panel" ${state.whyOpen ? '' : 'hidden'}>${whyHtml(shown, industry)}</div>
    </section>

    <!-- 3) تميّز عن منافسيك -->
    ${industry ? competitorHtml(industry) : ''}

    <!-- 4) الخطوط -->
    <section class="result-section">
      <h2 class="section-title">${t('fonts.title')}</h2>
      <p class="small-hint">${t('fonts.subtitle')}</p>
      <div id="font-list" class="font-list"></div>
    </section>

    <!-- 5) المعاينات -->
    <section class="result-section">
      <h2 class="section-title">${t('preview.title')}</h2>
      <label class="field-label" for="project-name">${t('preview.nameLabel')}</label>
      <input type="text" id="project-name" class="name-input" maxlength="30"
             value="${escapeHtml(state.projectName)}" placeholder="${t('preview.defaultName')}">
      <div id="previews" class="previews"></div>
    </section>

    <div class="actions">
      <a class="btn btn-primary" href="#/free/${audience.id}?c=${colorsToParam(shown)}">✋ ${t('result.edit')}</a>
      <a class="btn" href="#/ready/${audience.id}">🎨 ${t('result.backReady')}</a>
    </div>
  `;

  renderFontList(shown, style);
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
      <h2 class="section-title">🏁 ${t('comp.title')}</h2>
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

/* ---------- 4) بطاقات أزواج الخطوط ---------- */
function renderFontList(colors, style) {
  const pairs = FONT_PAIRS[style];
  const bg = colors[0];
  const headColor = readableOn(bg, colors);
  const list = document.getElementById('font-list');

  list.innerHTML = pairs.map((pair, i) => {
    const fonts = currentLang === 'ar' ? pair.ar : pair.en; // نعرض المثال بلغة الواجهة
    const selected = i === state.fontIndex;
    return `
      <button type="button" class="font-card ${selected ? 'selected' : ''}" data-index="${i}" aria-pressed="${selected}">
        <span class="font-sample" style="background:${bg}">
          <span class="font-head" style="font-family:'${fonts[0]}', sans-serif; font-weight:${headingWeight(fonts[0])}; color:${headColor}">${t('fonts.sampleHead')}</span>
          <span class="font-body" style="font-family:'${fonts[1]}', sans-serif; color:${headColor}">${t('fonts.sampleBody')}</span>
        </span>
        <span class="font-meta">
          ${selected ? `<span class="badge-inline">✓ ${t('fonts.selected')}</span>` : ''}
          <span><b>${t('fonts.arabic')}:</b> ${pair.ar[0]} + ${pair.ar[1]}</span>
          <span dir="ltr" class="en-names"><b>${t('fonts.english')}:</b> ${pair.en[0]} + ${pair.en[1]}</span>
          <span class="font-advice">${t('font.adv.' + pair.advice)}</span>
        </span>
      </button>
    `;
  }).join('');

  list.querySelectorAll('.font-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.fontIndex = Number(card.dataset.index);
      renderFontList(colors, style);
      renderPreviews(colors, style);
    });
  });
}

/* ---------- 5) المعاينات ---------- */
function renderPreviews(colors, style) {
  const pair = FONT_PAIRS[style][state.fontIndex];
  const fonts = currentLang === 'ar' ? pair.ar : pair.en;
  const head = `font-family:'${fonts[0]}', sans-serif; font-weight:${headingWeight(fonts[0])};`;
  const body = `font-family:'${fonts[1]}', sans-serif;`;

  const name = escapeHtml(state.projectName.trim() || t('preview.defaultName'));
  const initial = Array.from(name)[0] || '';

  // أدوار الألوان: أساسي (خلفية)، ثانوي، تمييز، وإضافيان
  const main = colors[0];
  const sec = colors[1] || colors[0];
  const acc = colors[2] || sec;
  const extra = colors[3] || acc;

  document.getElementById('previews').innerHTML = `
    <!-- منشور سوشيال -->
    <figure class="pv">
      <div class="pv-social" style="background:${sec}; ${body}">
        <span class="pv-circle" style="background:${acc}"></span>
        <span class="pv-circle small" style="background:${extra}"></span>
        <span class="pv-brand" style="color:${readableOn(sec, colors)}">${name}</span>
        <span class="pv-post-title" style="${head} color:${readableOn(sec, colors)}">${t('preview.postText')}</span>
        <span class="pv-btn" style="background:${acc}; color:${readableOn(acc, colors)}">${t('preview.postCta')}</span>
      </div>
      <figcaption>${t('preview.social')}</figcaption>
    </figure>

    <!-- بطاقة عمل -->
    <figure class="pv">
      <div class="pv-card" style="background:${main}; ${body}">
        <span class="pv-card-strip" style="background:${acc}"></span>
        <span class="pv-mark" style="background:${sec}; color:${readableOn(sec, colors)}; ${head}">${initial}</span>
        <span class="pv-card-person" style="${head} color:${readableOn(main, colors)}">${t('preview.cardPerson')}</span>
        <span class="pv-card-role" style="color:${readableOn(main, colors)}">${t('preview.cardRole')} · ${name}</span>
        <span class="pv-card-contact" dir="ltr" style="color:${readableOn(main, colors)}">hello@example.com</span>
      </div>
      <figcaption>${t('preview.card')}</figcaption>
    </figure>

    <!-- الشعار -->
    <figure class="pv">
      <div class="pv-logo" style="background:${main}">
        <span class="pv-mark big" style="background:${acc}; color:${readableOn(acc, colors)}; ${head}">${initial}</span>
        <span class="pv-logo-name" style="${head} color:${readableOn(main, colors)}">${name}</span>
        <span class="pv-logo-tag" style="${body} color:${readableOn(main, colors)}">${t('preview.tagline')}</span>
      </div>
      <figcaption>${t('preview.logo')}</figcaption>
    </figure>

    <!-- رأس موقع -->
    <figure class="pv wide">
      <div class="pv-web" style="${body}">
        <div class="pv-nav" style="background:${main}; color:${readableOn(main, colors)}">
          <span style="${head}">${name}</span>
          <span class="pv-links">
            <span>${t('preview.nav1')}</span><span>${t('preview.nav2')}</span><span>${t('preview.nav3')}</span>
          </span>
        </div>
        <div class="pv-hero" style="background:${sec}; color:${readableOn(sec, colors)}">
          <span class="pv-hero-title" style="${head}">${t('preview.heroTitle', { name })}</span>
          <span>${t('preview.tagline')}</span>
          <span class="pv-btn" style="background:${acc}; color:${readableOn(acc, colors)}">${t('preview.cta')}</span>
        </div>
      </div>
      <figcaption>${t('preview.web')}</figcaption>
    </figure>
  `;
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

/* يطبّق "نسخة داكنة" و"للطباعة" إن كانتا مفعّلتين */
function applyView(colors) {
  let out = colors;
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
            <strong>${n.type === 'good' ? '✓ ' + t('culture.good') : '⚠ ' + t('culture.caution')}:</strong>
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
