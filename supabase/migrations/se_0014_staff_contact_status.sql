-- حالة التواصل لكل منسوب (هل لديه جوال، وهل وافق على واتساب) دون كشف رقم الجوال. للمنسق ومدير النواة فقط.
-- مطبَّق على قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-17.
create or replace function public.se_staff_contact_status()
returns table (staff_id uuid, has_phone boolean, wa_opt_in boolean)
language sql stable security definer set search_path = ''
as $$
  select s.id, nullif(trim(coalesce(p.phone, '')), '') is not null, coalesce(o.opt_in, false)
  from public.staff_members s
  left join public.staff_private p on p.staff_id = s.id
  left join public.se_whatsapp_optin o on o.staff_id = s.id
  where public.se_is_coordinator()
$$;
revoke all on function public.se_staff_contact_status() from public, anon;
grant execute on function public.se_staff_contact_status() to authenticated;
