/* =========================================================================
   download.js — تحميل اللوحة كصورة PNG أو ملف PDF
   الخطوات داخل نافذة صغيرة:
     1) تسجيل سريع (اسم + بريد) — مرة واحدة فقط
     2) 3 أسئلة رأي إجبارية — مرة واحدة فقط على هذا الجهاز
     3) اختيار نوع الملف ← نرسم البطاقات ونحمّلها
   ========================================================================= */

/* الأسئلة الثلاثة: كل سؤال له 4 إجابات (a, b, c, d) نصوصها في ملف الترجمة */
const FEEDBACK_QUESTIONS = ['q1', 'q2', 'q3'];
const FEEDBACK_ANSWERS = ['a', 'b', 'c', 'd'];

/* حالة النافذة الحالية */
const dl = { colors: [], title: '', answers: {}, lastPng: null };

/* يفتح نافذة التحميل */
function openDownload(colors, title) {
  dl.colors = colors;
  dl.title = title;
  dl.answers = {};

  let overlay = document.getElementById('dl-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dl-overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    // الضغط خارج النافذة أو زر Esc يغلقها
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDownload(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDownload(); });
  }
  overlay.hidden = false;
  document.body.classList.add('no-scroll');

  // نبدأ من أول خطوة لم ينجزها المستخدم بعد
  if (!getAccount() && !isSignedIn()) renderDlSignup();
  else if (!hasGivenFeedback()) renderDlFeedback();
  else renderDlFormat();
}

