/* غلاف لوحة التحكم: الدخول، القائمة، التوجيه، الإجراءات */
(() => {
const { sb, h, raw, $, $$, put, S, toast, run, role, isCoord, L } = App;



const CP = ['coordinator', 'principal'], CPR = ['coordinator', 'principal'];
// القائمة العلوية: أربعة أقسام رئيسية فقط. الصفحات الداخلية (علامة 1) تُعرض كتبويبات داخل قسمها وتبقى روابطها القديمة تعمل وصلاحياتها كما هي
const MENU = [
  ['desk', 'مكتبي الإلكتروني', ['team_member', 'member']],      // الصفحة الأساسية لعضو الفريق
  ['dashboard', 'الرئيسية', ['coordinator', 'principal']],
  ['inds', 'إدارة المؤشرات', '*'],
  ['team', 'إدارة الفريق', ['coordinator', 'principal']],
  ['reports', 'التقارير', '*', 1], ['log', 'سجل النشاط', CP, 1],
  ['evidence', 'الشواهد', '*', 1], ['indmap', 'خريطة التقدم', '*', 1],
  ['cycles', 'دورات التقويم', CPR, 1], ['wa', 'واتساب', ['coordinator'], 1],
  ['staff', 'الصلاحيات', ['coordinator'], 1], ['systems', 'الأنظمة المرتبطة', '*', 1], ['assign', 'المسؤوليات', CP, 1], ['ann', 'الإعلانات', '*', 1],
  ['meetings', 'الاجتماعات', '*', 1], ['visits', 'الزيارات الفنية', '*', 1], ['tasks', 'المهام والتكليفات', '*', 1], ['cal', 'التقويم والمواعيد', '*', 1],
  ['perms', 'الأعضاء والصلاحيات', ['coordinator'], 1],     // انتقلت تبويباً في «إدارة البوابة» (#platform/staff)
  ['platform', 'إدارة البوابة', ['coordinator', 'principal']],   // الأخيرة دائماً
];
// اسم الصفحة الداخلية ← القسم الذي يحويها
const HUB_OF = { reports: 'dashboard', log: 'dashboard', evidence: 'inds', indmap: 'inds', ind: 'inds', cycles: 'platform', wa: 'platform', staff: 'platform', perms: 'platform', assign: 'platform', ann: 'platform', tasks: 'team', meetings: 'team', meeting: 'team', visits: 'team', visit: 'team', cal: 'team' };
const DESKP = ['tasks', 'meetings', 'meeting', 'visits', 'visit', 'cal', 'ann'];
const hubOf = n => role() === 'team_member' && DESKP.includes(n) ? 'desk' : HUB_OF[n];
const MEMBER_OK = ['desk', 'ind'];   // المنسوب العادي: مكتبه وصفحة المؤشر المسند إليه فقط
const allowed = (r) => r === '*' || r.includes(role());

// القائمة العلوية: عناصر قبل أول مجموعة تظهر مباشرة، وكل مجموعة تُفتح كقائمة منسدلة
const MICON = { dashboard: 'home', inds: 'note', team: 'users', platform: 'layers', desk: 'user' };
App.MICON = MICON;
function drawMenu() {
  const cur0 = location.hash.slice(1).split('/')[0] || (role() === 'team_member' || role() === 'member' ? 'desk' : 'dashboard'), cur = role() === 'member' ? 'desk' : role() === 'team_member' && (cur0 === 'team' || cur0 === 'platform' || cur0 === 'perms') ? 'desk' : (hubOf(cur0) || cur0);
  const nb = App.hubBadges ? App.hubBadges(App.lastAlerts) : {};
  put($('#menu'), h`${MENU.filter(m => !m[3] && allowed(m[2])).map(m => h`<a href="#${m[0]}" class="${m[0] === cur ? 'on' : ''}" ${m[0] === cur ? raw('aria-current="page"') : ''}>${MICON[m[0]] ? App.ico(MICON[m[0]]) : ''}<span class="ml">${m[1]}</span>${nb[m[0]] ? h` <span class="nb" aria-label="${nb[m[0]]} إجراء">${nb[m[0]] > 99 ? '99+' : App.nf(nb[m[0]])}</span>` : ''}</a>`)}`);
}
App.drawMenu = drawMenu;

// قائمة الجوال بنمط النواة الرقمية: زر «القائمة» يفتح لائحة عمودية بكل التبويبات (على الشاشات العريضة يبقى الشريط الأفقي)
(() => { const d = document.getElementById('subbar'), b = document.getElementById('dmb'), m = document.getElementById('menu'); if (!d || !b || !m) return;
  const set = (o) => { d.classList.toggle('open', o); b.setAttribute('aria-expanded', o); };
  b.onclick = (e) => { e.stopPropagation(); set(!d.classList.contains('open')); };
  m.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', (e) => { if (!d.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('open')) { set(false); b.focus(); } });
  matchMedia('(min-width:761px)').addEventListener('change', (q) => { if (q.matches) set(false); });
})();

// هوية المستخدم من النواة الرقمية: المنسوب بحساب الدخول، والدور من أدوار النواة وفريق التقويم
async function loadMe(uid) {
  const { data: st } = await sb.from('staff').select('id,full_name,is_active').eq('user_id', uid).maybeSingle();
  if (!st || !st.is_active) return null;
  const [adm, crd, team, rl] = await Promise.all([sb.raw.rpc('is_core_admin'), sb.raw.rpc('se_is_coordinator'), sb.raw.rpc('se_is_team_member'), sb.from('staff_roles').select('role_code,system_code').eq('staff_id', st.id).is('ended_on', null)]);
  const rs = rl.data || [], formal = rs.some(r => r.role_code === 'core_admin' || (r.role_code === 'coordinator' && r.system_code === 'self_evaluation'));
  const role = (adm.data === true || crd.data === true) ? (rs.some(r => r.role_code === 'principal') && !formal ? 'principal' : 'coordinator') : team.data === true ? 'team_member' : null;
  // كل منسوب بحساب في النواة يدخل مكتبه: إن كان فريقاً أو منسقاً فدوره، وإلا «منسوب» يرى المؤشرات المسندة إليه فقط
  // تبديل الدور: المنسق ومدير المدرسة يختاران بين لوحة المنسق ولوحة المعلم (مكتبي ومؤشراتي المسندة بصفتي عضواً في الفريق)
  const r0 = role || 'member', rvCan = r0 === 'coordinator' || r0 === 'principal';
  const rvView = window.RoleSwitch ? RoleSwitch.view('self_evaluation', uid, rvCan) : 'coord';
  const r = rvCan && rvView === 'teacher' ? (team.data === true ? 'team_member' : 'member') : r0;
  return { id: st.id, uid, role: r, staff_id: st.id, display_name: st.full_name, is_active: true, rv_can: rvCan, rv_view: rvView };
}
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showLogin();
  const me = await loadMe(session.user.id);
  if (me?.denied) return showDenied(me);   // منسوب بحساب صحيح لكنه ليس في فريق التقويم: تبقى جلسته (مشتركة مع بقية الأنظمة) وتظهر له صفحة توضيحية
  if (!me) {
    await sb.auth.signOut();
    return showLogin('nostaff');
  }
  S.me = me;
  const [cyc, stf, tm] = await Promise.all([
    sb.from('cycles').select('*').order('created_at', { ascending: false }),
    sb.from('staff').select('*').order('full_name'),
    sb.from('team_members').select('staff_id,is_active'),
  ]);
  S.cycles = cyc.data || []; S.staff = stf.data || []; await App.mergeContact(); S.team = new Set((tm.data || []).filter(x => x.is_active).map(x => x.staff_id));
  const saved = (() => { try { return localStorage.getItem('cyc'); } catch { return null; } })();
  S.cid = S.cycles.find(c => c.id === saved)?.id || (S.cycles.find(c => c.status === 'active') || S.cycles[0])?.id || null;
  drawCycles();
  $('#login').hidden = true; $('#shell').hidden = false;
  (App.drawWho || (() => put($('#who'), h`${me.display_name || ''} · ${L.role[me.role]}`)))();
  route();
  seUbStart(me, role() === 'team_member' || role() === 'member' ? '#desk' : '#dashboard');
  seKit(me);
  if (window.RoleSwitch) RoleSwitch.mount({ sys: 'self_evaluation', uid: session.user.id, can: me.rv_can, view: me.rv_view, teacherDesc: 'مكتبي والمؤشرات المسندة إليّ', coordDesc: 'المؤشرات والفريق والتقارير والإدارة',
    onSwitch: (v) => { location.hash = v === 'coord' ? '#dashboard' : '#desk'; location.reload(); } });
  App.alerts().then(drawMenu).catch(() => {});
}
// صفحة من ليس عضواً في فريق التقويم: لوحة بلا قائمة ولا دورات، ورسالة واضحة بدل إخراجه من حسابه
function showDenied(me) {
  S.me = null; S.denied = true;
  $('#login').hidden = true; $('#shell').hidden = false;
  put($('#menu'), h``); const cl = $('#cycSel')?.closest('.cyc'); if (cl) cl.style.display = 'none';
  put($('#who'), h`<span>${me.display_name || ''}</span>`);
  ubSetName(me.display_name || '', '#');
  put($('#pghead'), h`<div class="wrap pgh"><div class="pgt"><small>لوحة التقويم المدرسي الذكي</small><h1>مرحباً، ${me.display_name || ''}</h1></div><p class="pgd">لوحة التحكم خاصة بفريق التقويم المدرسي.</p></div>`);
  put($('#view'), h`<div class="wrap"><div class="pn" style="max-width:620px;margin:28px auto;text-align:center;padding:32px 22px">
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--brand);margin-bottom:10px"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7 1.4 0 2.7.4 3.8 1.1"/><circle cx="18" cy="17" r="4.5"/><path d="M15 20l6-6"/></svg>
    <h2 style="margin:0 0 8px">لست عضواً في فريق التقويم المدرسي</h2>
    <p class="muted" style="margin:0 0 6px">حسابك في النواة الرقمية صحيح، لكنه غير مضاف إلى فريق التقويم المدرسي الذكي، فلا تظهر لك صفحات اللوحة.</p>
    <p class="muted" style="margin:0 0 18px">إن كنت من أعضاء الفريق فتواصل مع منسق التقويم ليضيفك، ثم حدّث هذه الصفحة.</p>
    <div class="pa" style="justify-content:center"><a class="btn pri" href="./">الموقع العام للتقويم المدرسي</a><a class="btn" href="https://i3zalmadeni.github.io/digital-core">النواة الرقمية</a></div>
  </div></div>`);
  document.title = 'لست عضواً في الفريق | لوحة التقويم المدرسي الذكي';
}
function drawCycles() {
  put($('#cycSel'), h`${S.cycles.length ? S.cycles.map(c => h`<option value="${c.id}" ${c.id === S.cid ? raw('selected') : ''}>${c.name} — ${L.cycle[c.status]}</option>`) : h`<option value="">لا توجد دورة</option>`}`);
}
App.reloadCycles = async () => { const r = await sb.from('cycles').select('*').order('created_at', { ascending: false }); S.cycles = r.data || []; if (!S.cycles.find(c => c.id === S.cid)) S.cid = S.cycles[0]?.id || null; drawCycles(); };
// حالة الجوال وموافقة واتساب: من دالة آمنة لا تكشف الرقم، وتُدمج في S.staff (الحقلان phone وwhatsapp_opt_in يعتمد عليهما الإرسال والجاهزية)
App.mergeContact = async () => {
  if (!(role() === 'coordinator' || role() === 'principal')) return;
  const r = await sb.rpc('se_staff_contact_status'); if (r.error || !r.data) return;
  const m = new Map(r.data.map(x => [x.staff_id, x]));
  S.staff.forEach(s => { const c = m.get(s.id); if (c) { s.phone = c.has_phone ? 'موجود' : ''; s.whatsapp_opt_in = !!c.wa_opt_in; } });
};
App.reloadStaff = async () => { const [r, t] = await Promise.all([sb.from('staff').select('*').order('full_name'), sb.from('team_members').select('staff_id,is_active')]); S.staff = r.data || []; await App.mergeContact(); S.team = new Set((t.data || []).filter(x => x.is_active).map(x => x.staff_id)); };

// الدخول من هذا النظام نفسه بمعرّف حساب النواة الرقمية. الجلسة مشتركة مع بقية الأنظمة على الأصل نفسه.
const LOGIN_MSG = {
  denied: 'حسابك معروف في النواة الرقمية لكنه غير مرتبط بنظام التقويم المدرسي الذكي. يعيّن مدير النواة المنسق، ويضيف المنسق أعضاء الفريق.',
  nostaff: 'هذا الحساب غير مرتبط بسجل منسوب في النواة الرقمية أو غير مفعّل.',
};
function showLogin(code = '') {
  $('#shell').hidden = true; const el = $('#login'); el.hidden = false;
  put(el, h`<div class="login"><div class="pn">${raw(App.loginFormHTML('التقويم المدرسي الذكي', LOGIN_MSG[code] || ''))}
    <p class="muted" style="margin-top:12px"><a href="./">العودة إلى الموقع العام</a></p></div></div>`);
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    const { error } = await App.signIn($('#le').value, $('#lp').value);
    if (error) { $('#lerr').textContent = error; return; }
    boot();
  };
}

