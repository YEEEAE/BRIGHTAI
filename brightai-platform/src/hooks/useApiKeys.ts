import { useCallback, useEffect, useMemo, useState } from "react";
import ApiKeyService, { ApiKey, ApiProvider } from "../services/apikey.service";

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiKeyService.listApiKeys();
      setApiKeys(data);
    } catch {
      setError("تعذر تحميل المفاتيح.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const addApiKey = useCallback(
    async (provider: ApiProvider, key: string, name?: string) => {
      setError(null);
      try {
        await ApiKeyService.saveApiKey(provider, key, name);
        await fetchKeys();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر حفظ المفتاح.");
        return false;
      }
    },
    [fetchKeys]
  );

  const deleteApiKey = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await ApiKeyService.deleteApiKey(id);
        await fetchKeys();
        return true;
      } catch {
        setError("تعذر حذف المفتاح.");
        return false;
      }
    },
    [fetchKeys]
  );

  const testApiKey = useCallback(async (provider: ApiProvider, key: string) => {
    setError(null);
    try {
      await ApiKeyService.validateApiKey(provider, key);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر التحقق من المفتاح.");
      return false;
    }
  }, []);

  const getDefaultKey = useCallback(
    (provider: ApiProvider) => {
      const match = apiKeys.find((item) => item.provider === provider && item.is_default);
      return match || null;
    },
    [apiKeys]
  );

  return useMemo(
    () => ({ apiKeys, loading, error, addApiKey, deleteApiKey, testApiKey, getDefaultKey, refetch: fetchKeys }),
    [apiKeys, loading, error, addApiKey, deleteApiKey, testApiKey, getDefaultKey, fetchKeys]
  );
};
