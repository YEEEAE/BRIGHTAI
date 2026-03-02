-- ===================================
-- تنظيف وتفعيل عناصر المنصة عبر هجرة آمنة
-- ===================================
-- الهدف:
-- 1) إزالة بقايا دوال/مشغلات قد تسبب تعارضاً (خصوصاً ما يتعلق بإنشاء مدير داخل auth)
-- 2) التأكد من وجود حاويات التخزين الأساسية
-- 3) إضافة سياسات تخزين عملية (بدون فتح وصول عام غير مقصود)

-- -----------------------------------
-- 1) تنظيف الدوال القديمة (إن وجدت)
-- -----------------------------------
drop function if exists public.create_super_admin();
drop function if exists public.get_encryption_key();
drop function if exists public.encrypt_api_key(text);
drop function if exists public.decrypt_api_key(text);

-- إزالة أي مشغلات تشفير قديمة على api_keys (إن وجدت)
do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'api_keys_encrypt_before_write'
  ) then
    execute 'drop trigger api_keys_encrypt_before_write on public.api_keys';
  end if;
exception when undefined_table then
  -- تجاهل إذا لم يوجد الجدول في بيئات معينة
  null;
end;
$$;

-- بعد إزالة المشغل يمكن حذف دالة التشفير القديمة (إن وجدت)
drop function if exists public.encrypt_api_key_trigger();

-- -----------------------------------
-- 2) التأكد من وجود حاويات التخزين
-- -----------------------------------
-- ملاحظة: Supabase Storage يدير الجداول تحت schema "storage"
-- وهذه الأوامر تعمل عند تنفيذ الهجرات بصلاحيات قاعدة البيانات.
insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- -----------------------------------
-- 3) سياسات الوصول للتخزين (Storage RLS)
-- -----------------------------------
-- سياسات user-uploads: خاصة بالمستخدمين المسجلين فقط
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'user_uploads_select_own'
  ) then
    execute $pol$
      create policy "user_uploads_select_own"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'user-uploads' and owner = auth.uid())
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'user_uploads_insert_own'
  ) then
    execute $pol$
      create policy "user_uploads_insert_own"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'user-uploads' and owner = auth.uid())
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'user_uploads_update_own'
  ) then
    execute $pol$
      create policy "user_uploads_update_own"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'user-uploads' and owner = auth.uid())
      with check (bucket_id = 'user-uploads' and owner = auth.uid())
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'user_uploads_delete_own'
  ) then
    execute $pol$
      create policy "user_uploads_delete_own"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'user-uploads' and owner = auth.uid())
    $pol$;
  end if;

exception when undefined_table then
  -- إذا كان storage غير مفعل لأي سبب، لا نكسر الهجرة
  null;
end;
$$;

-- سياسات public-assets: القراءة متاحة للجميع (لأصول عامة مثل صور/شعارات)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public_assets_select'
  ) then
    execute $pol$
      create policy "public_assets_select"
      on storage.objects
      for select
      to public
      using (bucket_id = 'public-assets')
    $pol$;
  end if;
exception when undefined_table then
  null;
end;
$$;
