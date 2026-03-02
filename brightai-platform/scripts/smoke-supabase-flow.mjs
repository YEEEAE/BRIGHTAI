import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return new Map();
  const out = new Map();
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;
    const i = text.indexOf("=");
    if (i <= 0) continue;
    out.set(text.slice(0, i).trim(), text.slice(i + 1).trim());
  }
  return out;
};

const fileEnv = readEnvFile(envPath);
const env = (key) => process.env[key] || fileEnv.get(key) || "";

const url = env("REACT_APP_SUPABASE_URL");
const anon = env("REACT_APP_SUPABASE_ANON_KEY");
const email = env("SMOKE_ADMIN_EMAIL");
const password = env("SMOKE_ADMIN_PASSWORD");

if (!url || !anon) fail("بيانات Supabase غير موجودة في .env.local.");
if (!email || !password) {
  fail("ضع SMOKE_ADMIN_EMAIL و SMOKE_ADMIN_PASSWORD قبل التشغيل.");
}

const request = async (target, options = {}) => {
  const response = await fetch(target, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} | ${JSON.stringify(json)}`);
  }
  return json;
};

const login = async () => {
  const authUrl = `${url}/auth/v1/token?grant_type=password`;
  const payload = await request(authUrl, {
    method: "POST",
    headers: {
      apikey: anon,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!payload?.access_token) {
    fail("فشل تسجيل الدخول في اختبار التدفق.");
  }
  return payload;
};

const run = async () => {
  const { access_token: token, user } = await login();
  const userId = user?.id;
  if (!userId) fail("لم يتم العثور على معرف المستخدم بعد تسجيل الدخول.");

  const headers = {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const orgRows = await request(
    `${url}/rest/v1/organization_users?select=organization_id&user_id=eq.${userId}&limit=1`,
    { headers }
  );
  if (!Array.isArray(orgRows) || !orgRows[0]?.organization_id) {
    fail("المستخدم غير مرتبط بمنظمة داخل organization_users.");
  }
  const organizationId = orgRows[0].organization_id;

  const seed = Date.now();
  const insertPayload = {
    user_id: userId,
    created_by: userId,
    organization_id: organizationId,
    name: `اختبار تدفق ${seed}`,
    description: "اختبار إنشاء من السكربت",
    category: "اختبار",
    status: "قيد المراجعة",
    workflow: { nodes: [], edges: [] },
    settings: { smoke: true, ts: seed },
  };

  const created = await request(`${url}/rest/v1/agents`, {
    method: "POST",
    headers,
    body: JSON.stringify(insertPayload),
  });
  const createdId = created?.[0]?.id;
  if (!createdId) fail("فشل إنشاء الوكيل.");

  await request(`${url}/rest/v1/agents?id=eq.${createdId}&user_id=eq.${userId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      description: "اختبار تحديث من السكربت",
      status: "نشط",
    }),
  });

  await request(`${url}/rest/v1/agents?id=eq.${createdId}&user_id=eq.${userId}`, {
    method: "DELETE",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      Prefer: "return=minimal",
    },
  });

  console.log("✅ تدفق Supabase نجح: تسجيل دخول + إنشاء + تحديث + حذف.");
};

run().catch((error) => fail(`اختبار التدفق فشل: ${error instanceof Error ? error.message : "خطأ غير متوقع"}`));
