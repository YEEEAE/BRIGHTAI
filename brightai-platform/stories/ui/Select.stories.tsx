import { useState } from "react";
import Select from "../../src/components/ui/Select";

export default {
  title: "واجهة/قائمة اختيار",
  component: Select,
};

const options = [
  { value: "analytics", label: "تحليلات" },
  { value: "agents", label: "الوكلاء" },
  { value: "templates", label: "القوالب" },
];

export const مفرد = () => {
  const [value, setValue] = useState("");
  return (
    <Select
      options={options}
      value={value}
      onChange={(next) => setValue(next as string)}
      placeholder="اختر القسم"
    />
  );
};

export const متعدد = () => {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Select
      options={options}
      value={value}
      onChange={(next) => setValue(next as string[])}
      placeholder="اختر الأقسام"
      isMulti
    />
  );
};
