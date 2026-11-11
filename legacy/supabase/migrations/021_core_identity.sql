-- 021: ربط هوية التقويم الذاتي بالنواة الرقمية.
-- الدخول بحساب النواة؛ المنسق يُعيَّن من النواة (مدير النواة أو حامل دور المنسق)؛ أعضاء الفريق يُعيَّنون هنا من منسوبي النواة.
alter table public.staff    add column if not exists core_staff_id uuid unique;
alter table public.profiles add column if not exists core_user_id  uuid unique;
alter table public.profiles add column if not exists source text not null default 'local' check (source in ('local','core'));
comment on column public.staff.core_staff_id is 'معرّف المنسوب الثابت في النواة الرقمية (staff_members.id).';
comment on column public.profiles.core_user_id is 'معرّف حساب الدخول في النواة (auth.users.id هناك).';
comment on column public.profiles.source is 'core = حساب مستمد من النواة؛ local = حساب محلي (المقيّم الخارجي فقط).';
