/* =========================================================================
   refine.js — لوحة "🎯 دقّق النتيجة"
   اختيارات تجعل الألوان المقترحة أدق. كل اختيار قيمته '' = "تلقائي" (لا تغيير).
     feel      الإحساس (سيكولوجية الألوان): يحدد درجة اللون
     temp      حار أو بارد
     harmony   نظام التناسق: متكاملة، متجاورة، ثلاثية، أحادية اللون
     sat       التشبّع: قوة اللون
     value     السطوع: خلفية فاتحة أم داكنة
     contrast  التباين: كم يبرز لون التمييز (مثل الأزرار)
   ========================================================================= */

/* الإحساس ← مجال درجات اللون على العجلة (0 أحمر، 120 أخضر، 240 أزرق) */
const FEELINGS = {
  trust:    { hue: [205, 225] },            // ثقة: أزرق
  pro:      { hue: [215, 235], sat: 0.8 },  // احتراف: كحلي هادئ
  calm:     { hue: [175, 200], sat: 0.8 },  // هدوء: أزرق مخضر
  energy:   { hue: [355, 375], sat: 1.15 }, // طاقة: أحمر (375 = 15 بعد اللفة)
  excite:   { hue: [18, 32], sat: 1.15 },   // حماس: برتقالي
  warm:     { hue: [24, 40] },              // دفء: برتقالي مطفي
  luxury:   { hue: [275, 300], sat: 0.85 }, // فخامة: بنفسجي ملكي
  creative: { hue: [300, 330] },            // إبداع: وردي وبنفسجي
  joy:      { hue: [45, 58], sat: 1.1 },    // فرح: أصفر
  nature:   { hue: [95, 135] },             // طبيعة: أخضر
  health:   { hue: [145, 170] },            // صحة: أخضر نعناعي
};

/* قيم كل اختيار بالترتيب (بعد "تلقائي") */
const REFINE_OPTIONS = {
  feel: Object.keys(FEELINGS),
  temp: ['warm', 'cool'],
  harmony: ['complementary', 'analogous', 'triadic', 'mono'],
  sat: ['soft', 'medium', 'vivid'],
  value: ['light', 'dark'],
  contrast: ['calm', 'clear', 'strong'],
};

/* الاختيارات الافتراضية: كلها "تلقائي" */
function defaultRefine() {
  return { feel: '', temp: '', harmony: '', sat: '', value: '', contrast: '' };
}

/* هل اختار المستخدم أي شيء؟ */
function hasRefine(refine) {
  return Object.values(refine).some((v) => v);
}

/* كم ندور على العجلة لكل نظام تناسق (يُستخدم عند صنع لوحات الاستبيان) */
const HARMONY_SHIFTS = { complementary: 180, analogous: 30, triadic: 120, mono: 0 };

/* لون "ملوّن" = ليس أبيض ولا أسود ولا رمادي تقريباً */
function isChromatic(hsl) {
  return hsl.s >= 15 && hsl.l > 8 && hsl.l < 94;
}

/*
  يطبّق كل الاختيارات على لوحة ألوان.
  locked  = ألوان لا نغيّرها أبداً (مثل الألوان التي اختارها المستخدم بنفسه)
  options.skipFeeling = true في الاستبيان، لأن الإحساس استُخدم أصلاً عند صنع اللوحة
*/
function applyRefine(colors, refine, locked = [], options = {}) {
  let out = [...colors];
  const canChange = (i) => !locked.includes(colors[i]);

  if (refine.feel && !options.skipFeeling) out = applyFeeling(out, refine.feel, canChange);
  if (refine.harmony) out = applyHarmony(out, refine.harmony, canChange, locked);
  if (refine.temp) out = applyTemperature(out, refine.temp, canChange);
  if (refine.sat) out = applySaturation(out, refine.sat, canChange);
  if (refine.value) out = applyValue(out, refine.value, canChange);
  if (refine.contrast) out = applyContrast(out, refine.contrast, canChange);
  return uniqueColors(out);
}

/* الإحساس: نجعل لون التمييز من درجة الإحساس المختار */
function applyFeeling(colors, feel, canChange) {
  const hue = (FEELINGS[feel].hue[0] + FEELINGS[feel].hue[1]) / 2;
  return colors.map((hex, i) => {
    if (i !== 2 || !canChange(i)) return hex;
    const { s, l } = hexToHsl(hex);
    return hslToHex(hue, Math.max(s, 45), clamp(l, 35, 65));
  });
}

