/* =========================================================================
   image.js — طريقة البدء "ارفع صورة"
   كل شيء يحدث داخل المتصفح: الصورة لا تُرسل لأي خادم.

   كيف نستخرج الألوان؟ بطريقة اسمها k-means:
   1) نصغّر الصورة ونأخذ لون كل نقطة (بكسل) فيها.
   2) نختار 5 ألوان كبداية.
   3) كل نقطة تنضم لأقرب لون من الخمسة ← تتكوّن 5 مجموعات.
   4) نحسب متوسط كل مجموعة ← يصبح هو اللون الجديد.
   5) نكرر الخطوتين 3 و4 عدة مرات حتى تثبت الألوان.
   النتيجة: 5 ألوان تمثل الصورة، ومعها نسبة كل لون.
   ========================================================================= */

const IMAGE_COLORS = 5;   // كم لوناً نستخرج
const IMAGE_SIZE = 120;   // نصغّر الصورة لهذا الحجم (أسرع، والنتيجة نفسها تقريباً)

/* ---------- شاشة رفع الصورة ---------- */
function renderUpload(audience) {
  const up = state.upload; // { src, colors: [{hex, share}] } أو null

  app.innerHTML = `
    ${backLink('#/methods/' + audience.id)}
    <header class="page-head">
      <h1>${t('upload.title')}</h1>
      <p class="lead">${t('upload.subtitle')}</p>
    </header>

    <label class="drop-area ${up ? 'has-image' : ''}" id="drop-area" for="file-input">
      ${up
        ? `<img src="${up.src}" alt="" class="upload-preview">
           <span class="btn btn-small">${t('upload.change')}</span>`
        : `<span class="drop-icon" aria-hidden="true">🖼️</span><span>${t('upload.drop')}</span>`}
      <input type="file" id="file-input" accept="image/*" hidden>
    </label>

    <div id="upload-result">${up ? uploadResultHtml(audience, up) : ''}</div>
  `;

  // اختيار صورة بالضغط
  document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageFile(e.target.files[0], audience);
  });

  // أو بسحب الصورة وإفلاتها فوق المربع (في الكمبيوتر)
  const area = document.getElementById('drop-area');
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file, audience);
  });
}

/* يقرأ الصورة، يستخرج ألوانها، ثم يعيد رسم الشاشة */
function handleImageFile(file, audience) {
  document.getElementById('upload-result').innerHTML = `<p class="small-hint">${t('upload.working')}</p>`;
  const src = URL.createObjectURL(file); // رابط مؤقت للصورة داخل المتصفح فقط
  const img = new Image();
  img.onload = () => {
    try {
      state.upload = { src, colors: extractColors(img, IMAGE_COLORS) };
      renderUpload(audience);
    } catch (err) {
      toast(t('upload.error'));
    }
  };
  img.onerror = () => toast(t('upload.error'));
  img.src = src;
}

/* النتيجة تحت الصورة: الألوان، الأسلوب، الشرح، وزرّان */
function uploadResultHtml(audience, up) {
  const colors = up.colors.map((c) => c.hex);
  const style = detectStyle(colors);
  return `
    <section class="result-section upload-result">
      <h2 class="section-title">${t('upload.found')}</h2>
      <div class="option-strip upload-strip">
        ${up.colors.map((c) => `
          <i style="background:${c.hex}; flex:${c.share}; color:${isLight(c.hex) ? '#1a1a1a' : '#fff'}">
            <small dir="ltr">${Math.round(c.share)}%</small>
          </i>`).join('')}
      </div>
      <p class="style-pill">${t('upload.styleIs', { style: t('style.' + style) })}</p>
      <div class="why-panel">${whyHtml(colors, null)}</div>
      <div class="actions">
        <a class="btn btn-primary" href="#/result/${audience.id}?c=${colorsToParam(colors)}&s=${style}&from=upload">✓ ${t('upload.keep')}</a>
        <a class="btn" href="#/options/${audience.id}?mode=image&base=${colorsToParam(colors)}&s=${style}">✨ ${t('upload.adjust')}</a>
      </div>
    </section>
  `;
}

