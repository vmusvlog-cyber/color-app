/* =========================================================================
   app.js — الشاشات والتنقل بينها
   التطبيق صفحة واحدة. نعرف الشاشة المطلوبة من الجزء بعد # في الرابط:
     #/                         ← الرئيسية
     #/methods/beginner         ← طرق البدء لقسم "مبتدئ"
     #/ready/beginner           ← اللوحات الجاهزة
     #/free/beginner            ← الاختيار الحر
     #/result/beginner?c=...    ← شاشة النتيجة (الألوان داخل الرابط، لذلك يمكن مشاركته)
     شاشات "صِف فكرتك" موجودة في describe.js، وشاشة النتيجة في result.js
   ========================================================================= */

const MAX_COLORS = 8; // أقصى عدد ألوان في لوحة الاختيار الحر

/* ---------- حالة التطبيق (معلومات نتذكرها أثناء استخدامه) ---------- */
const state = {
  readyStyle: null,       // الأسلوب المختار في اللوحات الجاهزة
  readyAudience: null,    // القسم الذي اختير له الأسلوب (عند تغيير القسم نرجع للمقترح)
  readySize: 5,           // 3 أو 5 ألوان
  freePalette: [],        // ألوان لوحة الاختيار الحر
  freeSelected: null,     // رقم اللون المحدد في اللوحة (للحذف)
  suggestions: [],        // ألوان شريط الاقتراحات
  wheel: { h: 210, s: 70, l: 55 }, // اللون المختار في العجلة
  // المرحلة 2
  quiz: { step: 0, answers: {} }, // الاستبيان: رقم السؤال والإجابات
  myColors: [],                   // الألوان التي كتبها المستخدم في "عندي ألوان"
  options: { hash: null, list: [] }, // اللوحات الثلاث المقترحة
  lastOptionsHash: null,          // للرجوع من النتيجة إلى اللوحات الثلاث
  fontIndex: 0,                   // زوج الخطوط المختار
  fontStyle: null,                // الأسلوب الذي اختير له زوج الخطوط
  projectName: '',                // اسم المشروع في المعاينات
  whyOpen: false,                 // هل شرح "لماذا هذه الألوان؟" مفتوح
  colorHistory: null,             // الألوان السابقة لكل بطاقة في النتيجة (للسهمين)
  refine: defaultRefine(),        // اختيارات "دقّق النتيجة"
  // المرحلة 3
  upload: null,                   // الصورة المرفوعة وألوانها
  view: { gradients: false, dark: false, print: false }, // خيارات العرض
  culture: null,                  // منطقة الجمهور المختارة (أو null)
  cultureOpen: false,             // هل لوحة الثقافة مفتوحة
};

const app = document.getElementById('app');

/* =========================================================================
   أدوات صغيرة مساعدة
   ========================================================================= */

/* يقرأ الرابط ويرجع: اسم الشاشة، القسم، والمعلومات الإضافية بعد ? */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return {
    screen: parts[0] || 'home',
    audience: getAudience(parts[1]),
    params: Object.fromEntries(new URLSearchParams(query)),
  };
}

/* ألوان ← نص للرابط:  ['#F7F7F5', '#2B2D42'] ← "F7F7F5-2B2D42" */
function colorsToParam(colors) {
  return colors.map((c) => c.replace('#', '')).join('-');
}

/* نص الرابط ← ألوان (ونتجاهل أي قيمة غير صالحة) */
function paramToColors(text) {
  if (!text) return [];
  return text.split('-').map(normalizeHex).filter(Boolean);
}

/* يُظهر رسالة صغيرة أسفل الشاشة لثانيتين */
let toastTimer = null;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

/* زر الرجوع في أعلى كل شاشة */
function backLink(href) {
  return `<a class="back-link" href="${href}"><span class="back-arrow" aria-hidden="true">←</span> ${t('common.back')}</a>`;
}

/* نسب قاعدة 60-30-10 حسب عدد الألوان.
   الأول 60%، الثاني 30%، والباقي يتقاسم 10%. */
function ratioWeights(count) {
  if (count === 1) return [100];
  if (count === 2) return [70, 30];
  const accentShare = 10 / (count - 2);
  return [60, 30, ...Array(count - 2).fill(accentShare)];
}

/* اسم دور اللون في البراند: رئيسي / ثانوي / تمييز / محايد / مساعد
   الألوان الإضافية (بعد الثالث): الهادئ منها "محايد" للخلفيات، والملوّن "مساعد" */