/*
  نظام التناسق: نأخذ درجة "اللون الأساسي" في اللوحة، ثم نوزّع باقي
  الألوان الملوّنة على الدرجات التي يحددها النظام.
*/
function applyHarmony(colors, harmony, canChange, locked) {
  const hsl = colors.map(hexToHsl);
  // مصدر الدرجة: أول لون ثابت ملوّن، وإلا الثانوي، وإلا الأساسي، وإلا التمييز
  let source = locked.map(hexToHsl).find(isChromatic);
  if (!source) source = [1, 0, 2].map((i) => hsl[i]).find((c) => c && isChromatic(c));
  if (!source) return colors;
  const base = source.h;

  const targets = {
    complementary: [base + 180, base + 165, base + 195],
    analogous: [base + 30, base - 30, base + 55],
    triadic: [base + 120, base + 240],
    mono: [base],
  }[harmony];

  let t = 0;
  const out = colors.map((hex, i) => {
    const c = hsl[i];
    if (!canChange(i) || !isChromatic(c)) return hex;
    if (harmony === 'mono') return hslToHex(base, c.s, c.l);        // كل الألوان من نفس الدرجة
    if (i < 2 && Math.abs(c.h - base) < 1) return hex;              // هذا هو مصدر الدرجة نفسه
    if (i < 2) return hslToHex(base, c.s, c.l);                     // الأساسي والثانوي: نفس الدرجة
    const hue = targets[t % targets.length];
    t++;
    return hslToHex(hue, c.s, c.l);
  });

  // الثلاثية تحتاج ثلاث درجات. إن لم يكفِ عدد الألوان الملوّنة، نلوّن أحد الألوان
  // الإضافية المحايدة (من الأخير للأول) بالدرجة الثالثة
  if (harmony === 'triadic' && t < 2) {
    for (let i = out.length - 1; i >= 3 && t < 2; i--) {
      const c = hexToHsl(out[i]);
      if (!canChange(i) || isChromatic(c)) continue;
      out[i] = hslToHex(targets[t], Math.max(c.s, 40), clamp(c.l, 35, 75));
      t++;
    }
  }
  return out;
}

/* حار أو بارد: ننقل الألوان الملوّنة إلى النصف المطلوب من العجلة */
function applyTemperature(colors, temp, canChange) {
  const isWarm = (h) => h <= 70 || h >= 330;
  const isCool = (h) => h >= 150 && h <= 280;
  return colors.map((hex, i) => {
    const c = hexToHsl(hex);
    if (!canChange(i) || c.s < 12) return hex;
    const ok = temp === 'warm' ? isWarm(c.h) : isCool(c.h);
    if (ok) return hex;
    let h = (c.h + 180) % 360; // نجرب الجهة المقابلة من العجلة
    if (temp === 'warm' && !isWarm(h)) h = h < 200 ? 70 : 330;
    if (temp === 'cool' && !isCool(h)) h = h < 150 ? 150 : 280;
    return hslToHex(h, c.s, c.l);
  });
}

/* التشبّع: ناعمة (باهتة قليلاً)، متوسطة، زاهية */
function applySaturation(colors, sat, canChange) {
  const mul = { soft: 0.6, medium: 1, vivid: 1.35 }[sat];
  return colors.map((hex, i) => {
    const c = hexToHsl(hex);
    if (!canChange(i) || c.s < 15) return hex; // الألوان المحايدة تبقى محايدة
    let s = c.s * mul;
    if (sat === 'medium') s = clamp(c.s, 40, 70);
    return hslToHex(c.h, clamp(s, 5, 100), c.l);
  });
}

/* السطوع: خلفية فاتحة أم داكنة (نقلب الأساسي والثانوي إن لزم) */
function applyValue(colors, value, canChange) {
  const out = [...colors];
  const main = hexToHsl(out[0]);
  const second = out[1] ? hexToHsl(out[1]) : null;

  if (value === 'light' && main.l < 60 && canChange(0)) {
    out[0] = hslToHex(main.h, Math.min(main.s, 20), 95);
    if (second && second.l > 60 && canChange(1)) out[1] = hslToHex(second.h, Math.max(second.s, 20), 16);
  }
  if (value === 'dark' && main.l >= 40 && canChange(0)) {
    out[0] = hslToHex(main.h, clamp(main.s, 10, 30), 11);
    if (second && second.l < 50 && canChange(1)) out[1] = hslToHex(second.h, Math.min(second.s, 25), 90);
  }
  return out;
}