/* ===== الترويسة الثابتة: اسم الصفحة وما تحويه، بنمط واحد في كل صفحات لوحة التحكم ===== */
const DETAIL = {
  notifications: ['الرئيسية', 'الإشعارات', 'ما ينتظر إجراءك ونتائج طلباتك ومستجدات النظام، بالتصميم نفسه في كل أنظمة النواة الرقمية.', 'dashboard'],
  ind: ['المؤشرات', 'صفحة المؤشر', 'النص الرسمي للمؤشر ومسؤوله ومقيّمه وشواهده وتقييمه ومبرراته وزياراته ومهامه وسجل تعديلاته.', 'inds'],
  meeting: ['الاجتماعات', 'تفاصيل الاجتماع', 'المحاور والدعوات وتأكيد الحضور والحضور الفعلي والمحضر والقرارات.', 'team'],
  visit: ['الزيارات الفنية', 'تفاصيل الزيارة', 'بطاقات المؤشرات والملاحظات والتوصيات والإجراءات المطلوبة ومتابعتها.', 'team'],
};
// الهوية الموحدة للشريط الأبيض: الدور صغيراً، ثم أيقونة القسم واسمه، ووصف التبويب الداخلي بجواره
const ROLE_T = { coordinator: 'منسق التقويم المدرسي', principal: 'مدير المدرسة', team_member: 'عضو فريق التقويم', member: 'منسوب', reviewer: 'مراجع' };
function headFor(name, args) {
  const kick = ROLE_T[role()] || 'التقويم المدرسي الذكي', hubKey = (n) => role() === 'member' ? 'desk' : role() === 'team_member' && ['team', 'platform', 'perms', 'dashboard'].includes(n) ? 'desk' : n;
  const d = DETAIL[name]; if (d) { const k = hubKey(d[3]); return { kick, icon: MICON[k], title: d[1], desc: d[2] }; }
  const hub = App.HUBS?.[name]; if (!hub) { const m = MENU.find(x => x[0] === name); return { kick, icon: MICON[name] || 'home', title: m?.[1] || '', desc: '' }; }
  const tabs = hub.tabs.filter(t => allowed(t[2])), t = tabs.find(x => x[0] === args[0]) || tabs[0];
  return { kick, icon: MICON[name], title: hub.title, desc: t?.[3] || '', tab: tabs.length > 1 ? t?.[1] : '' };
}
let CYC = null;   // قائمة «الدورة» تنتقل من الشريط الداكن إلى الشريط الأبيض بجوار «تحديث»
const hhmm = d => d.toLocaleTimeString('ar-SA-u-ca-gregory-nu-latn', { hour: 'numeric', minute: '2-digit' });
function drawHead(hd) {
  App.head = hd || App.head; const x = App.head; if (!x) return;
  CYC = CYC || document.querySelector('label.cyc');
  put($('#pghead'), h`<div class="wrap pgh"><div class="pgt"><small>${x.kick}</small><h1>${x.icon ? App.ico(x.icon) : ''}${x.title}</h1></div><p class="pgd">${x.desc}</p>
    <div class="pgx"><span class="lu" title="آخر تحديث للبيانات">${App.stamp ? 'حُدِّثت ' + hhmm(App.stamp) : ''}</span><button class="btn sm" type="button" data-a="refreshNow" aria-label="تحديث البيانات">${App.ICO_REFRESH}تحديث</button></div></div>`);
  if (CYC) $('#pghead .pgx').prepend(CYC);
  document.title = (x.tab ? x.tab + ' – ' : '') + x.title + ' | لوحة التقويم المدرسي الذكي';
}
App.ICO_REFRESH = raw('<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>');
Act.refreshNow = async () => { await App.refresh(); toast('حُدِّثت البيانات'); };

