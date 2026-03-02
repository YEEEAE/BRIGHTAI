-- جدول سجلات التدقيق الأمني
create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

comment on table public.security_audit_logs is 'سجل تدقيق للأحداث الحساسة في النظام';
comment on column public.security_audit_logs.user_id is 'المستخدم المرتبط بالحدث إن وجد';
comment on column public.security_audit_logs.action is 'نوع العملية: INSERT/UPDATE/DELETE';
comment on column public.security_audit_logs.table_name is 'اسم الجدول المتأثر';
comment on column public.security_audit_logs.record_id is 'المعرف الأساسي للسجل';
comment on column public.security_audit_logs.payload is 'بيانات قبل وبعد التغيير';
comment on column public.security_audit_logs.created_at is 'تاريخ تسجيل الحدث';

-- سياسات الحماية لسجلات التدقيق
alter table public.security_audit_logs enable row level security;

create policy security_audit_read_own on public.security_audit_logs
  for select using (auth.uid() = user_id);

create policy security_audit_block_write on public.security_audit_logs
  for all using (false) with check (false);

-- دالة عامة لتسجيل أحداث التدقيق
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  record_id uuid;
  payload jsonb;
  user_id_column text;
begin
  user_id_column := coalesce(TG_ARGV[0], 'user_id');

  if user_id_column = 'id' then
    actor_id := coalesce(new.id, old.id, auth.uid());
  else
    actor_id := coalesce(
      (to_jsonb(new)->>user_id_column)::uuid,
      (to_jsonb(old)->>user_id_column)::uuid,
      auth.uid()
    );
  end if;

  record_id := coalesce(new.id, old.id);
  payload := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));

  insert into public.security_audit_logs (user_id, action, table_name, record_id, payload)
  values (actor_id, TG_OP, TG_TABLE_NAME, record_id, payload);

  return null;
end;
$$;

-- تريغرات التدقيق على الجداول الحساسة
create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute procedure public.log_audit_event('id');

create trigger audit_api_keys
after insert or update or delete on public.api_keys
for each row execute procedure public.log_audit_event('user_id');

create trigger audit_agents
after insert or update or delete on public.agents
for each row execute procedure public.log_audit_event('user_id');

create trigger audit_executions
after insert or update or delete on public.executions
for each row execute procedure public.log_audit_event('user_id');

create trigger audit_templates
after insert or update or delete on public.templates
for each row execute procedure public.log_audit_event('author_id');

-- سياسات التخزين الآمن للملفات
alter table storage.objects enable row level security;

create policy storage_read_public_assets on storage.objects
  for select using (bucket_id = 'public-assets');

create policy storage_read_own on storage.objects
  for select using (
    auth.role() = 'authenticated'
    and bucket_id = 'user-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_write_own on storage.objects
  for insert with check (
    auth.role() = 'authenticated'
    and bucket_id = 'user-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_update_own on storage.objects
  for update using (
    auth.role() = 'authenticated'
    and bucket_id = 'user-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    auth.role() = 'authenticated'
    and bucket_id = 'user-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_delete_own on storage.objects
  for delete using (
    auth.role() = 'authenticated'
    and bucket_id = 'user-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create index if not exists security_audit_user_id_idx on public.security_audit_logs (user_id);
create index if not exists security_audit_created_at_idx on public.security_audit_logs (created_at);
