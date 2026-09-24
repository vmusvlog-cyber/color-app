/* =========================================================================
   describe.js — أسئلة القسم، "عندي ألوان"، واللوحات الثلاث
   الشاشات:
     #/quiz/beginner       ← أسئلة القسم (سؤال أو سؤالان من sections.js)
     #/mycolors/beginner   ← إدخال ألوانك
     #/options/beginner?.. ← 3 لوحات مقترحة
   ========================================================================= */

/*
  خيارات السؤالين الثاني والثالث حسب كل مجال.
  who   = من جمهورك؟        use = أين ستستخدم الألوان؟
  space = أي مكان تريد تلوينه؟ (للسكن والديكور بدل "من جمهورك")
  ترتيب المجالات هنا هو ترتيبها في السؤال الأول.
*/
const FIELD_QUESTIONS = {
  food:      { who: ['families', 'youth', 'customers', 'kids', 'everyone'], use: ['menu', 'sign', 'packaging', 'interior', 'social', 'app'] },
  fashion:   { who: ['women', 'men', 'kids', 'youth', 'everyone'], use: ['store', 'packaging', 'clothing', 'social', 'web', 'brand'] },
  tech:      { who: ['youth', 'professionals', 'students', 'everyone'], use: ['app', 'web', 'brand', 'social', 'slides'] },
  health:    { who: ['families', 'women', 'men', 'elderly', 'everyone'], use: ['interior', 'brand', 'web', 'app', 'social', 'print'] },
  education: { who: ['kids', 'students', 'parents', 'professionals'], use: ['interior', 'slides', 'print', 'web', 'app', 'social'] },
  finance:   { who: ['professionals', 'customers', 'youth'], use: ['brand', 'web', 'app', 'slides', 'print'] },
  home:      { space: ['apartment', 'living', 'bedroom', 'kitchen', 'kidsroom', 'office', 'restaurant', 'cafe', 'shop', 'facade'],
               use: ['walls', 'furniture', 'floors', 'accessories', 'whole'] },
  kids:      { who: ['babies', 'kids', 'parents'], use: ['packaging', 'clothing', 'interior', 'social', 'brand', 'print'] },
  creative:  { who: ['youth', 'customers', 'everyone'], use: ['web', 'social', 'brand', 'print', 'packaging'] },
  other:     { who: ['kids', 'youth', 'women', 'men', 'families', 'professionals', 'everyone'], use: ['social', 'brand', 'web', 'print', 'slides'] },
};

/* قائمة المجالات (يستخدمها المعرض أيضاً في فلتر "المجال") */
const QUIZ = [{ key: 'industry', options: Object.keys(FIELD_QUESTIONS) }];

/* ---------- أسئلة القسم: سؤال واحد في كل مرة (من sections.js) ---------- */
function renderQuiz(audience, fresh) {
  if (fresh) state.quiz = { step: 0, answers: {} }; // نبدأ من جديد عند الدخول للشاشة
  const id = audience.id;
  const steps = SECTIONS[id] || SECTIONS.beginner;
  const q = steps[state.quiz.step];
  const total = steps.length;
  const chosen = state.quiz.answers[q.key];

  app.innerHTML = `
    ${backLink('#/')}
    <div class="quiz">
      <p class="eyebrow">${t('aud.' + id + '.title')}${total > 1 ? ' · ' + t('quiz.step', { n: state.quiz.step + 1, total }) : ''}</p>
      ${total > 1 ? `<div class="progress"><span style="width:${((state.quiz.step + 1) / total) * 100}%"></span></div>` : ''}
      <h1>${sectionQuestionTitle(id, q)}</h1>
      <div class="choice-chips">
        ${Object.keys(q.options).map((opt) => `
          <button type="button" class="choice-chip ${chosen === opt ? 'selected' : ''}" data-value="${opt}">${sectionOptionLabel(id, q, opt)}</button>`).join('')}
      </div>
      ${state.quiz.step > 0 ? `<button type="button" class="btn btn-small" id="quiz-prev"><span class="back-arrow" aria-hidden="true">←</span> ${t('quiz.prev')}</button>` : ''}
    </div>

    <!-- طرق أخرى لمن يريدها (روابط صغيرة) -->
    <p class="other-ways">
      <span>${t('quiz.otherWays')}</span>
      <a href="#/mycolors/${id}">${t('describe.has.title')}</a>
      <a href="#/ready/${id}">${t('method.ready.title')}</a>
      <a href="#/free/${id}">${t('method.free.title')}</a>
    </p>
  `;

  // الضغط على خيار: نحفظ الإجابة وننتقل مباشرة للسؤال التالي
  app.querySelectorAll('[data-value]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      // "لون واحد ← 3 ألوان": نفتح شاشة "عندي ألوان"
      if (q.options[value].go === 'mycolors') { location.hash = '#/mycolors/' + id; return; }
      state.quiz.answers[q.key] = value;
      if (state.quiz.step < total - 1) {
        state.quiz.step++;
        renderQuiz(audience);
        window.scrollTo(0, 0);
      } else {
        finishQuiz(id, steps, state.quiz.answers);
      }
    });
  });

  const prev = document.getElementById('quiz-prev');
  if (prev) prev.addEventListener('click', () => { state.quiz.step--; renderQuiz(audience); });
}

