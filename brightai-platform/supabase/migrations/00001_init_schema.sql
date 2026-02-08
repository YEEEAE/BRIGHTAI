-- ===================================
-- 1. تفعيل الإضافات المطلوبة
-- ===================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ===================================
-- 2. الدوال الأساسية للتشفير والتحديث
-- ===================================
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

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    company,
    plan,
    role,
    language,
    timezone,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'company',
    'free',
    coalesce(new.raw_user_meta_data->>'role', 'agent_user'),
    coalesce(new.raw_user_meta_data->>'language', 'ar'),
    coalesce(new.raw_user_meta_data->>'timezone', 'Asia/Riyadh'),
    now(),
    now()
  );
  return new;
end;
$$;

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

-- ===================================
-- 3. جدول الشركات
-- ===================================
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  website text,
  primary_color text default '#3B82F6',
  secondary_color text default '#8B5CF6',
  custom_domain text,
  settings jsonb default '{
    "language": "ar",
    "timezone": "Asia/Riyadh",
    "currency": "SAR",
    "date_format": "DD/MM/YYYY"
  }'::jsonb,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise', 'custom')),
  max_users integer default 5,
  max_teams integer default 2,
  max_agents integer default 10,
  max_api_calls_per_month integer default 1000,
  max_storage_gb integer default 5,
  current_users integer default 0,
  current_teams integer default 0,
  current_agents integer default 0,
  current_api_calls integer default 0,
  current_storage_gb numeric(10, 2) default 0,
  is_active boolean default true,
  is_verified boolean default false,
  is_trial boolean default true,
  trial_ends_at timestamptz,
  contact_email text,
  contact_phone text,
  billing_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  subscription_starts_at timestamptz,
  subscription_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  payment_method text,
  billing_address jsonb default '{}'::jsonb,
  internal_notes text
);

create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_plan on public.organizations(plan);
create index idx_organizations_is_active on public.organizations(is_active);
create index idx_organizations_created_at on public.organizations(created_at desc);

-- ===================================
-- 4. جدول مستخدمي الشركات
-- ===================================
create table public.organization_users (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in (
    'super_admin',
    'company_admin',
    'team_manager',
    'agent_developer',
    'agent_user'
  )),
  is_active boolean default true,
  joined_at timestamptz default now(),
  invited_by uuid references auth.users(id),
  invitation_accepted_at timestamptz,
  last_active_at timestamptz,
  custom_permissions jsonb default '[]'::jsonb,
  unique (organization_id, user_id)
);

create index idx_org_users_org on public.organization_users(organization_id);
create index idx_org_users_user on public.organization_users(user_id);
create index idx_org_users_role on public.organization_users(role);

-- ===================================
-- 5. جدول الفرق
-- ===================================
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  color text default '#3B82F6',
  avatar_url text,
  settings jsonb default '{}'::jsonb,
  max_agents integer,
  max_api_calls_per_month integer,
  current_agents integer default 0,
  current_api_calls integer default 0,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_teams_org on public.teams(organization_id);
create index idx_teams_created_by on public.teams(created_by);

-- ===================================
-- 6. جدول أعضاء الفرق
-- ===================================
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('manager', 'developer', 'member')),
  is_active boolean default true,
  joined_at timestamptz default now(),
  added_by uuid references auth.users(id),
  unique (team_id, user_id)
);

create index idx_team_members_team on public.team_members(team_id);
create index idx_team_members_user on public.team_members(user_id);

-- ===================================
-- 7. جدول الدعوات
-- ===================================
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null,
  email text not null,
  role text not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  status text default 'pending' check (status in (
    'pending',
    'accepted',
    'declined',
    'expired',
    'cancelled'
  )),
  invited_by uuid references auth.users(id) not null,
  invited_by_name text,
  personal_message text,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  declined_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create index idx_invitations_email on public.invitations(email);
create index idx_invitations_token on public.invitations(token);
create index idx_invitations_status on public.invitations(status);
create index idx_invitations_org on public.invitations(organization_id);
create index idx_invitations_expires_at on public.invitations(expires_at);

-- ===================================
-- 8. جدول الملفات الشخصية
-- ===================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  company text,
  plan text,
  role text default 'agent_user',
  job_title text,
  phone text,
  timezone text default 'Asia/Riyadh',
  language text default 'ar',
  bio text,
  preferences jsonb default '{}'::jsonb,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===================================
-- إنشاء مدير عام افتراضي
-- ===================================
create or replace function public.create_super_admin()
returns table(admin_id uuid, admin_email text, admin_password text)
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
  v_admin_email text := 'admin@brightai.sa';
  v_admin_password text := 'BrightAI@2024#Admin!';
  v_encrypted_password text;
begin
  v_encrypted_password := crypt(v_admin_password, gen_salt('bf'));

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    v_admin_email,
    v_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'full_name', 'Super Admin',
      'role', 'super_admin',
      'avatar_url', null
    ),
    now(),
    now(),
    '',
    ''
  )
  on conflict (email) do update
  set encrypted_password = v_encrypted_password
  returning id into v_admin_id;

  insert into public.profiles (
    id,
    full_name,
    role,
    language,
    timezone,
    created_at,
    updated_at
  ) values (
    v_admin_id,
    'Super Admin',
    'super_admin',
    'ar',
    'Asia/Riyadh',
    now(),
    now()
  )
  on conflict (id) do update
  set role = 'super_admin';

  return query select v_admin_id, v_admin_email, v_admin_password;
end;
$$;

