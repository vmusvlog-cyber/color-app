/* =========================================================================
   describe.js — طريقة البدء "صِف فكرتك"
   الشاشات:
     #/describe/beginner   ← سؤال: مبتدئ أم عندك ألوان؟
     #/quiz/beginner       ← الاستبيان (5 أسئلة)
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

/*
  أسئلة الاستبيان (6) بالترتيب. تتغير حسب إجابة السؤال الأول (المجال).
  type: 'text' = أزرار كلام، 'mood'/'style' = صور
  title = مفتاح نص السؤال (إن لم يوجد نستخدم 'q.' + key)
*/
function quizSteps(answers) {
  const field = FIELD_QUESTIONS[answers.industry] || FIELD_QUESTIONS.other;
  const second = field.space
    ? { key: 'space', type: 'text', options: field.space, label: 'space.' }
    : { key: 'who', type: 'text', options: field.who, label: 'who.' };
  return [
    { key: 'industry', type: 'text', options: Object.keys(FIELD_QUESTIONS), label: 'ind.' },
    second,
    { key: 'use', type: 'text', options: field.use, label: 'use.', title: field.space ? 'q.use.home' : 'q.use' },
    { key: 'feel', type: 'text', options: ['auto', ...feelingsFor(state.refine.temp)], label: 'refine.feel.' }, // بدون المشاعر المتعارضة مع حار/بارد
    { key: 'mood', type: 'mood', options: Object.keys(MOODS), label: 'mood.' },
    { key: 'style', type: 'style', options: STYLES, label: 'style.' },
  ];
}

/* قائمة المجالات (يستخدمها المعرض أيضاً في فلتر "المجال") */
const QUIZ = [{ key: 'industry', options: Object.keys(FIELD_QUESTIONS) }];

/* ---------- سؤال البداية: مبتدئ أم عندك ألوان؟ ---------- */
function renderDescribe(audience) {
  app.innerHTML = `
    ${backLink('#/methods/' + audience.id)}
    <header class="page-head">
      <h1>${t('describe.title')}</h1>
      <p class="lead">${t('describe.subtitle')}</p>
    </header>
    <div class="method-grid two">
      <a class="method-card big" href="#/quiz/${audience.id}">
        <h2>${t('describe.beginner.title')}</h2>
        <p>${t('describe.beginner.desc')}</p>
      </a>
      <a class="method-card big" href="#/mycolors/${audience.id}">
        <h2>${t('describe.has.title')}</h2>
        <p>${t('describe.has.desc')}</p>
      </a>
    </div>
  `;
}

