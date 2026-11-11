boot("dashboard.html", async (main, c) => {
  const { list, cur } = await pickCycle();
  if (!cur) { main.innerHTML = `${head("لوحة التقويم الذاتي")}<div class="card"><p>لا توجد دورة تقويم بعد.</p></div>`; return; }
  const [dom, prog, ov, lv] = await Promise.all([
    sb.from("se_domains").select("id,code,name_ar,sort_order").eq("guide_id", cur.guide_id).order("sort_order"),
    sb.from("se_cycle_domain_progress").select("*").eq("cycle_id", cur.id),
    sb.from("se_cycle_indicator_overview").select("eval_status,level_id").eq("cycle_id", cur.id),
    sb.from("se_levels").select("id,label_ar,sort_order").eq("guide_id", cur.guide_id).order("sort_order"),
  ]);
  const P = Object.fromEntries((prog.data || []).map((p) => [p.domain_id, p]));
  const sum = (k) => (prog.data || []).reduce((s, p) => s + (p[k] || 0), 0);
  const total = sum("indicators_total"), appr = sum("approved");
  const lvCount = {}; (ov.data || []).filter((x) => x.eval_status === "approved" && x.level_id).forEach((x) => { lvCount[x.level_id] = (lvCount[x.level_id] || 0) + 1; });
  main.innerHTML = `${head("لوحة التقويم الذاتي", `${cur.name} · ${cur.school_year || ""}`)}${cycleSwitch(list, cur)}
  <div class="grid">
    <div class="card stat"><b>${total}</b><span>مؤشرات الدورة</span></div>
    <div class="card stat"><b>${appr}</b><span>معتمدة</span></div>
    <div class="card stat"><b>${sum("in_progress")}</b><span>قيد العمل</span></div>
    <div class="card stat"><b>${sum("not_evaluated")}</b><span>لم تُقيَّم بعد</span></div>
  </div>
  <p class="sub">«لم تُقيَّم» لا تعني صفراً: المؤشر غير المقيَّم خارج حساب الاكتمال، والنسبة أدناه = المعتمد ÷ إجمالي مؤشرات المجال.</p>
  <h3 class="sec">التقدم حسب المجال</h3>
  <div class="tw"><table><thead><tr><th>المجال</th><th>المؤشرات</th><th>معتمد</th><th>قيد العمل</th><th>لم يُقيَّم</th><th>الاكتمال</th></tr></thead><tbody>${(dom.data || []).map((d) => { const p = P[d.id] || {}; const t = p.indicators_total || 0; return `<tr><td>${esc(d.code)} · ${esc(d.name_ar)}</td><td>${t}</td><td>${p.approved || 0}</td><td>${p.in_progress || 0}</td><td>${p.not_evaluated || 0}</td><td>${bar(pct(p.approved || 0, t))}<small>${pct(p.approved || 0, t)}%</small></td></tr>`; }).join("") || '<tr><td colspan="6">لا توجد مجالات.</td></tr>'}</tbody></table></div>
  <h3 class="sec">مستويات الأداء للمؤشرات المعتمدة</h3>
  <div class="grid">${(lv.data || []).map((l) => `<div class="card stat"><b>${lvCount[l.id] || 0}</b><span>${esc(l.label_ar)}</span></div>`).join("")}</div>
  <h3 class="sec">صلاحيتك في النظام</h3>
  <div class="card"><p>${c.roles.map((r) => `<span class="bdg" style="position:static;display:inline-block;margin-inline-end:6px">${esc(r)}</span>`).join("")}</p><p class="sub">الأدوار مستمدة من النواة الرقمية، ولا تُدار من هذا النظام.</p></div>`;
});