-- ===================================
-- 9. جدول الوكلاء
-- ===================================
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  created_by uuid references auth.users(id),
  name text not null,
  description text,
  category text,
  workflow jsonb,
  settings jsonb,
  status text not null default 'قيد المراجعة',
  is_public boolean not null default false,
  is_shared boolean default false,
  shared_with_teams uuid[] default array[]::uuid[],
  shared_with_users uuid[] default array[]::uuid[],
  sharing_permissions jsonb default '{
    "can_view": true,
    "can_edit": false,
    "can_execute": true,
    "can_delete": false
  }'::jsonb,
  is_template boolean default false,
  cloned_from uuid references public.agents(id) on delete set null,
  clone_count integer default 0,
  version_number integer default 1,
  parent_version uuid references public.agents(id) on delete set null,
  execution_count integer not null default 0,
  success_rate numeric(5,2),
  avg_response_time numeric(10,2),
  tags text[],
  version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_status_check check (status in ('نشط', 'متوقف', 'قيد المراجعة'))
);

-- ===================================
-- 10. جدول التنفيذات
-- ===================================
create table public.executions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  input jsonb,
  output jsonb,
  status text not null default 'قيد التنفيذ',
  error_message text,
  duration_ms integer,
  tokens_used integer,
  cost_usd numeric(12,4),
  execution_context jsonb default '{}'::jsonb,
  model_used text,
  temperature numeric(3,2),
  max_tokens integer,
  queue_time_ms integer,
  processing_time_ms integer,
  total_time_ms integer,
  started_at timestamptz default now(),
  completed_at timestamptz,
  constraint executions_status_check check (status in ('ناجح', 'فشل', 'قيد التنفيذ'))
);

-- ===================================
-- 11. جدول مفاتيح الواجهات
-- ===================================
create table public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in (
    'groq',
    'openai',
    'anthropic',
    'google',
    'huggingface',
    'custom'
  )),
  key_encrypted text not null,
  encryption_method text default 'aes-256-gcm',
  name text,
  description text,
  is_company_key boolean default false,
  is_default boolean default false,
  is_active boolean default true,
  is_valid boolean,
  last_validated_at timestamptz,
  last_used_at timestamptz,
  usage_count integer default 0,
  rate_limit_per_minute integer,
  rate_limit_per_day integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  constraint check_ownership check (
    (is_company_key = true and organization_id is not null and user_id is null) or
    (is_company_key = false and user_id is not null)
  )
);

-- ===================================
-- 12. جدول سجل الاستخدام
-- ===================================
create table public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  execution_id uuid references public.executions(id) on delete set null,
  event_type text not null check (event_type in (
    'agent_execution',
    'api_call',
    'file_upload',
    'file_download',
    'data_export',
    'webhook_trigger',
    'email_sent'
  )),
  resource_type text,
  resource_id uuid,
  action text,
  tokens_used integer default 0,
  tokens_input integer default 0,
  tokens_output integer default 0,
  cost_usd numeric(10, 6) default 0,
  duration_ms integer,
  api_key_id uuid references public.api_keys(id) on delete set null,
  provider text,
  model text,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  status text check (status in ('success', 'failed', 'partial')),
  error_message text,
  created_at timestamptz default now()
);

-- ===================================
-- 13. جدول سجل التدقيق
-- ===================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'INSERT', 'UPDATE', 'DELETE',
    'LOGIN', 'LOGOUT',
    'INVITE', 'ACCEPT_INVITE', 'DECLINE_INVITE',
    'ROLE_CHANGE', 'PERMISSION_CHANGE',
    'SETTINGS_UPDATE', 'API_KEY_ADD', 'API_KEY_DELETE'
  )),
  resource_type text not null,
  resource_id uuid,
  resource_name text,
  old_data jsonb,
  new_data jsonb,
  changes jsonb,
  ip_address inet,
  user_agent text,
  request_id text,
  context jsonb default '{}'::jsonb,
  status text default 'success' check (status in ('success', 'failed', 'reverted')),
  error_message text,
  created_at timestamptz default now()
);

-- ===================================
-- 14. جدول الإشعارات
-- ===================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in (
    'info', 'success', 'warning', 'error',
    'invitation', 'mention', 'assignment',
    'usage_limit', 'subscription', 'system'
  )),
  title text not null,
  message text not null,
  action_url text,
  action_label text,
  is_read boolean default false,
  read_at timestamptz,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- ===================================
-- 15. جدول القوالب
-- ===================================
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
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
  is_public boolean default false,
  is_official boolean default false,
  price_usd numeric(10, 2) default 0,
  license text default 'free',
  tags text[] default array[]::text[],
  requirements text,
  changelog jsonb default '[]'::jsonb,
  total_revenue numeric(10, 2) default 0,
  created_at timestamptz not null default now()
);

-- ===================================
-- 16. جدول المراجعات
-- ===================================
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references public.templates(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean default false,
  is_approved boolean default true,
  is_featured boolean default false,
  helpful_count integer default 0,
  not_helpful_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (template_id, user_id)
);

