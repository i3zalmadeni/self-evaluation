-- تغيير على مستوى النواة (مشترك): الصلاحيات الممنوحة تقتصر على الأنظمة المفعّلة
create or replace view public.grantable_permissions with (security_invoker = true) as
select p.code, p.system_code, p.level, p.name_ar
from public.permissions p
left join public.systems s on s.code = p.system_code
where p.system_code is null or s.status = 'connected';
grant select on public.grantable_permissions to authenticated;

create or replace function public.staff_permission_system_active() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_sys text; v_status text;
begin
  select p.system_code into v_sys from public.permissions p where p.code = new.permission_code;
  if v_sys is not null then
    select status into v_status from public.systems where code = v_sys;
    if v_status is distinct from 'connected' then
      raise exception 'لا يمكن منح صلاحية نظام غير مفعّل: %', v_sys using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists b_perm_system_active on public.staff_permissions;
create trigger b_perm_system_active before insert or update on public.staff_permissions
for each row execute function public.staff_permission_system_active();

create or replace function public.linked_systems()
returns table (code text, name_ar text, description text, status text, scopes text[], last_seen_at timestamptz, levels text[])
language sql stable security definer set search_path = '' as $$
  select s.code, s.name_ar, s.description, s.status, s.scopes, s.last_seen_at,
         coalesce((select array_agg(p.level order by p.level) from public.permissions p where p.system_code = s.code), '{}')
  from public.systems s
  where exists (select 1 from public.staff_members m where m.user_id = auth.uid() and m.is_active)
  order by (s.status = 'connected') desc, s.name_ar
$$;
revoke all on function public.linked_systems() from public;
grant execute on function public.linked_systems() to authenticated;
