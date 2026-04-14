(function attachBrightAIRuntimeConfig(globalScope) {
  "use strict";

  if (!globalScope || globalScope.BrightAIRuntimeConfig) {
    return;
  }

  var LOCAL_DEV_API_BASE = "http://localhost:3000";
  var SAME_ORIGIN_API_BASE = "/";
  var LOCAL_HOSTNAMES = {
    localhost: true,
    "127.0.0.1": true,
    "0.0.0.0": true,
    "::1": true
  };

  function normalizeBase(value) {
    var normalizedValue = String(value || "").trim();
    if (normalizedValue === "/") {
      return "/";
    }
    return normalizedValue.replace(/\/+$/, "");
  }

  function isLocalHostname(hostname) {
    return Boolean(LOCAL_HOSTNAMES[String(hostname || "").trim().toLowerCase()]);
  }

  function getConfigObject() {
    if (!globalScope.BRIGHTAI_CONFIG || typeof globalScope.BRIGHTAI_CONFIG !== "object") {
      globalScope.BRIGHTAI_CONFIG = {};
    }
    return globalScope.BRIGHTAI_CONFIG;
  }

  function readConfiguredBase() {
    var directBase = normalizeBase(globalScope.BRIGHTAI_API_BASE);
    if (directBase) {
      return directBase;
    }

    var configBase = normalizeBase(getConfigObject().API_BASE_URL);
    if (configBase) {
      return configBase;
    }

    return "";
  }

  function createMissingConfigError() {
    return new Error(
      "عنوان BrightAI API غير مضبوط. عيّن window.BRIGHTAI_API_BASE أو BRIGHTAI_CONFIG.API_BASE_URL. في الإنتاج لا يوجد fallback تلقائي إلى origin الحالي."
    );
  }

  function resolveApiBase() {
    var configuredBase = readConfiguredBase();
    if (configuredBase) {
      return configuredBase;
    }

    var hostname =
      globalScope.location && typeof globalScope.location.hostname === "string"
        ? globalScope.location.hostname
        : "";

    if (isLocalHostname(hostname)) {
      return LOCAL_DEV_API_BASE;
    }

    return SAME_ORIGIN_API_BASE;
  }

  function syncGlobals() {
    var configObject = getConfigObject();
    var resolvedBase = resolveApiBase();

    configObject.API_BASE_URL = resolvedBase || "";
    configObject.API_BASE_ERROR = resolvedBase ? "" : createMissingConfigError().message;
    configObject.LOCAL_DEV_API_BASE = LOCAL_DEV_API_BASE;
    configObject.SAME_ORIGIN_API_BASE = SAME_ORIGIN_API_BASE;

    if (resolvedBase) {
      globalScope.BRIGHTAI_API_BASE = resolvedBase;
      delete globalScope.__BRIGHTAI_API_CONFIG_ERROR__;
    } else {
      globalScope.__BRIGHTAI_API_CONFIG_ERROR__ = configObject.API_BASE_ERROR;
    }

    return configObject;
  }

  function getApiBase() {
    var configObject = syncGlobals();
    if (configObject.API_BASE_URL) {
      return configObject.API_BASE_URL;
    }
    throw createMissingConfigError();
  }

  function ensureRelativePath(path) {
    var normalizedPath = String(path || "").trim();
    if (!normalizedPath) {
      throw new Error("مسار API مطلوب لبناء الرابط.");
    }
    if (/^https?:\/\//i.test(normalizedPath)) {
      throw new Error("يجب تمرير path نسبي فقط إلى buildApiUrl، وليس URL كاملاً.");
    }
    return normalizedPath.charAt(0) === "/" ? normalizedPath : "/" + normalizedPath;
  }

  function buildApiUrl(path) {
    var base = getApiBase();
    var normalizedPath = ensureRelativePath(path);
    if (base === "/") {
      return normalizedPath;
    }
    return base + normalizedPath;
  }

  function hasConfiguredApiBase() {
    try {
      return Boolean(getApiBase());
    } catch (error) {
      return false;
    }
  }

  function getApiConfigError() {
    syncGlobals();
    return globalScope.__BRIGHTAI_API_CONFIG_ERROR__ || "";
  }

  syncGlobals();

  globalScope.BrightAIRuntimeConfig = {
    LOCAL_DEV_API_BASE: LOCAL_DEV_API_BASE,
    normalizeBase: normalizeBase,
    resolveApiBase: resolveApiBase,
    getApiBase: getApiBase,
    buildApiUrl: buildApiUrl,
    hasConfiguredApiBase: hasConfiguredApiBase,
    getApiConfigError: getApiConfigError
  };
})(typeof window !== "undefined" ? window : globalThis);
