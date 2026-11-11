-- (مستوى النواة) مناصب المنسقين المعتمدة: النواة، التقويم الذاتي، مجتمع لبيد المهني — منسق نشط واحد لكل نطاق
alter table public.staff_roles drop constraint if exists staff_roles_coordinator_scope_chk;
alter table public.staff_roles add constraint staff_roles_coordinator_scope_chk
  check (role_code <> 'coordinator' or system_code is null or system_code in ('self_evaluation','teachers_community')) not valid;
create unique index if not exists staff_roles_one_active_coordinator
  on public.staff_roles ((coalesce(system_code,'core')))
  where role_code = 'coordinator' and ended_on is null;
create or replace view public.coordinator_positions with (security_invoker = false) as
select p.scope, p.name_ar, p.system_code,
       (select s.full_name from public.staff_roles r join public.staff_members s on s.id = r.staff_id
         where r.role_code = 'coordinator' and coalesce(r.system_code,'core') = p.scope and r.ended_on is null limit 1) as holder_name,
       (select r.staff_id from public.staff_roles r
         where r.role_code = 'coordinator' and coalesce(r.system_code,'core') = p.scope and r.ended_on is null limit 1) as holder_staff_id
from (values ('core','منسق النواة الرقمية',null::text),
             ('self_evaluation','منسق التقويم الذاتي الذكي','self_evaluation'),
             ('teachers_community','منسق مجتمع لبيد المهني','teachers_community')) as p(scope,name_ar,system_code)
where exists (select 1 from public.staff_members m where m.user_id = auth.uid() and m.is_active);
grant select on public.coordinator_positions to authenticated;
