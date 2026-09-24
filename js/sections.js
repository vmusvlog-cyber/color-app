/* =========================================================================
   sections.js — الأقسام السبعة وأسئلة كل قسم (من قائمة صاحب التطبيق)
   كل قسم له سؤال أو سؤالان فقط (السهولة أولاً)، ثم النتيجة مباشرة.

   كل خيار يحمل "ملفاً" صغيراً يحدد شكل الألوان:
     feel  = الإحساس (من refine.js)       mood  = قوة الألوان (من generator.js)
     style = الأسلوب (الخمسة)              ind   = المجال (لألوان المنافسين والمعرض)
     temp  = حار/بارد                      contrast = calm/clear/strong
     value = light/dark                    pv    = أي معاينة نختار في النتيجة
     space/use = للديكور والأماكن
   إجابة السؤال الثاني تكمل الأول (وتغلبه إن تعارضا).

   أسماء الأسئلة والخيارات في i18n.js تحت 'sq.<القسم>.<السؤال>...'
   ========================================================================= */

const SECTIONS = {
  beginner: [
    { key: 'kind', options: {
      one:      { go: 'mycolors' },   // "لون واحد ← 3 ألوان": نفتح شاشة "عندي ألوان"
      warm:     { temp: 'warm', feel: 'warm', mood: 'warm', style: 'earthy' },
      cool:     { temp: 'cool', feel: 'calm', mood: 'calm', style: 'minimal' },
      luxury:   { feel: 'luxury', mood: 'elegant', style: 'luxury' },
      calm:     { feel: 'calm', mood: 'calm', style: 'minimal' },
      bold:     { feel: 'energy', mood: 'energetic', style: 'bold' },
      youthful: { feel: 'joy', mood: 'playful', style: 'bold' },
      natural:  { feel: 'nature', mood: 'natural', style: 'earthy' },
      comfy:    { feel: 'calm', mood: 'natural', style: 'minimal', contrast: 'calm' },
      contrast: { feel: 'excite', mood: 'energetic', style: 'bold', contrast: 'strong' },
    } },
  ],

  business: [
    { key: 'type', options: {
      fashion:    { ind: 'fashion', pv: 'packaging' },
      cafe:       { ind: 'food', pv: 'menu' },
      restaurant: { ind: 'food', pv: 'menu' },
      beauty:     { ind: 'fashion', pv: 'packaging' },
      fitness:    { ind: 'health', pv: 'social' },
      hotel:      { ind: 'home', pv: 'web' },
      realestate: { ind: 'home', pv: 'web' },
      tech:       { ind: 'tech', pv: 'app' },
      retail:     { ind: 'fashion', pv: 'packaging' },
      personal:   { ind: 'creative', pv: 'card' },
    } },
    { key: 'style', options: {
      luxury:       { feel: 'luxury', mood: 'elegant', style: 'luxury' },
      premium:      { feel: 'pro', mood: 'elegant', style: 'minimal' },
      modern:       { feel: 'pro', mood: 'calm', style: 'minimal' },
      friendly:     { feel: 'joy', mood: 'warm', style: 'earthy' },
      professional: { feel: 'trust', mood: 'calm', style: 'minimal' },
      bold:         { feel: 'energy', mood: 'energetic', style: 'bold' },
      minimal:      { feel: 'calm', mood: 'calm', style: 'minimal' },
      elegant:      { feel: 'luxury', mood: 'elegant', style: 'minimal' },
      youthful:     { feel: 'joy', mood: 'playful', style: 'bold' },
      creative:     { feel: 'creative', mood: 'playful', style: 'bold' },
    } },
  ],

  creator: [
    { key: 'video', options: {
      talking:     { feel: 'trust', mood: 'warm', style: 'minimal' },
      educational: { feel: 'trust', mood: 'calm', style: 'minimal' },
      product:     { feel: 'excite', mood: 'energetic', style: 'bold' },
      fashionreel: { feel: 'luxury', mood: 'elegant', style: 'luxury' },
      tiktok:      { feel: 'joy', mood: 'playful', style: 'bold' },
      reel:        { feel: 'excite', mood: 'playful', style: 'bold' },
      story:       { feel: 'joy', mood: 'warm', style: 'retro' },
      youtube:     { feel: 'energy', mood: 'energetic', style: 'bold' },
      podcast:     { feel: 'warm', mood: 'warm', style: 'retro' },
      cinematic:   { feel: 'calm', mood: 'elegant', style: 'retro' },
    } },
    { key: 'shot', options: {
      closeup: {}, medium: {}, wide: {}, detail: {}, walking: {}, talking: {}, broll: {},
      beforeafter: { contrast: 'strong' }, transition: {}, cta: { contrast: 'strong' },
    } },
  ],

  identity: [
    { key: 'trait', options: {
      expert:   { feel: 'trust', mood: 'calm', style: 'minimal' },
      creative: { feel: 'creative', mood: 'playful', style: 'bold' },
      bold:     { feel: 'energy', mood: 'energetic', style: 'bold' },
      luxury:   { feel: 'luxury', mood: 'elegant', style: 'luxury' },
      trusted:  { feel: 'trust', mood: 'calm', style: 'minimal' },
      modern:   { feel: 'pro', mood: 'calm', style: 'minimal' },
      leader:   { feel: 'pro', mood: 'elegant', style: 'bold' },
      simple:   { feel: 'calm', mood: 'natural', style: 'minimal' },
      youthful: { feel: 'joy', mood: 'playful', style: 'bold' },
      pro:      { feel: 'pro', mood: 'calm', style: 'minimal' },
    } },
    { key: 'field', options: {
      sales:       { ind: 'finance' },
      marketing:   { ind: 'creative' },
      fashion:     { ind: 'fashion' },
      business:    { ind: 'finance' },
      creator:     { ind: 'creative', pv: 'social' },
      coach:       { ind: 'education' },
      consultant:  { ind: 'finance' },
      fitness:     { ind: 'health', pv: 'social' },
      photography: { ind: 'creative' },
      retail:      { ind: 'fashion' },
    } },
  ],

  photo: [
    { key: 'subject', options: {
      person: {}, fashion: { ind: 'fashion' }, product: {}, food: { ind: 'food' },
      interior: { ind: 'home' }, street: {}, architecture: {}, car: {}, event: {}, lifestyle: {},
    } },
    { key: 'mood', options: {
      cinematic: { feel: 'calm', mood: 'elegant', style: 'retro' },
      luxury:    { feel: 'luxury', mood: 'elegant', style: 'luxury' },
      warm:      { feel: 'warm', mood: 'warm', style: 'earthy' },
      dark:      { feel: 'pro', mood: 'elegant', style: 'luxury', value: 'dark' },
      clean:     { feel: 'calm', mood: 'calm', style: 'minimal' },
      natural:   { feel: 'nature', mood: 'natural', style: 'earthy' },
      minimal:   { feel: 'calm', mood: 'calm', style: 'minimal' },
      dramatic:  { feel: 'excite', mood: 'energetic', style: 'bold', contrast: 'strong' },
      fresh:     { feel: 'health', mood: 'natural', style: 'minimal' },
      vintage:   { feel: 'warm', mood: 'warm', style: 'retro' },
    } },
  ],

  expo: [
    { key: 'field', options: {
      fashion:    { ind: 'fashion', feel: 'luxury', mood: 'elegant', style: 'luxury' },
      art:        { ind: 'creative', feel: 'creative', mood: 'playful', style: 'bold' },
      tech:       { ind: 'tech', feel: 'pro', mood: 'calm', style: 'minimal' },
      business:   { ind: 'finance', feel: 'trust', mood: 'calm', style: 'minimal' },
      food:       { ind: 'food', feel: 'warm', mood: 'energetic', style: 'bold' },
      education:  { ind: 'education', feel: 'trust', mood: 'calm', style: 'minimal' },
      beauty:     { ind: 'fashion', feel: 'calm', mood: 'playful', style: 'minimal' },
      sports:     { ind: 'health', feel: 'energy', mood: 'energetic', style: 'bold' },
      automotive: { feel: 'pro', mood: 'elegant', style: 'bold' },
      retail:     { ind: 'fashion', feel: 'joy', mood: 'warm', style: 'bold' },
    } },
    { key: 'place', options: {
      booth: {}, wall: {}, poster: {}, rollup: {}, signage: { contrast: 'strong' }, display: {},
      counter: {}, backdrop: {}, directions: { contrast: 'strong' }, entrance: {},
    } },
  ],

  // ديكور وأماكن: نفس السؤالين السابقين (أي مكان؟ وأين الألوان؟)
  decor: [
    { key: 'space', label: 'space.', options: Object.fromEntries(FIELD_QUESTIONS.home.space.map((s) =>
      [s, { space: s, ...(s === 'kidsroom' ? { feel: 'joy', mood: 'playful' } : {}) }])) },
    { key: 'use', label: 'use.', options: Object.fromEntries(FIELD_QUESTIONS.home.use.map((u) => [u, { use: u }])) },
  ],
};

