/* طبقة التوافق: تترجم أسماء الجداول والأعمدة والدوال التي تستخدمها واجهة التقويم إلى مخطط النواة (se_*).
   هي المكان الوحيد الذي يعرف الأسماء القديمة؛ بقية الواجهة تستدعي sb.from('cycles') كما كانت.
   - جداول النظام بالبادئة se_ في قاعدة النواة نفسها.
   - المنسوبون من جدول النواة staff_members (قراءة فقط من هنا).
   - سجل النشاط من سجل التدقيق المشترك audit_logs (جداول se_ فقط، وللمنسق).
   عند إضافة عمود أو جدول يُحدَّث هذا الملف ثم docs/schema.md. */
(() => {
const TABLES = {
  announcement_reads: 'se_announcement_reads', announcement_recipients: 'se_announcement_recipients', announcements: 'se_announcements',
  cycles: 'se_cycles', deadlines: 'se_deadlines', domain_assignments: 'se_domain_assignments', domains: 'se_domains',
  evaluation_levels: 'se_levels', evaluations: 'se_evaluations', evidence: 'se_evidence', evidence_files: 'se_evidence_files', evidence_indicators: 'se_evidence_indicators',
  guide_versions: 'se_guide_versions', improvement_action_indicators: 'se_improvement_action_indicators', improvement_actions: 'se_improvement_actions',
  indicator_access_links: 'se_indicator_access_links', indicator_assignments: 'se_indicator_assignments', indicator_guidance: 'se_indicator_guidance',
  indicator_guidance_evidence: 'se_indicator_guidance_evidence', indicators: 'se_indicators', meeting_agenda_items: 'se_meeting_agenda_items',
  meeting_decisions: 'se_meeting_decisions', meeting_invitees: 'se_meeting_invitees', meeting_minutes: 'se_meeting_minutes', meetings: 'se_meetings',
  standards: 'se_standards', suggested_evidence: 'se_suggested_evidence', tasks: 'se_tasks', team_files: 'se_team_files', technical_visits: 'se_technical_visits',
  visit_cards: 'se_visit_cards', visit_team: 'se_visit_team', whatsapp_messages: 'se_whatsapp_messages', whatsapp_optin: 'se_whatsapp_optin',
  whatsapp_settings: 'se_whatsapp_settings', whatsapp_templates: 'se_whatsapp_templates', team_members: 'se_team_members',
  cycle_indicator_overview: 'se_cycle_indicator_overview', cycle_domain_progress: 'se_cycle_domain_progress', cycle_indicators: 'se_cycle_indicators',
  public_results: 'se_public_results', staff_responsibilities: 'se_staff_responsibilities', team_calendar: 'se_team_calendar', team_task_stats: 'se_team_task_stats',
  public_evidence_stubs: 'se_public_evidence_stubs', staff: 'staff_members', activity_log: 'audit_logs', profiles: 'staff_members',
};
const RPCS = { create_access_link: 'se_create_access_link', rsvp_by_token: 'se_rsvp_by_token', get_invite: 'se_get_invite', get_access_link_data: 'se_get_access_link_data', create_invite_tokens: 'se_create_invite_tokens', public_owners: 'se_public_owners' };

// أعمدة قديمة ← جديدة (بحسب الجدول الجديد). عكس: القيمة المنطقية معكوسة.
const COLS = {
  se_cycles: { start_date: 'starts_on', end_date: 'ends_on', results_published: 'published', guide_version_id: 'guide_id' },
  se_domains: { guide_version_id: 'guide_id' },
  se_levels: { guide_version_id: 'guide_id', min_pct: 'min_percent', max_pct: 'max_percent' },
  se_domain_assignments: { kind: 'role_kind' },
  se_indicator_assignments: { kind: 'role_kind' },
  se_staff_responsibilities: { kind: 'role_kind' },
  se_announcement_reads: { profile_id: 'staff_id' },
  se_evidence: { uploaded_by: 'submitted_by' },
  se_indicators: { is_government_applicable: ['private_schools_only', true] },
  staff_members: { avatar_path: 'public_photo_path', display_name: 'full_name' },
  audit_logs: { entity_type: 'table_name', entity_id: 'record_id' },
};
// أعمدة لم تعد موجودة: تُحذف من الكتابة بصمت
const DROP = { se_evidence_files: ['sha256'] };

const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const colOf = (tbl, c) => { const m = COLS[tbl]?.[c]; return m ? (Array.isArray(m) ? m[0] : m) : c; };
const inv = (tbl, c) => Array.isArray(COLS[tbl]?.[c]) && COLS[tbl][c][1] === true;

// يعيد كتابة نص select: أسماء الأعمدة، والجداول المضمّنة (evidence_files(id) ← evidence_files:se_evidence_files(id))
function rewriteSelect(tbl, s) {
  if (typeof s !== 'string' || s === '*') return s;
  let out = s;
  for (const [o, n] of Object.entries(TABLES)) out = out.replace(new RegExp(`(^|[,\\s])${esc(o)}(!inner)?\\(`, 'g'), (m, p, inner) => `${p}${o}:${n}${inner || ''}(`);
  for (const [o, m] of Object.entries(COLS[tbl] || {})) {
    const n = Array.isArray(m) ? m[0] : m;
    // الاسم القديم يُجلب بعمود جديد (يُضاف الاسم القديم لاحقاً عند القراءة)
    out = out.replace(new RegExp(`(^|[,(\\s])${esc(o)}(?=$|[,)\\s])`, 'g'), (mm, p) => `${p}${n}`);
  }
  return out;
}
// يضيف الأسماء القديمة كأعمدة مرادفة للصفوف المقروءة
function alias(tbl, data) {
  const map = COLS[tbl]; if (!map || !data) return data;
  const fix = r => { if (r && typeof r === 'object') for (const [o, m] of Object.entries(map)) { const n = Array.isArray(m) ? m[0] : m; if (r[n] !== undefined && r[o] === undefined) r[o] = Array.isArray(m) && m[1] === true ? !r[n] : r[n]; } return r; };
  if (Array.isArray(data)) data.forEach(fix); else fix(data);
  if (tbl === 'audit_logs') (Array.isArray(data) ? data : [data]).forEach(r => { if (r) { r.entity_type = r.table_name?.replace(/^se_/, ''); if (/^(INSERT|UPDATE|DELETE)$/.test(r.action)) r.action = r.action.toLowerCase(); } });
  return data;
}
// يترجم حمولة كتابة (insert/update)
function mapPayload(tbl, p) {
  const one = r => { if (!r || typeof r !== 'object') return r; const o = {}; for (const [k, v] of Object.entries(r)) { if ((DROP[tbl] || []).includes(k)) continue; const m = COLS[tbl]?.[k]; o[m ? (Array.isArray(m) ? m[0] : m) : k] = (m && Array.isArray(m) && m[1] === true) ? !v : v; } return o; };
  return Array.isArray(p) ? p.map(one) : one(p);
}
const FILTERS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'not', 'filter']);