/* انتهت الأسئلة ← نحوّل الإجابات إلى ألوان ونذهب لشاشة اللوحات الثلاث */
function finishQuiz(id, steps, answers) {
  const p = sectionProfile(id, answers);
  // حار/بارد: من الإجابة إن وُجد، وإلا يبقى زر الشريط العلوي كما هو
  const temp = p.temp || state.refine.temp;
  // الإحساس لا يتعارض مع حار/بارد (مثلاً "دافئ" مع "بارد")
  const feel = p.feel && feelingsFor(temp).includes(p.feel) ? p.feel : '';
  // هذه الإجابات تصبح أول اختيار في لوحة "دقّق النتيجة" (ويمكن تغييرها هناك)
  state.refine = { ...defaultRefine(), temp, feel, contrast: p.contrast || '', value: p.value || '' };
  state.previewKind = null; // المعاينة تُختار تلقائياً حسب الإجابات الجديدة

  // q1 و q2 = إجابتا السؤالين (للبرومبت)، والباقي لصنع الألوان
  const query = new URLSearchParams({ mode: 'sec' });
  steps.forEach((q, i) => query.set('q' + (i + 1), answers[q.key]));
  ['ind', 'space', 'use', 'mood', 'pv'].forEach((k) => { if (p[k]) query.set(k, p[k]); });
  query.set('s', p.style);
  location.hash = `#/options/${id}?${query.toString()}`;
}

/* إجابات القسم من الرابط: { kind: 'warm' } أو { type: 'cafe', style: 'luxury' } */
function sectionAnswersFromParams(id, params) {
  const out = {};
  (SECTIONS[id] || []).forEach((q, i) => { if (params['q' + (i + 1)]) out[q.key] = params['q' + (i + 1)]; });
  return out;
}

