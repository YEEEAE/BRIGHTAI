import { toast } from "react-hot-toast";

// رسائل تنبيه موحدة للواجهة العربية
const defaultErrorMessage = "حدث خطأ ما";

const useAppToast = () => {
  const showSuccess = (message: string) => toast.success(message);
  const showError = (message: string = defaultErrorMessage) =>
    toast.error(message);
  const showLoading = (message: string = "جارٍ التحميل...") =>
    toast.loading(message);

  return { showSuccess, showError, showLoading };
};

export default useAppToast;
