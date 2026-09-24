/* =========================================================================
   palettes.js — البيانات: الأقسام الأربعة، الأساليب الخمسة، واللوحات الجاهزة
   ========================================================================= */

/*
  الأقسام الأربعة في الصفحة الرئيسية.
  styles = ترتيب الأساليب لهذا القسم؛ أول أسلوبين يظهران كـ "مقترح لك".
  (هذا هو معنى "مضبوطة حسب الجمهور" في هذه المرحلة)
*/
const AUDIENCES = [
  { id: 'beginner', icon: '🎨', styles: ['minimal', 'earthy', 'retro', 'luxury', 'bold'] },
  { id: 'business', icon: '💼', styles: ['minimal', 'luxury', 'earthy', 'bold', 'retro'] },
  { id: 'creator',  icon: '📱', styles: ['bold', 'retro', 'minimal', 'earthy', 'luxury'] },
  { id: 'identity', icon: '✨', styles: ['earthy', 'luxury', 'retro', 'minimal', 'bold'] },
];

/* الأساليب الخمسة */
const STYLES = ['minimal', 'luxury', 'bold', 'earthy', 'retro'];

/*
  اللوحات الجاهزة. كل لوحة فيها 5 ألوان مرتبة هكذا:
    [0] خلفية فاتحة   [1] اللون الرئيسي   [2] التمييز   [3] داكن للنصوص   [4] مساعد
  لذلك عند اختيار 3 أو 4 ألوان نأخذ أولها، وتبقى ملوّنة ومتناسقة.
  (لوحات "فاخر" وحدها خلفيتها داكنة)
  الاسم يأتي من ملف الترجمة: 'pal.' + id
*/
const READY_PALETTES = [
  // بسيط عصري
  { id: 'm1', style: 'minimal', colors: ['#F7F7F5', '#3A86FF', '#8D99AE', '#2B2D42', '#D9DCE1'] },
  { id: 'm2', style: 'minimal', colors: ['#F4F5F0', '#E07A5F', '#5C6B5E', '#2F3E46', '#CAD2C5'] },
  { id: 'm3', style: 'minimal', colors: ['#FFFFFF', '#E63946', '#457B9D', '#1D3557', '#A8DADC'] },
  { id: 'm4', style: 'minimal', colors: ['#F2EFEA', '#F2A541', '#7A7571', '#3D3B3C', '#C8C2B8'] },
  // فاخر
  { id: 'l1', style: 'luxury', colors: ['#111111', '#C9A227', '#F5F0E1', '#2A2A2A', '#8C6D1F'] },
  { id: 'l2', style: 'luxury', colors: ['#0B1D3A', '#D4AF37', '#F4EFE6', '#1F3A60', '#A08A5C'] },
  { id: 'l3', style: 'luxury', colors: ['#F6EFE9', '#5E1224', '#C8A45D', '#2B0A12', '#9C6B6B'] },
  { id: 'l4', style: 'luxury', colors: ['#0F2A24', '#B8914B', '#EDE6D6', '#1E4D40', '#6E7F73'] },
  // جريء
  { id: 'b1', style: 'bold', colors: ['#FFFFFF', '#FF3366', '#3A86FF', '#111111', '#FFD23F'] },
  { id: 'b2', style: 'bold', colors: ['#FFF4E0', '#FF6B35', '#7209B7', '#1B1B3A', '#F7C548'] },
  { id: 'b3', style: 'bold', colors: ['#F5F5F5', '#FF2E88', '#00B8CC', '#0D0D0D', '#39FF14'] },
  { id: 'b4', style: 'bold', colors: ['#FDFCF7', '#0047AB', '#FFC300', '#111111', '#E4002B'] },
  // ترابي
  { id: 'e1', style: 'earthy', colors: ['#EFE8DA', '#CB6843', '#6B705C', '#3F4238', '#A5A58D'] },
  { id: 'e2', style: 'earthy', colors: ['#F3E9DC', '#A0522D', '#556B2F', '#5C4033', '#D4B996'] },
  { id: 'e3', style: 'earthy', colors: ['#F5EEE6', '#C66B3D', '#4A5D23', '#7B4B2A', '#E0C9A6'] },
  { id: 'e4', style: 'earthy', colors: ['#E9E4D8', '#B5835A', '#8A9A5B', '#3E4A3D', '#D8CDB8'] },
  // كلاسيكي قديم
  { id: 'r1', style: 'retro', colors: ['#F4E3C1', '#D9822B', '#4F6D5A', '#7A4E2D', '#E3B448'] },
  { id: 'r2', style: 'retro', colors: ['#F2E6D8', '#D98E73', '#6C8A94', '#8B6F5A', '#E8C39E'] },
  { id: 'r3', style: 'retro', colors: ['#FBF3E4', '#C94C4C', '#2F6F73', '#3B3B3B', '#F2C57C'] },
  { id: 'r4', style: 'retro', colors: ['#EDE0C8', '#8C5E58', '#5E7C6B', '#4A3F35', '#D8B68A'] },
];

/* يرجع بيانات قسم حسب رقمه التعريفي (وإذا لم يوجد نرجع "مبتدئ") */
function getAudience(id) {
  return AUDIENCES.find((a) => a.id === id) || AUDIENCES[0];
}
