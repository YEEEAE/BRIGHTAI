import Loading from "../../src/components/ui/Loading";

export default {
  title: "واجهة/تحميل",
  component: Loading,
};

export const دوار = () => <Loading variant="spinner" />;
export const نقاط = () => <Loading variant="dots" />;
export const هيكل = () => <Loading variant="skeleton" lines={4} />;
export const شريط = () => <Loading variant="progress" progress={60} />;
