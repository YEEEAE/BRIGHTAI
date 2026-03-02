import { useState } from "react";
import Input from "../../src/components/ui/Input";

export default {
  title: "واجهة/حقل إدخال",
  component: Input,
};

export const افتراضي = () => {
  const [value, setValue] = useState("");
  return (
    <Input
      label="البريد الإلكتروني"
      type="email"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="أدخل البريد الإلكتروني"
      showCount
      maxLength={40}
      allowClear
    />
  );
};

export const مع_خطأ = () => (
  <Input label="كلمة المرور" type="password" error="الحقول مطلوبة" />
);
