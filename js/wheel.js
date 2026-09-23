/* =========================================================================
   wheel.js — عجلة الألوان
   نرسم دائرة على "canvas" (لوحة رسم في المتصفح):
   - الاتجاه حول الدائرة = درجة اللون (أحمر، أصفر، أخضر، أزرق...)
   - البعد عن المركز = قوة اللون (المركز رمادي، الأطراف زاهية)
   - شريط "الإضاءة" منفصل يجعل العجلة كلها أفتح أو أغمق
   ========================================================================= */

/**
 * يرسم العجلة ويجعلها تفاعلية.
 * wheelState: كائن فيه { h, s, l } — نحفظ فيه اللون المختار
 * onChange  : دالة تُستدعى كلما تغيّر اللون المختار
 */
function setupColorWheel(canvas, wheelState, onChange) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;       // العرض = الارتفاع
  const radius = size / 2;

  let cachedImage = null; // نحفظ صورة العجلة حتى لا نعيد حسابها مع كل حركة إصبع

  /* رسم العجلة نقطة نقطة (نحتاجه فقط عند تغيير الإضاءة) */
  function draw() {
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius, dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue; // خارج الدائرة: نتركه شفافاً
        const hue = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
        const sat = (dist / radius) * 100;
        const { r, g, b } = hexToRgb(hslToHex(hue, sat, wheelState.l));
        const i = (y * size + x) * 4;
        image.data[i] = r; image.data[i + 1] = g; image.data[i + 2] = b; image.data[i + 3] = 255;
      }
    }
    cachedImage = image;
    drawMarker();
  }

  /* الدائرة الصغيرة التي تُظهر مكان اللون المختار */
  function drawMarker() {
    ctx.putImageData(cachedImage, 0, 0); // نمسح العلامة القديمة بإعادة وضع الصورة
    const angle = ((wheelState.h - 180) * Math.PI) / 180;
    const dist = (wheelState.s / 100) * radius;
    const x = radius + Math.cos(angle) * dist;
    const y = radius + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  }

  /* عند الضغط أو السحب على العجلة: نحسب اللون تحت الإصبع */
  function pickAt(ev) {
    const rect = canvas.getBoundingClientRect();
    // نحوّل مكان الإصبع إلى إحداثيات داخل لوحة الرسم (لأن حجمها المعروض قد يختلف)
    const x = ((ev.clientX - rect.left) / rect.width) * size;
    const y = ((ev.clientY - rect.top) / rect.height) * size;
    const dx = x - radius, dy = y - radius;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
    wheelState.h = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    wheelState.s = (dist / radius) * 100;
    drawMarker();
    onChange();
  }

  let pressing = false;
  canvas.addEventListener('pointerdown', (e) => {
    pressing = true;
    canvas.setPointerCapture(e.pointerId);
    pickAt(e);
  });
  canvas.addEventListener('pointermove', (e) => { if (pressing) pickAt(e); });
  canvas.addEventListener('pointerup', () => { pressing = false; });
  canvas.addEventListener('pointercancel', () => { pressing = false; });

  draw();
  return { redraw: draw }; // نرجع دالة لإعادة الرسم (عند تغيير الإضاءة)
}
