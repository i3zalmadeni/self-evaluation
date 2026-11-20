-- تذكيرات واتساب اليدوية من «إدارة الفريق» (مجانية، دون مزود): زر يفتح واتساب المنسق برسالة جاهزة.
-- 1) أرقام جوالات المنسوبين الفعّالين للمنسق ومدير النواة فقط (لا تصل إلى غيرهما).
create or replace function public.se_staff_wa_phones()
returns table (staff_id uuid, phone text)
language sql stable security definer set search_path = ''
as $$
  select s.id, trim(p.phone)
  from public.staff_members s
  join public.staff_private p on p.staff_id = s.id
  where public.se_is_coordinator() and s.is_active and nullif(trim(coalesce(p.phone, '')), '') is not null
$$;
revoke all on function public.se_staff_wa_phones() from public, anon;
grant execute on function public.se_staff_wa_phones() to authenticated;

-- 2) حالة «manual»: فُتحت الرسالة في واتساب المنسق يدوياً (لا يُعرف هل ضغط «إرسال»)، ليظهر في السجل آخر تذكير لكل منسوب.
alter table public.se_whatsapp_messages drop constraint se_whatsapp_messages_status_check;
alter table public.se_whatsapp_messages add constraint se_whatsapp_messages_status_check
  check (status = any (array['queued', 'sent', 'delivered', 'failed', 'skipped', 'manual']));

-- 3) قالب تذكير المقيّم بمؤشر لم يبدأ تقييمه (يُعدَّل نصه من «إدارة البوابة ← واتساب» كبقية القوالب).
insert into public.se_whatsapp_templates (code, title_ar, body_ar, link_policy, enabled)
values ('evaluation_reminder', 'تذكير بتقييم مؤشر', 'السلام عليكم {{اسم}}، نذكّركم بتقييم المؤشر {{رمز_المؤشر}} المسند إليكم في التقويم المدرسي. التفاصيل: {{رابط}}', 'required', false)
on conflict (code) do nothing;
