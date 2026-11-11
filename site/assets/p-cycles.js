boot("cycles.html", async (main, c) => {
  const canEdit = c.isCoord || c.isAdmin;
  const [{ list }, yrs, gds, stf] = await Promise.all([
    pickCycle(),
    sb.from("academic_years").select("id,name,status,starts_on,ends_on").order("starts_on", { ascending: false }),
    sb.from("se_guide_versions").select("id,title,edition,is_current").order("created_at", { ascending: false }),
    canEdit ? sb.from("staff_members").select("id,full_name").eq("is_active", true).order("full_name") : Promise.resolve({ data: [] }),
  ]);
  const years = yrs.data || [], guides = gds.data || [], staff = stf.data || [];
  const Y = Object.fromEntries(years.map((y) => [y.id, y.name]));
  const ids = [...new Set(list.map((x) => x.coordinator_id).filter(Boolean))];
  const nm = {}; if (ids.length) { const { data } = await sb.from("staff_members").select("id,full_name").in("id", ids); (data || []).forEach((s) => { nm[s.id] = s.full_name; }); }
  const { data: full } = await sb.from("se_cycles").select("id,year_id,include_private_only");
  const F = Object.fromEntries((full || []).map((x) => [x.id, x]));

  main.innerHTML = `${head("دورات التقويم", "كل دورة تتبع عاماً دراسياً من النواة وتثبّت إصدار الدليل، فلا تتأثر الدورات السابقة بأي تحديث.")}
  ${canEdit ? '<div class="acts"><button class="btn" id="add">دورة جديدة</button></div>' : ""}
  <div class="tw"><table><thead><tr><th>الدورة</th><th>العام الدراسي</th><th>الحالة</th><th>النشر العام</th><th>الفترة</th><th>المنسق</th><th></th></tr></thead><tbody>${list.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(Y[F[x.id]?.year_id] || x.school_year || "—")}</td><td>${esc(lbl(LS.cycle, x.status))}</td><td>${x.published ? "منشورة" : "غير منشورة"}</td><td>${fmt(x.starts_on)} – ${fmt(x.ends_on)}</td><td>${esc(nm[x.coordinator_id] || "—")}</td><td class="acts"><a class="btn sec" href="dashboard.html?cycle=${esc(x.id)}">فتح</a>${canEdit ? `<button class="btn sec" data-e="${esc(x.id)}">تعديل</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="7">لا توجد دورات.</td></tr>'}</tbody></table></div>`;

  function form(cur) {
    const f = cur ? { ...cur, ...(F[cur.id] || {}) } : { status: "draft", published: false, include_private_only: false, year_id: (years.find((y) => y.status === "current") || years[0] || {}).id, guide_id: (guides.find((g) => g.is_current) || guides[0] || {}).id };
    const md = modal(`<h3>${cur ? "تعديل الدورة" : "دورة جديدة"}</h3><form id="cf"><div class="fg">
      <div><label>اسم الدورة *</label><input name="name" required value="${esc(f.name || "")}"></div>
      <div><label>العام الدراسي *</label><select name="year_id" required>${years.map((y) => `<option value="${esc(y.id)}" ${y.id === f.year_id ? "selected" : ""}>${esc(y.name)}</option>`).join("")}</select></div>
      <div><label>إصدار الدليل</label><select name="guide_id">${guides.map((g) => `<option value="${esc(g.id)}" ${g.id === f.guide_id ? "selected" : ""}>${esc(g.title)} · ${esc(g.edition || "")}</option>`).join("")}</select></div>
      <div><label>الحالة</label><select name="status">${opts(LS.cycle, f.status)}</select></div>
      <div><label>بداية الدورة</label><input type="date" name="starts_on" value="${esc(f.starts_on || "")}"></div>
      <div><label>نهاية الدورة</label><input type="date" name="ends_on" value="${esc(f.ends_on || "")}"></div>
      <div><label>منسق الدورة</label><select name="coordinator_id"><option value="">—</option>${staff.map((s) => `<option value="${esc(s.id)}" ${s.id === f.coordinator_id ? "selected" : ""}>${esc(s.full_name)}</option>`).join("")}</select></div>
    </div>
    <label><input type="checkbox" name="include_private_only" ${f.include_private_only ? "checked" : ""}> تضمين المؤشرات الخاصة بالمدارس الأهلية</label>
    <label><input type="checkbox" name="published" ${f.published ? "checked" : ""}> نشر النتائج المعتمدة للعموم</label>
    <p class="err" id="em" role="alert"></p><div class="acts mt"><button class="btn">حفظ</button><button type="button" class="btn sec" id="cx">إلغاء</button></div></form>`, true);
    md.el.querySelector("#cx").onclick = md.close;
    md.el.querySelector("#cf").onsubmit = async (ev) => {
      ev.preventDefault(); const fd = new FormData(ev.target); const em = md.el.querySelector("#em");
      const y = years.find((x) => x.id === fd.get("year_id")); const m = y && y.name.match(/(\d{4})\/(\d{4})/);
      const rec = { name: nn(fd.get("name")), year_id: fd.get("year_id"), school_year: m ? `${m[1]}-${m[2]}` : null, guide_id: nn(fd.get("guide_id")), status: fd.get("status"), starts_on: nn(fd.get("starts_on")), ends_on: nn(fd.get("ends_on")), coordinator_id: nn(fd.get("coordinator_id")), include_private_only: fd.get("include_private_only") === "on", published: fd.get("published") === "on" };
      if (rec.status !== "draft" && !rec.guide_id) { em.textContent = "اختر إصدار الدليل لغير المسودة."; return; }
      if (rec.starts_on && rec.ends_on && rec.ends_on < rec.starts_on) { em.textContent = "نهاية الدورة قبل بدايتها."; return; }
      if (rec.published && !(cur && cur.published) && !confirm("سيظهر ملخص النتائج المعتمدة لهذه الدورة للعموم دون تسجيل دخول. متابعة؟")) return;
      const r = cur ? await sb.from("se_cycles").update(rec).eq("id", cur.id) : await sb.from("se_cycles").insert({ ...rec, created_by: c.uid });
      if (r.error) { em.textContent = mapErr(r.error); return; }
      toast("تم الحفظ"); md.close(); location.reload();
    };
  }
  if (canEdit) {
    main.querySelector("#add").onclick = () => form(null);
    main.querySelectorAll("[data-e]").forEach((b) => { b.onclick = () => form(list.find((x) => x.id === b.dataset.e)); });
  }
});