/*
  التباين: كم يبرز لون التمييز عن الخلفية.
  نحرّك إضاءة لون التمييز خطوة خطوة حتى نصل للفرق المطلوب.
  (contrastRatio موجودة في result.js)
*/
function applyContrast(colors, contrast, canChange) {
  if (colors.length < 3 || !canChange(2)) return colors;
  const out = [...colors];
  const bg = out[0];
  const bgLight = hexToHsl(bg).l >= 50;
  let { h, s, l } = hexToHsl(out[2]);

  if (contrast === 'calm') {
    // نقرّب لون التمييز من الخلفية حتى يصبح هادئاً غير صارخ
    s *= 0.8;
    for (let k = 0; k < 20 && contrastRatio(bg, hslToHex(h, s, l)) > 2.2; k++) l += bgLight ? 3 : -3;
  } else {
    // واضح = فرق 3 على الأقل، قوي = فرق 4.5 على الأقل
    const target = contrast === 'clear' ? 3 : 4.5;
    if (contrast === 'strong') s = Math.max(s, 65);
    for (let k = 0; k < 25 && contrastRatio(bg, hslToHex(h, s, l)) < target; k++) l += bgLight ? -3 : 3;
  }
  out[2] = hslToHex(h, s, clamp(l, 5, 95));
  return out;
}

/* =========================================================================
   شكل اللوحة (HTML) — نفس اللوحة تظهر في كل الطرق
   ========================================================================= */

/* رسم صغير لكل نظام تناسق: دائرة ونقاط في أماكن الألوان */
function harmonyIcon(harmony) {
  const angles = { complementary: [0, 180], analogous: [-35, 0, 35], triadic: [0, 120, 240], mono: [0] }[harmony];
  const dots = angles.map((a) => {
    const rad = ((a - 90) * Math.PI) / 180;
    const x = 12 + Math.cos(rad) * 8, y = 12 + Math.sin(rad) * 8;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="currentColor"/>`;
  }).join('');
  const rings = harmony === 'mono' ? '<circle cx="12" cy="12" r="4" fill="currentColor" opacity=".35"/>' : '';
  return `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-opacity=".35"/>${rings}${dots}</svg>`;
}

/* نقطة ملوّنة صغيرة بجانب كل إحساس */
function feelingDot(feel) {
  const hue = (FEELINGS[feel].hue[0] + FEELINGS[feel].hue[1]) / 2;
  return `<span class="dot" style="background:${hslToHex(hue, 60, 50)}"></span>`;
}

/* يرسم اللوحة كاملة */
function refinePanelHtml(refine) {
  const row = (key) => `
    <div class="refine-row">
      <div class="refine-label">
        <strong>${t('refine.' + key)}</strong>
        <small>${t('refine.' + key + '.hint')}</small>
      </div>
      <div class="choice-chips">
        ${[''].concat(REFINE_OPTIONS[key]).map((v) => `
          <button type="button" class="choice-chip small refine-chip ${refine[key] === v ? 'selected' : ''}"
                  data-refine="${key}" data-value="${v}" aria-pressed="${refine[key] === v}">
            ${key === 'feel' && v ? feelingDot(v) : ''}
            ${key === 'harmony' && v ? harmonyIcon(v) : ''}
            <span class="chip-text">
              ${v ? t('refine.' + key + '.' + v) : t('refine.auto')}
              ${key === 'harmony' && v ? `<small>${t('refine.harmony.' + v + '.hint')}</small>` : ''}
            </span>
          </button>`).join('')}
      </div>
    </div>`;

  return `
    <section class="refine-panel" aria-labelledby="refine-title">
      <div class="refine-head">
        <h2 id="refine-title">🎯 ${t('refine.title')}</h2>
        ${hasRefine(refine) ? `<button type="button" class="btn btn-small" id="refine-reset">↺ ${t('refine.reset')}</button>` : ''}
      </div>
      <p class="small-hint">${t('refine.subtitle')}</p>
      ${['feel', 'temp', 'harmony', 'sat', 'value', 'contrast'].map(row).join('')}
    </section>`;
}

/* يربط أزرار اللوحة: عند أي ضغطة نحدّث الاختيارات ثم نستدعي onChange */
function bindRefinePanel(onChange) {
  document.querySelectorAll('[data-refine]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.refine[btn.dataset.refine] = btn.dataset.value;
      onChange();
    });
  });
  const reset = document.getElementById('refine-reset');
  if (reset) reset.addEventListener('click', () => { state.refine = defaultRefine(); onChange(); });
}
