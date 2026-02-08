-- تفعيل الإضافات المطلوبة
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- دالة جلب مفتاح التشفير من إعدادات السيرفر
create or replace function public.get_encryption_key()
returns text
language plpgsql
as $$
declare
  encryption_key text;
begin
  encryption_key := current_setting('app.encryption_key', true);
  if encryption_key is null or length(encryption_key) = 0 then
    raise exception 'مفتاح التشفير غير معرف في إعدادات قاعدة البيانات';
  end if;
  return encryption_key;
end;
$$;

-- دالة لتحديث عمود التعديل تلقائياً
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- دالة إنشاء ملف شخصي تلقائي عند التسجيل
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, company, plan, created_at, updated_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'company', 'starter', now(), now());
  return new;
end;
$$;

-- دالة تشفير مفاتيح API قبل التخزين
create or replace function public.encrypt_api_key(plain_key text)
returns text
language plpgsql
as $$
declare
  encryption_key text;
  encrypted bytea;
begin
  if plain_key is null or length(plain_key) = 0 then
    return null;
  end if;
  encryption_key := public.get_encryption_key();
  encrypted := pgp_sym_encrypt(plain_key, encryption_key);
  return 'enc:' || encode(encrypted, 'base64');
end;
$$;

-- دالة فك التشفير لمفاتيح API عند الاستخدام
create or replace function public.decrypt_api_key(encrypted_key text)
returns text
language plpgsql
as $$
declare
  encryption_key text;
  payload text;
  decrypted bytea;
begin
  if encrypted_key is null or length(encrypted_key) = 0 then
    return null;
  end if;
  if position('enc:' in encrypted_key) <> 1 then
    raise exception 'صيغة المفتاح المشفر غير صالحة';
  end if;
  encryption_key := public.get_encryption_key();
  payload := substring(encrypted_key from 5);
  decrypted := pgp_sym_decrypt(decode(payload, 'base64'), encryption_key);
  return convert_from(decrypted, 'utf8');
end;
$$;

-- دالة لتحديث مؤشرات أداء الوكيل
create or replace function public.update_agent_metrics()
returns trigger
language plpgsql
as $$
declare
  target_agent_id uuid;
begin
  target_agent_id := coalesce(new.agent_id, old.agent_id);
  update public.agents
  set
    execution_count = (
      select count(*) from public.executions where agent_id = target_agent_id
    ),
    success_rate = (
      select round((sum(case when status = 'ناجح' then 1 else 0 end)::numeric / nullif(count(*), 0)) * 100, 2)
      from public.executions
      where agent_id = target_agent_id
    ),
    avg_response_time = (
      select round(avg(duration_ms)::numeric, 2)
      from public.executions
      where agent_id = target_agent_id
    )
  where id = target_agent_id;
  return null;
end;
$$;

-- جدول الملفات الشخصية المرتبط بمستخدمي المصادقة
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  company text,
  plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'ملفات تعريف المستخدمين المرتبطة بنظام المصادقة';
comment on column public.profiles.id is 'معرف المستخدم من auth.users';
comment on column public.profiles.full_name is 'الاسم الكامل للمستخدم';
comment on column public.profiles.avatar_url is 'رابط صورة الملف الشخصي';
comment on column public.profiles.company is 'اسم الشركة';
comment on column public.profiles.plan is 'الخطة الحالية';
comment on column public.profiles.created_at is 'تاريخ الإنشاء';
comment on column public.profiles.updated_at is 'تاريخ آخر تعديل';

-- جدول مفاتيح API المشفرة
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  key_encrypted text not null,
  name text,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_keys_encrypted_format check (key_encrypted like 'enc:%')
);

comment on table public.api_keys is 'مفاتيح تكامل خارجية مشفرة لكل مستخدم';
comment on column public.api_keys.id is 'معرف المفتاح';
comment on column public.api_keys.user_id is 'مالك المفتاح';
comment on column public.api_keys.provider is 'مزود الخدمة الخارجي';
comment on column public.api_keys.key_encrypted is 'المفتاح مشفر بصيغة قاعدة 64 مع بادئة enc:';
comment on column public.api_keys.name is 'اسم وصفي للمفتاح';
comment on column public.api_keys.is_active is 'حالة التفعيل';
comment on column public.api_keys.last_used_at is 'آخر استخدام للمفتاح';
comment on column public.api_keys.created_at is 'تاريخ الإنشاء';

