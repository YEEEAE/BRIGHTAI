-- 1. Users Table (جدول المستخدمين)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active', -- active, inactive, locked
    failed_attempts INTEGER DEFAULT 0,
    lockout_until INTEGER,
    password_changed_at INTEGER NOT NULL,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 2. Roles Table (جدول الأدوار)
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL
);

-- 3. Permissions Table (جدول الصلاحيات)
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 4. Role-Permissions Table (جدول ربط الأدوار بالصلاحيات)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT,
    permission_id TEXT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. User-Roles Table (جدول ربط المستخدمين بالأدوار)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT,
    role_id TEXT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Sessions Table (جدول الجلسات النشطة للأجهزة والتوكنز)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_jti TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active INTEGER DEFAULT 1,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Audit Logs Table (جدول سجل المراجعة والتدقيق الفني)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    user_id TEXT,
    user_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    status TEXT NOT NULL, -- success, failure
    details TEXT,
    before_state TEXT, -- JSON String
    after_state TEXT -- JSON String
);

-- 8. User Preferences Table (جدول تفضيلات الموظفين وتخصيص الإشعارات)
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    channels_in_app INTEGER DEFAULT 1,
    channels_email INTEGER DEFAULT 0,
    channels_push INTEGER DEFAULT 0,
    quiet_hours_enabled INTEGER DEFAULT 0,
    quiet_hours_from INTEGER DEFAULT 22,
    quiet_hours_to INTEGER DEFAULT 7,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Password History Table (جدول سجل كلمات المرور السابقة لمنع التكرار)
CREATE TABLE IF NOT EXISTS password_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. User API Tokens Table (جدول مفاتيح الـ API للتكامل مع نظام فوكس ERP)
CREATE TABLE IF NOT EXISTS user_api_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
