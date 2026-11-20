/* تذكيرات واتساب (تبويب في «إدارة الفريق»، للمنسق): زر يفتح واتساب على جهاز المنسق برسالة جاهزة من القوالب،
   فيضغط «إرسال». مجاني ولا يحتاج مزوداً. يُسجَّل كل تذكير في سجل الرسائل بحالة «manual» ليظهر «آخر تذكير».
   الأرقام من الدالة se_staff_wa_phones (للمنسق ومدير النواة فقط). تُحمَّل بعد admin-team.js وقبل admin.js. */
(() => {
const { sb, h, S, nf, dt, dtt, staffName, must, table, panel, pageHead, badge, btn, isCoord } = App;
const MS = 864e5, today = () => new Date().toLocaleDateString('en-CA');
const days = s => Math.round((new Date(String(s).slice(0, 10) + 'T00:00:00') - new Date(today() + 'T00:00:00')) / MS);
// الرقم بصيغة دولية لرابط wa.me: 05xxxxxxxx ← 9665xxxxxxxx
const intl = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('05') && d.length === 10) d = '966' + d.slice(1); else if (d.startsWith('5') && d.length === 9) d = '966' + d; return d.length >= 11 ? d : ''; };
const fill = (s, v) => s.replace(/\{\{([^}]+)\}\}/g, (_, k) => v[k.trim()] ?? '');
const BASE = () => location.href.replace(/admin\.html.*$/, '').replace(/#.*$/, '');
const RSVP = { confirmed: ['أكّد الحضور', 'ok'], declined: ['اعتذر', 'bad'] };
let ROWS = [];

Act.remWa = ({ i }) => {
  const r = ROWS[+i]; if (!r?.phone) return;
  window.open('https://wa.me/' + r.phone + '?text=' + encodeURIComponent(r.body), '_blank', 'noopener');   // قبل أي انتظار حتى لا يحجبه المتصفح
  sb.from('whatsapp_messages').insert({ template_code: r.code, staff_id: r.sid, cycle_id: S.cid, body: r.body, has_link: /https?:\/\//.test(r.body), status: 'manual', sent_at: new Date().toISOString(), created_by: S.me.id })
    .then(({ error }) => { if (error) { console.warn('remind log', error.message); return; } const el = document.querySelector(`[data-last="${i}"]`); if (el) el.textContent = 'الآن'; });
};

Pages.remind = async () => {
  const nc = App.needCycle(); if (nc) return nc;
  if (!isCoord()) return h`<div class="pn"><p>تذكيرات واتساب للمنسق.</p></div>`;
  const [D, ref, ph, ts, lg] = await Promise.all([App.data(), App.ref(), sb.rpc('se_staff_wa_phones'), must(sb.from('whatsapp_templates').select('code,body_ar')),
    sb.from('whatsapp_messages').select('staff_id,body,created_at').eq('cycle_id', S.cid).eq('status', 'manual').order('created_at', { ascending: false }).limit(1000)]);
  const P = new Map((ph.data || []).map(x => [x.staff_id, intl(x.phone)])), T = Object.fromEntries(ts.map(t => [t.code, t.body_ar])), LOG = lg.data || [];
  const link = p => BASE() + 'admin.html#' + p;
  ROWS = [];
  const add = (sid, code, vars, what, when, tone) => { const body = fill(T[code] || '', { اسم: staffName(sid), ...vars }).trim();
    ROWS.push({ sid, code, body, what, when, tone, phone: P.get(sid) || '', last: LOG.find(m => m.staff_id === sid && m.body === body)?.created_at }); return ROWS.length - 1; };

  // 1) المهام: المتأخرة، وما يحل موعده خلال 3 أيام
  const A = [];
  D.tasks.filter(t => t.approval === 'approved' && t.assignee_staff_id && !['completed', 'cancelled'].includes(t.status) && (t.status === 'overdue' || (t.due_date && days(t.due_date) <= 3)))
    .sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || '')))
    .forEach(t => { const late = t.status === 'overdue' || (t.due_date && days(t.due_date) < 0), n = t.due_date ? days(t.due_date) : null;
      A.push(add(t.assignee_staff_id, late ? 'task_overdue' : 'task_reminder', { عنوان: t.title, موعد: t.due_date ? dt(t.due_date) : '—' }, t.title,
        n == null ? 'متأخرة' : n < 0 ? 'متأخرة ' + nf(-n) + ' يوم' : n === 0 ? 'اليوم' : n === 1 ? 'غداً' : 'بعد ' + nf(n) + ' أيام', late ? 'bad' : 'warn')); });

  // 2) الاجتماع القادم: كل المدعوين، ومن لم يؤكد أولاً
  const B = [], m = D.meetings.filter(x => x.status === 'scheduled' && days(x.meeting_date) >= 0).sort((a, b) => String(a.meeting_date).localeCompare(b.meeting_date))[0];
  if (m) D.inv.filter(x => x.meeting_id === m.id).sort((a, b) => (a.rsvp === 'confirmed') - (b.rsvp === 'confirmed'))
    .forEach(x => { const r = RSVP[x.rsvp] || ['لم يرد', 'warn']; B.push(add(x.staff_id, 'meeting_reminder', { عنوان: m.title, تاريخ: dt(m.meeting_date), وقت: App.pt(m.period_codes, m.start_time) || '—', مكان: m.location || '—' }, m.title, r[0], r[1])); });

  // 3) مؤشرات لم يبدأ تقييمها: رسالة واحدة لكل مقيّم بكل مؤشراته
  const C = [], stOf = id => D.om[id]?.eval_status || 'not_evaluated', byEv = new Map();
  D.resp.filter(r => r.kind === 'evaluator' && ref.im[r.indicator_id] && stOf(r.indicator_id) === 'not_evaluated').forEach(r => byEv.set(r.staff_id, [...(byEv.get(r.staff_id) || []), r.indicator_id]));
  byEv.forEach((ids, sid) => { const codes = ids.map(id => ref.im[id].code); C.push(add(sid, 'evaluation_reminder', { رمز_المؤشر: codes.join('، '), رابط: ids.length === 1 ? link('ind/' + ids[0]) : link('inds/list/mine') }, codes.join('، '), nf(ids.length) + ' مؤشر لم يبدأ', 'warn')); });

  // 4) شواهد تحتاج استكمالاً: لمسؤول المؤشر، رسالة واحدة بكل مؤشراته
  const E = [], byRs = new Map(), need = [...new Set(D.evid.filter(e => e.status === 'needs_completion').map(e => e.indicator_id))];
  need.forEach(iid => D.resp.filter(r => r.kind === 'responsible' && r.indicator_id === iid).forEach(r => byRs.set(r.staff_id, [...new Set([...(byRs.get(r.staff_id) || []), iid])])));
  byRs.forEach((ids, sid) => { const codes = ids.filter(id => ref.im[id]).map(id => ref.im[id].code); if (!codes.length) return;
    E.push(add(sid, 'evidence_request', { رمز_المؤشر: codes.join('، '), رابط: ids.length === 1 ? link('ind/' + ids[0]) : link('inds/evidence') }, codes.join('، '), nf(D.evid.filter(e => e.status === 'needs_completion' && ids.includes(e.indicator_id)).length) + ' شاهد يحتاج استكمالاً', 'warn')); });

  const cols = (subj) => [
    { h: 'المنسوب', f: i => App.pcell(ROWS[i].sid, 24) },
    { h: subj, f: i => ROWS[i].what },
    { h: 'الحالة', f: i => badge(ROWS[i].when, ROWS[i].tone) },
    { h: 'آخر تذكير', f: i => h`<small class="muted" data-last="${i}">${ROWS[i].last ? dtt(ROWS[i].last) : '—'}</small>` },
    { h: '', f: i => ROWS[i].phone ? btn('تذكير عبر واتساب', 'remWa', { i }, 'pri') : badge('لا جوال مسجّل', 'warn') },
  ];
  const noPh = ROWS.filter(r => !r.phone).length;
  return h`${pageHead('تذكيرات واتساب')}
  <div class="pn"><p>يفتح زر «تذكير عبر واتساب» واتساب على جهازك برسالة جاهزة إلى العضو، فتضغط «إرسال». مجاني ولا يحتاج ربط مزود. نصوص الرسائل من القوالب، وتُعدَّل من «إدارة البوابة ← واتساب».</p>
    ${noPh ? h`<p class="muted">تذكيرات لأعضاء بلا جوال مسجّل في النواة الرقمية: ${nf(noPh)}. يُضاف الجوال من سجل المنسوبين في النواة.</p>` : ''}</div>
  ${App.tlSum([[A.length, 'مهمة متأخرة أو قريبة', A.length ? 'bad' : 'ok'], [B.length, 'مدعو للاجتماع القادم', 'info'], [C.length, 'مقيّم لم يبدأ', C.length ? 'warn' : 'ok'], [E.length, 'مسؤول شواهد', E.length ? 'warn' : 'ok']])}
  ${panel(h`${App.ico('task')} المهام المتأخرة والقريبة (خلال 3 أيام)`, table(cols('المهمة'), A, 'لا مهام متأخرة أو قريبة.'))}
  ${panel(h`${App.ico('cal')} الاجتماع القادم${m ? h` <small class="muted">${m.title} · ${dt(m.meeting_date)}</small>` : ''}`, m ? table(cols('الاجتماع'), B, 'لا مدعوين لهذا الاجتماع بعد.') : h`<p class="muted empty">لا اجتماع مجدول قادم.</p>`)}
  ${panel(h`${App.ico('note')} مؤشرات لم يبدأ تقييمها`, table(cols('المؤشرات'), C, 'كل المؤشرات المسندة بدأ تقييمها.'))}
  ${panel(h`${App.ico('clip')} شواهد تحتاج استكمالاً`, table(cols('المؤشرات'), E, 'لا شواهد تحتاج استكمالاً.'))}`;
};
})();