/* ===== التوجيه: انتقال هادئ، لا وميض، وتجاهل الاستجابات المتأخرة ===== */
let seq = 0, curKey = null;
const SKEL = raw('<div class="skel" aria-busy="true" aria-label="جارٍ التحميل"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div>');
// سجل التنقل في لوحة التحكم: زر الرجوع في صفحة المؤشر يعود إلى الصفحة التي جاء منها المستخدم
const hist = [];
const noteHash = () => { const h = location.hash || '#dashboard'; if (hist[hist.length - 1] === h) return; const i = hist.lastIndexOf(h); if (i >= 0) hist.length = i + 1; else hist.push(h); if (hist.length > 60) hist.shift(); };
App.indBack = () => {
  for (let j = hist.length - 2; j >= 0; j--) {
    const h = hist[j], n = h.slice(1).split('/')[0] || 'dashboard';
    if (n === 'ind') continue;
    const m = MENU.find(x => x[0] === n), L = m ? 'العودة إلى ' + m[1] : n === 'meeting' ? 'العودة إلى الاجتماع' : n === 'visit' ? 'العودة إلى الزيارة' : null;
    if (L) return { href: h, label: L };
    break;
  }
  return null;
};
async function route(opt = {}) {
  if (!S.me) return;                                     // قبل الدخول أو لمن ليس في الفريق: لا توجيه
  noteHash();
  const parts = location.hash.slice(1).split('/'); let name = parts[0] || (role() === 'team_member' || role() === 'member' ? 'desk' : 'dashboard'), args = parts.slice(1);
  if (role() === 'member' && !MEMBER_OK.includes(name)) { name = 'desk'; args = []; }
  if (role() === 'team_member' && (name === 'team' || name === 'platform')) name = 'desk';
  if (role() === 'team_member' && name === 'dashboard' && (!args[0] || args[0] === 'overview')) { name = 'desk'; args = []; }   // لا لوحة متابعة شاملة لعضو الفريق: مكتبه هو الأساس   // عضو الفريق: مكتبه الإلكتروني بدل إدارة الفريق والمنصة
  const m = MENU.find(x => x[0] === name);               // الصلاحية تُفحص على الاسم الأصلي قبل التحويل إلى تبويب
  const hub = hubOf(name);
  if (!['ind', 'meeting', 'visit'].includes(name) && hub && Pages[hub] && (!m || allowed(m[2]))) { args = [name === 'indmap' ? 'map' : name === 'perms' ? 'staff' : name, ...args]; name = hub; }
  const my = opt.silent ? seq : ++seq, view = $('#view'), keep = !!opt.keep, key = name + '/' + (args[0] || '');
  const sameHub = curKey && curKey.split('/')[0] === name;
  drawMenu(); if (!opt.silent) drawHead(headFor(name, args));
  if (!Pages[name] || (m && !allowed(m[2]))) { put(view, h`<div class="pn"><p>الصفحة غير متاحة لدورك.</p></div>`); curKey = null; return; }
  if (!opt.silent) {
    document.body.classList.add('busy');
    if (sameHub || keep) view.classList.add('dim'); else put(view, SKEL);   // داخل القسم نفسه يبقى المحتوى القديم باهتاً حتى يجهز الجديد
  }
  let out;
  try {
    const r = await Pages[name](args);
    const body = r.html || r, dc = App.cycle(), banner = String(dc?.name || '').startsWith('[تجريبي]') && !dc.results_published
      ? raw(`<div class="demobar" role="status"><span>أنت تعرض <b>الدورة التجريبية</b>: كل ما فيها بيانات تجريبية للمعاينة وغير منشورة.</span></div>`) : '';
    out = { html: banner ? h`${banner}${body}` : body, after: r.after };
  } catch (e) { console.error(e); out = { html: h`<div class="pn"><p class="err">تعذّر تحميل الصفحة: ${App.errMsg(e)}</p></div>` }; }
  if (my !== seq) return;                                  // وصل المستخدم إلى صفحة أحدث أثناء التحميل
  const y = window.scrollY;
  put(view, out.html); if (out.after) out.after(view);
  view.classList.remove('dim'); document.body.classList.remove('busy');
  App.stamp = new Date(); curKey = key;
  if (opt.silent || keep) { window.scrollTo(0, y); drawHead(); return; }
  view.classList.remove('in'); void view.offsetWidth; view.classList.add(sameHub ? 'in-s' : 'in'); setTimeout(() => view.classList.remove('in', 'in-s'), 400);
  drawHead(); window.scrollTo({ top: 0, behavior: sameHub ? 'smooth' : 'auto' });
  view.focus({ preventScroll: true });
}
App.refresh = async () => { App.dropCache?.(); await route({ keep: true }); };

