import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.production");

const requiredKeys = [
  "REACT_APP_SUPABASE_URL",
  "REACT_APP_SUPABASE_ANON_KEY",
  "REACT_APP_DEFAULT_LOCALE",
  "REACT_APP_TIMEZONE",
];

const optionalRecommendedKeys = [
  "REACT_APP_ANALYTICS_KEY",
  "REACT_APP_ANALYTICS_PROVIDER",
  "REACT_APP_SENTRY_DSN",
  "REACT_APP_SENTRY_TRACES_SAMPLE_RATE",
];

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

if (!fs.existsSync(envPath)) {
  fail("ملف .env.production غير موجود.");
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

const map = new Map();
for (const line of lines) {
  const i = line.indexOf("=");
  if (i <= 0) continue;
  const key = line.slice(0, i).trim();
  const value = line.slice(i + 1).trim();
  map.set(key, value);
}

const getValue = (key) => {
  const fromEnv = process.env[key];
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }
  return map.get(key) || "";
};

const missingRequired = requiredKeys.filter((key) => !getValue(key));
if (missingRequired.length > 0) {
  fail(`المتغيرات المطلوبة غير مكتملة: ${missingRequired.join("، ")}`);
}

const recommendedMissing = optionalRecommendedKeys.filter((key) => !getValue(key));

const url = getValue("REACT_APP_SUPABASE_URL");
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  fail("قيمة REACT_APP_SUPABASE_URL غير صحيحة.");
}

if (getValue("REACT_APP_DEFAULT_LOCALE") !== "ar-SA") {
  fail("قيمة REACT_APP_DEFAULT_LOCALE يجب أن تكون ar-SA.");
}

if (getValue("REACT_APP_TIMEZONE") !== "Asia/Riyadh") {
  fail("قيمة REACT_APP_TIMEZONE يجب أن تكون Asia/Riyadh.");
}

const analyticsProvider = getValue("REACT_APP_ANALYTICS_PROVIDER").toLowerCase();
const analyticsKey = getValue("REACT_APP_ANALYTICS_KEY");

if (analyticsProvider === "ga4" && !analyticsKey) {
  fail("عند تفعيل REACT_APP_ANALYTICS_PROVIDER=ga4 يجب توفير REACT_APP_ANALYTICS_KEY.");
}

if (analyticsProvider && !["ga4", "none"].includes(analyticsProvider)) {
  fail("قيمة REACT_APP_ANALYTICS_PROVIDER غير مدعومة. القيم المسموحة: ga4 أو none.");
}

const sampleRateRaw = getValue("REACT_APP_SENTRY_TRACES_SAMPLE_RATE");
if (sampleRateRaw) {
  const parsed = Number(sampleRateRaw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    fail("REACT_APP_SENTRY_TRACES_SAMPLE_RATE يجب أن تكون رقمًا بين 0 و 1.");
  }
}

console.log("✅ تحقق الإنتاج ناجح.");
if (recommendedMissing.length > 0) {
  console.log(`⚠️ متغيرات موصى بها غير مفعلة: ${recommendedMissing.join("، ")}`);
}
