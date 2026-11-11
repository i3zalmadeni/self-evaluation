// اختيار أعضاء الفريق من منسوبي النواة. للمنسق فقط.
// الأسرار: CORE_URL, CORE_SYSTEM_KEY. الإجراءات: list | assign | unassign
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const one = (x: any) => (Array.isArray(x) ? x[0] : x);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const CORE_URL = Deno.env.get('CORE_URL')!, SYS = Deno.env.get('CORE_SYSTEM_KEY')!;
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'غير مصرح' }, 401);
    const { data: me } = await admin.from('profiles').select('role,is_active').eq('id', u.user.id).maybeSingle();
    if (!me || !me.is_active || me.role !== 'coordinator') return json({ error: 'للمنسق فقط' }, 403);
    const core = (path: string) => fetch(`${CORE_URL}/functions/v1/core-api${path}`, { headers: { 'x-system-key': SYS } });
    const b = await req.json().catch(() => ({}));

    if (b.action === 'list') {
      const r = await core('/v1/staff?limit=500'); if (!r.ok) return json({ error: 'تعذّر قراءة منسوبي النواة' }, 502);
      const staff = (await r.json()).data ?? [];
      const { data: mine } = await admin.from('staff').select('core_staff_id,profiles(role,is_active)').not('core_staff_id', 'is', null);
      const assigned = new Set((mine ?? []).filter((s: any) => one(s.profiles)?.role === 'team_member' && one(s.profiles)?.is_active).map((s: any) => s.core_staff_id));
      return json({ data: staff.map((s: any) => ({ id: s.id, full_name: s.full_name, category: s.category, job_title: s.job_title, assigned: assigned.has(s.id) })) });
    }
    const id = String(b.core_staff_id ?? ''); if (!UUID.test(id)) return json({ error: 'منسوب غير صالح' }, 400);
    const { data: st } = await admin.from('staff').select('id,profiles(id,role)').eq('core_staff_id', id).maybeSingle();
    const prof = one(st?.profiles);

    if (b.action === 'assign') {
      const r = await core(`/v1/staff/${id}`); if (!r.ok) return json({ error: 'المنسوب غير موجود في النواة' }, 404);
      const s = (await r.json()).data; if (s?.is_active === false) return json({ error: 'المنسوب غير على رأس العمل' }, 400);
      let sid = st?.id;
      if (!sid) { const i = await admin.from('staff').insert({ full_name: s.full_name, job_title: s.job_title ?? null, core_staff_id: id }).select('id').single(); if (i.error) return json({ error: i.error.message }, 400); sid = i.data.id; }
      if (prof) { if (prof.role !== 'coordinator') await admin.from('profiles').update({ role: 'team_member', is_active: true }).eq('id', prof.id); return json({ ok: true }); }
      const c = await admin.auth.admin.createUser({ email: `core-staff-${id}@core.labeed.local`, password: crypto.randomUUID() + crypto.randomUUID(), email_confirm: true });
      if (c.error || !c.data.user) return json({ error: 'تعذّر إنشاء الحساب المحلي' }, 500);
      const p = await admin.from('profiles').insert({ id: c.data.user.id, role: 'team_member', staff_id: sid, display_name: s.full_name, source: 'core', is_active: true });
      if (p.error) { await admin.auth.admin.deleteUser(c.data.user.id); return json({ error: p.error.message }, 400); }
      return json({ ok: true });
    }
    if (b.action === 'unassign') {
      if (!prof || prof.role !== 'team_member') return json({ error: 'ليس عضو فريق' }, 400);
      await admin.from('profiles').update({ is_active: false }).eq('id', prof.id); return json({ ok: true });
    }
    return json({ error: 'إجراء غير معروف' }, 400);
  } catch (e) { return json({ error: String(e) }, 500); }
});
