-- =========================================================================
-- schema.sql — جداول قاعدة البيانات في Supabase
-- طريقة الاستخدام: افتح مشروعك في Supabase ← SQL Editor ← New query
-- ← الصق هذا الملف كاملاً ← اضغط Run.
-- (إعادة تشغيله مرة ثانية آمنة ولا تحذف أي بيانات)
--
-- الجداول:
--   palettes  اللوحات (المحفوظة في الحساب، والمنشورة في المعرض)
--   likes     الإعجابات (كل مستخدم يعجب باللوحة مرة واحدة)
--   feedback  إجابات أسئلة الرأي الثلاثة قبل التحميل
--
-- الأمان (Row Level Security): كل جدول له قواعد تحدد من يقرأ ومن يكتب.
-- مثلاً: لا أحد يستطيع حذف لوحة غيره، ولا أحد يستطيع قراءة الآراء إلا أنت
-- من لوحة تحكم Supabase.
-- =========================================================================


-- ---------- أداة فحص: هل كل الألوان أكواد صحيحة مثل #1D3557 ؟ ----------
create or replace function public.valid_hex_colors(arr text[])
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(c ~ '^#[0-9A-F]{6}$'), false) from unnest(arr) as c
$$;


-- ========================= جدول اللوحات =========================
create table if not exists public.palettes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  colors      text[] not null,
  title       text,                       -- رقم اللوحة الجاهزة (مثل l2) أو فارغ
  style       text,                       -- minimal / luxury / bold / earthy / retro
  industry    text,                       -- المجال من الاستبيان (إن وُجد)
  audience    text,                       -- القسم: beginner / business / creator / identity
  author_name text,                       -- الاسم الذي يظهر في المعرض
  is_public   boolean not null default false,  -- true = منشورة في المعرض
  likes_count integer not null default 0,
  created_at  timestamptz not null default now(),

  -- قواعد تمنع البيانات الخاطئة
  constraint colors_count check (array_length(colors, 1) between 2 and 8),
  constraint colors_format check (public.valid_hex_colors(colors)),
  constraint title_length check (title is null or char_length(title) <= 40),
  constraint author_length check (author_name is null or char_length(author_name) <= 40),
  constraint style_value check (style is null or style in ('minimal', 'luxury', 'bold', 'earthy', 'retro')),
  constraint industry_length check (industry is null or char_length(industry) <= 20),
  constraint audience_value check (audience is null or audience in ('beginner', 'business', 'creator', 'identity'))
);

-- فهارس تجعل المعرض سريعاً عند الترتيب بالأحدث أو الأكثر إعجاباً
create index if not exists palettes_public_new on public.palettes (is_public, created_at desc);
create index if not exists palettes_public_popular on public.palettes (is_public, likes_count desc);
create index if not exists palettes_user on public.palettes (user_id, created_at desc);

alter table public.palettes enable row level security;

-- القراءة: اللوحات المنشورة للجميع، واللوحات الخاصة لصاحبها فقط
drop policy if exists "read public or own palettes" on public.palettes;
create policy "read public or own palettes" on public.palettes
  for select using (is_public or user_id = auth.uid());

-- الإضافة: المستخدم المسجّل فقط، وباسمه هو
drop policy if exists "insert own palettes" on public.palettes;
create policy "insert own palettes" on public.palettes
  for insert to authenticated with check (user_id = auth.uid());

-- التعديل والحذف: صاحب اللوحة فقط
drop policy if exists "update own palettes" on public.palettes;
create policy "update own palettes" on public.palettes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete own palettes" on public.palettes;
create policy "delete own palettes" on public.palettes
  for delete to authenticated using (user_id = auth.uid());

-- صلاحيات الأعمدة: لا أحد يستطيع تغيير عدد الإعجابات بنفسه
revoke all on public.palettes from anon, authenticated;
grant select on public.palettes to anon, authenticated;
grant insert (colors, title, style, industry, audience, author_name, is_public) on public.palettes to authenticated;
grant update (title, is_public) on public.palettes to authenticated;
grant delete on public.palettes to authenticated;


-- ========================= جدول الإعجابات =========================
create table if not exists public.likes (
  palette_id uuid not null references public.palettes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (palette_id, user_id)       -- إعجاب واحد لكل مستخدم على كل لوحة
);

alter table public.likes enable row level security;

drop policy if exists "read likes" on public.likes;
create policy "read likes" on public.likes
  for select using (true);

-- الإعجاب: للمستخدم المسجّل، وعلى لوحة منشورة فقط
drop policy if exists "like public palettes" on public.likes;
create policy "like public palettes" on public.likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.palettes p where p.id = palette_id and p.is_public)
  );

drop policy if exists "remove own like" on public.likes;
create policy "remove own like" on public.likes
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.likes from anon, authenticated;
grant select on public.likes to anon, authenticated;
grant insert (palette_id) on public.likes to authenticated;
grant delete on public.likes to authenticated;

-- عدّاد الإعجابات: يزيد وينقص تلقائياً عند الإعجاب أو إلغائه
create or replace function public.update_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.palettes set likes_count = likes_count + 1 where id = new.palette_id;
  elsif tg_op = 'DELETE' then
    update public.palettes set likes_count = greatest(likes_count - 1, 0) where id = old.palette_id;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_trigger on public.likes;
create trigger likes_count_trigger
  after insert or delete on public.likes
  for each row execute function public.update_likes_count();


-- ========================= جدول آراء المستخدمين =========================
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid(),     -- فارغ إن لم يكن مسجّلاً
  q1         text not null,               -- كيف كانت التجربة؟
  q2         text not null,               -- هل واجهت مشكلة؟
  q3         text not null,               -- ما الذي سيساعدك أكثر؟
  lang       text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- أي زائر يستطيع إرسال رأيه، لكن بإجابات من القائمة فقط.
-- لا توجد قاعدة قراءة، لذلك لا أحد يقرأ الآراء إلا أنت من لوحة التحكم.
drop policy if exists "send feedback" on public.feedback;
create policy "send feedback" on public.feedback
  for insert to anon, authenticated
  with check (
    q1 in ('a', 'b', 'c', 'd') and q2 in ('a', 'b', 'c', 'd') and q3 in ('a', 'b', 'c', 'd')
    and (lang is null or lang in ('ar', 'en'))
  );

revoke all on public.feedback from anon, authenticated;
grant insert (q1, q2, q3, lang) on public.feedback to anon, authenticated;


-- ---------- عرض سهل القراءة للآراء (لك أنت فقط في لوحة التحكم) ----------
-- افتح: Table Editor ← feedback_readable
create or replace view public.feedback_readable
with (security_invoker = true) as
select
  created_at as "التاريخ",
  case q1 when 'a' then 'سهلة جداً' when 'b' then 'سهلة' when 'c' then 'صعبة قليلاً' else 'صعبة' end as "التجربة",
  case q2 when 'a' then 'لا مشاكل' when 'b' then 'صعب أجد ما أريد' when 'c' then 'الألوان لم تناسبني' else 'شيء لم يعمل' end as "المشكلة",
  case q3 when 'a' then 'لوحات جاهزة أكثر' when 'b' then 'شرح أوضح' when 'c' then 'معاينات أكثر' else 'ممتاز كما هو' end as "ما يساعد أكثر",
  lang as "اللغة"
from public.feedback
order by created_at desc;

revoke all on public.feedback_readable from anon, authenticated;
