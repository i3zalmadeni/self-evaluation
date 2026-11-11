// مفتاح عام (publishable) آمن للنشر؛ الحماية الفعلية بسياسات RLS في قاعدة البيانات.
// المشروع هو قاعدة النواة الرقمية نفسها (labeedsch_PC): الحسابات والمنسوبون والأدوار منها مباشرة، وجداول النظام بالبادئة se_.
// لا تضع هنا مفتاح service_role أبدًا.
window.APP_CONFIG = {
  supabaseUrl: 'https://kbhovmnvqzgihhyibqkq.supabase.co',
  supabaseKey: 'sb_publishable_hfzNlh9tCpuC2zCf4T_2FA_42ujADOX'
};

// الدخول بمعرّف: يُترجم المعرّف داخلياً إلى بريد غير حقيقي بهذا النطاق (يطابق إعداد النواة).
window.LOGIN_DOMAIN = 'id.invalid';
