/* قائمة الترويسة في الصفحات الثابتة (تحليل النتائج): تُظهر «لوحة التحكم» و«خروج» لمن سجّل دخوله، و«تسجيل الدخول» لغيره.
   تستخدم الجلسة نفسها المخزّنة للموقع، ولا تغيّر أي بيانات. */
(async () => {
  const login = document.getElementById('loginLink'), adm = document.getElementById('adminLink');
  if (!login || !window.supabase || !window.makeClient || !window.APP_CONFIG) return;
  try {
    const sb = makeClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);
    const { data } = await sb.auth.getSession(); const s = data.session; if (!s) return;
    const p = await sb.myRole();
    if (adm) { adm.setAttribute('href', 'admin.html'); const t = adm.querySelector('span'); if (t) t.textContent = 'لوحة التحكم'; }   // اللوحة تتولى عرض رسالة لمن ليس في الفريق
    login.hidden = false; login.setAttribute('href', '#');
    login.addEventListener('click', async e => { e.preventDefault(); await sb.auth.signOut(); location.href = './'; });
  } catch (e) { /* تبقى القائمة بحالتها الافتراضية */ }
})();