function closeDownload() {
  const overlay = document.getElementById('dl-overlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('no-scroll');
}

/* الإطار المشترك لكل خطوة */
function dlFrame(step, inner) {
  const overlay = document.getElementById('dl-overlay');
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dl-heading">
      <div class="modal-head">
        <p class="eyebrow">${t('dl.step', { n: step })}</p>
        <button type="button" class="modal-close" id="dl-close" aria-label="${t('dl.close')}">✕</button>
      </div>
      <div class="progress"><span style="width:${(step / 3) * 100}%"></span></div>
      ${inner}
    </div>
  `;
  document.getElementById('dl-close').addEventListener('click', closeDownload);
}

/* ---------- الخطوة 1: تسجيل سريع ---------- */
function renderDlSignup() {
  dlFrame(1, `
    <h2 id="dl-heading">${t('dl.signupTitle')}</h2>
    <p class="small-hint">${t('dl.signupHint')}</p>
    <form id="dl-form" class="dl-form" novalidate>
      <label class="field-label" for="dl-name">${t('dl.name')}</label>
      <input type="text" id="dl-name" class="name-input" autocomplete="name" maxlength="40">
      <label class="field-label" for="dl-email">${t('dl.email')}</label>
      <input type="email" id="dl-email" class="name-input" autocomplete="email" dir="ltr" maxlength="80">
      <p class="form-error" id="dl-error" role="alert"></p>
      <button type="submit" class="btn btn-primary">${t('dl.continue')}</button>
    </form>
  `);
  document.getElementById('dl-name').focus();

  document.getElementById('dl-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('dl-name').value.trim();
    const email = document.getElementById('dl-email').value.trim();
    const error = document.getElementById('dl-error');
    if (!name) { error.textContent = t('dl.needName'); return; }
    // فحص بسيط لشكل البريد: شيء@شيء.شيء
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = t('dl.badEmail'); return; }
    setAccount(name, email);
    // إذا كانت قاعدة البيانات متصلة، نرسل أيضاً رابط دخول لإنشاء حساب حقيقي
    // (لا ننتظره: المستخدم يكمل التحميل مباشرة)
    if (cloudEnabled()) {
      sendMagicLink(email, name).then(() => { dl.linkSent = true; }).catch(() => {});
    }
    if (!hasGivenFeedback()) renderDlFeedback(); else renderDlFormat();
  });
}

/* ---------- الخطوة 2: ثلاثة أسئلة (إجبارية) ---------- */
function renderDlFeedback() {
  dlFrame(2, `
    <h2 id="dl-heading">${t('dl.feedbackTitle')}</h2>
    <p class="small-hint">${t('dl.feedbackHint')}</p>
    ${FEEDBACK_QUESTIONS.map((q) => `
      <fieldset class="fb-question">
        <legend>${t('fb.' + q)}</legend>
        <div class="choice-chips">
          ${FEEDBACK_ANSWERS.map((a) => `
            <button type="button" class="choice-chip small ${dl.answers[q] === a ? 'selected' : ''}"
                    data-q="${q}" data-a="${a}" aria-pressed="${dl.answers[q] === a}">${t('fb.' + q + '.' + a)}</button>
          `).join('')}
        </div>
      </fieldset>
    `).join('')}
    <p class="form-error" id="dl-error" role="alert"></p>
    <button type="button" class="btn btn-primary" id="fb-continue">${t('dl.continue')}</button>
  `);

  document.querySelectorAll('[data-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dl.answers[btn.dataset.q] = btn.dataset.a;
      renderDlFeedback();
    });
  });

  document.getElementById('fb-continue').addEventListener('click', () => {
    const allAnswered = FEEDBACK_QUESTIONS.every((q) => dl.answers[q]);
    if (!allAnswered) { document.getElementById('dl-error').textContent = t('dl.answerAll'); return; }
    addFeedback(dl.answers);
    sendFeedback(dl.answers).catch(() => {}); // نرسل الرأي لقاعدة البيانات (إن كانت متصلة)
    renderDlFormat();
  });
}

/* ---------- الخطوة 3: اختيار نوع الملف ---------- */
function renderDlFormat(done) {
  const account = isSignedIn() ? { name: userName() } : getAccount();
  dlFrame(3, `
    <h2 id="dl-heading">${done ? t('dl.done') : t('dl.formatTitle')}</h2>
    ${account ? `<p class="small-hint">${t('dl.hello', { name: escapeHtml(account.name) })}</p>` : ''}
    ${dl.linkSent && !isSignedIn() ? `<p class="small-hint">✉️ ${t('dl.linkSent')}</p>` : ''}
    ${done && dl.lastPng ? `
      <img src="${dl.lastPng}" alt="${escapeHtml(dl.title)}" class="dl-preview">
      <p class="small-hint">${t('dl.fallback')}</p>` : ''}
    <div class="format-grid">
      <button type="button" class="format-card" data-format="png">
        <span class="format-icon" aria-hidden="true">🖼️</span>
        <strong>${t('dl.png')}</strong>
        <small>${t('dl.pngDesc')}</small>
      </button>
      <button type="button" class="format-card" data-format="pdf">
        <span class="format-icon" aria-hidden="true">📄</span>
        <strong>${t('dl.pdf')}</strong>
        <small>${t('dl.pdfDesc')}</small>
      </button>
    </div>
    <p class="small-hint" id="dl-status" role="status"></p>
  `);

  document.querySelectorAll('[data-format]').forEach((btn) => {
    btn.addEventListener('click', () => makeDownload(btn.dataset.format));
  });
}

/* يرسم البطاقات ثم يحمّل الملف بالنوع المختار */
async function makeDownload(format) {
  document.getElementById('dl-status').textContent = t('dl.working');
  const canvas = await drawPaletteCanvas(dl.colors, dl.title);
  const fileName = 'palette-' + dl.colors.map((c) => c.slice(1)).join('-').toLowerCase();

  dl.lastPng = canvas.toDataURL('image/png');
  if (format === 'png') {
    triggerDownload(dl.lastPng, fileName + '.png');
  } else {
    const pdfBytes = makePdfFromCanvas(canvas);
    const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    triggerDownload(url, fileName + '.pdf');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  renderDlFormat(true); // نعرض الصورة أيضاً، حتى يستطيع حفظها يدوياً إن لم يبدأ التحميل
}

/* يبدأ تحميل ملف عن طريق رابط مؤقت */
function triggerDownload(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* =========================================================================
   رسم البطاقات على لوحة رسم (canvas) — نفس شكل البولارويد في الشاشة
   ========================================================================= */
async function drawPaletteCanvas(colors, title) {
  const isAr = currentLang === 'ar';
  const font = isAr ? "'Tajawal', 'Inter', sans-serif" : "'Inter', 'Tajawal', sans-serif";
  // ننتظر تحميل الخطوط حتى لا تظهر الكتابة بخط آخر
  try { await document.fonts.load('700 20px ' + (isAr ? 'Tajawal' : 'Inter')); } catch (e) { /* نكمل بالخط الاحتياطي */ }

  // القياسات (بالبكسل)
  const n = colors.length;
  const cardW = 200, square = 172, cardH = 300, gap = 26, pad = 48;
  const width = pad * 2 + n * cardW + (n - 1) * gap;
  const height = 110 + cardH + 110;
  const scale = 2; // ضعف الدقة حتى تكون الصورة واضحة

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.direction = isAr ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';

  // الخلفية والعنوان
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1C1C1E';
  ctx.font = `800 30px ${font}`;
  ctx.fillText(title, width / 2, 66);

  const weights = ratioWeights(n);
  const top = 110;

  colors.forEach((hex, i) => {
    // في العربية نرتب البطاقات من اليمين
    const x = isAr ? width - pad - (i + 1) * cardW - i * gap : pad + i * (cardW + gap);

    // إطار البطاقة الأبيض مع ظل خفيف
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.14)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    roundedRect(ctx, x, top, cardW, cardH, 6);
    ctx.fill();
    ctx.restore();

    // مربع اللون
    const sx = x + (cardW - square) / 2, sy = top + 14;
    ctx.fillStyle = hex;
    ctx.fillRect(sx, sy, square, square);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, square - 1, square - 1);

    // نسبة 60-30-10 فوق اللون
    ctx.fillStyle = isLight(hex) ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';
    ctx.font = `800 18px ${font}`;
    ctx.fillText(formatPercent(weights[i]), sx + square / 2, sy + 30);

    // الاسم والكود والدور في الجزء السفلي الأعرض
    const cx = x + cardW / 2;
    ctx.fillStyle = '#1C1C1E';
    ctx.font = `700 18px ${font}`;
    ctx.fillText(colorName(hex), cx, sy + square + 34);
    ctx.fillStyle = '#6B6B70';
    ctx.font = `500 15px ui-monospace, Menlo, monospace`;
    ctx.direction = 'ltr';                       // الكود يُكتب دائماً من اليسار (حتى لا تنتقل # لآخره)
    ctx.fillText(hex, cx, sy + square + 58);
    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.font = `400 13px ${font}`;
    ctx.fillText(roleName(i), cx, sy + square + 80);
  });

  // شريط 60-30-10
  const barY = top + cardH + 36, barW = width - pad * 2;
  let bx = isAr ? width - pad : pad;
  ctx.save();
  roundedRect(ctx, pad, barY, barW, 18, 9);
  ctx.clip();
  colors.forEach((hex, i) => {
    const w = (weights[i] / 100) * barW;
    ctx.fillStyle = hex;
    if (isAr) { bx -= w; ctx.fillRect(bx, barY, w + 0.5, 18); }
    else { ctx.fillRect(bx, barY, w + 0.5, 18); bx += w; }
  });
  ctx.restore();

  // التذييل
  ctx.fillStyle = '#9A9AA0';
  ctx.font = `500 14px ${font}`;
  ctx.fillText(t('dl.footer', { app: t('app.name') }), width / 2, height - 28);

  return canvas;
}

/* مستطيل بزوايا دائرية (يعمل حتى في المتصفحات القديمة) */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* =========================================================================
   صنع ملف PDF بدون أي مكتبة خارجية
   الفكرة: ملف PDF بصفحة واحدة، داخلها صورة (JPEG) للبطاقات بنفس الحجم.
   ملف PDF في الحقيقة نص منظم بطريقة معينة + بيانات الصورة.
   ========================================================================= */
function makePdfFromCanvas(canvas) {
  // صورة JPEG بخلفية بيضاء (JPEG لا يدعم الشفافية، وخلفيتنا بيضاء أصلاً)
  const jpegBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  const jpeg = Uint8Array.from(atob(jpegBase64), (ch) => ch.charCodeAt(0));

  // حجم الصفحة بالنقاط (الصورة مرسومة بضعف الدقة، لذلك نقسم على 2)
  const pageW = Math.round(canvas.width / 2);
  const pageH = Math.round(canvas.height / 2);
  const drawCommands = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;

  const encoder = new TextEncoder();
  const parts = [];      // أجزاء الملف بالترتيب
  const offsets = [];    // مكان بداية كل "كائن" داخل الملف (يحتاجه قارئ PDF)
  let length = 0;
  const add = (piece) => {
    const bytes = typeof piece === 'string' ? encoder.encode(piece) : piece;
    parts.push(bytes);
    length += bytes.length;
  };
  const startObject = () => offsets.push(length);

  add('%PDF-1.4\n');
  startObject(); add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObject(); add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObject(); add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  startObject();
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg);
  add('\nendstream\nendobj\n');
  startObject(); add(`5 0 obj\n<< /Length ${drawCommands.length} >>\nstream\n${drawCommands}\nendstream\nendobj\n`);

  // فهرس المواقع في آخر الملف
  const xrefStart = length;
  add(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach((o) => add(String(o).padStart(10, '0') + ' 00000 n \n'));
  add(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  // نجمع كل الأجزاء في ملف واحد
  const out = new Uint8Array(length);
  let pos = 0;
  parts.forEach((p) => { out.set(p, pos); pos += p.length; });
  return out;
}