-- جدول الوكلاء الذكيين
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text,
  workflow jsonb,
  settings jsonb,
  status text not null default 'قيد المراجعة',
  is_public boolean not null default false,
  execution_count integer not null default 0,
  success_rate numeric(5,2),
  avg_response_time numeric(10,2),
  tags text[],
  version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_status_check check (status in ('نشط', 'متوقف', 'قيد المراجعة'))
);

comment on table public.agents is 'وكلاء الأتمتة والتحليلات المرتبطون بالمستخدمين';
comment on column public.agents.id is 'معرف الوكيل';
comment on column public.agents.user_id is 'مالك الوكيل';
comment on column public.agents.name is 'اسم الوكيل';
comment on column public.agents.description is 'وصف الوكيل';
comment on column public.agents.category is 'تصنيف الوكيل';
comment on column public.agents.workflow is 'مخطط سير العمل بصيغة JSONB';
comment on column public.agents.settings is 'إعدادات الوكيل بصيغة JSONB';
comment on column public.agents.status is 'حالة تشغيل الوكيل';
comment on column public.agents.is_public is 'إتاحة الوكيل للاستخدام العام';
comment on column public.agents.execution_count is 'عدد مرات التنفيذ';
comment on column public.agents.success_rate is 'نسبة النجاح المئوية';
comment on column public.agents.avg_response_time is 'متوسط زمن الاستجابة بالميلي ثانية';
comment on column public.agents.tags is 'وسوم الوكيل';
comment on column public.agents.version is 'نسخة الوكيل';
comment on column public.agents.created_at is 'تاريخ الإنشاء';
comment on column public.agents.updated_at is 'تاريخ آخر تعديل';

-- جدول سجل التنفيذات
create table public.executions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb,
  output jsonb,
  status text not null default 'قيد التنفيذ',
  error_message text,
  duration_ms integer,
  tokens_used integer,
  cost_usd numeric(12,4),
  started_at timestamptz default now(),
  completed_at timestamptz,
  constraint executions_status_check check (status in ('ناجح', 'فشل', 'قيد التنفيذ'))
);

comment on table public.executions is 'سجل تشغيل الوكلاء ومؤشرات الأداء';
comment on column public.executions.id is 'معرف التنفيذ';
comment on column public.executions.agent_id is 'الوكيل المنفذ';
comment on column public.executions.user_id is 'مالك التنفيذ';
comment on column public.executions.input is 'مدخلات التنفيذ';
comment on column public.executions.output is 'مخرجات التنفيذ';
comment on column public.executions.status is 'حالة التنفيذ';
comment on column public.executions.error_message is 'رسالة الخطأ إن وجدت';
comment on column public.executions.duration_ms is 'مدة التنفيذ بالميلي ثانية';
comment on column public.executions.tokens_used is 'عدد الرموز المستخدمة';
comment on column public.executions.cost_usd is 'تكلفة التنفيذ بالدولار';
comment on column public.executions.started_at is 'بداية التنفيذ';
comment on column public.executions.completed_at is 'اكتمال التنفيذ';

-- جدول القوالب الجاهزة
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  workflow jsonb,
  settings jsonb,
  preview_image_url text,
  author_id uuid references auth.users(id) on delete set null,
  downloads integer not null default 0,
  rating numeric(3,2),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.templates is 'قوالب جاهزة قابلة للاستخدام والتحميل';
comment on column public.templates.id is 'معرف القالب';
comment on column public.templates.name is 'اسم القالب';
comment on column public.templates.description is 'وصف القالب';
comment on column public.templates.category is 'تصنيف القالب';
comment on column public.templates.workflow is 'مخطط القالب بصيغة JSONB';
comment on column public.templates.settings is 'إعدادات القالب بصيغة JSONB';
comment on column public.templates.preview_image_url is 'رابط معاينة القالب';
comment on column public.templates.author_id is 'صاحب القالب';
comment on column public.templates.downloads is 'عدد مرات التحميل';
comment on column public.templates.rating is 'التقييم العام';
comment on column public.templates.is_featured is 'إتاحة القالب للعامة عبر إبراز القالب';
comment on column public.templates.created_at is 'تاريخ الإنشاء';

-- تفعيل حماية الصفوف
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.agents enable row level security;
alter table public.executions enable row level security;
alter table public.templates enable row level security;

