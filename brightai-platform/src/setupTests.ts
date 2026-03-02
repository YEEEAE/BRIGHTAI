// إضافة أدوات مطابقة مخصصة لاختبارات DOM
// مثال للاستخدام: expect(element).toHaveTextContent(/نص/)
// المزيد: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

jest.mock("date-fns/locale", () => {
  // Use CJS locale modules so Jest in CRA can avoid ESM parsing issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { arSA } = require("date-fns/locale/ar-SA.cjs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { enUS } = require("date-fns/locale/en-US.cjs");

  return { arSA, enUS };
});
