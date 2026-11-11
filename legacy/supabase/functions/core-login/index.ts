// دخول التقويم الذاتي بحساب النواة الرقمية. كلمة المرور تُتحقق منها النواة ولا تُخزَّن هنا.
// الأسرار (إعدادات الدالة): CORE_URL, CORE_ANON_KEY, CORE_SYSTEM_KEY, CORE_COORDINATOR_ROLE (اختياري، الافتراضي selfeval_coordinator)
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const DENY = 'بيانات الدخول غير صحيحة، أو لا تملك صلاحية على التقويم الذاتي';
const rnd = () => crypto.randomUUID() + crypto.randomUUID();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const CORE_URL = Deno.env.get('CORE_URL')!, CORE_ANON = Deno.env.get('CORE_ANON_KEY')!, SYS = Deno.env.get('CORE_SYSTEM_KEY')!;
    const COORD_ROLE = Deno.env.get('CORE_COORDINATOR_ROLE') ?? 'selfeval_coordinator';
    const b = await req.json().catch(() => ({}));
    const email = String(b.email ?? '').trim().toLowerCase(), password = String(b.password ?? '');
    if (!email.includes('@') || !password) return json({ error: DENY }, 401);

    // 1) التحقق من الحساب في النواة
    const core = createClient(CORE_URL, CORE_ANON, { auth: { persistSession: false } });
    const { data: cs, error: ce } = await core.auth.signInWithPassword({ email, password });
    if (ce || !cs.user) return json({ error: DENY }, 401);
    const { data: isAdmin } = await core.rpc('is_core_admin');

    // 2) هوية المنسوب وأدواره في النظام
    const vr = await fetch(`${CORE_URL}/functions/v1/core-api/v1/identity/verify?user_id=${cs.user.id}`, { headers: { 'x-system-key': SYS } });
    const v = vr.ok ? await vr.json() : null;
    const staffId: string | null = v?.staff?.id ?? null;
    const valid = v?.valid === true;
    const isCoord = (v?.roles ?? []).some((r: { role_code: string }) => r.role_code === COORD_ROLE);
    const level = (isAdmin === true || (valid && isCoord)) ? 'coordinator' : null;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    // 3) الملف المحلي: بمعرّف حساب النواة، وإلا بمعرّف المنسوب (عضو فريق عيّنه المنسق)
    const PCOLS = 'id,role,is_active,source,staff_id';
    let { data: p } = await admin.from('profiles').select(PCOLS).eq('core_user_id', cs.user.id).maybeSingle();
    let staffRow: { id: string } | null = null;
    if (staffId) {
      const r = await admin.from('staff').select('id').eq('core_staff_id', staffId).maybeSingle(); staffRow = r.data;
      if (!p && staffRow) {
        const r2 = await admin.from('profiles').select(PCOLS).eq('staff_id', staffRow.id).maybeSingle(); p = r2.data;
        if (p) await admin.from('profiles').update({ core_user_id: cs.user.id }).eq('id', p.id);
      }
    }

    if (!level) {
      // لا منسق ولا مدير: يُقبل عضو الفريق المعيَّن فقط وبحساب نشط في النواة
      if (p?.source === 'core' && p.role === 'coordinator') await admin.from('profiles').update({ is_active: false }).eq('id', p.id); // سُحب دور المنسق
      if (!p || !valid || !p.is_active || p.role !== 'team_member') return json({ error: DENY }, 403);
    } else {
      if (!staffRow && staffId) {
        const ins = await admin.from('staff').insert({ full_name: v.staff.full_name, job_title: v.staff.job_title ?? null, core_staff_id: staffId }).select('id').single(); staffRow = ins.data;
      }
      if (!p) {
        const c = await admin.auth.admin.createUser({ email: `core-${cs.user.id}@core.labeed.local`, password: rnd(), email_confirm: true });
        if (c.error || !c.data.user) return json({ error: 'تعذّر إنشاء الملف المحلي' }, 500);
        const ins = await admin.from('profiles').insert({ id: c.data.user.id, role: 'coordinator', staff_id: staffRow?.id ?? null, display_name: v?.staff?.full_name ?? email, core_user_id: cs.user.id, source: 'core', is_active: true }).select(PCOLS).single();
        if (ins.error) { await admin.auth.admin.deleteUser(c.data.user.id); return json({ error: ins.error.message }, 500); }
        p = ins.data;
      } else if (p.role !== 'coordinator' || !p.is_active) {
        await admin.from('profiles').update({ role: 'coordinator', is_active: true }).eq('id', p.id);
      }
    }

    // 4) جلسة محلية بكلمة مرور عشوائية تُجدَّد في كل دخول (لا تُعرف لأحد)
    const { data: lu } = await admin.auth.admin.getUserById(p!.id);
    const pw = rnd();
    const up = await admin.auth.admin.updateUserById(p!.id, { password: pw });
    if (up.error || !lu?.user?.email) return json({ error: 'تعذّر إنشاء الجلسة' }, 500);
    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
    const { data: ls, error: le } = await local.auth.signInWithPassword({ email: lu.user.email, password: pw });
    if (le || !ls.session) return json({ error: 'تعذّر إنشاء الجلسة' }, 500);
    return json({ access_token: ls.session.access_token, refresh_token: ls.session.refresh_token, role: level ?? 'team_member' });
  } catch (e) { return json({ error: String(e) }, 500); }
});
