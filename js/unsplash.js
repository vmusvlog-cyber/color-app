/* =========================================================================
   unsplash.js — صور حقيقية ملهمة من مكتبة Unsplash المجانية
   طريقتان:
   1) رابط بحث جاهز يفتح Unsplash أو Pinterest (يعمل دائماً، بدون مفتاح)
   2) صور داخل التطبيق نفسه (تحتاج مفتاحاً مجانياً في config.js)
   شروط Unsplash: نعرض الصور من روابطهم مباشرة، ونذكر اسم المصوّر
   مع رابط لصفحته ولموقع Unsplash.
   ========================================================================= */

const UNSPLASH_APP = 'alwan_sahla'; // اسم التطبيق في روابط الشكر (يطلبه Unsplash)

/* هل المفتاح موجود؟ */
function unsplashEnabled() {
  return typeof UNSPLASH_ACCESS_KEY !== 'undefined' && UNSPLASH_ACCESS_KEY !== '';
}

/* رابط بحث جاهز في موقع Unsplash (مع فلتر اللون إن وُجد) */
function unsplashSearchUrl(query, color) {
  const slug = encodeURIComponent(query.trim().replace(/\s+/g, '-'));
  return `https://unsplash.com/s/photos/${slug}` + (color ? `?color=${color}` : '');
}

/* رابط بحث جاهز في Pinterest (بكلمات اللون) */
function pinterestSearchUrl(query) {
  return 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(query);
}

/* رابط الشكر للمصوّر (بالصيغة التي يطلبها Unsplash) */
function unsplashCredit(url) {
  return `${url}?utm_source=${UNSPLASH_APP}&utm_medium=referral`;
}

/*
  يبحث عن صور في Unsplash ويرجع: [{ thumb, full, alt, author, authorUrl, pageUrl }]
  نحفظ النتائج يوماً كاملاً في الجهاز، لأن المفتاح المجاني له عدد طلبات محدود في الساعة.
*/
async function unsplashPhotos(query, color, count = 4) {
  if (!unsplashEnabled()) return [];
  const cacheKey = 'unsplash:' + query + '|' + color + '|' + count;
  const cached = loadData(cacheKey, null);
  if (cached && Date.now() - cached.time < 24 * 60 * 60 * 1000) return cached.photos;

  const params = new URLSearchParams({ query, per_page: String(count), orientation: 'landscape', content_filter: 'high' });
  if (color) params.set('color', color);
  const res = await fetch('https://api.unsplash.com/search/photos?' + params.toString(), {
    headers: { Authorization: 'Client-ID ' + UNSPLASH_ACCESS_KEY, 'Accept-Version': 'v1' },
  });
  if (!res.ok) throw new Error('unsplash ' + res.status);
  const data = await res.json();
  const photos = (data.results || []).map((p) => ({
    thumb: p.urls.small,
    full: p.urls.regular,
    alt: p.alt_description || query,
    author: p.user.name,
    authorUrl: unsplashCredit(p.user.links.html),
    pageUrl: unsplashCredit(p.links.html),
  }));
  saveData(cacheKey, { time: Date.now(), photos });
  return photos;
}

/* شبكة صور مع اسم المصوّر تحت كل صورة */
function photosGridHtml(photos) {
  return `
    <div class="photo-grid">
      ${photos.map((p) => `
        <figure class="photo">
          <a href="${p.pageUrl}" target="_blank" rel="noopener"><img src="${p.thumb}" alt="${escapeHtml(p.alt)}" loading="lazy"></a>
          <figcaption>
            ${t('photo.by')} <a href="${p.authorUrl}" target="_blank" rel="noopener">${escapeHtml(p.author)}</a>
            · <a href="${unsplashCredit('https://unsplash.com/')}" target="_blank" rel="noopener">Unsplash</a>
          </figcaption>
        </figure>`).join('')}
    </div>`;
}
