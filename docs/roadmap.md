# خارطة الطريق

الواجهة القديمة بالكامل في `legacy/docs/` لتُنقل وحدةً وحدة إلى جداول `se_` (الجداول موجودة في القاعدة أصلاً، فالعمل في الواجهة).

| المرحلة | الوحدة | القديم للنقل | الجداول |
|---|---|---|---|
| 1 ✅ | إدارة الدورات (إنشاء وتعديل وإغلاق ونشر) | admin-pages1.js | se_cycles |
| 2 | الفريق والإسناد (فريق من منسوبي النواة، مسؤوليات المجالات والمؤشرات) | admin-team.js | se_team_members، se_domain_assignments، se_indicator_assignments |
| 3 | التقييم واعتماده | admin-indwork.js، admin-indlist.js | se_evaluations، se_levels |
| 4 | الشواهد والملفات (رفع، مراجعة، ربط بعدة مؤشرات، عارض PDF) | indpage.js | se_evidence*، Storage |
| 5 | الاجتماعات والزيارات والمهام والإعلانات والمواعيد | admin-hubs.js، admin-desk.js | se_meetings*، se_technical_visits، se_tasks، se_announcements، se_deadlines |
| 6 | خطة التحسين والاسترشاد | admin-pages2.js | se_improvement_actions، se_indicator_guidance* |
| 7 | واتساب (طابور فقط) | admin-pages3.js | se_whatsapp_* |
| 8 | الموقع العام، التحليل والمقارنة، التصدير | analysis.html، comparison.html، about.html | se_public_results |

## قرارات
1. **ربط الدورة بالعام الدراسي**: منجز (`se_cycles.year_id` مرجع لـ`academic_years`، ترحيل se_0006).
2. **حالة النظام في النواة**: منجز، صارت `connected` (القيم المسموحة: planned، connected، suspended).
3. **المقيّم الخارجي** (مفتوح): حسابه محلي خارج المنسوبين، ويخالف قاعدة «الهوية من النواة». يحتاج تصميماً مع مستودع النواة (دور خارجي وحساب في النواة) قبل بناء مرحلة الشواهد والنتائج العامة.
4. **بيانات تجريبية**: الدورة الحالية «[تجريبي]» غير منشورة وتتبع عاماً مغلقاً؛ تُحذف قبل التشغيل الفعلي.