-- ===================================
-- 17. جدول الاشتراكات والفواتير
-- ===================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  plan text not null,
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  amount numeric(10, 2) not null,
  currency text default 'USD',
  status text check (status in ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  cancelled_at timestamptz,
  trial_ends_at timestamptz,
  payment_provider text default 'stripe',
  payment_provider_subscription_id text,
  payment_provider_customer_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_number text unique not null,
  amount numeric(10, 2) not null,
  tax_amount numeric(10, 2) default 0,
  total_amount numeric(10, 2) not null,
  currency text default 'USD',
  status text check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null,
  due_date date not null,
  paid_at timestamptz,
  pdf_url text,
  payment_method text,
  payment_provider_invoice_id text,
  line_items jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===================================
-- 18. جدول ذاكرة الوكلاء
-- ===================================
create table public.agent_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references public.agents(id) on delete cascade not null,
  content text not null,
  role text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ===================================
-- 19. الفهارس
-- ===================================
create index idx_agents_org on public.agents(organization_id);
create index idx_agents_team on public.agents(team_id);
create index idx_agents_created_by on public.agents(created_by);
create index idx_agents_is_template on public.agents(is_template);
create index idx_agents_category on public.agents(category);
create index idx_agents_user_id on public.agents(user_id);
create index idx_agents_status on public.agents(status);
create index idx_agents_created_at on public.agents(created_at);
create index idx_agents_updated_at on public.agents(updated_at);

create index idx_executions_org on public.executions(organization_id);
create index idx_executions_team on public.executions(team_id);
create index idx_executions_agent_status on public.executions(agent_id, status);
create index idx_executions_started_at on public.executions(started_at desc);
create index idx_executions_user_id on public.executions(user_id);

create index idx_apikeys_org on public.api_keys(organization_id);
create index idx_apikeys_user on public.api_keys(user_id);
create index idx_apikeys_provider on public.api_keys(provider);
create index idx_apikeys_is_company_key on public.api_keys(is_company_key);

create index idx_usage_org_date on public.usage_logs(organization_id, created_at desc);
create index idx_usage_user_date on public.usage_logs(user_id, created_at desc);
create index idx_usage_event_type on public.usage_logs(event_type);
create index idx_usage_created_at on public.usage_logs(created_at desc);

create index idx_audit_org_date on public.audit_logs(organization_id, created_at desc);
create index idx_audit_user on public.audit_logs(user_id);
create index idx_audit_action on public.audit_logs(action);
create index idx_audit_resource on public.audit_logs(resource_type, resource_id);
create index idx_audit_created_at on public.audit_logs(created_at desc);

create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_notifications_org on public.notifications(organization_id);
create index idx_notifications_type on public.notifications(type);

create index idx_templates_public on public.templates(is_public);
create index idx_templates_official on public.templates(is_official);
create index idx_templates_category on public.templates(category);
create index idx_templates_author on public.templates(author_id);
create index idx_templates_created_at on public.templates(created_at);

create index idx_reviews_template on public.reviews(template_id);
create index idx_reviews_user on public.reviews(user_id);
create index idx_reviews_rating on public.reviews(rating);

create index idx_profiles_created_at on public.profiles(created_at);
create index idx_profiles_updated_at on public.profiles(updated_at);

create index idx_agent_memories_user on public.agent_memories(user_id, created_at desc);
create index idx_agent_memories_agent on public.agent_memories(agent_id, created_at desc);

-- ===================================
-- 20. تفعيل سياسات الحماية
-- ===================================
alter table public.organizations enable row level security;
alter table public.organization_users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.invitations enable row level security;
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.executions enable row level security;
alter table public.api_keys enable row level security;
alter table public.notifications enable row level security;
alter table public.templates enable row level security;
alter table public.reviews enable row level security;
alter table public.usage_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.agent_memories enable row level security;

-- المؤسسات
create policy organizations_select_own on public.organizations
  for select using (
    id in (select organization_id from public.organization_users where user_id = auth.uid())
  );

create policy organizations_super_admin_all on public.organizations
  for all using (
    exists (
      select 1 from public.organization_users
      where user_id = auth.uid() and role = 'super_admin'
    )
  ) with check (
    exists (
      select 1 from public.organization_users
      where user_id = auth.uid() and role = 'super_admin'
    )
  );

create policy organizations_admin_update on public.organizations
  for update using (
    id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

-- مستخدمو الشركات
create policy org_users_select on public.organization_users
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy org_users_admin_manage on public.organization_users
  for all using (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  ) with check (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

-- الفرق
create policy teams_select on public.teams
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy teams_admin_manage on public.teams
  for all using (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  ) with check (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

-- أعضاء الفرق
create policy team_members_select on public.team_members
  for select using (
    team_id in (
      select id from public.teams
      where organization_id in (
        select organization_id from public.organization_users where user_id = auth.uid()
      )
    )
  );

create policy team_members_manage on public.team_members
  for all using (
    team_id in (
      select id from public.teams
      where organization_id in (
        select organization_id from public.organization_users
        where user_id = auth.uid() and role in ('super_admin', 'company_admin', 'team_manager')
      )
    )
  ) with check (
    team_id in (
      select id from public.teams
      where organization_id in (
        select organization_id from public.organization_users
        where user_id = auth.uid() and role in ('super_admin', 'company_admin', 'team_manager')
      )
    )
  );

-- الدعوات
create policy invitations_select on public.invitations
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy invitations_manage on public.invitations
  for all using (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin', 'team_manager')
    )
  ) with check (
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin', 'team_manager')
    )
  );

-- الملفات الشخصية
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- الوكلاء
create policy agents_select_org on public.agents
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
    or auth.uid() = any(shared_with_users)
    or user_id = auth.uid()
  );

create policy agents_insert_org on public.agents
  for insert with check (
    user_id = auth.uid()
    or organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid()
      and role in ('super_admin', 'company_admin', 'team_manager', 'agent_developer')
    )
  );

create policy agents_update_org on public.agents
  for update using (
    created_by = auth.uid() or
    user_id = auth.uid() or
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin', 'team_manager')
    )
  );

-- التنفيذات
create policy executions_select_org on public.executions
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy executions_insert_own on public.executions
  for insert with check (auth.uid() = user_id);

-- مفاتيح الواجهات
create policy api_keys_select_own on public.api_keys
  for select using (user_id = auth.uid());

