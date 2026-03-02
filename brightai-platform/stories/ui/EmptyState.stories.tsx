import EmptyState from "../../src/components/ui/EmptyState";

export default {
  title: "واجهة/حالة فارغة",
  component: EmptyState,
};

export const افتراضية = () => (
  <EmptyState
    title="لا توجد بيانات"
    description="ابدأ بإضافة عناصر جديدة لعرضها هنا"
    actionLabel="إضافة عنصر"
  />
);
