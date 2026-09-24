/* =========================================================================
   config.js — إعدادات الاتصال بـ Supabase (قاعدة البيانات)
   انسخ القيمتين من Supabase: Project Settings ← API
     - Project URL        ← ضعه في SUPABASE_URL
     - anon public key    ← ضعه في SUPABASE_ANON_KEY
   هذا المفتاح "عام" ومسموح أن يظهر في الموقع، لأن قواعد الأمان في
   قاعدة البيانات (ملف supabase/schema.sql) هي التي تحمي البيانات.
   ⚠️ لا تضع هنا أبداً المفتاح السري "service_role".

   إذا تركت القيمتين فارغتين، يعمل التطبيق كما كان: كل شيء محفوظ في
   جهاز المستخدم، والمعرض مخفي.
   ========================================================================= */

const SUPABASE_URL = 'https://ffdpcfqtnldxgcgjffbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xSNBgw6ZqaZNFMxiXlCXAA_tUBpfBpe'; // المفتاح العام (Publishable)