/* الملف الافتراضي لكل قسم (قبل الإجابات) */
const SECTION_DEFAULTS = {
  beginner: { mood: 'calm', style: 'minimal' },
  business: { mood: 'calm', style: 'minimal' },
  creator:  { ind: 'creative', pv: 'video', mood: 'energetic', style: 'bold' },
  identity: { mood: 'calm', style: 'minimal', pv: 'card' },
  photo:    { ind: 'creative', pv: 'photo', mood: 'warm', style: 'earthy' },
  expo:     { pv: 'expo', mood: 'calm', style: 'minimal' },
  decor:    { ind: 'home', pv: 'room', mood: 'warm', style: 'minimal' },
};

/* نص السؤال أو الخيار: الديكور يستخدم نصوصه القديمة ('space.' و 'use.') */
function sectionQuestionTitle(sectionId, q) {
  return t('sq.' + sectionId + '.' + q.key);
}
function sectionOptionLabel(sectionId, q, opt) {
  return q.label ? t(q.label + opt) : t('sq.' + sectionId + '.' + q.key + '.' + opt);
}

/* يجمع ملف الألوان من إجابات القسم: answers = { kind: 'warm' } أو { type: 'cafe', style: 'luxury' } */
function sectionProfile(sectionId, answers) {
  const questions = SECTIONS[sectionId] || SECTIONS.beginner;
  const profile = { ...(SECTION_DEFAULTS[sectionId] || SECTION_DEFAULTS.beginner) };
  questions.forEach((q) => Object.assign(profile, q.options[answers[q.key]] || {}));
  return profile;
}

/* الإجابات بالإنجليزية (للبرومبت، لأنه إنجليزي دائماً). مثل: ['Café', 'Luxury'] */
function sectionAnswersEn(sectionId, answers) {
  const questions = SECTIONS[sectionId] || [];
  const saved = currentLang;
  currentLang = 'en';
  const out = questions.filter((q) => answers[q.key]).map((q) => sectionOptionLabel(sectionId, q, answers[q.key]));
  currentLang = saved;
  return out;
}