/* ---------- عندي ألوان: اكتب اسماً أو كوداً، أو اختر من العجلة ---------- */
function renderMyColors(audience) {
  app.innerHTML = `
    ${backLink('#/quiz/' + audience.id)}
    <header class="page-head">
      <h1>${t('mycolors.title')}</h1>
      <p class="lead">${t('mycolors.subtitle')}</p>
    </header>

    <section class="source-box">
      <label class="field-label" for="color-text">${t('mycolors.inputLabel')}</label>
      <form class="text-add" id="color-form">
        <input type="text" id="color-text" autocomplete="off" placeholder="${t('mycolors.placeholder')}">
        <button type="submit" class="btn btn-primary">${t('mycolors.add')}</button>
      </form>

      <h2 class="sub-title">${t('mycolors.orWheel')}</h2>
      <div class="wheel-wrap">
        <canvas id="wheel" width="240" height="240" aria-label="${t('free.wheel')}"></canvas>
        <div class="wheel-side">
          <label class="slider-label">${t('free.lightness')}
            <input type="range" id="lightness" min="10" max="90" value="${state.wheel.l}">
          </label>
          <span class="src-swatch big" id="wheel-swatch"></span>
          <code id="wheel-hex" dir="ltr"></code>
          <button type="button" class="btn btn-small" id="wheel-add">+ ${t('mycolors.add')}</button>
        </div>
      </div>
    </section>

    <section class="my-palette static">
      <h2>${t('mycolors.chosen')}</h2>
      <div id="chosen-list" class="chosen-list"></div>
      <div class="actions">
        <button type="button" class="btn btn-primary" id="complete-btn">
          ${t('mycolors.complete')} <span class="fwd-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  `;

  // إضافة لون مكتوب
  document.getElementById('color-form').addEventListener('submit', (e) => {
    e.preventDefault(); // نمنع الصفحة من إعادة التحميل
    const input = document.getElementById('color-text');
    const hex = findColorByText(input.value);
    if (!hex) { toast(t('mycolors.notFound')); return; }
    if (addMyColor(hex)) input.value = '';
  });

  // العجلة (نفس العجلة المستخدمة في الاختيار الحر)
  const wheelColor = () => hslToHex(state.wheel.h, state.wheel.s, state.wheel.l);
  const updateSwatch = () => {
    document.getElementById('wheel-swatch').style.background = wheelColor();
    document.getElementById('wheel-hex').textContent = wheelColor();
  };
  const wheel = setupColorWheel(document.getElementById('wheel'), state.wheel, updateSwatch);
  updateSwatch();
  document.getElementById('lightness').addEventListener('input', (e) => {
    state.wheel.l = Number(e.target.value);
    wheel.redraw();
    updateSwatch();
  });
  document.getElementById('wheel-add').addEventListener('click', () => addMyColor(wheelColor()));

  document.getElementById('complete-btn').addEventListener('click', () => {
    if (state.myColors.length === 0) { toast(t('mycolors.none')); return; }
    location.hash = `#/options/${audience.id}?mode=colors&base=${colorsToParam(state.myColors)}`;
  });

  renderChosenList();
}

/* يضيف لوناً لقائمة "ألوانك" (3 كحد أقصى). يرجع true إن نجح */
function addMyColor(hex) {
  if (state.myColors.includes(hex)) return true;
  if (state.myColors.length >= 3) { toast(t('mycolors.max')); return false; }
  state.myColors.push(hex);
  renderChosenList();
  return true;
}

/* يرسم الألوان المختارة مع زر إزالة لكل لون */
function renderChosenList() {
  const list = document.getElementById('chosen-list');
  if (state.myColors.length === 0) {
    list.innerHTML = `<p class="zone-empty">${t('mycolors.none')}</p>`;
    return;
  }
  list.innerHTML = state.myColors.map((c, i) => `
    <div class="chosen-item">
      <span class="pal-color" style="background:${c}"></span>
      <span class="chosen-text"><strong>${colorName(c)}</strong><code dir="ltr">${c}</code></span>
      <button type="button" class="remove-btn" data-index="${i}" aria-label="${t('mycolors.remove')}">✕</button>
    </div>
  `).join('');
  list.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.myColors.splice(Number(btn.dataset.index), 1);
      renderChosenList();
    });
  });
}

