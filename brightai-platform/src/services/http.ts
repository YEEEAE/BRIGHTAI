import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { APP_DEFAULT_LOCALE } from "../constants/app";

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

http.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (method !== "get") {
    return config;
  }
  if (config.headers && "x-cache" in config.headers) {
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
  if (method !== "get") {
    return response;
  }
  const key = buildCacheKey(response.config);
  responseCache.set(key, { timestamp: Date.now(), data: response.data });
  return response;
});

export const clearHttpCache = () => {
  responseCache.clear();
};
