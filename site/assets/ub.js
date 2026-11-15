/* شريط المستخدم الموحّد (النسخة نفسها في كل أنظمة النواة الرقمية). */
// ===== شريط المستخدم الموحّد لمنظومة النواة الرقمية: الإشعارات، ثم صورة المستخدم واسمه الأول والأخير، ثم الخروج =====
// النسخة نفسها في كل الأنظمة. كل نظام يمرّر مصدر إشعاراته ورابط «مشاهدة الكل» إن وُجدت صفحة للإشعارات.
// زر الخروج يحمل المعرّف out، فيعمل معه معالج الخروج الموجود في كل نظام دون تغيير.
const UB_SVG = {
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
  check: '<path d="M4 12l5 5L20 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', alert: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', inbox: '<path d="M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>', file: '<path d="M14 3H6v18h12V7zM14 3v4h4"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
};
const ubIco = (n) => `<svg class="ub-i" viewBox="0 0 24 24" aria-hidden="true">${UB_SVG[n] || UB_SVG.bell}</svg>`;
const ubEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// الاسم الأول والأخير: يُبقي الأسماء المركبة («عبد الله»، «آل الشيخ») متصلة
function ubShortName(n) {
  const w = String(n || "").trim().split(/\s+/).filter(Boolean); if (w.length <= 2) return w.join(" ");
  if (w.length === 3 && /^ال/.test(w[1])) return w.join(" "); // اسم حساب وصفي مثل «مدير النواة الرقمية»
  const pre = ["عبد", "أبو", "ابو", "أبا", "ابا"], mid = ["آل", "ال", "أبو", "ابو", "بن", "بنت", "عبد"];
  let first = w[0], i = 1; if (pre.includes(first) && w.length > 2) { first += " " + w[1]; i = 2; }
  let last = w[w.length - 1]; if (w.length - 2 >= i && ["آل", "ال", "أبو", "ابو", "عبد"].includes(w[w.length - 2])) last = w[w.length - 2] + " " + last;
  return mid.includes(last) ? first : first + " " + last;
}
const UB_CSS = `.ub{display:flex;align-items:center;gap:10px;flex:none}
.ub-n{position:relative}
.ub-bell{position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);color:#fff;cursor:pointer;padding:0;transition:background .2s}
.ub-bell:hover,.ub-bell[aria-expanded=true]{background:rgba(255,255,255,.22)}.ub-bell:focus-visible,.ub-out:focus-visible,.ub-u:focus-visible{outline:3px solid #f0b34a;outline-offset:2px}
.ub .ub-i{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ub-c{position:absolute;inset-block-start:-6px;inset-inline-end:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:#f0b34a;color:#3b2a06;font-size:.72rem;font-weight:800;display:grid;place-items:center;box-shadow:0 0 0 2px #17414f;line-height:1}
.ub-c[hidden],.ub-p[hidden],.ub a.ub-all[hidden]{display:none}
.ub-p{position:absolute;inset-block-start:calc(100% + 10px);inset-inline-end:0;width:min(370px,calc(100vw - 24px));max-height:72vh;display:flex;flex-direction:column;background:var(--surface,#fff);color:var(--ink,#0d2b45);border:1px solid var(--line,#e2edf1);border-radius:18px;box-shadow:0 18px 44px rgba(8,40,60,.28);z-index:80;overflow:hidden;text-align:start;font-weight:400}
.ub-ph{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line,#e2edf1)}
.ub-ph b{font-size:1rem;color:var(--ink,#0d2b45)}.ub-ph button{font:inherit;font-size:.8rem;font-weight:700;color:var(--brand2,#0c6f82);background:none;border:0;cursor:pointer;padding:4px 0}
.ub-l{overflow:auto;flex:1}
.ub a.ub-it{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;text-decoration:none;color:var(--ink,#0d2b45);border-bottom:1px solid var(--soft,#eef8fa);background:none;border-radius:0;font-weight:400;white-space:normal;min-height:0}
.ub a.ub-it::after{display:none}.ub a.ub-it:hover{background:var(--soft,#eef8fa);color:var(--ink,#0d2b45)}.ub a.ub-it.new{background:var(--brandsoft,#e3f6f7)}
.ub-ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:none;background:#e7f0fb;color:#2f6fc4}
.ub-ic .ub-i{width:17px;height:17px}.ub-it.ok .ub-ic{background:#e2f5ea;color:#1f9d63}.ub-it.warn .ub-ic{background:#fdf1dc;color:#b06d0c}.ub-it.bad .ub-ic{background:#fbe5e8;color:#c23646}
.ub-it .ub-tx{min-width:0;flex:1}.ub-it b{display:block;font-size:.9rem;line-height:1.5;color:var(--ink,#0d2b45)}.ub-it small{display:block;color:var(--ink2,#3d566b);font-size:.8rem;line-height:1.6}
.ub-it time{display:block;color:var(--muted,#71859a);font-size:.72rem;margin-top:2px}.ub-it .ub-dot{width:8px;height:8px;border-radius:50%;background:#f0b34a;flex:none;margin-top:8px}
.ub-empty{margin:18px 14px;text-align:center;color:var(--muted,#71859a);font-size:.9rem}
.ub a.ub-all{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-top:1px solid var(--line,#e2edf1);font-weight:800;font-size:.88rem;color:var(--brand2,#0c6f82);text-decoration:none;background:var(--surface,#fff);border-radius:0;white-space:nowrap}
.ub a.ub-all:hover{background:var(--soft,#eef8fa)}
.ub a.ub-u{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#fff;min-height:44px;padding:0;padding-inline-start:10px;border-radius:0;border-inline-start:1px solid rgba(255,255,255,.18);background:none;font-weight:400}.ub a.ub-u:hover{background:none}.ub a.ub-u::after{display:none}
.ub-av{width:36px;height:36px;border-radius:50%;flex:none;display:grid;place-items:center;overflow:hidden;background:rgba(255,255,255,.16);color:#fff;font-weight:800;font-size:.95rem;border:2px solid rgba(255,255,255,.6)}
.ub-av img{width:100%;height:100%;object-fit:cover;display:block}
.ub-nm{color:#e3f0f5;font-size:.86rem;font-weight:700;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ub a.ub-u:hover .ub-nm{text-decoration:underline}
.ub-out{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);color:#fff;font:inherit;font-size:.86rem;font-weight:700;cursor:pointer;text-decoration:none;transition:background .2s}
.ub-out .ub-i{width:18px;height:18px}
.ub #out.ub-out,header .ub #out.ub-out{color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);box-shadow:none;transform:none}
.ub #out.ub-out:hover,header .ub #out.ub-out:hover{background:#c23646;border-color:#c23646;color:#fff}
@media (max-width:700px){.ub-nm{display:none}.ub a.ub-u{padding-inline-start:6px}}
@media (max-width:520px){.ub{gap:6px}.ub-out span{display:none}.ub-out{padding:0 10px}}
@media (max-width:640px){.ub-p{position:fixed;inset-inline:12px;inset-block-start:auto;margin-top:10px;width:auto;max-height:70vh}}
@media print{.ub{display:none}}`;
(function () { if (document.getElementById("ub-css")) return; const s = document.createElement("style"); s.id = "ub-css"; s.textContent = UB_CSS; (document.head || document.documentElement).appendChild(s); })();
// HTML الشريط. home: رابط صفحة المستخدم (ملفه أو حسابه) عند النقر على صورته واسمه
function ubBarHTML(name, home) {
  return `<div class="ub"><div class="ub-n"><button type="button" class="ub-bell" id="ubB" aria-label="الإشعارات" aria-expanded="false" aria-haspopup="true" aria-controls="ubP">${ubIco("bell")}<span class="ub-c" id="ubC" hidden></span></button>
    <div class="ub-p" id="ubP" role="dialog" aria-label="الإشعارات" hidden><div class="ub-ph"><b>الإشعارات</b><button type="button" id="ubR">تحديد الكل كمقروء</button></div><div class="ub-l" id="ubL"><p class="ub-empty">جارٍ التحميل…</p></div><a class="ub-all" id="ubA" href="#" hidden>مشاهدة الكل</a></div></div>
    <a class="ub-u" href="${ubEsc(home || "#")}" title="${ubEsc(name)}"><span class="ub-av" id="ubAv" aria-hidden="true">${ubEsc(String(name || "").trim().charAt(0))}</span><span class="ub-nm">${ubEsc(ubShortName(name))}</span></a>
    <button type="button" class="ub-out" id="out">${ubIco("logout")}<span>خروج</span></button></div>`;
}
// تشغيل الشريط بعد إدراجه. o: { client, key, uid, load: async () => [عناصر], allUrl, markAll: async () => {} }
// العنصر: { id, title, body, href, icon, tone: ok|warn|bad|info, t: وقت (اختياري), read: (اختياري؛ وإلا يُحفظ المقروء في هذا المتصفح) }
function ubMount(o) {
  const $u = (s) => document.getElementById(s), B = $u("ubB"), P = $u("ubP"), L = $u("ubL"), C = $u("ubC"), A = $u("ubA");
  if (!B) return;
  const cli = o.client || (typeof sb !== "undefined" ? sb : null);
  // الصورة: من سجل النواة (دالة core_my_photo)، وإلا يبقى أول حرف من الاسم
  if (cli) Promise.resolve(cli.rpc("core_my_photo")).then(async (r) => {
    const ph = r && r.data; if (!ph || !ph.path) return;
    let url = null;
    if (ph.public) url = `${APP_CONFIG.supabaseUrl}/storage/v1/object/public/${ph.bucket}/${ph.path.split("/").map(encodeURIComponent).join("/")}`;
    else { try { const s = await cli.storage.from(ph.bucket).createSignedUrl(ph.path, 3600); url = s && s.data && s.data.signedUrl; } catch (_) {} }
    if (!url) return; const im = new Image(); im.alt = ""; im.onload = () => { const d = $u("ubAv"); if (d) { d.textContent = ""; d.appendChild(im); } }; im.src = url;
  }).catch(() => {});
  if (o.allUrl) { A.href = o.allUrl; A.hidden = false; }
  const KEY = "ub-seen-" + (o.key || "x") + "-" + (o.uid || ""); let seen;
  try { seen = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (_) { seen = new Set(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...seen].slice(-300))); } catch (_) {} };
  let N = [], at = 0;
  const unread = (x) => (x.read != null ? !x.read : !seen.has(String(x.id)));
  const fmt = (t) => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }); };
  const paint = () => {
    const n = N.filter(unread).length; C.hidden = !n; C.textContent = n > 9 ? "9+" : String(n);
    B.setAttribute("aria-label", n ? `الإشعارات، ${n} غير مقروء` : "الإشعارات");
    L.innerHTML = N.length ? N.slice(0, 15).map((x, i) => `<a class="ub-it ${ubEsc(x.tone || "info")}${unread(x) ? " new" : ""}" href="${ubEsc(x.href || "#")}" data-i="${i}"><span class="ub-ic">${ubIco(x.icon || "bell")}</span><span class="ub-tx"><b>${ubEsc(x.title)}</b>${x.body ? `<small>${ubEsc(x.body)}</small>` : ""}${x.t ? `<time>${ubEsc(fmt(x.t))}</time>` : ""}</span>${unread(x) ? '<span class="ub-dot" aria-label="غير مقروء"></span>' : ""}</a>`).join("")
      : '<p class="ub-empty">لا إشعارات حالياً.</p>';
  };
  const load = async () => { try { N = (await o.load()) || []; } catch (e) { console.error(e); N = []; } N.sort((a, b) => (+new Date(b.t || 0) || 0) - (+new Date(a.t || 0) || 0)); at = Date.now(); paint(); };
  const close = () => { P.hidden = true; B.setAttribute("aria-expanded", "false"); };
  B.onclick = (e) => { e.stopPropagation(); const open = P.hidden; P.hidden = !open; B.setAttribute("aria-expanded", String(open)); if (open && Date.now() - at > 60000) load(); };
  $u("ubR").onclick = async () => { N.forEach((x) => seen.add(String(x.id))); save(); if (o.markAll) { try { await o.markAll(); } catch (_) {} } N = N.map((x) => (x.read != null ? { ...x, read: true } : x)); paint(); };
  L.addEventListener("click", (e) => { const a = e.target.closest("[data-i]"); if (!a) return; const x = N[+a.dataset.i]; if (x) { seen.add(String(x.id)); save(); } });
  P.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", close); document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !P.hidden) { close(); B.focus(); } });
  load();
}
// تحديث الاسم بعد الدخول (للأنظمة التي تبني الشريط قبل معرفة المستخدم)
function ubSetName(name, home) {
  const u = document.querySelector(".ub-u"); if (!u) return; u.title = name || ""; if (home) u.href = home;
  const n = u.querySelector(".ub-nm"); if (n) n.textContent = ubShortName(name);
  const av = document.getElementById("ubAv"); if (av && !av.querySelector("img")) av.textContent = String(name || "").trim().charAt(0);
}
// ===== نهاية شريط المستخدم الموحّد =====
// ===== ربط الشريط بلوحة التقويم المدرسي الذكي =====
// يُدرج الشريط في #subbar عند تحميل الصفحة (فيعمل معه معالج الخروج #out في admin.js)، ثم يُكمَل الاسم والإشعارات بعد الدخول.
(function () {
  const w = document.querySelector("#subbar .who"); if (!w) return;
  w.innerHTML = '<span id="who" hidden></span>' + ubBarHTML("", "#");
})();
const SE_UB_ICO = { task: "clock", cal: "cal", mega: "alert", note: "file", clip: "file", visit: "eye", users: "user", flag: "alert", doc: "file", user: "user" };
function seUbStart(me, home) {
  ubSetName(me && me.display_name || "", home);
  if (window.__seUb) return; window.__seUb = true;
  ubMount({ key: "se", uid: me && me.id, allUrl: "#alerts", load: async () => {
    if (typeof S === "undefined" || !S.cid || !S.me) return [];
    const A = await App.alerts(), seen = new Set(), N = [];
    (A.groups || []).forEach((g) => (g.items || []).forEach((i) => { if (seen.has(i.uid)) return; seen.add(i.uid);
      N.push({ id: i.uid, title: String(i.title || ""), body: String(i.sub || ""), tone: i.tone === "bad" || i.tone === "warn" || i.tone === "ok" ? i.tone : "info", icon: SE_UB_ICO[g.icon] || "bell", href: "#alerts" }); }));
    return N;
  } });
}
