# الربط بالنواة

## ما هو مسجَّل في النواة لهذا النظام
- النظام `self_evaluation` في جدول `systems` (الحالة الحالية `planned`، النطاقات: school:read, staff:read, identity:verify, changes:read).
- صلاحيات `self_evaluation:view | add | edit | approve` في `permissions`.
- الدور التنظيمي `coordinator` بنطاق `self_evaluation` في `staff_roles`.

## من يستطيع ماذا
| المستخدم | مصدر الصلاحية | الأثر |
|---|---|---|
| مدير النواة | `is_core_admin()` | الكل، ويعيّن المنسق |
| المنسق / قائد المدرسة | دور `coordinator` لـ`self_evaluation` أو `self_evaluation:approve` | إدارة الدورات والفريق والاعتماد |
| عضو الفريق | جدول `se_team_members` (يُختار من منسوبي النواة) | تقييم مؤشراته المسندة فقط |
| اطلاع | `self_evaluation:view` | قراءة |
| مقيّم خارجي | `se_external_evaluators` | قراءة المعتمد في دورة منشورة (قرار مفتوح: انظر roadmap) |

## قراءة النواة
القراءة المباشرة من جداول النواة محكومة بـRLS النواة نفسها. للتكامل خارج القاعدة تبقى `core-api` (للقراءة فقط، ترويسة `x-system-key`) موثقة في مستودع النواة `docs/api.md`.

## ما لا يفعله النظام
لا يكتب في جداول النواة، ولا ينشئ حسابات، ولا يخزّن نسخاً من بيانات المنسوبين؛ يربط بمعرّف المنسوب الثابت `staff_members.id`.
