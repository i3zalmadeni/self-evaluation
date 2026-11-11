boot("cycles.html", async (main) => {
  const { list } = await pickCycle();
  const ids = [...new Set(list.map((x) => x.coordinator_id).filter(Boolean))];
  const nm = {}; if (ids.length) { const { data } = await sb.from("staff_members").select("id,full_name").in("id", ids); (data || []).forEach((s) => { nm[s.id] = s.full_name; }); }
  main.innerHTML = `${head("دورات التقويم", "كل دورة تثبّت إصدار الدليل المستخدم فيها، فلا تتأثر الدورات السابقة بأي تحديث.")}
  <div class="tw"><table><thead><tr><th>الدورة</th><th>العام</th><th>الحالة</th><th>النشر العام</th><th>الفترة</th><th>المنسق</th><th></th></tr></thead><tbody>${list.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.school_year || "—")}</td><td>${esc(lbl(LS.cycle, x.status))}</td><td>${x.published ? "منشورة" : "غير منشورة"}</td><td>${fmt(x.starts_on)} – ${fmt(x.ends_on)}</td><td>${esc(nm[x.coordinator_id] || "—")}</td><td><a class="btn sec" href="dashboard.html?cycle=${esc(x.id)}">فتح</a></td></tr>`).join("") || '<tr><td colspan="7">لا توجد دورات.</td></tr>'}</tbody></table></div>
  <p class="sub">إنشاء الدورات وتعديلها تُبنى في مرحلة لاحقة (انظر docs/roadmap.md).</p>`;
});
