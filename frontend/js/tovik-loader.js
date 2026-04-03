(() => {
  "use strict";

  const currentScript = document.currentScript;
  if (!currentScript || window.__brightTovikQueued) return;

  window.__brightTovikQueued = true;

  const src = currentScript.dataset.src || "https://tovik.app/tovik.js";
  const events = ["pointerdown", "touchstart", "keydown", "scroll"];
  const listenerOptions = { once: true, passive: true };
  let loaded = false;

  const load = () => {
    if (loaded || document.querySelector(`script[src="${src}"]`)) return;
    loaded = true;

    events.forEach((eventName) => {
      window.removeEventListener(eventName, load, listenerOptions);
    });

    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.async = true;
    script.fetchPriority = "low";
    document.body.appendChild(script);
  };

  events.forEach((eventName) => {
    window.addEventListener(eventName, load, listenerOptions);
  });
})();