-- سياسات الملفات الشخصية
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- سياسات مفاتيح API
create policy api_keys_select_own on public.api_keys
  for select using (auth.uid() = user_id);
create policy api_keys_insert_own on public.api_keys
  for insert with check (auth.uid() = user_id);
create policy api_keys_update_own on public.api_keys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy api_keys_delete_own on public.api_keys
  for delete using (auth.uid() = user_id);

-- سياسات الوكلاء
create policy agents_select_own on public.agents
  for select using (auth.uid() = user_id);
create policy agents_insert_own on public.agents
  for insert with check (auth.uid() = user_id);
create policy agents_update_own on public.agents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy agents_delete_own on public.agents
  for delete using (auth.uid() = user_id);

-- سياسات التنفيذات
create policy executions_select_own on public.executions
  for select using (auth.uid() = user_id);
create policy executions_insert_own on public.executions
  for insert with check (auth.uid() = user_id);
create policy executions_update_own on public.executions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy executions_delete_own on public.executions
  for delete using (auth.uid() = user_id);

-- سياسات القوالب العامة للمستخدمين المسجلين
create policy templates_select_public on public.templates
  for select using (auth.role() = 'authenticated' and (is_featured = true or author_id = auth.uid()));
create policy templates_insert_own on public.templates
  for insert with check (auth.uid() = author_id);
create policy templates_update_own on public.templates
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy templates_delete_own on public.templates
  for delete using (auth.uid() = author_id);

-- فهارس لتحسين الاستعلامات
create index agents_user_id_idx on public.agents (user_id);
create index agents_status_idx on public.agents (status);
create index agents_category_idx on public.agents (category);
create index agents_created_at_idx on public.agents (created_at);
create index agents_updated_at_idx on public.agents (updated_at);

create index executions_user_id_idx on public.executions (user_id);
create index executions_agent_id_idx on public.executions (agent_id);
create index executions_status_idx on public.executions (status);
create index executions_created_at_idx on public.executions (started_at);

create index templates_author_id_idx on public.templates (author_id);
create index templates_category_idx on public.templates (category);
create index templates_created_at_idx on public.templates (created_at);
create index templates_featured_idx on public.templates (is_featured);

create index api_keys_user_id_idx on public.api_keys (user_id);
create index api_keys_created_at_idx on public.api_keys (created_at);

create index profiles_created_at_idx on public.profiles (created_at);
create index profiles_updated_at_idx on public.profiles (updated_at);

-- تريغر إنشاء الملف الشخصي عند التسجيل
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- تريغر تحديث وقت التعديل للملفات الشخصية والوكلاء
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

create trigger update_agents_updated_at
before update on public.agents
for each row execute procedure public.update_updated_at_column();

-- تريغر تشفير مفاتيح API قبل الحفظ
create or replace function public.encrypt_api_key_trigger()
returns trigger
language plpgsql
as $$
begin
  if new.key_encrypted is not null and position('enc:' in new.key_encrypted) <> 1 then
    new.key_encrypted := public.encrypt_api_key(new.key_encrypted);
  end if;
  return new;
end;
$$;

create trigger api_keys_encrypt_before_write
before insert or update on public.api_keys
for each row execute procedure public.encrypt_api_key_trigger();

-- تريغر تحديث مؤشرات الوكيل عند تغيّر التنفيذات
create trigger executions_after_insert
after insert on public.executions
for each row execute procedure public.update_agent_metrics();

create trigger executions_after_update
after update on public.executions
for each row execute procedure public.update_agent_metrics();

create trigger executions_after_delete
after delete on public.executions
for each row execute procedure public.update_agent_metrics();

-- بيانات تجريبية اختيارية للقوالب العامة
insert into public.templates (name, description, category, workflow, settings, downloads, rating, is_featured)
values
  ('قالب تقارير الإدارة التنفيذية', 'تجميع المؤشرات اليومية وإرسال تقرير تنفيذي مختصر', 'تحليلات تنفيذية', '{}'::jsonb, '{}'::jsonb, 120, 4.7, true),
  ('قالب مراقبة الامتثال التشغيلي', 'تنبيه فوري عند تجاوزات السياسات التشغيلية', 'الامتثال والحوكمة', '{}'::jsonb, '{}'::jsonb, 85, 4.5, true);