/* ---------- 3 لوحات مقترحة ---------- */
function renderOptions(audience, params) {
  // نصنع اللوحات مرة واحدة لكل رابط ولكل اختيارات "دقّق"، حتى لا تتغير عند تبديل اللغة
  const key = location.hash + '|' + JSON.stringify(state.refine) + '|' + state.paletteSize;
  if (state.options.hash !== key) {
    state.options = { hash: key, list: makeOptions(params) };
  }
  state.lastOptionsHash = location.hash; // لزر الرجوع من شاشة النتيجة

  // المعلومات التي ننقلها لشاشة النتيجة (المجال والأسلوب)
  // المعلومات التي ننقلها لشاشة النتيجة (المجال، الأسلوب، ومكان الاستخدام لاختيار المعاينة)
  const extra = ['ind', 's', 'use', 'space', 'q1', 'q2', 'pv']
    .filter((k) => params[k])
    .map((k) => '&' + k + '=' + params[k])
    .join('');
  let backHref = '#/quiz/' + audience.id;
  if (params.mode === 'colors') backHref = '#/mycolors/' + audience.id;
  if (params.mode === 'image') backHref = '#/upload/' + audience.id;

  app.innerHTML = `
    ${backLink(backHref)}
    <header class="page-head">
      <h1>${t('options.title')}</h1>
      <p class="lead">${t('options.subtitle')}</p>
    </header>

    ${refinePanelHtml(state.refine)}

    <div class="options-list">
      ${state.options.list.map((opt) => `
        <a class="option-card" href="#/result/${audience.id}?c=${colorsToParam(opt.colors)}${extra}&from=options">
          <div class="option-strip">
            ${opt.colors.map((c) => `<i style="background:${c}"></i>`).join('')}
          </div>
          <div class="option-info">
            <div>
              <h2>${optionTitle(opt.harmony)}</h2>
              <p>${optionDesc(opt.harmony)}</p>
            </div>
            <span class="btn btn-small btn-primary">${t('options.choose')}</span>
          </div>
        </a>
      `).join('')}
    </div>

    <div class="actions">
      <button type="button" class="btn" id="more-btn">${t('options.more')}</button>
    </div>
  `;

  document.getElementById('more-btn').addEventListener('click', () => {
    state.options.list = makeOptions(params);
    renderOptions(audience, params);
  });

  // أي ضغطة في لوحة "دقّق" تعيد صنع اللوحات الثلاث فوراً (بدون القفز لأعلى الصفحة)
  bindRefinePanel(() => renderOptions(audience, params));
}

/* عنوان ووصف كل لوحة مقترحة (أنظمة "دقّق" لها أسماء خاصة) */
function optionTitle(harmony) {
  return HARMONY_SHIFTS[harmony] !== undefined ? t('refine.harmony.' + harmony) : t('harmony.' + harmony);
}
function optionDesc(harmony) {
  return HARMONY_SHIFTS[harmony] !== undefined ? t('refine.harmony.' + harmony + '.hint') : t('harmony.' + harmony + '.desc');
}

/* يختار طريقة الصنع حسب المصدر: من الاستبيان أو من ألوانك */
function makeOptions(params) {
  const refine = state.refine;
  let list;
  let locked = [];     // ألوان لا نغيّرها (ألوان المستخدم نفسه)

  if (params.mode === 'image') {
    list = generateFromImage(paramToColors(params.base));
  } else if (params.mode === 'colors') {
    const bases = paramToColors(params.base);
    locked = bases;
    list = generateAroundColors(bases.length ? bases : ['#3A86FF']);
  } else {
    list = generateFromAnswers({
      industry: params.ind, who: params.who, space: params.space, use: params.use, mood: params.mood, style: params.s,
    }, refine);
  }

  // نطبّق باقي اختيارات "دقّق" على كل لوحة
  const skipFeeling = params.mode !== 'image' && params.mode !== 'colors'; // في الاستبيان استُخدم الإحساس أصلاً
  const style = params.mode === 'sec' || !params.mode ? params.s : null;   // الخلفية الداكنة للفاخر فقط
  return list.map((opt) => {
    let colors = applyRefine(opt.colors, refine, locked, { skipFeeling, style });
    // عدد الألوان الذي اختاره المستخدم (ألوانه الخاصة تبقى دائماً)
    const keep = colors.filter((c) => locked.includes(c));
    colors = [...new Set([...colors.slice(0, state.paletteSize), ...keep])].slice(0, Math.max(state.paletteSize, keep.length + 1));
    return { harmony: refine.harmony || opt.harmony, colors };
  });
}
