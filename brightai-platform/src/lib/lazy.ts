import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type LazyModule<T extends ComponentType<any>> = Promise<{ default: T }>;

type LazyWithPreload<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  preload: () => LazyModule<T>;
};

const CHUNK_ERROR_PATTERN = /(loading chunk|failed to fetch dynamically imported module|chunkloaderror)/i;
const HTML_RESPONSE_PATTERN = /unexpected token '<'|importing a module script failed/i;
const CHUNK_RELOAD_FLAG = "brightai_chunk_reload_once";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetriableChunkError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return CHUNK_ERROR_PATTERN.test(error.message) || HTML_RESPONSE_PATTERN.test(error.message);
};

const tryRecoverChunkByReload = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const alreadyReloaded = window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) === "1";
  if (alreadyReloaded) {
    return false;
  }
  window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
  window.location.reload();
  return true;
};

/**
 * تحميل كسول مع إعادة المحاولة تلقائياً عند فشل تحميل الحزمة.
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
  importer: () => LazyModule<T>,
  retries = 2,
  baseDelayMs = 400
): LazyWithPreload<T> => {
  const load = async () => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const module = await importer();
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
        }
        return module;
      } catch (error) {
        lastError = error;
        if (attempt >= retries || !isRetriableChunkError(error)) {
          if (isRetriableChunkError(error) && tryRecoverChunkByReload()) {
            await new Promise(() => undefined);
          }
          break;
        }
        await sleep(baseDelayMs * (attempt + 1));
      }
    }
    throw lastError;
  };

  const Component = lazy(load) as LazyWithPreload<T>;
  Component.preload = load;
  return Component;
};

/**
 * جدولة تحميل الخلفية للمسارات بعد استقرار الواجهة الأولى.
 */
export const preloadOnIdle = (tasks: Array<() => Promise<unknown> | unknown>) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let cancelled = false;
  const run = () => {
    if (cancelled) {
      return;
    }
    tasks.forEach((task) => {
      try {
        void Promise.resolve(task()).catch(() => undefined);
      } catch {
        // تجاهل أخطاء التحميل الخلفي لتجنب كسر الواجهة.
      }
    });
  };

  if ("requestIdleCallback" in window) {
    const idleId = (
      window as Window & {
        requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback: (id: number) => void;
      }
    ).requestIdleCallback(run, { timeout: 2000 });

    return () => {
      cancelled = true;
      (
        window as Window & {
          cancelIdleCallback: (id: number) => void;
        }
      ).cancelIdleCallback(idleId);
    };
  }

  const timer = setTimeout(run, 1200);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
};

export type { LazyWithPreload };