/* ===== تحديث حيّ: شارات القائمة تتجدد دورياً، والصفحات التشغيلية تتجدد صامتة عند عدم انشغال المستخدم ===== */
let lastPoll = Date.now();
const LIVE = new Set(['dashboard/overview', 'notifications/', 'dashboard/', 'team/overview', 'team/']);
async function poll() {
  if (document.hidden || !S.me || !S.cid) return;
  lastPoll = Date.now(); App.dropCache?.();
  try { await App.alerts(); drawMenu(); } catch { return; }
  const ae = document.activeElement, busyEdit = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName), modal = $('[role="dialog"]');
  if (LIVE.has(curKey) && !busyEdit && !modal) route({ silent: true });
}
setInterval(poll, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastPoll > 30000) poll(); });

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = Act[el.dataset.a]; if (!fn) return;
  el.disabled = true;
  try { await fn({ ...el.dataset }, el); } catch (err) { console.error(err); toast(App.errMsg(err), true); }
  finally { el.disabled = false; }
});
$('#cycSel').onchange = e => { S.cid = e.target.value || null; try { localStorage.setItem('cyc', S.cid || ''); } catch {} route(); };
$('#out').onclick = async () => { S.me = null; S.denied = false; await sb.auth.signOut(); location.href = './'; };   // الخروج يعيد إلى الصفحة الرئيسية للنظام
// انتهاء الجلسة من جهة الخادم (أو تسجيل الخروج من تبويب آخر): نرجع إلى شاشة الدخول برسالة واضحة بدل أخطاء صامتة
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT' && (S.me || S.denied)) { S.me = null; S.denied = false; showLogin(); } });
window.addEventListener('offline', () => toast('لا يوجد اتصال بالإنترنت: لن تُحفظ التعديلات حتى يعود', true));
window.addEventListener('online', () => { toast('عاد الاتصال'); App.refresh?.(); });
window.addEventListener('hashchange', () => { route(); seKit(); });
// الحزمة الموحدة: شريط الإعلانات وبطاقة الترحيب في الصفحة الرئيسية وإدارة الإعلانات في إدارة البوابة
let kitMe = null, kitHome = null;
function seKit(me) {
  if (!window.PK) return; kitMe = me || kitMe; if (!kitMe || S.denied) return;
  const hs = location.hash.slice(1).split('/'), home = !hs[0] || hs[0] === 'dashboard' || hs[0] === 'desk';
  if (home !== kitHome) {
    kitHome = home;
    PK.mountAnnouncements({ sb, system: 'self_evaluation', page: home ? 'home' : 'all', before: '#view' });   // خارج الترويسة الثابتة ليمرّ مع الصفحة عند التمرير
    if (home) { const st = S.staff.find(x => x.id === S.me.staff_id); PK.welcome('#view', { mode: 'before', sb, name: (st && st.full_name) || kitMe.display_name || '', role: L.role[role()] || '' }); }
    else document.querySelectorAll('.pk-wcw').forEach(e => e.remove());
  }
  if (hs[0] === 'platform' && (role() === 'coordinator' || role() === 'principal')) { if (!document.querySelector('.pk-admwrap')) PK.mountAdminSection({ sb, system: 'self_evaluation', central: true, after: '#view' }); }
  else document.querySelectorAll('.pk-admwrap').forEach(e => e.remove());
}
// الشريط العلوي (الشعار) يختفي عند التمرير ويبقى شريط الأقسام وترويسة الصفحة ثابتَين
const setHH = () => { const hh = $('.astick header')?.offsetHeight || 0, st = document.documentElement.style; st.setProperty('--hh', hh + 'px'); st.setProperty('--sh', Math.max(0, ($('.astick')?.offsetHeight || 0) - hh) + 'px'); };
if (window.ResizeObserver && $('.astick')) new ResizeObserver(setHH).observe($('.astick'));
window.addEventListener('resize', setHH); setHH(); setTimeout(setHH, 600);
Act.print = () => window.print();
Act.back = () => history.back();
boot();
})();
