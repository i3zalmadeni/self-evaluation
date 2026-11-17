-- دخول جميع المنسوبين إلى مكتبهم في التقويم: المنسوب (ولو لم يكن عضواً في فريق التقويم) يقرأ ما يخصه فقط. إضافات قراءة فقط.
-- مطبَّق على قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-17.
drop policy if exists se_ind_assign_read_own on public.se_indicator_assignments;
create policy se_ind_assign_read_own on public.se_indicator_assignments for select to authenticated
  using (public.se_can_see_indicator(cycle_id, indicator_id));
drop policy if exists se_dom_assign_read_own on public.se_domain_assignments;
create policy se_dom_assign_read_own on public.se_domain_assignments for select to authenticated
  using (staff_id = public.current_staff_id());
drop policy if exists se_cycles_read_assigned on public.se_cycles;
create policy se_cycles_read_assigned on public.se_cycles for select to authenticated
  using (exists (select 1 from public.se_indicator_assignments a where a.cycle_id = se_cycles.id and a.staff_id = public.current_staff_id())
      or exists (select 1 from public.se_domain_assignments d where d.cycle_id = se_cycles.id and d.staff_id = public.current_staff_id()));