/* ---------- الاستبيان: سؤال واحد في كل مرة ---------- */
function renderQuiz(audience, fresh) {
  if (fresh) state.quiz = { step: 0, answers: {} }; // نبدأ من جديد عند الدخول للشاشة
  const steps = quizSteps(state.quiz.answers);
  const q = steps[state.quiz.step];
  const total = steps.length;
  const chosen = state.quiz.answers[q.key];

  // شكل كل خيار حسب نوع السؤال
  const optionHtml = (opt) => {
    const selected = chosen === opt ? 'selected' : '';
    if (q.type === 'text') {
      // سؤال الإحساس: نقطة ملوّنة بجانب كل إحساس، و"دعنا نختار لك" بدون نقطة
      const dot = q.key === 'feel' && opt !== 'auto' ? feelingDot(opt) : '';
      const label = q.key === 'feel' && opt === 'auto' ? t('feel.auto') : t(q.label + opt);
      return `<button type="button" class="choice-chip ${selected}" data-value="${opt}">${dot}${label}</button>`;
    }
    const picture = q.type === 'mood' ? moodScene(opt) : styleScene(opt);
    const desc = q.type === 'style' ? `<small>${t('style.' + opt + '.desc')}</small>` : '';
    return `
      <button type="button" class="choice-image ${selected}" data-value="${opt}">
        <span class="choice-pic">${picture}</span>
        <span class="choice-label">${t(q.label + opt)}${desc}</span>
      </button>`;
  };

  app.innerHTML = `
    ${backLink('#/describe/' + audience.id)}
    <div class="quiz">
      <p class="eyebrow">${t('quiz.step', { n: state.quiz.step + 1, total })}</p>
      <div class="progress"><span style="width:${((state.quiz.step + 1) / total) * 100}%"></span></div>
      <h1>${t(q.title || 'q.' + q.key)}</h1>
      <div class="${q.type === 'text' ? 'choice-chips' : 'choice-images'}">
        ${q.options.map(optionHtml).join('')}
      </div>
      ${state.quiz.step > 0 ? `<button type="button" class="btn btn-small" id="quiz-prev"><span class="back-arrow" aria-hidden="true">←</span> ${t('quiz.prev')}</button>` : ''}
    </div>
  `;

  // الضغط على خيار: نحفظ الإجابة وننتقل مباشرة للسؤال التالي
  app.querySelectorAll('[data-value]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // إذا غيّر المستخدم المجال، نمسح إجابات السؤالين التاليين لأن خياراتهما تتغير
      if (q.key === 'industry' && state.quiz.answers.industry !== btn.dataset.value) {
        delete state.quiz.answers.who;
        delete state.quiz.answers.space;
        delete state.quiz.answers.use;
      }
      state.quiz.answers[q.key] = btn.dataset.value;
      if (state.quiz.step < total - 1) {
        state.quiz.step++;
        renderQuiz(audience);
        window.scrollTo(0, 0);
      } else {
        // انتهت الأسئلة ← نذهب لشاشة اللوحات الثلاث ومعنا الإجابات في الرابط
        const a = state.quiz.answers;
        // إجابة الإحساس تصبح أول اختيار في لوحة "دقّق النتيجة" (ويمكن تغييرها هناك)
        state.refine = { ...defaultRefine(), temp: state.refine.temp, feel: a.feel === 'auto' ? '' : a.feel };
        state.previewKind = null; // المعاينة تُختار تلقائياً حسب الإجابات الجديدة
        const place = a.space ? '&space=' + a.space : '&who=' + a.who;
        location.hash = `#/options/${audience.id}?mode=quiz&ind=${a.industry}${place}&use=${a.use}&mood=${a.mood}&s=${a.style}`;
      }
    });
  });

  const prev = document.getElementById('quiz-prev');
  if (prev) prev.addEventListener('click', () => { state.quiz.step--; renderQuiz(audience); });

  // صور حقيقية بدل الرسومات في سؤالي المزاج والأسلوب (إن وُجد مفتاح Unsplash)
  if ((q.type === 'mood' || q.type === 'style') && unsplashEnabled()) loadQuizPhotos(q);
}

/* يستبدل رسمة كل خيار بصورة حقيقية، ويكتب اسم المصوّر تحتها */
function loadQuizPhotos(q) {
  const queries = q.type === 'mood' ? MOOD_PHOTO_QUERY : STYLE_PHOTO_QUERY;
  app.querySelectorAll('.choice-image').forEach((btn) => {
    const opt = btn.dataset.value;
    unsplashPhotos(queries[opt], '', 1)
      .then((photos) => {
        const photo = photos[0];
        if (!photo || !document.body.contains(btn)) return;
        btn.querySelector('.choice-pic').innerHTML = `<img src="${photo.thumb}" alt="${escapeHtml(photo.alt)}">`;
        btn.querySelector('.choice-label').insertAdjacentHTML('beforeend',
          `<small class="photo-credit">${escapeHtml(photo.author)} · Unsplash</small>`);
      })
      .catch(() => { /* نبقي الرسمة إن فشل التحميل */ });
  });
}

/* ---------- عندي ألوان: اكتب اسماً أو كوداً، أو اختر من العجلة ---------- */
function renderMyColors(audience) {
  app.innerHTML = `
    ${backLink('#/describe/' + audience.id)}
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
  const extra = ['ind', 's', 'use', 'space']
    .filter((k) => params[k])
    .map((k) => '&' + k + '=' + params[k])
    .join('');
  let backHref = '#/describe/' + audience.id;
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
  const style = params.mode === 'quiz' || !params.mode ? params.s : null;   // الخلفية الداكنة للفاخر فقط
  return list.map((opt) => {
    let colors = applyRefine(opt.colors, refine, locked, { skipFeeling, style });
    // عدد الألوان الذي اختاره المستخدم (ألوانه الخاصة تبقى دائماً)
    const keep = colors.filter((c) => locked.includes(c));
    colors = [...new Set([...colors.slice(0, state.paletteSize), ...keep])].slice(0, Math.max(state.paletteSize, keep.length + 1));
    return { harmony: refine.harmony || opt.harmony, colors };
  });
}
