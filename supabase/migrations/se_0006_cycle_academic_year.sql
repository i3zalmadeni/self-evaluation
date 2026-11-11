-- ربط دورة التقويم بالعام الدراسي في النواة (العام وحدة الدورة). إضافة فقط، لا حذف ولا تعديل لجداول النواة.
-- مطبَّق على قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-11.
alter table public.se_cycles add column if not exists year_id uuid references public.academic_years(id) on delete restrict;
comment on column public.se_cycles.year_id is 'العام الدراسي في النواة (academic_years.id) الذي تتبعه الدورة.';
create index if not exists se_cycles_year_idx on public.se_cycles(year_id);
update public.se_cycles c set year_id = (select a.id from public.academic_years a where a.name like replace(c.school_year, '-', '/') || '%' limit 1)
where c.year_id is null and c.school_year is not null;
