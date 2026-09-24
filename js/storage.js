/* =========================================================================
   storage.js — الحفظ على جهاز المستخدم (localStorage)
   localStorage = مساحة صغيرة في المتصفح تبقى حتى بعد إغلاق الصفحة.
   ملاحظة: البيانات هنا تبقى على هذا الجهاز وهذا المتصفح فقط.
   في المرحلة 5 سننقل الحسابات والآراء إلى قاعدة بيانات حقيقية.
   ========================================================================= */

/* يقرأ قيمة محفوظة (أو يرجع القيمة الاحتياطية إن لم توجد أو منعها المتصفح) */
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/* يحفظ قيمة. يرجع true إن نجح */
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false; // مثلاً في وضع التصفح الخاص
  }
}

/* ---------- اللوحات المحفوظة ---------- */
function getSavedPalettes() {
  return loadData('savedPalettes', []);
}

/* palette = { colors, title, style, audience } */
function savePalette(palette) {
  const list = getSavedPalettes();
  list.unshift({ ...palette, id: Date.now(), date: new Date().toISOString() }); // الأحدث أولاً
  return saveData('savedPalettes', list);
}

function deletePalette(id) {
  saveData('savedPalettes', getSavedPalettes().filter((p) => p.id !== id));
}

/* ---------- الحساب البسيط (اسم + بريد) ---------- */
function getAccount() {
  return loadData('account', null);
}

function setAccount(name, email) {
  saveData('account', { name, email, date: new Date().toISOString() });
}

/* ---------- آراء المستخدمين قبل التحميل ---------- */
function hasGivenFeedback() {
  return loadData('feedback', []).length > 0;
}

function addFeedback(answers) {
  const list = loadData('feedback', []);
  list.push({ ...answers, date: new Date().toISOString() });
  saveData('feedback', list);
}
