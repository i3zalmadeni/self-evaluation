# مخطط جداول النظام (se_)

مولَّد من قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-11. **القاعدة هي المرجع**؛ أي تعديل يُطبَّق عليها بترحيل ثم يُحدَّث هذا الملف.

عدد الجداول: 38. كلها مفعَّل عليها RLS.

| الجدول | الأعمدة |
|---|---|
| `se_guide_versions` | id, code, title, edition, issued_year, is_current, created_at |
| `se_domains` | id, guide_id, code, name_ar, sort_order |
| `se_standards` | id, domain_id, code, name_ar, sort_order |
| `se_indicators` | id, standard_id, code, official_text, requirements_text, sort_order, private_schools_only |
| `se_levels` | id, guide_id, code, label_ar, sort_order, min_percent, max_percent |
| `se_cycles` | id, name, school_year, starts_on, ends_on, status, guide_id, coordinator_id, year_id, published, created_by, created_at, updated_at, include_private_only |
| `se_team_members` | id, staff_id, is_active, added_by, created_at, updated_at |
| `se_external_evaluators` | id, user_id, full_name, organization, is_active, expires_on, created_by, created_at, updated_at |
| `se_domain_assignments` | id, cycle_id, domain_id, staff_id, role_kind, created_at |
| `se_indicator_assignments` | id, cycle_id, indicator_id, staff_id, role_kind, created_at |
| `se_evaluations` | id, cycle_id, indicator_id, level_id, status, justification, gaps_notes, evaluated_by, approved_by, approved_at, created_at, updated_at, achievement_pct, strengths |
| `se_suggested_evidence` | id, indicator_id, kind, title, description, sort_order, created_by, created_at, updated_at |
| `se_evidence` | id, cycle_id, indicator_id, title, description, status, submitted_by, review_note, reviewed_by, reviewed_at, created_at, updated_at |
| `se_evidence_files` | id, evidence_id, storage_path, file_name, mime_type, size_bytes, uploaded_by, created_at |
| `se_meetings` | id, cycle_id, title, meeting_date, start_time, location, status, domain_id, standard_id, indicator_id, created_by, created_at |
| `se_meeting_agenda_items` | id, meeting_id, title, responsible_staff_id, minutes_allocated, sort_order |
| `se_meeting_invitees` | id, meeting_id, staff_id, invitee_kind, rsvp, rsvp_at, rsvp_reason, attended, attended_at, recorded_by, invite_token_hash |
| `se_meeting_minutes` | id, meeting_id, discussion, status, approved_by, approved_at, summary_sent_at |
| `se_meeting_decisions` | id, meeting_id, decision_text, is_recommendation, responsible_staff_id, due_date |
| `se_technical_visits` | id, cycle_id, visit_date, visit_time, target_party, target_staff_id, purpose, notes, status, created_by, created_at |
| `se_visit_team` | visit_id, staff_id |
| `se_visit_cards` | id, visit_id, indicator_id, existing_practices, verified_items, strengths, gaps, recommendations, required_actions, responsible_staff_id, due_date, followup |
| `se_tasks` | id, cycle_id, title, description, task_type, status, approval, proposed_by, approved_by, approved_at, assignee_staff_id, start_date, due_date, required_output, indicator_id, meeting_id, visit_id, visit_card_id, completion_note, completed_at, closed_approved_by, closed_approved_at, created_at, updated_at |
| `se_team_files` | id, owner_type, owner_id, storage_path, file_name, mime_type, size_bytes, uploaded_by, created_at |
| `se_announcements` | id, cycle_id, title, body, priority, audience, publish_at, expires_at, created_by, created_at |
| `se_announcement_recipients` | announcement_id, staff_id |
| `se_announcement_reads` | announcement_id, staff_id, read_at |
| `se_deadlines` | id, cycle_id, kind, domain_id, indicator_id, title, due_date, original_due_date, extension_reason, created_by, created_at |
| `se_evidence_indicators` | evidence_id, indicator_id |
| `se_improvement_actions` | id, cycle_id, gap_description, root_cause, goal, action, responsible_staff_id, start_date, end_date, success_measure, required_evidence, progress_pct, status, followup_result, source_visit_card_id, created_by, created_at |
| `se_improvement_action_indicators` | action_id, indicator_id |
| `se_indicator_guidance` | indicator_id, interpretation, significance, updated_at |
| `se_indicator_guidance_evidence` | id, indicator_id, sort_order, title, kind |
| `se_whatsapp_optin` | staff_id, opt_in, updated_at |
| `se_whatsapp_settings` | id, enabled, send_from, send_to, timezone, bulk_allowed, allowed_types, updated_at |
| `se_whatsapp_templates` | code, title_ar, body_ar, link_policy, provider_template_name, enabled |
| `se_whatsapp_messages` | id, template_code, staff_id, cycle_id, body, has_link, status, provider_message_id, error, scheduled_for, sent_at, created_by, created_at |
| `se_indicator_access_links` | id, cycle_id, indicator_id, staff_id, token_hash, expires_at, revoked_at, last_used_at, created_by, created_at |

## عروض (views)
`se_cycle_indicators`, `se_cycle_indicator_overview`, `se_cycle_domain_progress`, `se_staff_responsibilities`, `se_team_calendar`, `se_team_task_stats`, `se_public_results`.

## دوال الصلاحيات
`se_is_coordinator()` · `se_is_team_member()` · `se_is_evaluator(cycle, indicator)` · `se_is_external_evaluator()` · `se_can_see_indicator()` · `se_evidence_can_read/write()`. تعتمد على `is_core_admin()` و`core_can()` و`staff_roles` في النواة.