/*
  يستخرج أبرز الألوان من صورة بطريقة k-means.
  يرجع: [{ hex: '#AABBCC', share: 42.5 }, ...] مرتبة من الأكثر للأقل
*/
function extractColors(img, k) {
  // 1) نرسم الصورة مصغّرة على لوحة رسم مخفية ونقرأ ألوان نقاطها
  const scale = Math.min(1, IMAGE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // نتجاهل الأجزاء الشفافة
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) throw new Error('empty image');

  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

  // 2) نختار ألوان البداية بذكاء: كل لون جديد بعيد عن السابقين (يسمى k-means++)
  const centers = [pixels[Math.floor(Math.random() * pixels.length)]];
  while (centers.length < k) {
    const d = pixels.map((p) => Math.min(...centers.map((c) => dist(p, c))));
    const total = d.reduce((a, b) => a + b, 0);
    if (total === 0) break; // الصورة لونها واحد تقريباً
    let r = Math.random() * total, idx = 0;
    while (r > d[idx]) { r -= d[idx]; idx++; }
    centers.push(pixels[idx]);
  }

  // 3 و 4) نكرر: كل نقطة لأقرب مركز، ثم نحسب متوسط كل مجموعة
  let counts = [];
  for (let round = 0; round < 12; round++) {
    const sums = centers.map(() => [0, 0, 0]);
    counts = centers.map(() => 0);
    for (const p of pixels) {
      let best = 0, bestD = Infinity;
      centers.forEach((c, j) => { const dd = dist(p, c); if (dd < bestD) { bestD = dd; best = j; } });
      sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2];
      counts[best]++;
    }
    centers.forEach((c, j) => {
      if (counts[j] > 0) centers[j] = sums[j].map((v) => v / counts[j]);
    });
  }

  // 5) نحوّل النتيجة إلى أكواد ونرتبها حسب النسبة
  const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  return centers
    .map((c, j) => ({ hex: toHex(c), share: (counts[j] / pixels.length) * 100 }))
    .filter((c) => c.share > 0)
    .sort((a, b) => b.share - a.share);
}

/*
  "اقترح تعديلات": 3 لوحات من ألوان الصورة
  1) ألوان الصورة نفسها بعد ترتيبها وتنعيمها
  2 و 3) لوحتان متناسقتان حول أقوى لون في الصورة
*/
function generateFromImage(colors) {
  const hsl = colors.map((c) => ({ hex: c, ...hexToHsl(c) }));
  const byLight = [...hsl].sort((a, b) => b.l - a.l);
  const lightest = byLight[0];
  const darkest = byLight[byLight.length - 1];
  const vivid = [...hsl].sort((a, b) => b.s - a.s).find((c) => c !== lightest && c !== darkest) || hsl[0];

  // الترتيب: خلفية فاتحة، ثم أقوى لون (رئيسي)، ثم لون آخر من الصورة (تمييز)،
  // ثم الداكن للنصوص في المكان الرابع (حتى لا تبدو اللوحة غامقة)
  const others = hsl.filter((c) => c !== lightest && c !== darkest && c !== vivid);
  const tidy = [
    hslToHex(lightest.h, Math.min(lightest.s, 25), Math.max(lightest.l, 93)),
    hslToHex(vivid.h, Math.max(vivid.s, 55), clamp(vivid.l, 40, 60)),
    ...others.slice(0, 1).map((c) => hslToHex(c.h, Math.max(c.s, 35), clamp(c.l, 35, 70))),
    hslToHex(darkest.h, darkest.s, Math.min(darkest.l, 22)),
    ...others.slice(1).map((c) => c.hex),
  ].slice(0, 5);

  const around = generateAroundColors([vivid.hex]);
  return [{ harmony: 'image', colors: uniqueColors(tidy) }, around[0], around[1]];
}
