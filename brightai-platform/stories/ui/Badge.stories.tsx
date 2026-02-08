import Badge from "../../src/components/ui/Badge";

export default {
  title: "واجهة/شارة",
  component: Badge,
};

export const افتراضية = () => <Badge>افتراضي</Badge>;
export const نجاح = () => <Badge variant="success">ناجح</Badge>;
export const تحذير = () => <Badge variant="warning">تحذير</Badge>;
export const خطأ = () => <Badge variant="error">خطأ</Badge>;
export const مؤشر = () => <Badge dot>نشط</Badge>;
