import Button from "../../src/components/ui/Button";

export default {
  title: "واجهة/زر",
  component: Button,
};

export const أساسي = () => <Button>زر أساسي</Button>;
export const ثانوي = () => <Button variant="secondary">زر ثانوي</Button>;
export const حد = () => <Button variant="outline">زر بحد</Button>;
export const شفاف = () => <Button variant="ghost">زر شفاف</Button>;
export const خطر = () => <Button variant="danger">زر خطر</Button>;
export const تحميل = () => <Button loading>جارٍ التنفيذ</Button>;
