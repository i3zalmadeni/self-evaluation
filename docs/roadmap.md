# خارطة الطريق

الواجهة القديمة بالكامل في `legacy/docs/` لتُنقل وحدةً وحدة إلى جداول `se_` (الجداول موجودة في القاعدة أصلاً، فالعمل في الواجهة).

| المرحلة | الوحدة | القديم للنقل | الجداول |
|---|---|---|---|
| 1 | إدارة الدورات (إنشاء وتعديل وإغلاق ونشر) | admin-pages1.js | se_cycles |
| 2 | الفريق والإسناد (فريق من منسوبي النواة، مسؤوليات المجالات والمؤشرات) | admin-team.js | se_team_members، se_domain_assignments، se_indicator_assignments |
| 3 | التقييم واعتماده | admin-indwork.js، admin-indlist.js | se_evaluations، se_levels |
| 4 | الشواهد والملفات (رفع، مراجعة، ربط بعدة مؤشرات، عارض PDF) | indpage.js | se_evidence*، Storage |
| 5 | الاجتماعات والزيارات والمهام والإعلانات والمواعيد | admin-hubs.js، admin-desk.js | se_meetings*، se_technical_visits، se_tasks، se_announcements، se_deadlines |
| 6 | خطة التحسين والاسترشاد | admin-pages2.js | se_improvement_actions، se_indicator_guidance* |
| 7 | واتساب (طابور فقط) | admin-pages3.js | se_whatsapp_* |
| 8 | الموقع العام، التحليل والمقارنة، التصدير | analysis.html، comparison.html، about.html | se_public_results |

## قرارات مفتوحة
1. **ربط الدورة بالعام الدراسي**: قاعدة النواة تجعل العام الدراسي وحدة الدورة، بينما `se_cycles.school_year` نص حر. المقترح إضافة `year_id` مرجعاً لـ`academic_years` (ترحيل على القاعدة، يلزم موافقتك).
2. **حالة النظام في النواة**: `planned`؛ تُحوَّل إلى `active` عند اعتماد الواجهة.
3. **المقيّم الخارجي**: حساب محلي خارج المنسوبين، ويخالف قاعدة «الهوية من النواة». المقترح حساب بدور خارجي في النواة بدل جدول محلي.
4. **بيانات تجريبية**: الدورة الحالية «[تجريبي]» غير منشورة؛ تُحذف قبل التشغيل الفعلي.
