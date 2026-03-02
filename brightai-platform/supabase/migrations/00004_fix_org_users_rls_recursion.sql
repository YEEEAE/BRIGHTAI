-- ===================================
-- إصلاح تكرار لا نهائي في سياسات الأمان
-- جدول: organization_users
-- ===================================
-- المشكلة:
-- سياسة الجدول كانت تستعلم من نفس الجدول داخل USING/WITH CHECK
-- مما ينتج عنه: infinite recursion detected in policy for relation "organization_users"
--
-- الحل:
-- 1) إنشاء دالة بصلاحيات مالك القاعدة للتحقق من صلاحية الإدارة مع تعطيل row_security داخلها
-- 2) إعادة تعريف سياسات الجدول بحيث لا تستعلم من نفس الجدول مباشرة داخل السياسة

-- -----------------------------------
-- 1) دالة تحقق آمنة (تعمل كجسر بدون تكرار)
-- -----------------------------------
create or replace function public.is_org_admin(target_org_id uuid, target_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- تعطيل row_security داخل الدالة لتجنب استدعاء سياسات organization_users أثناء التحقق.
  perform set_config('row_security', 'off', true);

  return exists (
    select 1
    from public.organization_users ou
    where ou.organization_id = target_org_id
      and ou.user_id = target_user_id
      and ou.is_active = true
      and ou.role in ('super_admin', 'company_admin', 'team_manager')
  );
end;
$$;

revoke all on function public.is_org_admin(uuid, uuid) from public;
grant execute on function public.is_org_admin(uuid, uuid) to authenticated;

-- -----------------------------------
-- 2) إعادة ضبط سياسات organization_users
-- -----------------------------------
alter table public.organization_users enable row level security;

drop policy if exists org_users_select on public.organization_users;
drop policy if exists org_users_admin_manage on public.organization_users;
drop policy if exists org_users_manage on public.organization_users;
drop policy if exists organization_users_select on public.organization_users;
drop policy if exists organization_users_manage on public.organization_users;

create policy org_users_select_safe on public.organization_users
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_org_admin(organization_id)
);

create policy org_users_insert_safe on public.organization_users
for insert
to authenticated
with check (
  public.is_org_admin(organization_id)
);

create policy org_users_update_safe on public.organization_users
for update
to authenticated
using (
  public.is_org_admin(organization_id)
)
with check (
  public.is_org_admin(organization_id)
);

create policy org_users_delete_safe on public.organization_users
for delete
to authenticated
using (
  public.is_org_admin(organization_id)
);

