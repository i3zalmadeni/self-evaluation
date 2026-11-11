-- تكافؤ الواجهة المنقولة: تاريخ الشاهد، مسؤولو المؤشرات للموقع العام، وقراءة سجل نشاط النظام للمنسق. إضافات فقط.
-- مطبَّق على قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-11.

-- 1) تاريخ الشاهد (كان في النظام السابق)
alter table public.se_evidence add column if not exists evidence_date date;

-- 2) مسؤول المؤشر ومقيّمه للموقع العام: الاسم والصورة العامة فقط، وفق قاعدة النواة (موافقة المنسوب publish_public والمفتاح العام للمدرسة)
create or replace function public.se_public_owners()
returns table (cycle_id uuid, indicator_id uuid, domain_id uuid, kind text, full_name text, avatar_path text)
language sql stable security definer set search_path = ''
as $$
  select a.cycle_id, a.indicator_id, null::uuid, a.role_kind, s.full_name, s.public_photo_path
  from public.se_indicator_assignments a
  join public.se_cycles c on c.id = a.cycle_id and c.published and c.status in ('active','closed')
  join public.staff_members s on s.id = a.staff_id and s.is_active and s.publish_public
  where exists (select 1 from public.school_profile sp where sp.publish_public)
  union all
  select a.cycle_id, null::uuid, a.domain_id, a.role_kind, s.full_name, s.public_photo_path
  from public.se_domain_assignments a
  join public.se_cycles c on c.id = a.cycle_id and c.published and c.status in ('active','closed')
  join public.staff_members s on s.id = a.staff_id and s.is_active and s.publish_public
  where exists (select 1 from public.school_profile sp where sp.publish_public)
$$;
revoke all on function public.se_public_owners() from public;
grant execute on function public.se_public_owners() to anon, authenticated;

-- 3) سجل نشاط النظام: المنسق (ومدير النواة ومدير المدرسة) يقرأ سجلات جداول se_ فقط من سجل التدقيق المشترك
drop policy if exists se_audit_read on public.audit_logs;
create policy se_audit_read on public.audit_logs for select to authenticated
  using (table_name like 'se\_%' and public.se_is_coordinator());
