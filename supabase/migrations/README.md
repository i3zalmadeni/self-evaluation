# ترحيلات قاعدة البيانات

قاعدة هذا النظام هي **قاعدة النواة الرقمية نفسها** (مشروع Supabase `labeedsch_PC`). جداوله بالبادئة `se_` ودوالّه بالبادئة `se_`.

## الترحيلات المطبَّقة (سجل Supabase)
`se_0001_core_cycles_reference_assignments` · `se_0002_seed_official_guide_1447` · `se_0003_exclude_private_only_indicators` · `se_0004_evidence_module` · `se_0005_evidence_read_policy_by_columns` · `se_team_management` · `se_team_revoke_trigger_funcs` · `se_improvement_and_shared_evidence` · `se_indicator_guidance_tables` · `se_guidance_public_read` · `se_whatsapp_tokens_public_views` · `se_whatsapp_settings_audit_fix` · `se_evaluation_pct_logic` · `se_0006_cycle_academic_year` (ملفه هنا)

## القاعدة
- الترحيلات الجديدة تُضاف هنا بصيغة `se_NNNN_وصف.sql` **بعد** تطبيقها على القاعدة، ويبقى مخطط الجداول في `docs/schema.md`.
- لا يعدّل أي ترحيل جداول النواة (staff_members، academic_years، roles…) ولا يحذف منها؛ التعديل عليها من مستودع النواة (i3zalmadeni/PS).
- الترحيلات القديمة (001–021) لمشروع Supabase السابق محفوظة في `legacy/supabase/` للرجوع فقط.

- se_0007 — evidence_date، دالة se_public_owners، سياسة قراءة سجل النشاط للمنسق.
- se_0008 — due_date لإسنادات المؤشرات، وعرض se_public_evidence_stubs (عدد الشواهد المعتمدة المنشورة فقط).