function roleName(index, hex) {
  if (index === 0) return t('role.main');
  if (index === 1) return t('role.secondary');
  if (index === 2) return t('role.accent');
  if (hex && hexToHsl(hex).s < 20) return t('role.neutral');
  return t('role.support');
}

/* يكتب النسبة بشكل جميل: 60 ← "60%"، 3.333 ← "3.3%" */
function formatPercent(n) {
  return Math.round(n * 10) / 10 + '%';
}

/* =========================================================================
   الشريط العلوي (اسم التطبيق + زر تغيير اللغة)
   ========================================================================= */
function renderTopbar() {
  const savedCount = getSavedPalettes().length;
  document.getElementById('topbar').innerHTML = `
    <a class="brand" href="#/">
      <span class="brand-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      ${t('app.name')}
    </a>
    <nav class="top-actions">
      <a class="lang-btn" href="#/gallery">🖼 <span class="nav-text">${t('nav.gallery')}</span></a>
      <a class="lang-btn" href="#/saved">♡ <span class="nav-text">${t('nav.saved')}</span>${savedCount ? ` <span class="count">${savedCount}</span>` : ''}</a>
      <button class="lang-btn" id="lang-btn" type="button">${t('lang.switch')}</button>
    </nav>
  `;
  document.getElementById('lang-btn').addEventListener('click', () => {
    setLang(currentLang === 'ar' ? 'en' : 'ar');
    render(true);
  });
}

/* يضبط اتجاه الصفحة (يمين/يسار) ولغتها */
function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = t('lang.dir');
  document.title = t('app.name') + ' — ' + t('app.tagline');
}

/* =========================================================================
   الشاشة 1: الرئيسية — أربع بطاقات
   ========================================================================= */
