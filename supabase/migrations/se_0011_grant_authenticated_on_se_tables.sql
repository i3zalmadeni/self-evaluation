-- جداول نظام التقويم (se_) المفعّل عليها RLS ولها سياسات لكن دور authenticated لا يملك عليها صلاحيات الجدول،
-- فيُرفض الوصول بالخطأ 42501 قبل أن تُقيَّم السياسات (حتى لمدير النواة). نمنح الصلاحيات نفسها الممنوحة للجداول العاملة،
-- والحماية الفعلية تبقى بسياسات RLS. لا يُمنح anon شيئاً جديداً.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'se\_%'
      and c.relrowsecurity
      and exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
      and not has_table_privilege('authenticated', format('public.%I', c.relname), 'SELECT')
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t.relname);
  end loop;
end $$;
