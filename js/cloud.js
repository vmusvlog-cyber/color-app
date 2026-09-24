/* =========================================================================
   cloud.js — كل الاتصال بـ Supabase موجود هنا فقط
   باقي التطبيق لا يعرف تفاصيل قاعدة البيانات؛ يستدعي هذه الدوال فقط.
   إذا لم تُضبط المفاتيح في config.js (أو لم تُحمَّل المكتبة) يبقى
   cloudEnabled() = false ويعمل التطبيق محلياً كما في المرحلة 4.
   ========================================================================= */

let sb = null;         // "عميل" Supabase — الأداة التي نتحدث بها مع قاعدة البيانات
let cloudUser = null;  // المستخدم المسجّل حالياً (أو null)

/* هل قاعدة البيانات متصلة؟ */
function cloudEnabled() {
  return sb !== null;
}

/* هل المستخدم مسجّل الدخول؟ */
function isSignedIn() {
  return cloudUser !== null;
}

/* الاسم الذي نعرضه للمستخدم */
function userName() {
  if (!cloudUser) return '';
  const meta = cloudUser.user_metadata || {};
  return meta.name || (cloudUser.email || '').split('@')[0];
}

/* يجهّز الاتصال (مرة واحدة عند فتح التطبيق) */
function initCloud() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) return;
  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'implicit',      // الرابط السحري يعمل حتى لو فُتح في متصفح آخر
        detectSessionInUrl: true,  // يقرأ بيانات الدخول من الرابط عند الرجوع من البريد
        persistSession: true,      // يبقى المستخدم مسجلاً بعد إغلاق الصفحة
      },
    });
  } catch (e) {
    sb = null;
    return;
  }

  // كلما تغيّرت حالة الدخول (دخول/خروج) نحدّث الواجهة
  sb.auth.onAuthStateChange((event, session) => {
    const wasSignedIn = isSignedIn();
    cloudUser = session ? session.user : null;
    if (!wasSignedIn && cloudUser) migrateLocalPalettes(); // ننقل اللوحات المحلية إلى الحساب
    if (typeof renderTopbar === 'function') renderTopbar();
  });
}

/* ينتظر حتى نعرف هل المستخدم مسجّل (ويعالج الرجوع من رابط البريد) */
async function cloudReady() {
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    cloudUser = data.session ? data.session.user : null;
  } catch (e) {
    cloudUser = null;
  }
}

/* ---------- تسجيل الدخول بالرابط السحري ---------- */
async function sendMagicLink(email, name) {
  // بعد الضغط على الرابط في البريد يرجع المستخدم لنفس الصفحة التي كان فيها
  saveData('returnTo', location.hash || '#/');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: location.origin + location.pathname,
      data: { name },  // نحفظ الاسم مع الحساب
    },
  });
  if (error) throw error;
}

async function signOut() {
  if (sb) await sb.auth.signOut();
  cloudUser = null;
}

/* ---------- اللوحات ---------- */

/* يحوّل لوحة من شكل التطبيق إلى شكل قاعدة البيانات */
function toRow(p, isPublic) {
  return {
    colors: p.colors,
    title: p.title || null,
    style: p.style || null,
    industry: p.industry || null,
    audience: p.audience || null,
    author_name: userName().slice(0, 40),
    is_public: isPublic,
  };
}

/* حفظ لوحة في حساب المستخدم (خاصة) */
async function cloudSavePalette(p) {
  const { error } = await sb.from('palettes').insert(toRow(p, false));
  if (error) throw error;
}

/* نشر لوحة في المعرض العام */
async function publishPalette(p) {
  const { error } = await sb.from('palettes').insert(toRow(p, true));
  if (error) throw error;
}

/* لوحات المستخدم نفسه (الخاصة والمنشورة) */
async function fetchMyPalettes() {
  const { data, error } = await sb.from('palettes')
    .select('id, colors, title, style, industry, audience, is_public, created_at')
    .eq('user_id', cloudUser.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function cloudDeletePalette(id) {
  const { error } = await sb.from('palettes').delete().eq('id', id);
  if (error) throw error;
}

/* لوحات المعرض. filters = { style, industry, sort: 'new' | 'popular' } */
async function fetchGallery(filters) {
  let query = sb.from('palettes')
    .select('id, colors, title, style, industry, audience, author_name, likes_count, created_at')
    .eq('is_public', true);
  if (filters.style) query = query.eq('style', filters.style);
  if (filters.industry) query = query.eq('industry', filters.industry);
  query = query.order(filters.sort === 'popular' ? 'likes_count' : 'created_at', { ascending: false }).limit(60);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* أرقام اللوحات التي أعجب بها المستخدم */
async function fetchMyLikes() {
  if (!cloudUser) return new Set();
  const { data, error } = await sb.from('likes').select('palette_id').eq('user_id', cloudUser.id);
  if (error) throw error;
  return new Set(data.map((row) => row.palette_id));
}

async function likePalette(id) {
  const { error } = await sb.from('likes').insert({ palette_id: id });
  if (error) throw error;
}

async function unlikePalette(id) {
  const { error } = await sb.from('likes').delete().eq('palette_id', id).eq('user_id', cloudUser.id);
  if (error) throw error;
}

/* ---------- آراء المستخدمين ---------- */
async function sendFeedback(answers) {
  if (!sb) return;
  const { error } = await sb.from('feedback').insert({ q1: answers.q1, q2: answers.q2, q3: answers.q3, lang: currentLang });
  if (error) throw error;
}

/* عند أول تسجيل دخول: ننقل اللوحات المحفوظة في الجهاز إلى الحساب */
async function migrateLocalPalettes() {
  const local = getSavedPalettes();
  if (local.length === 0) return;
  try {
    for (const p of local) await cloudSavePalette(p);
    saveData('savedPalettes', []);
  } catch (e) {
    /* نحاول مرة أخرى في الدخول القادم */
  }
}