function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-strip" aria-hidden="true">
        <i style="background:#E07A5F"></i><i style="background:#F2CC8F"></i>
        <i style="background:#81B29A"></i><i style="background:#3D405B"></i>
      </div>
      <h1>${t('home.title')}</h1>
      <p class="lead">${t('home.subtitle')}</p>
    </section>

    <div class="audience-grid">
      ${AUDIENCES.map((a) => `
        <a class="audience-card" href="#/methods/${a.id}">
          <span class="audience-icon" aria-hidden="true">${a.icon}</span>
          <h2>${t('aud.' + a.id + '.title')}</h2>
          <p>${t('aud.' + a.id + '.desc')}</p>
        </a>
      `).join('')}
    </div>
  `;
}

/* =========================================================================
   الشاشة 2: طرق البدء الأربع
   ========================================================================= */
function renderMethods(audience) {
  const methods = [
    { id: 'upload',   icon: '🖼️', soon: false },
    { id: 'describe', icon: '💬', soon: false },
    { id: 'ready',    icon: '🎨', soon: false },
    { id: 'free',     icon: '✋', soon: false },
  ];

  app.innerHTML = `
    ${backLink('#/')}
    <header class="page-head">
      <p class="eyebrow">${t('methods.subtitle', { audience: t('aud.' + audience.id + '.title') })}</p>
      <h1>${t('methods.title')}</h1>
      <p class="tip">${t('aud.' + audience.id + '.tip')}</p>
    </header>

    <div class="method-grid">
      ${methods.map((m) => m.soon
        ? `<div class="method-card is-soon" aria-disabled="true">
             <span class="method-icon" aria-hidden="true">${m.icon}</span>
             <h2>${t('method.' + m.id + '.title')}</h2>
             <p>${t('method.' + m.id + '.desc')}</p>
             <span class="badge">${t('common.soon')}</span>
           </div>`
        : `<a class="method-card" href="#/${m.id}/${audience.id}">
             <span class="method-icon" aria-hidden="true">${m.icon}</span>
             <h2>${t('method.' + m.id + '.title')}</h2>
             <p>${t('method.' + m.id + '.desc')}</p>
           </a>`
      ).join('')}
    </div>
  `;
}

/* =========================================================================
   الشاشة 3: اللوحات الجاهزة
   ========================================================================= */
function renderReady(audience) {
  // الأساليب مرتبة حسب القسم؛ أول اثنين "مقترح لك"
  const styles = audience.styles;
  if (state.readyAudience !== audience.id) {
    state.readyAudience = audience.id;
    state.readyStyle = styles[0];
  }

  // اللوحات الجاهزة بعد تطبيق اختيارات "دقّق النتيجة" (إن وُجدت)
  const palettes = READY_PALETTES
    .filter((p) => p.style === state.readyStyle)
    .map((p) => ({ ...p, colors: applyRefine(p.colors, state.refine) }));

  app.innerHTML = `
    ${backLink('#/methods/' + audience.id)}
    <header class="page-head">
      <h1>${t('ready.title')}</h1>
      <p class="lead">${t('ready.subtitle')}</p>
    </header>

    <div class="style-tabs" role="tablist">
      ${styles.map((s, i) => `
        <button type="button" role="tab" class="style-tab ${s === state.readyStyle ? 'active' : ''}"
                data-style="${s}" aria-selected="${s === state.readyStyle}">
          ${t('style.' + s)}
          ${i < 2 ? `<span class="rec">★ ${t('common.recommended')}</span>` : ''}
        </button>
      `).join('')}
    </div>

    <div class="ready-bar">
      <p class="style-desc">${t('style.' + state.readyStyle + '.desc')}</p>
      <div class="size-toggle" role="group" aria-label="${t('ready.size')}">
        ${[3, 5].map((n) => `
          <button type="button" class="${state.readySize === n ? 'active' : ''}" data-size="${n}">
            ${t('ready.count', { n })}
          </button>
        `).join('')}
      </div>
    </div>

    ${refinePanelHtml(state.refine)}

    <div class="palette-grid">
      ${palettes.map((p) => {
        const colors = p.colors.slice(0, state.readySize);
        return `
          <a class="palette-tile" href="#/result/${audience.id}?c=${colorsToParam(colors)}&p=${p.id}&s=${p.style}&from=ready">
            <div class="tile-strip">
              ${colors.map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}
            </div>
            <div class="tile-name">${t('pal.' + p.id)}</div>
          </a>
        `;
      }).join('')}
    </div>
  `;

  // الضغط على أسلوب أو عدد ألوان يعيد رسم الشاشة
  app.querySelectorAll('.style-tab').forEach((btn) => {
    btn.addEventListener('click', () => { state.readyStyle = btn.dataset.style; renderReady(audience); });
  });
  app.querySelectorAll('.size-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => { state.readySize = Number(btn.dataset.size); renderReady(audience); });
  });
  bindRefinePanel(() => renderReady(audience));
}

/* =========================================================================
   الشاشة 5: الاختيار الحر (سحب وإفلات)
   ========================================================================= */
function renderFree(audience, params) {
  // إذا جئنا من شاشة النتيجة ومعنا ألوان، نضعها في اللوحة
  if (params.c) {
    state.freePalette = paramToColors(params.c).slice(0, MAX_COLORS);
    state.freeSelected = null;
    // نحذف الألوان من الرابط حتى لا تُمسح تعديلاتك عند تغيير اللغة
    history.replaceState(null, '', '#/free/' + audience.id);
  }
  if (state.suggestions.length === 0) refreshSuggestions();

  // لوحات جاهزة صغيرة من الأسلوبين المقترحين لهذا القسم
  const miniPalettes = READY_PALETTES.filter((p) => audience.styles.slice(0, 2).includes(p.style));

  app.innerHTML = `
    ${backLink('#/methods/' + audience.id)}
    <header class="page-head">
      <h1>${t('free.title')}</h1>
      <p class="lead">${t('free.hint')}</p>
    </header>

    <!-- لوحتك: منطقة الإفلات -->
    <section class="my-palette">
      <h2>${t('free.yourPalette')}</h2>
      <div id="palette-zone" class="palette-zone"></div>
      <p class="small-hint">${t('free.selectHint')}</p>
      <div class="actions">
        <button type="button" class="btn btn-danger" id="delete-btn">🗑 ${t('free.delete')}</button>
        <button type="button" class="btn" id="clear-btn">${t('free.clear')}</button>
        <button type="button" class="btn btn-primary" id="result-btn">${t('free.seeResult')} <span class="fwd-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>

    <div class="sources">
      <!-- المصدر 1: شريط الاقتراحات -->
      <section class="source-box">
        <div class="source-head">
          <h2>${t('free.suggestions')}</h2>
          <button type="button" class="btn btn-small" id="refresh-btn">↻ ${t('free.refresh')}</button>
        </div>
        <div class="swatch-strip" id="suggestions"></div>
      </section>

      <!-- المصدر 2: عجلة الألوان -->
      <section class="source-box">
        <h2>${t('free.wheel')}</h2>
        <p class="small-hint">${t('free.wheelHint')}</p>
        <div class="wheel-wrap">
          <canvas id="wheel" width="240" height="240" aria-label="${t('free.wheel')}"></canvas>
          <div class="wheel-side">
            <label class="slider-label">${t('free.lightness')}
              <input type="range" id="lightness" min="10" max="90" value="${state.wheel.l}">
            </label>
            <button type="button" class="src-swatch big" id="wheel-swatch"></button>
            <code id="wheel-hex" dir="ltr"></code>
            <button type="button" class="btn btn-small" id="wheel-add">+ ${t('free.add')}</button>
          </div>
        </div>
      </section>

      <!-- المصدر 3: من اللوحات الجاهزة -->
      <section class="source-box">
        <h2>${t('free.readyPalettes')}</h2>
        <div class="mini-palettes">
          ${miniPalettes.map((p) => `
            <div class="mini-palette">
              <span class="mini-name">${t('pal.' + p.id)}</span>
              <div class="swatch-strip">
                ${p.colors.map((c) => `<button type="button" class="src-swatch" data-hex="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  renderPaletteZone();
  renderSuggestions();

  // ألوان اللوحات الجاهزة الصغيرة: قابلة للسحب أو النقر
  app.querySelectorAll('.mini-palettes .src-swatch').forEach((el) => makeSourceSwatch(el));

  // العجلة
  const wheelColor = () => hslToHex(state.wheel.h, state.wheel.s, state.wheel.l);
  const swatch = document.getElementById('wheel-swatch');
  const updateWheelSwatch = () => {
    const hex = wheelColor();
    swatch.style.background = hex;
    swatch.setAttribute('aria-label', hex);
    document.getElementById('wheel-hex').textContent = hex;
  };
  const wheel = setupColorWheel(document.getElementById('wheel'), state.wheel, updateWheelSwatch);
  updateWheelSwatch();
  makeDraggable(swatch, {
    zoneId: 'palette-zone',
    getColor: wheelColor,
    onTap: () => addColor(wheelColor()),
    onDrop: (hex, index) => insertColor(hex, index, null),
  });
  document.getElementById('wheel-add').addEventListener('click', () => addColor(wheelColor()));
  document.getElementById('lightness').addEventListener('input', (e) => {
    state.wheel.l = Number(e.target.value);
    wheel.redraw();
    updateWheelSwatch();
  });

  // الأزرار
  document.getElementById('refresh-btn').addEventListener('click', () => { refreshSuggestions(); renderSuggestions(); });
  document.getElementById('delete-btn').addEventListener('click', deleteSelected);
  document.getElementById('clear-btn').addEventListener('click', () => {
    state.freePalette = [];
    state.freeSelected = null;
    renderPaletteZone();
  });
  document.getElementById('result-btn').addEventListener('click', () => {
    if (state.freePalette.length < 2) { toast(t('free.needTwo')); return; }
    location.hash = `#/result/${audience.id}?c=${colorsToParam(state.freePalette)}&from=free`;
  });
}

/* يجعل مربع لون (من الاقتراحات أو اللوحات) قابلاً للسحب أو النقر */
function makeSourceSwatch(el) {
  makeDraggable(el, {
    zoneId: 'palette-zone',
    getColor: () => el.dataset.hex,
    onTap: () => addColor(el.dataset.hex),
    onDrop: (hex, index) => insertColor(hex, index, null),
  });
}

/* ثمانية ألوان عشوائية جديدة لشريط الاقتراحات */
function refreshSuggestions() {
  state.suggestions = Array.from({ length: 8 }, randomNiceColor);
}

function renderSuggestions() {
  const strip = document.getElementById('suggestions');
  strip.innerHTML = state.suggestions.map((c) =>
    `<button type="button" class="src-swatch" data-hex="${c}" style="background:${c}" aria-label="${c}"></button>`
  ).join('');
  strip.querySelectorAll('.src-swatch').forEach((el) => makeSourceSwatch(el));
}

/* يرسم ألوان "لوحتك" ويحدّث حالة الأزرار */
function renderPaletteZone() {
  const zone = document.getElementById('palette-zone');
  if (!zone) return;

  if (state.freePalette.length === 0) {
    zone.innerHTML = `<p class="zone-empty">${t('free.empty')}</p>`;
  } else {
    zone.innerHTML = state.freePalette.map((c, i) => `
      <button type="button" class="pal-item ${state.freeSelected === i ? 'selected' : ''}"
              data-index="${i}" aria-pressed="${state.freeSelected === i}">
        <span class="pal-color" style="background:${c}"></span>
        <code dir="ltr">${c}</code>
      </button>
    `).join('');
  }

  // كل لون في اللوحة: نقرة = تحديد، سحب = تغيير الترتيب
  zone.querySelectorAll('.pal-item').forEach((el) => {
    const index = Number(el.dataset.index);
    makeDraggable(el, {
      zoneId: 'palette-zone',
      getColor: () => state.freePalette[index],
      onTap: () => {
        state.freeSelected = state.freeSelected === index ? null : index;
        renderPaletteZone();
      },
      onDrop: (hex, toIndex) => insertColor(hex, toIndex, index),
    });
  });

  // زر الحذف يعمل فقط عند تحديد لون
  document.getElementById('delete-btn').disabled = state.freeSelected === null;
  document.getElementById('clear-btn').disabled = state.freePalette.length === 0;
}

/* يضيف لوناً في نهاية اللوحة (عند النقر) */
function addColor(hex) {
  insertColor(hex, state.freePalette.length, null);
}

/*
  يضع لوناً في مكان معين من اللوحة.
  fromIndex = null  ← لون جديد من الخارج
  fromIndex = رقم   ← لون موجود نُغيّر مكانه (إعادة ترتيب)
*/
function insertColor(hex, index, fromIndex) {
  if (fromIndex !== null) {
    state.freePalette.splice(fromIndex, 1);
    if (fromIndex < index) index--; // بعد الحذف تتحرك الأماكن خطوة
  } else if (state.freePalette.length >= MAX_COLORS) {
    toast(t('free.full', { n: MAX_COLORS }));
    return;
  }
  state.freePalette.splice(index, 0, hex);
  state.freeSelected = fromIndex !== null ? index : null;
  renderPaletteZone();
}

/* يحذف اللون المحدد */
function deleteSelected() {
  if (state.freeSelected === null) return;
  state.freePalette.splice(state.freeSelected, 1);
  state.freeSelected = null;
  renderPaletteZone();
}

/* =========================================================================
   الموزّع: يقرأ الرابط ويعرض الشاشة المناسبة
   ========================================================================= */
function render(keepScroll) {
  // عند الانتقال لشاشة أخرى نغلق أي نافذة مفتوحة (التحميل أو تسجيل الدخول)
  if (!keepScroll) { closeDownload(); closeSignIn(); }
  applyLanguage();
  renderTopbar();
  const { screen, audience, params } = parseHash();

  if (screen === 'methods') renderMethods(audience);
  else if (screen === 'ready') renderReady(audience);
  else if (screen === 'free') renderFree(audience, params);
  else if (screen === 'result') renderResult(audience, params);
  else if (screen === 'describe') renderDescribe(audience);
  else if (screen === 'quiz') renderQuiz(audience, !keepScroll); // تبديل اللغة لا يعيد الاستبيان من البداية
  else if (screen === 'mycolors') renderMyColors(audience);
  else if (screen === 'options') renderOptions(audience, params);
  else if (screen === 'upload') renderUpload(audience);
  else if (screen === 'saved') renderSaved();
  else if (screen === 'gallery') renderGallery();
  else renderHome();

  if (!keepScroll) window.scrollTo(0, 0);
}

// نعيد الرسم كلما تغيّر الرابط (مثلاً عند الضغط على بطاقة أو زر الرجوع في المتصفح)
window.addEventListener('hashchange', () => render());
startApp();

/*
  تشغيل التطبيق:
  1) نجهّز الاتصال بقاعدة البيانات (إن كانت المفاتيح موجودة في config.js)
  2) إذا رجع المستخدم من رابط البريد، ننتظر حتى يكتمل تسجيل دخوله
     ثم نعيده للصفحة التي كان فيها
*/
async function startApp() {
  const hash = location.hash; // نقرؤه قبل initCloud، لأن مكتبة Supabase تمسح بيانات الدخول من الرابط
  initCloud();
  const fromEmail = hash.includes('access_token=');
  const linkError = hash.includes('error_description=') || hash.includes('error=');

  if (fromEmail || linkError) {
    applyLanguage();
    renderTopbar();
    app.innerHTML = `<p class="zone-empty">${t('auth.signingIn')}</p>`;
  }
  await cloudReady();

  if (fromEmail || linkError) {
    const back = loadData('returnTo', null) || '#/';
    saveData('returnTo', null);
    // نستبدل الرابط الطويل (فيه بيانات الدخول) بالصفحة التي كان فيها المستخدم
    history.replaceState(null, '', location.pathname + location.search + back);
    if (isSignedIn()) setTimeout(() => toast(t('auth.welcome', { name: userName() })), 300);
    else toast(t('auth.linkError'));
  }
  render();
}
