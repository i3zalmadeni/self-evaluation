-- إصلاح رفع الشواهد: إضافات فقط، لا حذف بيانات ولا تغيير في الصلاحيات.
-- مطبَّق على قاعدة النواة (labeedsch_PC) بتاريخ 2026-11-17.

-- 1) نوع الشاهد: العمود category كان في النظام السابق (legacy 004) وتستخدمه الواجهة، ولم يُنقل إلى se_evidence
--    فكان كل إدراج لشاهد جديد يُرفض (عمود غير موجود) قبل الوصول إلى رفع الملف.
alter table public.se_evidence add column if not exists category text;

-- 2) أنواع الملفات: إضافة الصور (JPEG/PNG/WebP) إلى الأنواع المسموحة، ورفع الحد إلى 10 ميغابايت للملف.
alter table public.se_evidence_files drop constraint if exists se_evidence_files_mime_type_check;
alter table public.se_evidence_files add constraint se_evidence_files_mime_type_check check (mime_type = any (array[
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg','image/png','image/webp']));
alter table public.se_evidence_files drop constraint if exists se_evidence_files_size_bytes_check;
alter table public.se_evidence_files add constraint se_evidence_files_size_bytes_check check (size_bytes > 0 and size_bytes <= 10485760);

update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array[
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg','image/png','image/webp'] where id = 'se-evidence';

-- شرط الصلاحية كما هو (se_evidence_can_write)، والتغيير في الامتدادات المقبولة فقط.
alter policy se_storage_insert on storage.objects with check (
  bucket_id = 'se-evidence'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$'
  and public.se_evidence_can_write(public.se_path_evidence(name)));

notify pgrst, 'reload schema';
