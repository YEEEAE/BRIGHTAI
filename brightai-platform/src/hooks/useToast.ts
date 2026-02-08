import { toast, type ToastOptions } from "react-hot-toast";

type PromiseMessages = {
  loading: string;
  success: string;
  error: string;
};

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) =>
    toast.success(message, options);
  const error = (message: string, options?: ToastOptions) =>
    toast.error(message, options);
  const info = (message: string, options?: ToastOptions) =>
    toast(message, options);
  const warning = (message: string, options?: ToastOptions) =>
    toast(message, { ...options, icon: "⚠️" });
  const loading = (message: string, options?: ToastOptions) =>
    toast.loading(message, options);
  const promise = <T,>(promiseRef: Promise<T>, messages: PromiseMessages) =>
    toast.promise(promiseRef, messages);

  return { success, error, info, warning, loading, promise };
};