function wrap(b, tbl) {
  return new Proxy(b, {
    get(t, k) {
      if (k === 'then') return (res, rej) => t.then(r => { if (r && r.data) alias(tbl, r.data); return r; }).then(res, rej);
      const v = t[k]; if (typeof v !== 'function') return v;
      return (...a) => {
        if (k === 'select') a[0] = rewriteSelect(tbl, a[0]);
        else if (k === 'insert' || k === 'update' || k === 'upsert') a[0] = mapPayload(tbl, a[0]);
        else if (FILTERS.has(k) && typeof a[0] === 'string') {
          const c0 = a[0]; a[0] = colOf(tbl, c0);
          if (inv(tbl, c0) && (k === 'eq' || k === 'neq')) a[1] = !a[1];
          if (tbl === 'audit_logs' && k === 'eq' && c0 === 'entity_type') a[1] = 'se_' + a[1];
        }
        const out = v.apply(t, a);
        return out && typeof out.then === 'function' && out !== t ? wrap(out, tbl) : out === t ? wrap(t, tbl) : out;
      };
    },
  });
}

window.makeClient = (url, key) => {
  const raw = supabase.createClient(url, key);
  return {
    auth: raw.auth, storage: raw.storage, functions: raw.functions, channel: (...a) => raw.channel(...a), removeChannel: (...a) => raw.removeChannel(...a), raw,
    from(name) {
      const tbl = TABLES[name] || name;
      let q = raw.from(tbl);
      // سجل النشاط: جداول النظام فقط
      if (tbl === 'audit_logs') q = new Proxy(q, { get(t, k) { const v = t[k]; if (k === 'select') return (...a) => v.apply(t, [rewriteSelect(tbl, a[0]), ...a.slice(1)]).like('table_name', 'se\\_%'); return typeof v === 'function' ? v.bind(t) : v; } });
      return wrap(q, tbl);
    },
    // دور المستخدم الحالي في هذا النظام (من النواة): coordinator | principal | team_member | null
    async myRole() {
      const { data: { session } } = await raw.auth.getSession(); if (!session) return null;
      const { data: st } = await raw.from('staff_members').select('id,full_name').eq('user_id', session.user.id).maybeSingle(); if (!st) return null;
      const [a, c, t] = await Promise.all([raw.rpc('is_core_admin'), raw.rpc('se_is_coordinator'), raw.rpc('se_is_team_member')]);
      const role = c.data ? 'coordinator' : a.data ? 'principal' : t.data ? 'team_member' : null;
      return role ? { role, display_name: st.full_name } : null;
    },
    rpc(name, args, opts) { return raw.rpc(RPCS[name] || name, args, opts); },
  };
};
window.CompatMaps = { TABLES, RPCS, COLS };
})();
