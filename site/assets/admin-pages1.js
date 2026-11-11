/* صفحات: لوحة المتابعة، الدورات، المنسوبون والحسابات، المسؤوليات */
(() => {
const { sb, h, raw, $, put, S, L, lab, opts, nf, dt, dtt, today, codeCmp, staffName, staffOpts, toast, run, must, ask, sure, badge, sb_, table, btn, pageHead, panel, isCoord, role, csv } = App;

// ===== بيانات مرجعية (مشتركة بين الدورات) =====
let REF;
App.ref = async (force) => {
  if (REF && !force) return REF;
  const [d, s, i] = await Promise.all([
    must(sb.from('domains').select('*').order('sort_order')),
    must(sb.from('standards').select('*').order('sort_order')),
    must(sb.from('indicators').select('*').eq('is_government_applicable', true).order('sort_order')),
  ]);
  const dm = Object.fromEntries(d.map(x => [x.id, x])), sm = Object.fromEntries(s.map(x => [x.id, x]));
  i.sort((a, b) => codeCmp(a.code, b.code));
  i.forEach(x => { x.std = sm[x.standard_id]; x.dom = dm[x.std?.domain_id]; });
  REF = { domains: d, standards: s, inds: i, im: Object.fromEntries(i.map(x => [x.id, x])), dm, sm };
  return REF;
};
const needCycle = () => S.cid ? null : h`${pageHead('لا توجد دورة')}<div class="pn"><p>أنشئ دورة أولاً من صفحة «دورات التقويم».</p><a class="btn pri" href="#cycles">دورات التقويم</a></div>`;
App.needCycle = needCycle;
const short = (t, n = 90) => t && t.length > n ? t.slice(0, n) + '…' : t;
App.short = short;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const bar = p => h`<div class="bar2"><span style="width:${p}%"></span></div>`;

// ===== لوحة المتابعة: انتقلت إلى admin-dashboard.js =====

// ===== الدورات =====
// الدورة تتبع عاماً دراسياً من النواة (year_id) وتثبّت إصدار الدليل
const yearLabel = y => y.name;
const schoolYearOf = y => { const m = y?.name?.match(/(\d{4})\/(\d{4})/); return m ? `${m[1]}-${m[2]}` : null; };
const cycleFields = (gv, yrs) => [
  { k: 'name', l: 'اسم الدورة', req: 1, ph: 'الدورة الأولى' },
  { k: 'year_id', l: 'العام الدراسي (من النواة)', t: 'select', req: 1, o: yrs.map(y => [y.id, yearLabel(y)]) },
  { k: 'start_date', l: 'تاريخ البداية', t: 'date' }, { k: 'end_date', l: 'تاريخ النهاية', t: 'date' },
  { k: 'coordinator_id', l: 'منسق الدورة', t: 'select', o: staffOpts() },
  ...(gv ? [{ k: 'guide_version_id', l: 'إصدار الدليل المرجعي', t: 'select', o: gv.map(g => [g.id, `${g.title} · ${g.edition || ''}`]), req: 1 }] : []),
];
const loadYears = async () => must(sb.from('academic_years').select('id,name,status,starts_on').order('starts_on', { ascending: false }));
const withYear = (v, yrs) => { const y = yrs.find(x => x.id === v.year_id); return { ...v, school_year: schoolYearOf(y) }; };
Pages.cycles = async () => {
  const [gv, yrs] = await Promise.all([must(sb.from('guide_versions').select('*')), loadYears()]);
  const coord = isCoord(), ym = Object.fromEntries(yrs.map(y => [y.id, y.name]));
  return h`${pageHead('دورات التقويم الذاتي', coord ? btn('+ دورة جديدة', 'cycNew', {}, 'pri') : '')}
  ${App.tlSum([[S.cycles.length, 'دورة'], [S.cycles.filter(c => c.status === 'active').length, 'نشطة', 'ok'], [S.cycles.filter(c => c.status === 'paused').length, 'متوقفة مؤقتاً', 'warn'], [S.cycles.filter(c => c.results_published).length, 'نتائج منشورة', 'info']])}
  ${App.tlist(S.cycles.map(c => { const g = gv.find(x => x.id === c.guide_version_id), tn = c.status === 'active' ? 'ok' : c.status === 'paused' ? 'warn' : 'mute'; return App.tile({ tone: tn, ico: 'layers', title: h`${c.name} <small class="muted">${ym[c.year_id] || c.school_year || ''}</small>`,
    meta: h`${sb_('cycle', c.status)}<span>${App.ico('cal')} ${dt(c.start_date)} ← ${dt(c.end_date)}</span>${c.coordinator_id ? h`<span>${App.ico('user')} ${staffName(c.coordinator_id)}</span>` : ''}${g ? h`<span>${App.ico('doc')} ${g.title} · ${g.edition || ''}</span>` : ''}${c.results_published ? badge('النتائج منشورة', 'ok') : badge('النتائج غير منشورة')}`,
    acts: !coord ? '' : h`${btn('تعديل', 'cycEdit', { id: c.id })}${c.status !== 'active' ? btn(c.status === 'closed' ? 'إعادة فتح' : c.status === 'paused' ? 'استئناف' : 'إطلاق', 'cycSet', { id: c.id, st: 'active' }, 'pri') : btn('إيقاف مؤقت', 'cycSet', { id: c.id, st: 'paused' })}${c.status !== 'closed' ? btn('إغلاق', 'cycSet', { id: c.id, st: 'closed' }) : ''}${btn(c.results_published ? 'إلغاء النشر' : 'نشر النتائج', 'cycPub', { id: c.id, v: c.results_published ? '' : '1' })}` }); }), 'لا توجد دورات. ابدأ بإنشاء الدورة الأولى.')}
  <p class="muted">كل دورة تتبع عاماً دراسياً في النواة الرقمية ولها تقييماتها وشواهدها ومهامها المستقلة، ولا تُنقل تلقائياً بين الدورات. المجالات والمعايير والمؤشرات مرجع مشترك مثبّت بإصدار الدليل. ملاحظة: الدورة التجريبية، إن وُجدت، تُحذف قبل التشغيل الفعلي.</p>`;
};
Act.cycNew = async () => {
  const [gv, yrs] = await Promise.all([must(sb.from('guide_versions').select('*')), loadYears()]);
  const cur = gv.find(g => g.is_current) || gv[0], yc = yrs.find(y => y.status === 'current') || yrs[0];
  const v = await ask('دورة تقويم جديدة', cycleFields(gv, yrs), { guide_version_id: cur?.id, year_id: yc?.id, coordinator_id: S.me.staff_id });
  if (!v) return; if (await run(sb.from('cycles').insert({ ...withYear(v, yrs), status: 'draft', created_by: S.me.id }), 'أُنشئت الدورة')) { await App.reloadCycles(); App.refresh(); }
};
Act.cycEdit = async ({ id }) => {
  const yrs = await loadYears(); const c = S.cycles.find(x => x.id === id); const v = await ask('تعديل الدورة', cycleFields(null, yrs), c); if (!v) return;
  if (await run(sb.from('cycles').update(withYear(v, yrs)).eq('id', id), 'حُفظت')) { await App.reloadCycles(); App.refresh(); }
};
Act.cycSet = async ({ id, st }) => {
  if (st === 'closed' && !await sure('إغلاق الدورة يمنع تعديل التقييمات. متابعة؟')) return;
  if (await run(sb.from('cycles').update({ status: st }).eq('id', id), 'تم تغيير حالة الدورة')) { await App.reloadCycles(); App.refresh(); }
};
Act.cycPub = async ({ id, v }) => {
  if (v && !await sure('سيرى الزائر التقييمات المعتمدة وحدها (المبررات والنسب). متابعة النشر؟')) return;
  if (await run(sb.from('cycles').update({ results_published: !!v }).eq('id', id), v ? 'نُشرت النتائج' : 'أُلغي النشر')) { await App.reloadCycles(); App.refresh(); }
};

// ===== فريق التقويم =====
// المنسوبون وحساباتهم وأدوارهم من النواة الرقمية (قراءة فقط هنا). المنسق يعيّنه مدير النواة، وفريق التقويم يُختار من منسوبي المدرسة.
Pages.staff = async () => {
  const [, tm, wo] = await Promise.all([App.reloadStaff(), must(sb.from('team_members').select('*')), sb.from('whatsapp_optin').select('*')]);
  const tmap = Object.fromEntries(tm.map(t => [t.staff_id, t])), opt = Object.fromEntries((wo.data || []).map(o => [o.staff_id, o.opt_in]));
  const inTeam = s => !!tmap[s.id]?.is_active, hasAcc = s => !!s.user_id && s.account_status === 'active';
  const mgr = isCoord() || role() === 'principal';
  const order = [...S.staff].filter(s => s.is_active || inTeam(s)).sort((a, b) => (inTeam(b) - inTeam(a)) || a.full_name.localeCompare(b.full_name, 'ar'));
  return h`${pageHead('فريق التقويم الذاتي')}
  ${App.tlSum([[S.team.size, 'عضو في فريق التقويم', 'ok'], [order.filter(s => inTeam(s) && !hasAcc(s)).length, 'أعضاء بلا حساب في النواة', 'warn'], [S.staff.filter(x => x.is_active).length, 'منسوباً في المدرسة']])}
  <section class="tl-sec"><h2>${App.ico('users')} منسوبو المدرسة</h2>${App.tlist(order.map(s => App.tile({ tone: inTeam(s) ? (hasAcc(s) ? 'ok' : 'warn') : 'mute', lead: h`<span class="tl-av">${App.avatarHtml(s, 54)}</span>`, title: s.full_name,
    meta: h`${s.job_title ? h`<span>${s.job_title}</span>` : ''}${inTeam(s) ? badge('عضو في الفريق', 'ok') : badge('خارج الفريق')}${hasAcc(s) ? badge('لديه حساب في النواة', 'info') : badge('بلا حساب في النواة')}${opt[s.id] ? badge('واتساب: موافق', 'ok') : ''}`,
    acts: !mgr ? '' : h`${inTeam(s) ? btn('إزالة من الفريق', 'tmOff', { id: s.id }, 'bad') : btn('إضافة إلى الفريق', 'tmOn', { id: s.id }, 'pri')}${btn(opt[s.id] ? 'إلغاء موافقة واتساب' : 'تسجيل موافقة واتساب', 'tmWa', { id: s.id, v: opt[s.id] ? '' : '1' })}` })), 'لا يوجد منسوبون في النواة.')}</section>
  <p class="muted">الحسابات والأدوار تُدار من النواة الرقمية: يعيّن مدير النواة منسق التقويم، ويُنشئ حسابات المنسوبين. هنا تُحدَّد عضوية فريق التقويم فقط، ولا يستطيع المقيّم أن يكون خارجها. رقم الجوال محفوظ في النواة ولا يُنسخ إلى هذا النظام.</p>`;
};
Act.tmOn = async ({ id }) => {
  const ex = (await must(sb.from('team_members').select('id').eq('staff_id', id)))[0];
  const r = ex ? sb.from('team_members').update({ is_active: true }).eq('id', ex.id) : sb.from('team_members').insert({ staff_id: id, added_by: S.me.id });
  if (await run(r, 'أُضيف إلى فريق التقويم')) { await App.reloadStaff(); App.refresh(); }
};
Act.tmOff = async ({ id }) => {
  if (!await sure('إزالة العضو من فريق التقويم؟ لا يمكن إزالته وهو مقيّم لمؤشرات.')) return;
  if (await run(sb.from('team_members').update({ is_active: false }).eq('staff_id', id), 'أُزيل من الفريق')) { await App.reloadStaff(); App.refresh(); }
};
Act.tmWa = async ({ id, v }) => { if (await run(sb.from('whatsapp_optin').upsert({ staff_id: id, opt_in: !!v }), 'تم')) App.refresh(); };

// صورة المنسوب: الصورة العامة من النواة (حاوية public-photos) لمن وافق على النشر، وإلا الأحرف الأولى
const avUrl = p => p ? sb.storage.from('public-photos').getPublicUrl(p).data.publicUrl : '';
const initials = n => { const w = String(n || '؟').trim().split(/\s+/), l = w.length > 1 ? w[w.length - 1].replace(/^ال/, '') : ''; return w[0][0] + (l ? l[0] : ''); };
App.avatarHtml = (st, size = 40) => h`<span class="av" style="--s:${size}px">${st?.avatar_path ? h`<img src="${avUrl(st.avatar_path)}" alt="" loading="lazy">` : h`<i>${initials(st?.full_name || st?.display_name)}</i>`}</span>`;
App.pcell = (id, size = 24) => h`<span class="pcell">${App.avatarHtml(S.staff.find(s => s.id === id) || { full_name: staffName(id) }, size)}<span>${staffName(id)}</span></span>`;
App.ncell = (n, size = 24) => h`<span class="pcell">${App.avatarHtml(S.staff.find(s => s.full_name === n) || { full_name: n }, size)}<span>${n}</span></span>`;
const drawWho = () => put($('#who'), h`${App.avatarHtml(S.staff.find(s => s.id === S.me.staff_id) || { display_name: S.me.display_name }, 28)}<span>${S.me.display_name || ''} · ${L.role[S.me.role]}</span>`);
App.drawWho = drawWho;

// ===== المسؤوليات =====
Pages.assign = async (a) => {
  const nc = needCycle(); if (nc) return nc;
  const ref = await App.ref();
  const [da, ia] = await Promise.all([
    must(sb.from('domain_assignments').select('*').eq('cycle_id', S.cid)),
    must(sb.from('indicator_assignments').select('*').eq('cycle_id', S.cid)),
  ]);
  const sid = a[0] || '';
  let mine = [];
  if (sid) mine = (await must(sb.from('staff_responsibilities').select('*').eq('cycle_id', S.cid).eq('staff_id', sid))).sort((x, y) => codeCmp(x.code, y.code));
  const chips = (list, kind, iid) => h`<div class="chips">${list.filter(x => x.kind === kind).map(x => h`<span class="chip2">${App.pcell(x.staff_id, 20)}${x.due_date ? h` <small>${dt(x.due_date)}</small>` : ''} <button data-a="asDel" data-t="indicator_assignments" data-id="${x.id}" aria-label="إزالة">✕</button></span>`)}${btn('+', 'asAdd', { iid, kind })}</div>`;
  return h`${pageHead('إدارة المسؤوليات')}
  ${panel('ملف مسؤوليات منسوب', h`<div class="flt"><label>المنسوب <select id="asPick"><option value="">اختر…</option>${S.staff.map(s => h`<option value="${s.id}" ${s.id === sid ? raw('selected') : ''}>${s.full_name}</option>`)}</select></label></div>
    ${sid ? h`<h3 style="margin:8px 0">${staffName(sid)}: ${nf(mine.length)} مؤشراً</h3>${table([
      { h: 'الرمز', f: r => h`<a href="#ind/${r.indicator_id}" dir="ltr">${r.code}</a>` }, { h: 'نص المؤشر', f: r => r.official_text }, { h: 'الدور', f: r => badge(L.kind[r.kind], r.kind === 'responsible' ? 'warn' : 'info') },
      { h: 'عبر', f: r => r.via === 'domain' ? 'المجال' : 'المؤشر' }, { h: '', f: r => r.kind === 'responsible' ? btn('رابط وصول', 'asLink', { iid: r.indicator_id, sid }) : '' },
    ], mine, 'لا توجد مسؤوليات في هذه الدورة')}
    <div class="pa noprint" style="margin-top:10px">${btn('طباعة', 'print')} ${btn('تصدير CSV', 'asCsv', { sid })}</div>` : h`<p class="muted">اختر منسوباً لعرض ما أُسند إليه عبر المجالات الأربعة.</p>`}`)}
  <section class="tl-sec"><div class="tl-hd"><h2>${App.ico('layers')} إسناد المجالات</h2>${btn('+ إسناد مجال', 'asDom', {}, 'pri')}</div>${App.tlist(da.map(r => { const di = ref.domains.findIndex(d => d.id === r.domain_id), k = [0, 3, 2, 1][Math.max(0, di) % 4];
    return App.tile({ tone: 'info', ico: 'flag', title: ref.dm[r.domain_id]?.name_ar, meta: h`<span class="bdg">${L.kind[r.kind]}</span>`, extra: h`<div class="tl-ps"><span class="tl-p">${App.avatarHtml(S.staff.find(x => x.id === r.staff_id) || { full_name: staffName(r.staff_id) }, 20)}${staffName(r.staff_id)}</span></div>`, acts: btn('إزالة', 'asDel', { t: 'domain_assignments', id: r.id }, 'bad') }); }), 'لا توجد إسنادات مجالات')}</section>
  <section class="tl-sec"><div class="tl-hd"><h2>${App.ico('user')} إسناد المؤشرات</h2><small class="muted">المسؤول يوفّر المعلومات والشواهد ولا يقيّم؛ المقيّم عضو في فريق التقويم.</small></div>
  ${ref.domains.map((d, di) => { const k = [0, 3, 2, 1][di % 4], xs = ref.inds.filter(i => i.dom?.id === d.id);
    return h`<div class="as-dom" style="--b:var(--c${k}b);--f:var(--c${k}f)"><h3>${d.name_ar} <span class="bdg">${nf(xs.length)}</span></h3><div class="as-list">${xs.map(i => h`<div class="as-row"><a class="as-c" href="#ind/${i.id}" dir="ltr">${i.code}</a><div class="as-t">${App.short(i.official_text, 110)}</div>
      <div class="as-w"><small>المسؤولون</small>${chips(ia.filter(x => x.indicator_id === i.id), 'responsible', i.id)}</div><div class="as-w"><small>المقيّمون</small>${chips(ia.filter(x => x.indicator_id === i.id), 'evaluator', i.id)}</div></div>`)}</div></div>`; })}</section>`;
  // (الربط بعد الرسم أدناه)
};
const origAssign = Pages.assign;
Pages.assign = async (a) => { const r = await origAssign(a); return { html: r, after: v => { const s = $('#asPick', v); if (s) s.onchange = () => { location.hash = '#assign/' + s.value; }; } }; };
Act.asDom = async () => {
  const ref = await App.ref(); const v = await ask('إسناد مجال', [{ k: 'domain_id', l: 'المجال', t: 'select', req: 1, o: ref.domains.map(d => [d.id, d.name_ar]) }, { k: 'staff_id', l: 'المنسوب', t: 'select', req: 1, o: staffOpts() }, { k: 'kind', l: 'الدور', t: 'select', req: 1, o: Object.entries(L.kind) }], { kind: 'evaluator' });
  if (v && v.kind === 'evaluator' && !S.team.has(v.staff_id)) return toast('المقيّم يجب أن يكون عضواً في فريق التقويم: أضفه من «فريق التقويم» أولاً', true);
  if (v && await run(sb.from('domain_assignments').insert({ ...v, cycle_id: S.cid }), 'أُسند المجال')) App.refresh();
};
Act.asAdd = async ({ iid, kind }) => {
  const f = [{ k: 'staff_id', l: kind === 'evaluator' ? 'المقيّم (عضو فريق التقويم)' : 'المسؤول', t: 'select', req: 1, o: staffOpts(kind === 'evaluator' ? (s => S.team.has(s.id)) : null) }];
  if (kind === 'responsible') f.push({ k: 'due_date', l: 'الموعد النهائي لتوفير الشواهد', t: 'date' });
  const v = await ask(kind === 'evaluator' ? 'إضافة مقيّم' : 'إضافة مسؤول', f); if (!v) return;
  if (await run(sb.from('indicator_assignments').insert({ ...v, cycle_id: S.cid, indicator_id: iid, kind }), 'تم الإسناد')) App.refresh();
};
Act.asDel = async ({ t, id }) => { if (await sure('إزالة هذا الإسناد؟') && await run(sb.from(t).delete().eq('id', id), 'أُزيل')) App.refresh(); };
Act.asCsv = async ({ sid }) => {
  const rs = await must(sb.from('staff_responsibilities').select('*').eq('cycle_id', S.cid).eq('staff_id', sid));
  csv('مسؤوليات-' + staffName(sid), [{ h: 'الرمز', x: r => r.code }, { h: 'نص المؤشر', x: r => r.official_text }, { h: 'الدور', x: r => L.kind[r.kind] }], rs.sort((a, b) => codeCmp(a.code, b.code)));
};
Act.asLink = async ({ iid, sid }) => {
  const { data, error } = await sb.rpc('create_access_link', { p_cycle: S.cid, p_indicator: iid, p_staff: sid, p_days: 30 });
  if (error) return toast(App.errMsg(error), true);
  const url = new URL('access.html#' + data, location.href.replace(/admin\.html.*$/, '')).href;
  App.modal('رابط وصول المسؤول', h`<p>رابط للاطلاع على تفاصيل المؤشر دون حساب (قراءة فقط، صالح 30 يوماً):</p><input readonly value="${url}" dir="ltr" style="width:100%;padding:8px" onclick="this.select()"><p class="muted">لا يُحفظ الرابط في النظام؛ انسخه الآن. إنشاء رابط جديد يُبقي القديم صالحاً حتى انتهائه.</p>`);
};

// ===== الأنظمة المرتبطة بالنواة =====
// الصلاحيات تُمنح من النواة وحدها، ولا تُمنح إلا لأنظمة مفعّلة. هنا عرض للقراءة.
const SYS_ST = { connected: ['مفعّل', 'ok'], planned: ['مخطط (غير مفعّل)', 'mute'], suspended: ['موقوف', 'warn'] };
const LV = { view: 'اطلاع', add: 'إضافة', edit: 'تعديل', approve: 'اعتماد' };
const SCOPE = { 'school:read': 'بيانات المدرسة', 'staff:read': 'سجل المنسوبين', 'students:read': 'سجل المتعلمين', 'facilities:read': 'المرافق', 'identity:verify': 'التحقق من الهوية', 'changes:read': 'متابعة التغييرات' };
Pages.systems = async () => {
  const [sys, cp, mine] = await Promise.all([must(sb.raw.rpc('linked_systems')), must(sb.raw.from('coordinator_positions').select('*')), sb.raw.from('staff_permissions').select('permission_code').eq('staff_id', S.me.staff_id)]);
  const mp = new Set((mine.data || []).map(x => x.permission_code)), act = sys.filter(x => x.status === 'connected');
  return h`${pageHead('الأنظمة المرتبطة بالنواة')}
  ${App.tlSum([[sys.length, 'نظام مسجّل'], [act.length, 'نظام مفعّل', 'ok'], [sys.length - act.length, 'غير مفعّل', 'warn']])}
  <section class="tl-sec"><h2>${App.ico('users')} المنسقون المعتمدون</h2>${App.tlist(cp.map(c => App.tile({ tone: c.holder_name ? 'ok' : 'warn', ico: 'user', title: c.name_ar, meta: c.holder_name ? h`<span>${c.holder_name}</span>` : badge('لم يُعيَّن بعد', 'warn') })), '')}</section>
  <section class="tl-sec"><h2>${App.ico('layers')} الأنظمة</h2>${App.tlist(sys.map(x => { const [t, tone] = SYS_ST[x.status] || [x.status, 'mute'], me = x.levels.filter(l => mp.has(x.code + ':' + l));
    return App.tile({ tone, ico: 'layers', title: x.name_ar, meta: h`${badge(t, tone === 'mute' ? undefined : tone)}${x.code === 'self_evaluation' ? badge('هذا النظام', 'info') : ''}${x.status === 'connected' ? h`<span>مستويات الصلاحية: ${x.levels.map(l => LV[l] || l).join('، ')}</span>` : h`<span class="muted">لا تُمنح صلاحياته قبل التفعيل</span>`}${me.length ? h`<span>صلاحياتك: ${me.map(l => LV[l]).join('، ')}</span>` : ''}`,
      extra: h`<small class="muted">يقرأ من النواة: ${(x.scopes || []).map(c => SCOPE[c] || c).join(' · ')}</small>` }); }), 'لا أنظمة مسجّلة.')}</section>
  <p class="muted">يُعيَّن المنسقون من النواة (دور «منسق» مع نطاقه). منسق واحد نشط لكل نطاق. تُسجَّل الأنظمة وتُفعَّل وتُمنح صلاحياتها من النواة الرقمية فقط (مدير النواة). قائمة الصلاحيات القابلة للمنح تشمل الأنظمة المفعّلة وحدها، ويرفض النظام منح صلاحية نظام غير مفعّل. كل نظام يقرأ من النواة ما تتيحه نطاقاته أعلاه ولا يكتب في سجلاتها.</p>`;
};
})();
