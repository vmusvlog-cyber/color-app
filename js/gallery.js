/* =========================================================================
   gallery.js — المعرض العام، نافذة تسجيل الدخول، وشاشة "لوحاتي"
     #/gallery  ← المعرض (فلاتر: الأسلوب، المجال، الترتيب)
     #/saved    ← لوحاتي (من الحساب إن كان مسجلاً، وإلا من الجهاز)
   ========================================================================= */

/* فلاتر المعرض الحالية */
const galleryFilters = { style: '', industry: '', sort: 'new' };

/* ---------- شاشة المعرض ---------- */
function renderGallery() {
  // أزرار فلتر صغيرة: [الكل] + الخيارات
  const chips = (key, values, labelPrefix) => [''].concat(values).map((v) => `
    <button type="button" class="choice-chip small ${galleryFilters[key] === v ? 'selected' : ''}"
            data-filter="${key}" data-value="${v}" aria-pressed="${galleryFilters[key] === v}">
      ${v ? t(labelPrefix + v) : t('gallery.all')}
    </button>`).join('');

  app.innerHTML = `
    ${backLink('#/')}
    <header class="page-head">
      <h1>${t('gallery.title')}</h1>
      <p class="lead">${t('gallery.subtitle')}</p>
    </header>
    ${!cloudEnabled() ? `<p class="zone-empty">${t('gallery.off')}</p>` : `
      <div class="filters">
        <div class="filter-row"><span class="filter-label">${t('gallery.sort')}</span>
          <div class="choice-chips">
            ${['new', 'popular'].map((v) => `
              <button type="button" class="choice-chip small ${galleryFilters.sort === v ? 'selected' : ''}"
                      data-filter="sort" data-value="${v}" aria-pressed="${galleryFilters.sort === v}">
                ${v === 'new' ? t('gallery.sortNew') : t('gallery.sortPopular')}
              </button>`).join('')}
          </div>
        </div>
        <div class="filter-row"><span class="filter-label">${t('gallery.style')}</span>
          <div class="choice-chips">${chips('style', STYLES, 'style.')}</div>
        </div>
        <div class="filter-row"><span class="filter-label">${t('gallery.industry')}</span>
          <div class="choice-chips">${chips('industry', QUIZ[0].options.filter((o) => o !== 'other'), 'ind.')}</div>
        </div>
      </div>
      <div id="gallery-grid"><p class="small-hint">${t('gallery.loading')}</p></div>
    `}
  `;

  if (!cloudEnabled()) return;

  app.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      galleryFilters[btn.dataset.filter] = btn.dataset.value;
      renderGallery();
    });
  });

  loadGalleryGrid();
}

/* يحمّل لوحات المعرض من قاعدة البيانات ويرسمها */
async function loadGalleryGrid() {
  const grid = document.getElementById('gallery-grid');
  try {
    const [rows, liked] = await Promise.all([fetchGallery(galleryFilters), fetchMyLikes()]);
    if (!document.body.contains(grid)) return; // انتقل المستخدم لشاشة أخرى أثناء التحميل
    if (rows.length === 0) { grid.innerHTML = `<p class="zone-empty">${t('gallery.empty')}</p>`; return; }

    grid.innerHTML = `<div class="palette-grid">${rows.map((p) => {
      const author = escapeHtml(p.author_name || '');
      const name = p.title ? t('pal.' + p.title) : t('gallery.untitled', { name: author });
      const href = `#/result/${p.audience || 'beginner'}?c=${colorsToParam(p.colors)}` +
        (p.style ? '&s=' + p.style : '') + (p.industry ? '&ind=' + p.industry : '');
      const isLiked = liked.has(p.id);
      return `
        <div class="palette-tile saved-tile">
          <a class="tile-strip" href="${href}">${p.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</a>
          <div class="tile-name saved-row">
            <span><strong>${name}</strong><small>${author ? t('gallery.by', { name: author }) : ''}</small></span>
            <button type="button" class="like-btn ${isLiked ? 'liked' : ''}" data-like="${p.id}"
                    aria-pressed="${isLiked}" aria-label="${t('gallery.like')}">
              <span>${p.likes_count}</span>
            </button>
          </div>
        </div>`;
    }).join('')}</div>`;

    grid.querySelectorAll('[data-like]').forEach((btn) => btn.addEventListener('click', () => toggleLike(btn)));
  } catch (e) {
    grid.innerHTML = `<p class="zone-empty">${t('cloud.error')}</p>`;
  }
}

/* زر الإعجاب: نغيّر الشكل فوراً، ثم نحفظ في قاعدة البيانات (ونرجع إن فشل) */
async function toggleLike(btn) {
  if (!isSignedIn()) { openSignIn(t('auth.forLike')); return; }
  const id = btn.dataset.like;
  const wasLiked = btn.classList.contains('liked');
  const countEl = btn.querySelector('span');
  const setState = (liked) => {
    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', liked);
    countEl.textContent = Number(countEl.textContent) + (liked ? 1 : -1);
  };
  setState(!wasLiked);
  btn.disabled = true;
  try {
    if (wasLiked) await unlikePalette(id); else await likePalette(id);
  } catch (e) {
    setState(wasLiked);
    toast(t('cloud.error'));
  }
  btn.disabled = false;
}

/* ---------- نافذة تسجيل الدخول (رابط سحري) ---------- */
function openSignIn(reason) {
  let overlay = document.getElementById('auth-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSignIn(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSignIn(); });
  }
  overlay.hidden = false;
  document.body.classList.add('no-scroll');

  const account = getAccount() || {};
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-heading">
      <div class="modal-head">
        <h2 id="auth-heading">${t('auth.title')}</h2>
        <button type="button" class="modal-close" id="auth-close" aria-label="${t('dl.close')}">✕</button>
      </div>
      ${reason ? `<p>${reason}</p>` : ''}
      <p class="small-hint">${t('auth.hint')}</p>
      <form id="auth-form" class="dl-form" novalidate>
        <label class="field-label" for="auth-name">${t('dl.name')}</label>
        <input type="text" id="auth-name" class="name-input" autocomplete="name" maxlength="40" value="${escapeHtml(account.name || '')}">
        <label class="field-label" for="auth-email">${t('dl.email')}</label>
        <input type="email" id="auth-email" class="name-input" autocomplete="email" dir="ltr" maxlength="80" value="${escapeHtml(account.email || '')}">
        <p class="form-error" id="auth-error" role="alert"></p>
        <button type="submit" class="btn btn-primary" id="auth-submit">${t('auth.send')}</button>
      </form>
    </div>
  `;
  document.getElementById('auth-close').addEventListener('click', closeSignIn);

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const error = document.getElementById('auth-error');
    if (!name) { error.textContent = t('dl.needName'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = t('dl.badEmail'); return; }

    const submit = document.getElementById('auth-submit');
    submit.disabled = true;
    try {
      await sendMagicLink(email, name);
      setAccount(name, email);
      overlay.querySelector('.modal').innerHTML = `
        <div class="modal-head">
          <h2 id="auth-heading">${t('auth.sent')}</h2>
          <button type="button" class="modal-close" id="auth-close" aria-label="${t('dl.close')}">✕</button>
        </div>
        <p>${t('auth.sentHint', { email: escapeHtml(email) })}</p>
        <button type="button" class="btn" id="auth-ok">${t('dl.close')}</button>
      `;
      document.getElementById('auth-close').addEventListener('click', closeSignIn);
      document.getElementById('auth-ok').addEventListener('click', closeSignIn);
    } catch (err) {
      error.textContent = t('auth.error');
      submit.disabled = false;
    }
  });
}

