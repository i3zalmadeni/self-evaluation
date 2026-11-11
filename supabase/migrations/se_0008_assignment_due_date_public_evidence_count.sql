alter table public.se_indicator_assignments add column if not exists due_date date;

create or replace view public.se_public_evidence_stubs with (security_invoker = false) as
select e.id, e.cycle_id, ei.indicator_id
from public.se_evidence e
join public.se_evidence_indicators ei on ei.evidence_id = e.id
join public.se_cycles c on c.id = e.cycle_id and c.published and c.status in ('active','closed')
where e.status = 'approved';
grant select on public.se_public_evidence_stubs to anon, authenticated;
