// المنطق المشترك لنظام التقويم الذاتي الذكي.
// الهوية والأدوار من النواة الرقمية مباشرة (نفس مشروع Supabase): auth.users وstaff_members وstaff_roles وstaff_permissions.
// النظام يقرأ سجلات النواة ولا يكتب فيها، ويكتب في جداول se_ فقط. الحماية الفعلية بسياسات RLS في قاعدة البيانات.
const sb = supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const qs = (k) => new URLSearchParams(location.search).get(k);
const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-SA-u-nu-latn", { year: "numeric", month: "short", day: "numeric" }) : "—");
const head = (t, s) => `<h2>${esc(t)}</h2>${s ? `<p class="sub">${esc(s)}</p>` : ""}`;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const bar = (p) => `<div class="pbar" style="background:#e3eef0;border-radius:99px;height:8px;min-width:90px"><div style="width:${Math.max(0, Math.min(100, p))}%;background:#0c6f82;height:8px;border-radius:99px"></div></div>`;

// تسميات الحالات (القيم غير المعروفة تُعرض كما هي)
const LS = {
  cycle: { draft: "مسودة", active: "نشطة", paused: "متوقفة مؤقتاً", closed: "مغلقة" },
  eval: { draft: "مسودة", submitted: "مقدَّم", approved: "معتمد" },
};
const lbl = (map, k) => map[k] || k || "—";

function toast(msg, bad) { const d = document.createElement("div"); d.className = "toast" + (bad ? " bad" : ""); d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
function mapErr(e) {
  const m = e?.message || String(e);
  if (/row-level security/.test(m)) return "لا تملك صلاحية تنفيذ هذه العملية.";
  if (/violates foreign key/.test(m)) return "السجل مرتبط ببيانات أخرى ولا يمكن حذفه.";
  return m;
}

// قائمة النظام. العمود الخامس: شرط الظهور (coord = منسق أو مدير النواة، team = عضو فريق فأعلى)
const NAV = [
  ["dashboard.html", "الرئيسية", "home", "ملخص الدورة الحالية"],
  ["cycles.html", "دورات التقويم", "chart", "الدورات وحالتها"],
  ["indicators.html", "المؤشرات", "key", "المجالات والمعايير والمؤشرات ومستويات الأداء"],
];

// يتحقق من الجلسة وهوية النواة وصلاحيات النظام، ثم يرسم الإطار ويستدعي render
async function boot(page, render, o = {}) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace("login.html"); return; }
  const { data: me } = await sb.from("staff_members").select("id,full_name,category,job_title").eq("user_id", session.user.id).maybeSingle();
  if (!me) { await sb.auth.signOut(); location.replace("login.html?e=nostaff"); return; }
  const rpc = async (n, a) => { const r = await sb.rpc(n, a); return r.data === true; };
  const [isAdmin, isCoord, isTeam, canView] = await Promise.all([rpc("is_core_admin"), rpc("se_is_coordinator"), rpc("se_is_team_member"), rpc("core_can", { p: APP_CONFIG.systemCode + ":view" })]);
  const roles = [isAdmin && "مدير النواة", isCoord && !isAdmin && "منسق التقويم", isTeam && "عضو فريق التقويم", canView && !isAdmin && !isCoord && !isTeam && "اطلاع"].filter(Boolean);
  const allowed = isAdmin || isCoord || isTeam || canView;
  const ctx = { me, uid: session.user.id, isAdmin, isCoord, isTeam, canView, roles, allowed };
  document.getElementById("shell").innerHTML =
    `<header><div class="wrap top">${brandHTML("dashboard.html")}<button class="navtoggle" aria-label="القائمة" aria-expanded="false">${ico("menu")}</button>
     <nav><a href="dashboard.html" class="on">لوحة التقويم</a></nav><span class="who">${ico("user")}${esc(me.full_name)}</span>${headMoe}<a class="loginbtn" href="#" id="out">خروج</a></div>
     <div class="dnav"><div class="wrap"><div class="dnav-in">${allowed ? NAV.map(([h, n, e, t]) => `<a href="${h}" title="${esc(t)}" class="${h === page ? "on" : ""}" ${h === page ? 'aria-current="page"' : ""}>${ico(e)}${n}</a>`).join("") : ""}</div></div></div></header><main class="wrap" id="main"></main>${footerHTML}`;
  bindNav();
  document.getElementById("out").onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.replace("login.html"); };
  const main = document.getElementById("main");
  if (!allowed) {
    main.innerHTML = `${head("لا تتوفر لك صلاحية الدخول", "نظام التقويم الذاتي الذكي")}<div class="card"><p>حسابك معروف في النواة، لكنه غير مرتبط بالنظام.</p><p class="sub">يعيّن مدير النواة منسق النظام من «المستخدمون والصلاحيات» في النواة، ويضيف المنسق أعضاء الفريق من منسوبي المدرسة.</p></div>`;
    return;
  }
  if ((o.coord && !(isCoord || isAdmin)) || (o.admin && !isAdmin)) { location.replace("dashboard.html"); return; }
  try { await render(main, ctx); } catch (e) { console.error(e); main.innerHTML = '<p class="err">تعذر تحميل الصفحة.</p>'; }
}

// الدورة المعروضة: ?cycle= أو الدورة النشطة الأحدث أو أحدث دورة
async function pickCycle() {
  const { data } = await sb.from("se_cycles").select("id,name,school_year,status,published,starts_on,ends_on,guide_id,coordinator_id").order("created_at", { ascending: false });
  const list = data || [];
  const id = qs("cycle");
  return { list, cur: list.find((x) => x.id === id) || list.find((x) => x.status === "active") || list[0] || null };
}
const cycleSwitch = (list, cur) => list.length > 1 ? `<div class="acts"><select onchange="location.search='?cycle='+this.value" aria-label="الدورة" style="width:auto">${list.map((x) => `<option value="${esc(x.id)}" ${cur && x.id === cur.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>` : "";

function modal(html, wide) {
  const ov = document.createElement("div"); ov.className = "ov"; ov.innerHTML = `<div class="md" role="dialog" aria-modal="true" ${wide ? 'style="max-width:860px"' : ""}>${html}</div>`;
  const close = () => ov.remove(); ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });
  document.body.appendChild(ov); return { el: ov.firstChild, close };
}
const nn = (v) => (v === "" || v === undefined || v === null ? null : typeof v === "string" ? v.trim() || null : v);
const opts = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}" ${k === sel ? "selected" : ""}>${esc(v)}</option>`).join("");