function closeSignIn() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('no-scroll');
}

/* ---------- شاشة "لوحاتي" ---------- */
function renderSaved() {
  const signedIn = isSignedIn();
  app.innerHTML = `
    ${backLink('#/')}
    <header class="page-head">
      <h1>${t('saved.title')}</h1>
      <p class="lead">${signedIn ? t('saved.cloudSubtitle') : t('saved.subtitle')}</p>
      ${signedIn ? `
        <p class="account-row">
          <span>${t('auth.signedAs', { name: escapeHtml(userName()) })}</span>
          <button type="button" class="btn btn-small" id="signout-btn">${t('auth.signOut')}</button>
        </p>` : ''}
      ${!signedIn && cloudEnabled() ? `
        <p class="account-row">
          <span>${t('auth.keepEverywhere')}</span>
          <button type="button" class="btn btn-small btn-primary" id="signin-btn">${t('auth.signIn')}</button>
        </p>` : ''}
    </header>
    <div id="saved-list">${signedIn ? `<p class="small-hint">${t('gallery.loading')}</p>` : savedListHtml(getSavedPalettes(), false)}</div>
  `;

  const signInBtn = document.getElementById('signin-btn');
  if (signInBtn) signInBtn.addEventListener('click', () => openSignIn(''));
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      toast(t('auth.signedOut'));
      renderTopbar();
      renderSaved();
    });
  }

  if (signedIn) loadCloudSaved(); else bindSavedDelete(false);
}

/* يحمّل لوحات الحساب من قاعدة البيانات */
async function loadCloudSaved() {
  const box = document.getElementById('saved-list');
  try {
    const rows = await fetchMyPalettes();
    if (!document.body.contains(box)) return;
    box.innerHTML = savedListHtml(rows.map((r) => ({ ...r, date: r.created_at })), true);
    bindSavedDelete(true);
  } catch (e) {
    box.innerHTML = `<p class="zone-empty">${t('cloud.error')}</p>`;
  }
}

/* قائمة اللوحات (نفس الشكل للمحفوظة في الجهاز وفي الحساب) */
function savedListHtml(list, isCloud) {
  if (list.length === 0) return `<p class="zone-empty">${t('saved.empty')}</p>`;
  return `
    <div class="palette-grid">
      ${list.map((p) => {
        const name = p.title ? t('pal.' + p.title) : t('saved.untitled');
        const date = new Date(p.date).toLocaleDateString(currentLang === 'ar' ? 'ar' : 'en');
        const href = `#/result/${p.audience || 'beginner'}?c=${colorsToParam(p.colors)}` +
          (p.style ? '&s=' + p.style : '') + (p.industry ? '&ind=' + p.industry : '');
        return `
          <div class="palette-tile saved-tile">
            <a class="tile-strip" href="${href}">${p.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</a>
            <div class="tile-name saved-row">
              <span><strong>${name}</strong><small>${date}${isCloud && p.is_public ? ' · ' + t('saved.public') : ''}</small></span>
              <span class="saved-actions">
                <a class="btn btn-small" href="${href}">${t('saved.open')}</a>
                <button type="button" class="btn btn-small btn-danger" data-delete="${p.id}">${t('saved.delete')}</button>
              </span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* أزرار الحذف */
function bindSavedDelete(isCloud) {
  app.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        if (isCloud) await cloudDeletePalette(btn.dataset.delete);
        else deletePalette(Number(btn.dataset.delete));
        toast(t('saved.deleted'));
        renderTopbar();
        renderSaved();
      } catch (e) {
        toast(t('cloud.error'));
      }
    });
  });
}
