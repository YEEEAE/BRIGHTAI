const AUTH_UNCONFIGURED_MESSAGE = 'التسجيل غير متاح الآن؛ خدمة الحسابات غير مهيأة.';
const PORTAL_CLOSED_MESSAGE = 'التسجيل مغلق حاليًا. تواصل معنا لمعرفة خيارات استكشاف المنتج.';

export function getSignUpAvailability(authUrl, portalEnabled) {
  if (typeof authUrl !== 'string' || !authUrl.trim()) {
    return { available: false, message: AUTH_UNCONFIGURED_MESSAGE };
  }
  if (portalEnabled !== true) {
    return { available: false, message: PORTAL_CLOSED_MESSAGE };
  }
  return { available: true, message: '' };
}
