/* =========================================================================
   drag.js — السحب والإفلات (يعمل بالماوس وباللمس على الجوال والآيباد)
   نستخدم "Pointer Events" لأنها تتعامل مع الماوس واللمس بنفس الطريقة.

   الفكرة ببساطة:
   - عند الضغط على لون نبدأ بالمراقبة.
   - إذا تحرك الإصبع/الماوس أكثر من 6 بكسل ← هذا "سحب": نُظهر دائرة ملونة تتبع الإصبع.
   - إذا رُفع الإصبع بدون تحرك ← هذا "نقرة" (tap).
   - عند الإفلات فوق منطقة اللوحة نحسب المكان الذي يجب أن يُدرج فيه اللون.
   ========================================================================= */

const DRAG_THRESHOLD = 6; // كم بكسل يجب أن يتحرك الإصبع حتى نعتبره سحباً

/**
 * يجعل عنصراً قابلاً للسحب.
 * options:
 *   getColor  : دالة ترجع لون العنصر (HEX)
 *   onTap     : ماذا يحدث عند النقر فقط
 *   onDrop    : ماذا يحدث عند الإفلات داخل اللوحة — تستقبل (اللون، مكان الإدراج)
 *   zoneId    : رقم تعريف منطقة الإفلات (اللوحة)
 */
function makeDraggable(el, options) {
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // الزر الأيسر أو اللمس فقط
    const startX = e.clientX, startY = e.clientY;
    let ghost = null; // الدائرة الملونة التي تتبع الإصبع أثناء السحب

    el.setPointerCapture(e.pointerId); // نستمر باستقبال الحركة حتى لو خرج الإصبع عن العنصر

    const onMove = (ev) => {
      const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (!ghost && moved > DRAG_THRESHOLD) {
        ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.background = options.getColor();
        document.body.appendChild(ghost);
        el.classList.add('is-dragging');
      }
      if (ghost) {
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        showDropMarker(options.zoneId, ev.clientX, ev.clientY);
      }
    };

    const onUp = (ev) => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.classList.remove('is-dragging');

      if (ghost) {
        // انتهى السحب: هل أُفلت اللون فوق اللوحة؟
        ghost.remove();
        const index = findDropIndex(options.zoneId, ev.clientX, ev.clientY);
        clearDropMarker(options.zoneId);
        if (index !== null) options.onDrop(options.getColor(), index);
      } else if (ev.type === 'pointerup' && options.onTap) {
        options.onTap(); // لم يتحرك ← نقرة عادية
      }
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  });

  // دعم لوحة المفاتيح: زر Enter أو المسافة = نقرة
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && options.onTap) {
      e.preventDefault();
      options.onTap();
    }
  });
}

/*
  يحسب مكان الإدراج داخل اللوحة.
  يرجع رقماً (0 = في البداية) أو null إذا لم يكن الإصبع فوق اللوحة.
*/
function findDropIndex(zoneId, x, y) {
  const zone = document.getElementById(zoneId);
  if (!zone) return null;
  const r = zone.getBoundingClientRect();
  if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;

  const items = [...zone.querySelectorAll('.pal-item')];
  if (items.length === 0) return 0;

  // نجد أقرب لون إلى الإصبع
  let nearest = 0, best = Infinity;
  items.forEach((item, i) => {
    const b = item.getBoundingClientRect();
    const d = Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2));
    if (d < best) { best = d; nearest = i; }
  });

  // هل نضعه قبل هذا اللون أم بعده؟
  // في العربية (من اليمين لليسار) "قبل" تعني جهة اليمين
  const b = items[nearest].getBoundingClientRect();
  const center = b.left + b.width / 2;
  const isRtl = document.documentElement.dir === 'rtl';
  const before = isRtl ? x > center : x < center;
  return before ? nearest : nearest + 1;
}

/* يُظهر خطاً صغيراً يوضح أين سيُوضع اللون */
function showDropMarker(zoneId, x, y) {
  clearDropMarker(zoneId);
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  const index = findDropIndex(zoneId, x, y);
  if (index === null) return;
  zone.classList.add('drop-active');
  const items = zone.querySelectorAll('.pal-item');
  if (index < items.length) items[index].classList.add('insert-before');
  else if (items.length) items[items.length - 1].classList.add('insert-after');
}

/* يُخفي علامات الإدراج */
function clearDropMarker(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  zone.classList.remove('drop-active');
  zone.querySelectorAll('.insert-before, .insert-after').forEach((el) => {
    el.classList.remove('insert-before', 'insert-after');
  });
}
