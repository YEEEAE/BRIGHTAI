const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * AR: توليد سر 2FA جديد ورابط TOTP للمستخدم
 * EN: Generate new 2FA secret and TOTP URL for a user
 */
function generateSecret(email) {
  const secret = speakeasy.generateSecret({
    name: `BrightAI Mais (${email})`,
    issuer: 'BrightAI'
  });

  return {
    otpauthUrl: secret.otpauth_url,
    base32: secret.base32
  };
}

/**
 * AR: توليد كود QR بصيغة Data URL لعرضه بالفرونتند
 * EN: Generate QR Code as Data URL for frontend display
 */
async function generateQRCodeUrl(otpauthUrl) {
  try {
    return await qrcode.toDataURL(otpauthUrl);
  } catch (err) {
    console.error('❌ Failed to generate 2FA QR Code:', err.message);
    throw new Error('Failed to generate QR Code');
  }
}

/**
 * AR: التحقق من صحة رمز الـ 2FA المدخل
 * EN: Verify entered 2FA token
 */
function verifyToken(secretBase32, token) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: token,
    window: 1 // AR: السماح بخطوة زمنية واحدة قبل/بعد (30 ثانية لتأخر الساعة)
  });
}

module.exports = {
  generateSecret,
  generateQRCodeUrl,
  verifyToken
};
