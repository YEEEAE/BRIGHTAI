# Cloudflare Pages Build Configuration
# https://developers.cloudflare.com/pages/configuration/build-configuration/

[build]
  command = ""
  publish = "."

[build.environment]

# إيقاف Email Obfuscation لإزالة email-decode.min.js الحاجب للعرض
# هذا الإعداد يتم ضبطه من لوحة تحكم Cloudflare أيضاً:
# Settings > Speed > Optimization > Email Obfuscation = OFF
#
# ملاحظة: يمكن أيضاً إضافة هيدر لتعطيله:
# ضع في _headers:
# /*
#   cf-edge-cache: no-cache

# تحسين الأداء: Cloudflare Performance Settings
# Auto Minify: CSS/JS = ON (من لوحة Cloudflare)
# Brotli: ON
# Early Hints: ON
# HTTP/2 Push: ON
