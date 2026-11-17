-- se_0015: وقت الاجتماع والزيارة الفنية بالحصص (حصص احجز مرفق) بدل الساعة.
-- start_time / visit_time تبقى (تُحسب من بداية أول حصة) لترتيب الأحداث وللتوافق مع بقية الشاشات.
alter table public.se_meetings add column if not exists period_codes text[];
alter table public.se_technical_visits add column if not exists period_codes text[];

create or replace function public.se_trg_periods() returns trigger
language plpgsql security definer set search_path = '' as $f$
declare a time; n int; v text[] := new.period_codes;
begin
  if v is null or cardinality(v) = 0 then new.period_codes := null; return new; end if;
  select min(starts_at), count(*) into a, n from public.fb_periods where is_bookable and code = any (v);
  if n <> (select count(distinct c) from unnest(v) c) then raise exception 'حصة غير صالحة'; end if;
  if tg_table_name = 'se_meetings' then new.start_time := a; else new.visit_time := a; end if;
  return new;
end $f$;
drop trigger if exists t_se_meetings_periods on public.se_meetings;
create trigger t_se_meetings_periods before insert or update on public.se_meetings for each row execute function public.se_trg_periods();
drop trigger if exists t_se_visits_periods on public.se_technical_visits;
create trigger t_se_visits_periods before insert or update on public.se_technical_visits for each row execute function public.se_trg_periods();
