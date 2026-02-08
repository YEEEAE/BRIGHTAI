import Card from "../../src/components/ui/Card";
import Badge from "../../src/components/ui/Badge";

export default {
  title: "واجهة/بطاقة",
  component: Card,
};

export const افتراضية = () => (
  <Card
    header={<h3 className="text-lg font-bold text-slate-100">بطاقة ملخص</h3>}
    body="وصف مختصر للمحتوى داخل البطاقة مع تأثيرات مناسبة"
    badge={<Badge variant="info">جديد</Badge>}
  />
);
