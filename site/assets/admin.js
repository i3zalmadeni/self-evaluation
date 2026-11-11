/* غلاف لوحة التحكم: الدخول، القائمة، التوجيه، الإجراءات */
(() => {
const { sb, h, raw, $, $$, put, S, toast, run, role, isCoord, L } = App;



const CP = ['coordinator', 'principal'], CPR = ['coordinator', 'principal'];
// القائمة العلوية: أربعة أقسام رئيسية فقط. الصفحات الداخلية (علامة 1) تُعرض كتبويبات داخل قسمها وتبقى روابطها القديمة تعمل وصلاحياتها كما هي
const MENU = [
  ['desk', 'مكتبي الإلكتروني', ['team_member']],      // الصفحة الأساسية لعضو الفريق
  ['dashboard', 'مكتبي الإلكتروني', ['coordinator', 'principal']],
  ['inds', 'إدارة المؤشرات', '*'],
  ['team', 'إدارة الفريق', ['coordinator', 'principal']],
  ['platform', 'إدارة المنصة', ['coordinator', 'principal']],
  ['alerts', 'التنبيهات', '*'],
  ['reports', 'التقارير', '*', 1], ['log', 'سجل النشاط', CP, 1],
  ['evidence', 'الشواهد', '*', 1], ['indmap', 'خريطة التقدم', '*', 1],
  ['cycles', 'دورات التقويم', CPR, 1], ['wa', 'واتساب', ['coordinator'], 1],
  ['staff', 'فريق التقويم', ['coordinator', 'principal'], 1], ['assign', 'المسؤوليات', CP, 1], ['ann', 'الإعلانات', '*', 1],
  ['meetings', 'الاجتماعات', '*', 1], ['visits', 'الزيارات الفنية', '*', 1], ['tasks', 'المهام والتكليفات', '*', 1], ['cal', 'التقويم والمواعيد', '*', 1],
];
// اسم الصفحة الداخلية ← القسم الذي يحويها
const HUB_OF = { reports: 'dashboard', log: 'dashboard', evidence: 'inds', indmap: 'inds', ind: 'inds', cycles: 'platform', wa: 'platform', staff: 'platform', assign: 'platform', ann: 'platform', tasks: 'team', meetings: 'team', meeting: 'team', visits: 'team', visit: 'team', cal: 'team' };
const DESKP = ['tasks', 'meetings', 'meeting', 'visits', 'visit', 'cal', 'ann'];
const hubOf = n => role() === 'team_member' && DESKP.includes(n) ? 'desk' : HUB_OF[n];
const allowed = (r) => r === '*' || r.includes(role());

// القائمة العلوية: عناصر قبل أول مجموعة تظهر مباشرة، وكل مجموعة تُفتح كقائمة منسدلة
const MICON = { dashboard: 'bars', alerts: 'bell', inds: 'note', team: 'users', platform: 'layers', desk: 'user' };
function drawMenu() {
  const cur0 = location.hash.slice(1).split('/')[0] || (role() === 'team_member' ? 'desk' : 'dashboard'), cur = role() === 'team_member' && (cur0 === 'team' || cur0 === 'platform') ? 'desk' : (hubOf(cur0) || cur0);
  const nb = App.hubBadges ? App.hubBadges(App.lastAlerts) : {};
  put($('#menu'), h`${MENU.filter(m => !m[3] && allowed(m[2])).map(m => h`<a href="#${m[0]}" class="${m[0] === cur ? 'on' : ''}" ${m[0] === cur ? raw('aria-current="page"') : ''}>${MICON[m[0]] ? App.ico(MICON[m[0]]) : ''}<span class="ml">${m[1]}</span>${nb[m[0]] ? h` <span class="nb" aria-label="${nb[m[0]]} إجراء">${nb[m[0]] > 99 ? '99+' : App.nf(nb[m[0]])}</span>` : ''}</a>`)}`);
}
App.drawMenu = drawMenu;

// هوية المستخدم من النواة الرقمية: المنسوب بحساب الدخول، والدور من أدوار النواة وفريق التقويم
async function loadMe(uid) {
  const { data: st } = await sb.from('staff').select('id,full_name,is_active').eq('user_id', uid).maybeSingle();
  if (!st || !st.is_active) return null;
  const [adm, crd, team, rl] = await Promise.all([sb.raw.rpc('is_core_admin'), sb.raw.rpc('se_is_coordinator'), sb.raw.rpc('se_is_team_member'), sb.from('staff_roles').select('role_code,system_code').eq('staff_id', st.id).is('ended_on', null)]);
  const rs = rl.data || [], formal = rs.some(r => r.role_code === 'core_admin' || (r.role_code === 'coordinator' && r.system_code === 'self_evaluation'));
  const role = (adm.data === true || crd.data === true) ? (rs.some(r => r.role_code === 'principal') && !formal ? 'principal' : 'coordinator') : team.data === true ? 'team_member' : null;
  return role ? { id: st.id, uid, role, staff_id: st.id, display_name: st.full_name, is_active: true } : { denied: true, display_name: st.full_name };
}
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showLogin();
  const me = await loadMe(session.user.id);
  if (!me || me.denied) {
    await sb.auth.signOut();
    return showLogin(me?.denied ? 'حسابك معروف في النواة الرقمية لكنه غير مرتبط بنظام التقويم الذاتي. يعيّن مدير النواة المنسق، ويضيف المنسق أعضاء الفريق.' : 'هذا الحساب غير مرتبط بسجل منسوب في النواة الرقمية أو غير مفعّل.');
  }
  S.me = me;
  const [cyc, stf, tm] = await Promise.all([
    sb.from('cycles').select('*').order('created_at', { ascending: false }),
    sb.from('staff').select('*').order('full_name'),
    sb.from('team_members').select('staff_id,is_active'),
  ]);
  S.cycles = cyc.data || []; S.staff = stf.data || []; S.team = new Set((tm.data || []).filter(x => x.is_active).map(x => x.staff_id));
  const saved = (() => { try { return localStorage.getItem('cyc'); } catch { return null; } })();
  S.cid = S.cycles.find(c => c.id === saved)?.id || (S.cycles.find(c => c.status === 'active') || S.cycles[0])?.id || null;
  drawCycles();
  $('#login').hidden = true; $('#shell').hidden = false;
  (App.drawWho || (() => put($('#who'), h`${me.display_name || ''} · ${L.role[me.role]}`)))();
  route();
  App.alerts().then(drawMenu).catch(() => {});
}
function drawCycles() {
  put($('#cycSel'), h`${S.cycles.length ? S.cycles.map(c => h`<option value="${c.id}" ${c.id === S.cid ? raw('selected') : ''}>${c.name} — ${L.cycle[c.status]}</option>`) : h`<option value="">لا توجد دورة</option>`}`);
}
App.reloadCycles = async () => { const r = await sb.from('cycles').select('*').order('created_at', { ascending: false }); S.cycles = r.data || []; if (!S.cycles.find(c => c.id === S.cid)) S.cid = S.cycles[0]?.id || null; drawCycles(); };
App.reloadStaff = async () => { const [r, t] = await Promise.all([sb.from('staff').select('*').order('full_name'), sb.from('team_members').select('staff_id,is_active')]); S.staff = r.data || []; S.team = new Set((t.data || []).filter(x => x.is_active).map(x => x.staff_id)); };

function showLogin(msg = '') {
  $('#shell').hidden = true; const el = $('#login'); el.hidden = false;
  put(el, h`<div class="login"><div class="pn"><h1 style="font-size:1.3rem;margin-bottom:6px">لوحة التقويم الذاتي</h1><p class="muted">مدرسة لبيد بن ربيعة المتوسطة. الدخول بحساب النواة الرقمية نفسه.</p>
    <form class="frm" id="lf"><label class="fld"><span>البريد الإلكتروني</span><input id="le" type="email" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" dir="ltr"></label>
    <label class="fld"><span>كلمة المرور</span><input id="lp" type="password" required autocomplete="current-password" dir="ltr"></label>
    <div class="err" id="lerr" role="alert">${msg}</div><button class="btn pri" type="submit">دخول</button></form>
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
  alerts: ['مكتبي الإلكتروني', 'التنبيهات', 'كل الإجراءات المعلّقة عليك مرتبة بدرجة الاستعجال: اعتمادات ومتابعات ومواعيد، وتتجدد عند كل إجراء.'],
  ind: ['المؤشرات', 'صفحة المؤشر', 'النص الرسمي للمؤشر ومسؤوله ومقيّمه وشواهده وتقييمه ومبرراته وزياراته ومهامه وسجل تعديلاته.', 'inds'],
  meeting: ['الاجتماعات', 'تفاصيل الاجتماع', 'المحاور والدعوات وتأكيد الحضور والحضور الفعلي والمحضر والقرارات.', 'team'],
  visit: ['الزيارات الفنية', 'تفاصيل الزيارة', 'بطاقات المؤشرات والملاحظات والتوصيات والإجراءات المطلوبة ومتابعتها.', 'team'],
};
function headFor(name, args) {
  const d = DETAIL[name]; if (d) return { kick: App.HUBS?.[role() === 'team_member' && d[3] === 'team' ? 'desk' : d[3]]?.title || d[0], title: d[1], desc: d[2] };
  const hub = App.HUBS?.[name]; if (!hub) { const m = MENU.find(x => x[0] === name); return { kick: 'مكتبي الإلكتروني', title: m?.[1] || '', desc: '' }; }
  const tabs = hub.tabs.filter(t => allowed(t[2])), t = tabs.find(x => x[0] === args[0]) || tabs[0];
  return { kick: hub.title, title: t?.[1] || hub.title, desc: t?.[3] || '' };
}
const hhmm = d => d.toLocaleTimeString('ar-SA-u-ca-gregory-nu-latn', { hour: 'numeric', minute: '2-digit' });
function drawHead(hd) {
  App.head = hd || App.head; const x = App.head; if (!x) return;
  put($('#pghead'), h`<div class="wrap pgh"><div class="pgt"><small>${x.kick}</small><h1>${x.title}</h1></div><p class="pgd">${x.desc}</p>
    <div class="pgx"><span class="lu" title="آخر تحديث للبيانات">${App.stamp ? 'حُدِّثت ' + hhmm(App.stamp) : ''}</span><button class="btn sm" type="button" data-a="refreshNow" aria-label="تحديث البيانات">${App.ICO_REFRESH}تحديث</button></div></div>`);
  document.title = x.title + ' | لوحة التقويم الذاتي';
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
  noteHash();
  const parts = location.hash.slice(1).split('/'); let name = parts[0] || (role() === 'team_member' ? 'desk' : 'dashboard'), args = parts.slice(1);
  if (role() === 'team_member' && (name === 'team' || name === 'platform')) name = 'desk';
  if (role() === 'team_member' && name === 'dashboard' && (!args[0] || args[0] === 'overview')) { name = 'desk'; args = []; }   // لا لوحة متابعة شاملة لعضو الفريق: مكتبه هو الأساس   // عضو الفريق: مكتبه الإلكتروني بدل إدارة الفريق والمنصة
  const m = MENU.find(x => x[0] === name);               // الصلاحية تُفحص على الاسم الأصلي قبل التحويل إلى تبويب
  const hub = hubOf(name);
  if (!['ind', 'meeting', 'visit'].includes(name) && hub && Pages[hub] && (!m || allowed(m[2]))) { args = [name === 'indmap' ? 'map' : name, ...args]; name = hub; }
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
const LIVE = new Set(['dashboard/overview', 'alerts/', 'dashboard/', 'team/overview', 'team/']);
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
$('#out').onclick = async () => { await sb.auth.signOut(); S.me = null; showLogin(); };
// انتهاء الجلسة من جهة الخادم (أو تسجيل الخروج من تبويب آخر): نرجع إلى شاشة الدخول برسالة واضحة بدل أخطاء صامتة
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT' && S.me) { S.me = null; showLogin('انتهت الجلسة، سجّل الدخول من جديد.'); } });
window.addEventListener('offline', () => toast('لا يوجد اتصال بالإنترنت: لن تُحفظ التعديلات حتى يعود', true));
window.addEventListener('online', () => { toast('عاد الاتصال'); App.refresh?.(); });
window.addEventListener('hashchange', () => route());
// الشريط العلوي (الشعار) يختفي عند التمرير ويبقى شريط الأقسام وترويسة الصفحة ثابتَين
const setHH = () => { const hh = $('.astick header')?.offsetHeight || 0, st = document.documentElement.style; st.setProperty('--hh', hh + 'px'); st.setProperty('--sh', Math.max(0, ($('.astick')?.offsetHeight || 0) - hh) + 'px'); };
if (window.ResizeObserver && $('.astick')) new ResizeObserver(setHH).observe($('.astick'));
window.addEventListener('resize', setHH); setHH(); setTimeout(setHH, 600);
Act.print = () => window.print();
Act.back = () => history.back();
boot();
})();
