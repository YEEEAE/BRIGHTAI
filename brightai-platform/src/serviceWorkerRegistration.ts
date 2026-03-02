// تسجيل Service Worker لدعم العمل دون اتصال وتحسين الأداء

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export const register = (config?: Config) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
      navigator.serviceWorker.ready.then(() => {
        console.info("Service Worker يعمل في بيئة التطوير المحلية.");
      });
    } else {
      registerValidSW(swUrl, config);
    }
  });
};

const registerValidSW = (swUrl: string, config?: Config) => {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
            } else if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch(() => {
      // تجاهل أخطاء التسجيل للحفاظ على استقرار التطبيق
    });
};

const checkValidServiceWorker = (swUrl: string, config?: Config) => {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (response.status === 404 || (contentType && !contentType.includes("javascript"))) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      // عند عدم الاتصال يتم الاعتماد على النسخة المخزنة مؤقتاً
    });
};

export const unregister = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch(() => {
        // تجاهل أخطاء إلغاء التسجيل
      });
  }
};
