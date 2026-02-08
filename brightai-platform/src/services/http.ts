import axios, { AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { APP_DEFAULT_LOCALE } from "../constants/app";
import { getCsrfToken, getRequestId, logSecurityEvent, signRequest } from "../lib/security";
import { trackApiResponseTime, trackErrorEvent } from "../lib/analytics";

type CacheEntry = {
  timestamp: number;
  data: unknown;
};

const CACHE_TTL_MS = 30000;
const responseCache = new Map<string, CacheEntry>();

const buildCacheKey = (config: AxiosRequestConfig) => {
  const base = config.baseURL || "";
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${base}${url}?${params}`;
};

// عميل موحد للطلبات الشبكية
export const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "",
  headers: {
    "Accept-Language": APP_DEFAULT_LOCALE,
  },
});

http.interceptors.request.use(async (config) => {
  const csrfToken = getCsrfToken();
  const requestId = getRequestId();
  const timestamp = new Date().toISOString();
  const url = `${config.baseURL || ""}${config.url || ""}`;
  const body = config.data ? JSON.stringify(config.data) : "";
  const signature = await signRequest(
    `${(config.method || "get").toLowerCase()}\n${url}\n${timestamp}\n${requestId}\n${body}\n${csrfToken}`
  );

  const headers = AxiosHeaders.from(config.headers);
  headers.set("X-Requested-With", "XMLHttpRequest");
  headers.set("X-CSRF-Token", csrfToken);
  headers.set("X-Request-Id", requestId);
  headers.set("X-Request-Timestamp", timestamp);
  if (signature) {
    headers.set("X-Request-Signature", signature);
  } else {
    logSecurityEvent({
      type: "request-signing",
      message: "تعذر توقيع الطلب.",
      meta: { url },
    });
  }
  config.headers = headers;

  (config as AxiosRequestConfig & { metadata?: { startTime: number } }).metadata = {
    startTime: performance.now(),
  };
  const method = (config.method || "get").toLowerCase();
  if (method !== "get") {
    return config;
  }
  if (headers.has("x-cache")) {
    return config;
  }
  const key = buildCacheKey(config);
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    config.adapter = async () =>
      ({
        data: cached.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      }) as AxiosResponse;
  }
  return config;
});

http.interceptors.response.use((response) => {
  const method = (response.config.method || "get").toLowerCase();
  const metadata = (response.config as AxiosRequestConfig & { metadata?: { startTime: number } }).metadata;
  if (metadata?.startTime) {
    trackApiResponseTime(
      response.config.url || "",
      method,
      performance.now() - metadata.startTime,
      response.status
    );
  }
  if (method !== "get") {
    return response;
  }
  const key = buildCacheKey(response.config);
  responseCache.set(key, { timestamp: Date.now(), data: response.data });
  return response;
}, (error) => {
  if (error?.config) {
    const config = error.config as AxiosRequestConfig & { metadata?: { startTime: number } };
    const metadata = config.metadata;
    if (metadata?.startTime) {
      trackApiResponseTime(
        config.url || "",
        (config.method || "get").toLowerCase(),
        performance.now() - metadata.startTime,
        error?.response?.status
      );
    }
  }
  trackErrorEvent(error, "http");
  return Promise.reject(error);
});

export const clearHttpCache = () => {
  responseCache.clear();
};
