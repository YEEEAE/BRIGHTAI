import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

// رسائل تنبيه موحدة للواجهة العربية
const defaultErrorMessage = "حدث خطأ ما";

const useAppToast = () => {
  const showSuccess = useCallback((message: string) => toast.success(message), []);
  const showError = useCallback(
    (message: string = defaultErrorMessage) => toast.error(message),
    []
  );
  const showLoading = useCallback(
    (message: string = "جارٍ التحميل...") => toast.loading(message),
    []
  );

  return useMemo(
    () => ({ showSuccess, showError, showLoading }),
    [showSuccess, showError, showLoading]
  );
};

export default useAppToast;
