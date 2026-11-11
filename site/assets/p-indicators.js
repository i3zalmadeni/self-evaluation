boot("indicators.html", async (main) => {
  const { list, cur } = await pickCycle();
  if (!cur) { main.innerHTML = `${head("المؤشرات")}<div class="card"><p>لا توجد دورة تقويم بعد.</p></div>`; return; }
  const [dom, std, ind, ov, lv] = await Promise.all([
    sb.from("se_domains").select("id,code,name_ar,sort_order").eq("guide_id", cur.guide_id).order("sort_order"),
    sb.from("se_standards").select("id,domain_id,code,name_ar,sort_order").order("sort_order"),
    sb.from("se_indicators").select("id,standard_id,code,official_text,sort_order,private_schools_only").order("sort_order"),
    sb.from("se_cycle_indicator_overview").select("indicator_id,eval_status,achievement_pct,level_id,approved_evidence,total_evidence").eq("cycle_id", cur.id),
    sb.from("se_levels").select("id,label_ar").eq("guide_id", cur.guide_id),
  ]);
  const O = Object.fromEntries((ov.data || []).map((x) => [x.indicator_id, x])), LV = Object.fromEntries((lv.data || []).map((l) => [l.id, l.label_ar]));
  const rows = (s) => (ind.data || []).filter((i) => i.standard_id === s.id).map((i) => {
    const o = O[i.id] || {}; const skip = i.private_schools_only;
    return `<tr data-q="${esc((i.code + " " + i.official_text).toLowerCase())}"><td dir="ltr">${esc(i.code)}</td><td>${esc(i.official_text)}${skip ? ' <small>(خاص بالمدارس الأهلية)</small>' : ""}</td><td>${skip ? "—" : o.eval_status ? esc(lbl(LS.eval, o.eval_status)) : "لم يُقيَّم"}</td><td>${o.achievement_pct != null ? o.achievement_pct + "%" : "—"}</td><td>${esc(LV[o.level_id] || "—")}</td><td>${o.total_evidence ? `${o.approved_evidence || 0}/${o.total_evidence}` : "—"}</td></tr>`;
  }).join("");
  main.innerHTML = `${head("المؤشرات", `${cur.name} · للقراءة فقط في هذه المرحلة`)}${cycleSwitch(list, cur)}
  <div class="acts"><input id="q" type="search" placeholder="بحث برمز المؤشر أو نصه" aria-label="بحث" style="max-width:360px"></div>
  ${(dom.data || []).map((d) => `<h3 class="sec">${esc(d.code)} · ${esc(d.name_ar)}</h3>${(std.data || []).filter((s) => s.domain_id === d.id).map((s) => `<div class="card" style="margin-bottom:12px"><b>${esc(s.code)} · ${esc(s.name_ar)}</b><div class="tw"><table><thead><tr><th>الرمز</th><th>المؤشر</th><th>الحالة</th><th>التحقق</th><th>المستوى</th><th>الشواهد المعتمدة</th></tr></thead><tbody>${rows(s)}</tbody></table></div></div>`).join("")}`).join("")}`;
  main.querySelector("#q").oninput = (e) => { const v = e.target.value.trim().toLowerCase(); main.querySelectorAll("tr[data-q]").forEach((r) => { r.hidden = v && !r.dataset.q.includes(v); }); };
});
