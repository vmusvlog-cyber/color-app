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
    [0] الأساسي (60%)   [1] الثانوي (30%)   [2] التمييز (10%)   [3] و [4] ألوان إضافية
  لذلك عند اختيار "3 ألوان" نأخذ أول ثلاثة فقط، وتبقى متناسقة.
  الاسم يأتي من ملف الترجمة: 'pal.' + id
*/
const READY_PALETTES = [
  // بسيط عصري
  { id: 'm1', style: 'minimal', colors: ['#F7F7F5', '#2B2D42', '#3A86FF', '#D9DCE1', '#8D99AE'] },
  { id: 'm2', style: 'minimal', colors: ['#F4F5F0', '#5C6B5E', '#E07A5F', '#CAD2C5', '#2F3E46'] },
  { id: 'm3', style: 'minimal', colors: ['#FFFFFF', '#1D3557', '#E63946', '#A8DADC', '#457B9D'] },
  { id: 'm4', style: 'minimal', colors: ['#F2EFEA', '#3D3B3C', '#F2A541', '#C8C2B8', '#7A7571'] },
  // فاخر
  { id: 'l1', style: 'luxury', colors: ['#111111', '#F5F0E1', '#C9A227', '#2A2A2A', '#8C6D1F'] },
  { id: 'l2', style: 'luxury', colors: ['#0B1D3A', '#F4EFE6', '#D4AF37', '#1F3A60', '#A08A5C'] },
  { id: 'l3', style: 'luxury', colors: ['#F6EFE9', '#5E1224', '#C8A45D', '#2B0A12', '#9C6B6B'] },
  { id: 'l4', style: 'luxury', colors: ['#0F2A24', '#EDE6D6', '#B8914B', '#1E4D40', '#6E7F73'] },
  // جريء
  { id: 'b1', style: 'bold', colors: ['#FFFFFF', '#111111', '#FF3366', '#FFD23F', '#3A86FF'] },
  { id: 'b2', style: 'bold', colors: ['#FFF4E0', '#1B1B3A', '#FF6B35', '#F7C548', '#7209B7'] },
  { id: 'b3', style: 'bold', colors: ['#0D0D0D', '#F5F5F5', '#39FF14', '#FF2E88', '#00E5FF'] },
  { id: 'b4', style: 'bold', colors: ['#FDFCF7', '#0047AB', '#FFC300', '#E4002B', '#111111'] },
  // ترابي
  { id: 'e1', style: 'earthy', colors: ['#EFE8DA', '#6B705C', '#CB6843', '#A5A58D', '#3F4238'] },
  { id: 'e2', style: 'earthy', colors: ['#F3E9DC', '#A0522D', '#556B2F', '#D4B996', '#5C4033'] },
  { id: 'e3', style: 'earthy', colors: ['#F5EEE6', '#C66B3D', '#4A5D23', '#E0C9A6', '#7B4B2A'] },
  { id: 'e4', style: 'earthy', colors: ['#E9E4D8', '#3E4A3D', '#B5835A', '#8A9A5B', '#5A4632'] },
  // كلاسيكي قديم
  { id: 'r1', style: 'retro', colors: ['#F4E3C1', '#D9822B', '#7A4E2D', '#E3B448', '#4F6D5A'] },
  { id: 'r2', style: 'retro', colors: ['#F2E6D8', '#6C8A94', '#D98E73', '#E8C39E', '#8B6F5A'] },
  { id: 'r3', style: 'retro', colors: ['#FBF3E4', '#C94C4C', '#2F6F73', '#F2C57C', '#3B3B3B'] },
  { id: 'r4', style: 'retro', colors: ['#EDE0C8', '#8C5E58', '#5E7C6B', '#D8B68A', '#4A3F35'] },
];

/* يرجع بيانات قسم حسب رقمه التعريفي (وإذا لم يوجد نرجع "مبتدئ") */
function getAudience(id) {
  return AUDIENCES.find((a) => a.id === id) || AUDIENCES[0];
}