create policy api_keys_select_company on public.api_keys
  for select using (
    is_company_key = true and
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy api_keys_admin_manage on public.api_keys
  for all using (
    is_company_key = true and
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  ) with check (
    is_company_key = true and
    organization_id in (
      select organization_id from public.organization_users
      where user_id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

create policy api_keys_insert_own on public.api_keys
  for insert with check (auth.uid() = user_id);

-- الإشعارات
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

-- القوالب
create policy templates_select_public on public.templates
  for select using (is_public = true or author_id = auth.uid());
create policy templates_insert_own on public.templates
  for insert with check (auth.uid() = author_id);
create policy templates_update_own on public.templates
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy templates_delete_own on public.templates
  for delete using (auth.uid() = author_id);

-- المراجعات
create policy reviews_select_public on public.reviews
  for select using (is_approved = true or user_id = auth.uid());
create policy reviews_insert_own on public.reviews
  for insert with check (user_id = auth.uid());
create policy reviews_update_own on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- سجلات الاستخدام والتدقيق
create policy usage_logs_select_org on public.usage_logs
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy audit_logs_select_org on public.audit_logs
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

-- الاشتراكات والفواتير
create policy subscriptions_select_org on public.subscriptions
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

create policy invoices_select_org on public.invoices
  for select using (
    organization_id in (
      select organization_id from public.organization_users where user_id = auth.uid()
    )
  );

-- ذاكرة الوكلاء
create policy agent_memories_select_own on public.agent_memories
  for select using (user_id = auth.uid());

create policy agent_memories_insert_own on public.agent_memories
  for insert with check (user_id = auth.uid());

-- ===================================
-- 21. المشغلات
-- ===================================
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create trigger update_organizations_updated_at
before update on public.organizations
for each row execute procedure public.update_updated_at_column();

create trigger update_teams_updated_at
before update on public.teams
for each row execute procedure public.update_updated_at_column();

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

create trigger update_agents_updated_at
before update on public.agents
for each row execute procedure public.update_updated_at_column();

create trigger update_reviews_updated_at
before update on public.reviews
for each row execute procedure public.update_updated_at_column();

create trigger update_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.update_updated_at_column();

create trigger update_invoices_updated_at
before update on public.invoices
for each row execute procedure public.update_updated_at_column();

create trigger api_keys_encrypt_before_write
before insert or update on public.api_keys
for each row execute procedure public.encrypt_api_key_trigger();

-- ===================================
-- 22. دوال الإحصاءات والتدقيق
-- ===================================
create or replace function public.update_org_api_usage()
returns trigger
language plpgsql
as $$
begin
  update public.organizations
  set current_api_calls = current_api_calls + 1
  where id = new.organization_id;
  return new;
end;
$$;

create trigger increment_api_usage
after insert on public.executions
for each row execute procedure public.update_org_api_usage();

create or replace function public.update_agent_stats()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ناجح' then
    update public.agents
    set
      execution_count = execution_count + 1,
      success_rate = (
        select (count(*) filter (where status = 'ناجح')::float /
                nullif(count(*)::float, 0) * 100)
        from public.executions
        where agent_id = new.agent_id
      ),
      avg_response_time = (
        select avg(duration_ms)
        from public.executions
        where agent_id = new.agent_id and status = 'ناجح'
      )
    where id = new.agent_id;
  end if;
  return new;
end;
$$;

create trigger update_agent_statistics
after update of status on public.executions
for each row
when (new.status = 'ناجح')
execute function public.update_agent_stats();

create or replace function public.log_audit_trail()
returns trigger
language plpgsql
security definer
as $$
declare
  v_organization_id uuid;
  v_changes jsonb;
begin
  if tg_table_name = 'organizations' then
    v_organization_id := coalesce(new.id, old.id);
  elsif tg_table_name = 'agents' then
    v_organization_id := coalesce(new.organization_id, old.organization_id);
  elsif tg_table_name = 'teams' then
    v_organization_id := coalesce(new.organization_id, old.organization_id);
  end if;

  if tg_op = 'UPDATE' then
    v_changes := jsonb_build_object(
      'old', to_jsonb(old),
      'new', to_jsonb(new)
    );
  end if;

  insert into public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_data,
    new_data,
    changes,
    created_at
  ) values (
    v_organization_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    v_changes,
    now()
  );

  return coalesce(new, old);
end;
$$;

create trigger audit_organizations_changes
after insert or update or delete on public.organizations
for each row execute function public.log_audit_trail();

create trigger audit_agents_changes
after insert or update or delete on public.agents
for each row execute function public.log_audit_trail();

create trigger audit_teams_changes
after insert or update or delete on public.teams
for each row execute function public.log_audit_trail();

-- ===================================
-- 23. وظائف مجدولة اختيارية
-- ===================================
create or replace function public.expire_old_invitations()
returns void
language plpgsql
as $$
begin
  update public.invitations
  set status = 'expired'
  where status = 'pending'
  and expires_at < now();
end;
$$;

create or replace function public.reset_monthly_usage()
returns void
language plpgsql
as $$
begin
  update public.organizations
  set current_api_calls = 0;

  update public.teams
  set current_api_calls = 0;
end;
$$;

-- ===================================
-- 24. المشاهدات
-- ===================================
create or replace view public.organization_stats as
select
  o.id,
  o.name,
  o.plan,
  count(distinct ou.user_id) as total_users,
  count(distinct t.id) as total_teams,
  count(distinct a.id) as total_agents,
  count(distinct e.id) as total_executions,
  sum(ul.cost_usd) as total_cost,
  sum(ul.tokens_used) as total_tokens,
  o.current_api_calls,
  o.max_api_calls_per_month,
  round((o.current_api_calls::float / nullif(o.max_api_calls_per_month, 0)::float * 100), 2) as usage_percentage
from public.organizations o
left join public.organization_users ou on o.id = ou.organization_id
left join public.teams t on o.id = t.organization_id
left join public.agents a on o.id = a.organization_id
left join public.executions e on o.id = e.organization_id
left join public.usage_logs ul on o.id = ul.organization_id
group by o.id;

create or replace view public.agent_performance as
select
  a.id,
  a.name,
  a.organization_id,
  a.category,
  count(e.id) as total_executions,
  count(e.id) filter (where e.status = 'ناجح') as successful_executions,
  count(e.id) filter (where e.status = 'فشل') as failed_executions,
  round(
    (count(e.id) filter (where e.status = 'ناجح')::float /
    nullif(count(e.id), 0)::float * 100), 2
  ) as success_rate,
  avg(e.duration_ms) as avg_duration_ms,
  sum(e.tokens_used) as total_tokens,
  sum(e.cost_usd) as total_cost
from public.agents a
left join public.executions e on a.id = e.agent_id
group by a.id;

-- ===================================
-- 25. بيانات تجريبية
-- ===================================
insert into public.organizations (
  name,
  slug,
  description,
  plan,
  is_active,
  is_trial,
  trial_ends_at
) values (
  'شركة تجريبية',
  'demo-company',
  'شركة تجريبية لاختبار المنصة',
  'pro',
  true,
  true,
  now() + interval '30 days'
) on conflict do nothing;

select * from public.create_super_admin();

insert into public.templates (
  name,
  description,
  category,
  is_official,
  is_public,
  is_featured,
  workflow,
  settings,
  tags
) values
(
  'مساعد خدمة العملاء',
  'وكيل للرد على استفسارات العملاء بشكل تلقائي',
  'محادثة',
  true,
  true,
  true,
  '{"nodes": [], "edges": []}'::jsonb,
  '{}'::jsonb,
  array['خدمة العملاء', 'محادثة', 'عربي']
),
(
  'محلل البيانات التنفيذي',
  'وكيل لتحليل البيانات وإنشاء تقارير تنفيذية',
  'تحليل',
  true,
  true,
  true,
  '{"nodes": [], "edges": []}'::jsonb,
  '{}'::jsonb,
  array['تحليل', 'تقارير']
),
(
  'مولد المحتوى التسويقي',
  'وكيل لإنشاء محتوى تسويقي باللغة العربية',
  'تسويق',
  true,
  true,
  true,
  '{"nodes": [], "edges": []}'::jsonb,
  '{}'::jsonb,
  array['تسويق', 'محتوى', 'عربي']
)
on conflict do nothing;

-- ===================================
-- 26. التعليقات التوضيحية
-- ===================================
comment on table public.organizations is 'بيانات الشركات والحسابات المؤسسية';
comment on column public.organizations.id is 'معرف الشركة';
comment on column public.organizations.name is 'اسم الشركة';
comment on column public.organizations.slug is 'المعرف النصي للشركة';
comment on column public.organizations.description is 'وصف الشركة';
comment on column public.organizations.logo_url is 'رابط شعار الشركة';
comment on column public.organizations.website is 'موقع الشركة';
comment on column public.organizations.primary_color is 'اللون الأساسي للهوية';
comment on column public.organizations.secondary_color is 'اللون الثانوي للهوية';
comment on column public.organizations.custom_domain is 'النطاق المخصص للشركة';
comment on column public.organizations.settings is 'إعدادات التخصيص العامة';
comment on column public.organizations.plan is 'الخطة الحالية للشركة';
comment on column public.organizations.max_users is 'الحد الأقصى للمستخدمين';
comment on column public.organizations.max_teams is 'الحد الأقصى للفرق';
comment on column public.organizations.max_agents is 'الحد الأقصى للوكلاء';
comment on column public.organizations.max_api_calls_per_month is 'الحد الأقصى للنداءات الشهرية';
comment on column public.organizations.max_storage_gb is 'الحد الأقصى للتخزين بالغيغابايت';
comment on column public.organizations.current_users is 'عدد المستخدمين الحالي';
comment on column public.organizations.current_teams is 'عدد الفرق الحالية';
comment on column public.organizations.current_agents is 'عدد الوكلاء الحالي';
comment on column public.organizations.current_api_calls is 'الاستخدام الحالي للنداءات';
comment on column public.organizations.current_storage_gb is 'الاستخدام الحالي للتخزين';
comment on column public.organizations.is_active is 'حالة التفعيل';
comment on column public.organizations.is_verified is 'حالة التحقق';
comment on column public.organizations.is_trial is 'هل الحساب تجريبي';
comment on column public.organizations.trial_ends_at is 'نهاية الفترة التجريبية';
comment on column public.organizations.contact_email is 'بريد التواصل';
comment on column public.organizations.contact_phone is 'هاتف التواصل';
comment on column public.organizations.billing_email is 'بريد الفوترة';
comment on column public.organizations.created_at is 'تاريخ الإنشاء';
comment on column public.organizations.updated_at is 'تاريخ التحديث';
comment on column public.organizations.subscription_starts_at is 'تاريخ بدء الاشتراك';
comment on column public.organizations.subscription_ends_at is 'تاريخ نهاية الاشتراك';
comment on column public.organizations.stripe_customer_id is 'معرف العميل في بوابة الدفع';
comment on column public.organizations.stripe_subscription_id is 'معرف الاشتراك في بوابة الدفع';
comment on column public.organizations.payment_method is 'طريقة الدفع';
comment on column public.organizations.billing_address is 'عنوان الفوترة';
comment on column public.organizations.internal_notes is 'ملاحظات داخلية للإدارة';

comment on table public.organization_users is 'ربط المستخدمين بالشركات وأدوارهم';
comment on column public.organization_users.id is 'معرف الربط';
comment on column public.organization_users.organization_id is 'معرف الشركة';
comment on column public.organization_users.user_id is 'معرف المستخدم';
comment on column public.organization_users.role is 'دور المستخدم داخل الشركة';
comment on column public.organization_users.is_active is 'حالة العضوية';
comment on column public.organization_users.joined_at is 'تاريخ الانضمام';
comment on column public.organization_users.invited_by is 'معرف الداعي';
comment on column public.organization_users.invitation_accepted_at is 'تاريخ قبول الدعوة';
comment on column public.organization_users.last_active_at is 'آخر نشاط للمستخدم';
comment on column public.organization_users.custom_permissions is 'صلاحيات مخصصة للمستخدم';

comment on table public.teams is 'بيانات فرق العمل داخل الشركات';
comment on column public.teams.id is 'معرف الفريق';
comment on column public.teams.organization_id is 'معرف الشركة';
comment on column public.teams.name is 'اسم الفريق';
comment on column public.teams.description is 'وصف الفريق';
comment on column public.teams.color is 'لون الفريق';
comment on column public.teams.avatar_url is 'صورة الفريق';
comment on column public.teams.settings is 'إعدادات الفريق';
comment on column public.teams.max_agents is 'حد الوكلاء للفريق';
comment on column public.teams.max_api_calls_per_month is 'حد النداءات الشهري للفريق';
comment on column public.teams.current_agents is 'عدد الوكلاء الحالي للفريق';
comment on column public.teams.current_api_calls is 'الاستخدام الحالي للفريق';
comment on column public.teams.is_active is 'حالة تفعيل الفريق';
comment on column public.teams.created_by is 'منشئ الفريق';
comment on column public.teams.created_at is 'تاريخ إنشاء الفريق';
comment on column public.teams.updated_at is 'تاريخ تحديث الفريق';

comment on table public.team_members is 'أعضاء الفرق وأدوارهم';
comment on column public.team_members.id is 'معرف العضوية';
comment on column public.team_members.team_id is 'معرف الفريق';
comment on column public.team_members.user_id is 'معرف المستخدم';
comment on column public.team_members.role is 'دور العضو في الفريق';
comment on column public.team_members.is_active is 'حالة العضوية';
comment on column public.team_members.joined_at is 'تاريخ الانضمام';
comment on column public.team_members.added_by is 'من قام بالإضافة';

comment on table public.invitations is 'دعوات الانضمام إلى الشركات والفرق';
comment on column public.invitations.id is 'معرف الدعوة';
comment on column public.invitations.organization_id is 'معرف الشركة';
comment on column public.invitations.team_id is 'معرف الفريق';
comment on column public.invitations.email is 'بريد المدعو';
comment on column public.invitations.role is 'الدور المطلوب';
comment on column public.invitations.token is 'رمز الدعوة';
comment on column public.invitations.status is 'حالة الدعوة';
comment on column public.invitations.invited_by is 'معرف المرسل';
comment on column public.invitations.invited_by_name is 'اسم المرسل';
comment on column public.invitations.personal_message is 'رسالة شخصية';
comment on column public.invitations.created_at is 'تاريخ الإنشاء';
comment on column public.invitations.expires_at is 'تاريخ انتهاء الدعوة';
comment on column public.invitations.accepted_at is 'تاريخ قبول الدعوة';
comment on column public.invitations.declined_at is 'تاريخ رفض الدعوة';
comment on column public.invitations.metadata is 'بيانات إضافية للدعوة';

comment on table public.profiles is 'ملفات المستخدمين الشخصية';
comment on column public.profiles.id is 'معرف المستخدم';
comment on column public.profiles.full_name is 'الاسم الكامل';
comment on column public.profiles.avatar_url is 'صورة المستخدم';
comment on column public.profiles.company is 'اسم الشركة';
comment on column public.profiles.plan is 'خطة المستخدم';
comment on column public.profiles.role is 'دور المستخدم';
comment on column public.profiles.job_title is 'المسمى الوظيفي';
comment on column public.profiles.phone is 'رقم الهاتف';
comment on column public.profiles.timezone is 'المنطقة الزمنية';
comment on column public.profiles.language is 'لغة المستخدم';
comment on column public.profiles.bio is 'نبذة مختصرة';
comment on column public.profiles.preferences is 'تفضيلات المستخدم';
comment on column public.profiles.last_active_at is 'آخر نشاط';
comment on column public.profiles.created_at is 'تاريخ الإنشاء';
comment on column public.profiles.updated_at is 'تاريخ التحديث';

comment on table public.agents is 'وكلاء الذكاء وسير العمل';
comment on column public.agents.id is 'معرف الوكيل';
comment on column public.agents.user_id is 'مالك الوكيل';
comment on column public.agents.organization_id is 'معرف الشركة';
comment on column public.agents.team_id is 'معرف الفريق';
comment on column public.agents.created_by is 'منشئ الوكيل';
comment on column public.agents.name is 'اسم الوكيل';
comment on column public.agents.description is 'وصف الوكيل';
comment on column public.agents.category is 'تصنيف الوكيل';
comment on column public.agents.workflow is 'مخطط سير العمل';
comment on column public.agents.settings is 'إعدادات الوكيل';
comment on column public.agents.status is 'حالة الوكيل';
comment on column public.agents.is_public is 'إتاحة عامة';
comment on column public.agents.is_shared is 'مشاركة داخلية';
comment on column public.agents.shared_with_teams is 'فرق مشاركة الوكيل';
comment on column public.agents.shared_with_users is 'مستخدمون مشاركون';
comment on column public.agents.sharing_permissions is 'صلاحيات المشاركة';
comment on column public.agents.is_template is 'هل الوكيل قالب';
comment on column public.agents.cloned_from is 'المصدر المنسوخ';
comment on column public.agents.clone_count is 'عدد النسخ';
comment on column public.agents.version_number is 'رقم الإصدار';
comment on column public.agents.parent_version is 'الإصدار الأب';
comment on column public.agents.execution_count is 'عدد التنفيذات';
comment on column public.agents.success_rate is 'نسبة النجاح';
comment on column public.agents.avg_response_time is 'متوسط زمن الاستجابة';
comment on column public.agents.tags is 'وسوم الوكيل';
comment on column public.agents.version is 'نسخة الوكيل النصية';
comment on column public.agents.created_at is 'تاريخ الإنشاء';
comment on column public.agents.updated_at is 'تاريخ التحديث';

comment on table public.executions is 'سجل تنفيذ الوكلاء';
comment on column public.executions.id is 'معرف التنفيذ';
comment on column public.executions.agent_id is 'معرف الوكيل';
comment on column public.executions.user_id is 'معرف المستخدم';
comment on column public.executions.organization_id is 'معرف الشركة';
comment on column public.executions.team_id is 'معرف الفريق';
comment on column public.executions.input is 'مدخلات التنفيذ';
comment on column public.executions.output is 'مخرجات التنفيذ';
comment on column public.executions.status is 'حالة التنفيذ';
comment on column public.executions.error_message is 'رسالة الخطأ';
comment on column public.executions.duration_ms is 'مدة التنفيذ بالميلي ثانية';
comment on column public.executions.tokens_used is 'عدد الرموز المستخدمة';
comment on column public.executions.cost_usd is 'التكلفة بالدولار';
comment on column public.executions.execution_context is 'سياق التنفيذ';
comment on column public.executions.model_used is 'النموذج المستخدم';
comment on column public.executions.temperature is 'درجة العشوائية';
comment on column public.executions.max_tokens is 'الحد الأقصى للرموز';
comment on column public.executions.queue_time_ms is 'زمن الانتظار';
comment on column public.executions.processing_time_ms is 'زمن المعالجة';
comment on column public.executions.total_time_ms is 'زمن التنفيذ الكلي';
comment on column public.executions.started_at is 'بداية التنفيذ';
comment on column public.executions.completed_at is 'نهاية التنفيذ';

comment on table public.api_keys is 'مفاتيح التكامل المشفرة';
comment on column public.api_keys.id is 'معرف المفتاح';
comment on column public.api_keys.organization_id is 'معرف الشركة';
comment on column public.api_keys.user_id is 'معرف المستخدم';
comment on column public.api_keys.provider is 'مزود الخدمة';
comment on column public.api_keys.key_encrypted is 'المفتاح المشفر';
comment on column public.api_keys.encryption_method is 'طريقة التشفير';
comment on column public.api_keys.name is 'اسم المفتاح';
comment on column public.api_keys.description is 'وصف المفتاح';
comment on column public.api_keys.is_company_key is 'مفتاح خاص بالشركة';
comment on column public.api_keys.is_default is 'مفتاح افتراضي';
comment on column public.api_keys.is_active is 'حالة التفعيل';
comment on column public.api_keys.is_valid is 'حالة التحقق';
comment on column public.api_keys.last_validated_at is 'آخر تحقق';
comment on column public.api_keys.last_used_at is 'آخر استخدام';
comment on column public.api_keys.usage_count is 'عدد مرات الاستخدام';
comment on column public.api_keys.rate_limit_per_minute is 'حد الدقيقة';
comment on column public.api_keys.rate_limit_per_day is 'حد اليوم';
comment on column public.api_keys.created_at is 'تاريخ الإنشاء';
comment on column public.api_keys.updated_at is 'تاريخ التحديث';
comment on column public.api_keys.expires_at is 'تاريخ الانتهاء';
comment on column public.api_keys.metadata is 'بيانات إضافية';

comment on table public.usage_logs is 'سجل استخدام الموارد';
comment on column public.usage_logs.id is 'معرف السجل';
comment on column public.usage_logs.organization_id is 'معرف الشركة';
comment on column public.usage_logs.user_id is 'معرف المستخدم';
comment on column public.usage_logs.team_id is 'معرف الفريق';
comment on column public.usage_logs.agent_id is 'معرف الوكيل';
comment on column public.usage_logs.execution_id is 'معرف التنفيذ';
comment on column public.usage_logs.event_type is 'نوع الحدث';
comment on column public.usage_logs.resource_type is 'نوع المورد';
comment on column public.usage_logs.resource_id is 'معرف المورد';
comment on column public.usage_logs.action is 'الإجراء';
comment on column public.usage_logs.tokens_used is 'إجمالي الرموز';
comment on column public.usage_logs.tokens_input is 'رموز الإدخال';
comment on column public.usage_logs.tokens_output is 'رموز الإخراج';
comment on column public.usage_logs.cost_usd is 'تكلفة الاستخدام';
comment on column public.usage_logs.duration_ms is 'مدة التنفيذ';
comment on column public.usage_logs.api_key_id is 'المفتاح المستخدم';
comment on column public.usage_logs.provider is 'مزود الخدمة';
comment on column public.usage_logs.model is 'النموذج المستخدم';
comment on column public.usage_logs.ip_address is 'عنوان الشبكة';
comment on column public.usage_logs.user_agent is 'بيانات المتصفح';
comment on column public.usage_logs.metadata is 'بيانات إضافية';
comment on column public.usage_logs.status is 'حالة الحدث';
comment on column public.usage_logs.error_message is 'رسالة الخطأ';
comment on column public.usage_logs.created_at is 'تاريخ الإنشاء';

comment on table public.audit_logs is 'سجل التدقيق للعمليات';
comment on column public.audit_logs.id is 'معرف السجل';
comment on column public.audit_logs.organization_id is 'معرف الشركة';
comment on column public.audit_logs.user_id is 'معرف المستخدم';
comment on column public.audit_logs.action is 'نوع العملية';
comment on column public.audit_logs.resource_type is 'نوع المورد';
comment on column public.audit_logs.resource_id is 'معرف المورد';
comment on column public.audit_logs.resource_name is 'اسم المورد';
comment on column public.audit_logs.old_data is 'البيانات السابقة';
comment on column public.audit_logs.new_data is 'البيانات الجديدة';
comment on column public.audit_logs.changes is 'ملخص التغييرات';
comment on column public.audit_logs.ip_address is 'عنوان الشبكة';
comment on column public.audit_logs.user_agent is 'بيانات المتصفح';
comment on column public.audit_logs.request_id is 'معرف الطلب';
comment on column public.audit_logs.context is 'سياق العملية';
comment on column public.audit_logs.status is 'حالة العملية';
comment on column public.audit_logs.error_message is 'رسالة الخطأ';
comment on column public.audit_logs.created_at is 'تاريخ الإنشاء';

comment on table public.notifications is 'إشعارات المستخدمين';
comment on column public.notifications.id is 'معرف الإشعار';
comment on column public.notifications.organization_id is 'معرف الشركة';
comment on column public.notifications.user_id is 'معرف المستخدم';
comment on column public.notifications.type is 'نوع الإشعار';
comment on column public.notifications.title is 'عنوان الإشعار';
comment on column public.notifications.message is 'نص الإشعار';
comment on column public.notifications.action_url is 'رابط الإجراء';
comment on column public.notifications.action_label is 'نص الإجراء';
comment on column public.notifications.is_read is 'حالة القراءة';
comment on column public.notifications.read_at is 'وقت القراءة';
comment on column public.notifications.priority is 'أولوية الإشعار';
comment on column public.notifications.metadata is 'بيانات إضافية';
comment on column public.notifications.created_at is 'تاريخ الإنشاء';
comment on column public.notifications.expires_at is 'تاريخ الانتهاء';

comment on table public.templates is 'قوالب جاهزة للوكلاء';
comment on column public.templates.id is 'معرف القالب';
comment on column public.templates.organization_id is 'معرف الشركة المالكة';
comment on column public.templates.name is 'اسم القالب';
comment on column public.templates.description is 'وصف القالب';
comment on column public.templates.category is 'تصنيف القالب';
comment on column public.templates.workflow is 'مخطط القالب';
comment on column public.templates.settings is 'إعدادات القالب';
comment on column public.templates.preview_image_url is 'رابط المعاينة';
comment on column public.templates.author_id is 'معرف المؤلف';
comment on column public.templates.downloads is 'عدد الاستخدامات';
comment on column public.templates.rating is 'التقييم العام';
comment on column public.templates.is_featured is 'قالب مميز';
comment on column public.templates.is_public is 'قالب عام';
comment on column public.templates.is_official is 'قالب رسمي';
comment on column public.templates.price_usd is 'سعر القالب';
comment on column public.templates.license is 'نوع الترخيص';
comment on column public.templates.tags is 'وسوم القالب';
comment on column public.templates.requirements is 'متطلبات القالب';
comment on column public.templates.changelog is 'سجل التغييرات';
comment on column public.templates.total_revenue is 'إجمالي العائد';
comment on column public.templates.created_at is 'تاريخ الإنشاء';

comment on table public.reviews is 'مراجعات القوالب';
comment on column public.reviews.id is 'معرف المراجعة';
comment on column public.reviews.template_id is 'معرف القالب';
comment on column public.reviews.user_id is 'معرف المستخدم';
comment on column public.reviews.organization_id is 'معرف الشركة';
comment on column public.reviews.rating is 'درجة التقييم';
comment on column public.reviews.title is 'عنوان المراجعة';
comment on column public.reviews.comment is 'نص المراجعة';
comment on column public.reviews.is_verified_purchase is 'شراء موثق';
comment on column public.reviews.is_approved is 'اعتماد المراجعة';
comment on column public.reviews.is_featured is 'مراجعة مميزة';
comment on column public.reviews.helpful_count is 'عدد مفيد';
comment on column public.reviews.not_helpful_count is 'عدد غير مفيد';
comment on column public.reviews.created_at is 'تاريخ الإنشاء';
comment on column public.reviews.updated_at is 'تاريخ التحديث';

comment on table public.subscriptions is 'اشتراكات الشركات';
comment on column public.subscriptions.id is 'معرف الاشتراك';
comment on column public.subscriptions.organization_id is 'معرف الشركة';
comment on column public.subscriptions.plan is 'اسم الخطة';
comment on column public.subscriptions.billing_cycle is 'دورة الفوترة';
comment on column public.subscriptions.amount is 'قيمة الاشتراك';
comment on column public.subscriptions.currency is 'عملة الفوترة';
comment on column public.subscriptions.status is 'حالة الاشتراك';
comment on column public.subscriptions.starts_at is 'بداية الاشتراك';
comment on column public.subscriptions.ends_at is 'نهاية الاشتراك';
comment on column public.subscriptions.cancelled_at is 'تاريخ الإلغاء';
comment on column public.subscriptions.trial_ends_at is 'نهاية التجربة';
comment on column public.subscriptions.payment_provider is 'مزود الدفع';
comment on column public.subscriptions.payment_provider_subscription_id is 'معرف الاشتراك لدى المزود';
comment on column public.subscriptions.payment_provider_customer_id is 'معرف العميل لدى المزود';
comment on column public.subscriptions.metadata is 'بيانات إضافية';
comment on column public.subscriptions.created_at is 'تاريخ الإنشاء';
comment on column public.subscriptions.updated_at is 'تاريخ التحديث';

comment on table public.invoices is 'فواتير الشركات';
comment on column public.invoices.id is 'معرف الفاتورة';
comment on column public.invoices.organization_id is 'معرف الشركة';
comment on column public.invoices.subscription_id is 'معرف الاشتراك';
comment on column public.invoices.invoice_number is 'رقم الفاتورة';
comment on column public.invoices.amount is 'قيمة الفاتورة قبل الضريبة';
comment on column public.invoices.tax_amount is 'قيمة الضريبة';
comment on column public.invoices.total_amount is 'الإجمالي بعد الضريبة';
comment on column public.invoices.currency is 'عملة الفاتورة';
comment on column public.invoices.status is 'حالة الفاتورة';
comment on column public.invoices.issue_date is 'تاريخ الإصدار';
comment on column public.invoices.due_date is 'تاريخ الاستحقاق';
comment on column public.invoices.paid_at is 'وقت السداد';
comment on column public.invoices.pdf_url is 'رابط ملف الفاتورة';
comment on column public.invoices.payment_method is 'طريقة الدفع';
comment on column public.invoices.payment_provider_invoice_id is 'معرف الفاتورة لدى المزود';
comment on column public.invoices.line_items is 'بنود الفاتورة';
comment on column public.invoices.notes is 'ملاحظات إضافية';
comment on column public.invoices.created_at is 'تاريخ الإنشاء';
comment on column public.invoices.updated_at is 'تاريخ التحديث';

comment on table public.agent_memories is 'ذاكرة سياق الوكلاء';
comment on column public.agent_memories.id is 'معرف الذاكرة';
comment on column public.agent_memories.user_id is 'معرف المستخدم';
comment on column public.agent_memories.agent_id is 'معرف الوكيل';
comment on column public.agent_memories.content is 'نص الذاكرة';
comment on column public.agent_memories.role is 'دور الرسالة';
comment on column public.agent_memories.metadata is 'بيانات إضافية';
comment on column public.agent_memories.created_at is 'تاريخ الإنشاء';
