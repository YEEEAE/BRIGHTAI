import {createPublicMeasurement} from './measurement-core.mjs';
const id = 'G-9LMB4PGTWJ';
if (!window.__brightaiMeasurementInstalled) {
  window.__brightaiMeasurementInstalled = true;
  let ready = false, stopped = false, loaded = false, checking = false;
  window['ga-disable-' + id] = true;
  const stop = () => {
    stopped = true; ready = false; window['ga-disable-' + id] = true;
    // Do not replay pending interactions after an emergency stop.
    if (!loaded) window.dataLayer?.splice(0);
  };
  const enabled = () => ready && !stopped && window['ga-disable-' + id] !== true;
  const track = createPublicMeasurement({
    enabled,
    send: (name, properties) => window.gtag?.('event', name, properties),
  });
  window.addEventListener('brightai:measurement-stop', stop);
  window.addEventListener('brightai:measurement', e => {
    const {name, properties, eventId} = e.detail || {};
    const accepted = track(name, properties, eventId);
    if (e.detail) e.detail.accepted = accepted;
  });
  async function check() {
    if (checking || stopped) return;
    checking = true;
    try {
      let response = await fetch('/api/measurement-status/', {cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer', signal:AbortSignal.timeout(4000)});
      // Static hosting has no runtime env. Its explicit public control remains on.
      if (response.status === 404) response = await fetch('/measurement-control.json', {cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer', signal:AbortSignal.timeout(4000)});
      if (!response.ok) throw Error('STATUS_UNAVAILABLE');
      const state = await response.json();
      if (state.enabled !== true) { stop(); return; }
      ready = true; window['ga-disable-' + id] = false;
      if (!loaded) {
        loaded = true;
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
        document.head.append(script);
      }
    } catch {
      // Pause transport on a failed check; normal traffic resumes after recovery.
      ready = false; window['ga-disable-' + id] = true;
    } finally { checking = false; }
  }
  if (!/^\/(?:app|auth|api)(?:\/|$)/i.test(window.location.pathname)) {
    const controlSelector = 'a[href],area[href],button,summary,input[type="button"],input[type="submit"],input[type="reset"],input[type="image"],[role="button"],[role="link"]';
    const trackClick = event => {
      if (!event.isTrusted || !enabled()) return;
      const path = event.composedPath();
      const control = path.find(element => element.matches?.(controlSelector));
      if (!control) return;
      const link = control.matches('a[href],area[href]');
      if (event.type === 'auxclick' && (event.button !== 1 || !link)) return;

      const region = path.find(element => element.matches?.('header,nav,main,aside,footer'));
      const parameters = {
        send_to: id,
        element_type: link || control.matches('[role="link"]') ? 'link' : control.matches('summary') ? 'disclosure' : 'button',
        page_section: region?.localName ?? 'other',
      };
      if (link) {
        if (control.hasAttribute('download')) parameters.link_type = 'download';
        else {
          parameters.link_type = 'other';
          try {
            const destination = new URL(control.getAttribute('href'), document.baseURI);
            if (destination.protocol === 'mailto:') parameters.link_type = 'email';
            else if (destination.protocol === 'tel:') parameters.link_type = 'phone';
            else if (destination.protocol === 'http:' || destination.protocol === 'https:') {
              parameters.link_type = destination.origin === window.location.origin ? 'internal' : 'external';
            }
          } catch {
            // Keep the click count even when a link has an invalid destination.
          }
        }
      }
      window.gtag?.('event', 'site_click', parameters);
    };
    document.addEventListener('click', trackClick, {capture: true, passive: true});
    document.addEventListener('auxclick', trackClick, {capture: true, passive: true});
  }
  document.addEventListener('click', e => {
    const link = e.target?.closest?.('a');
    if (!link || e.defaultPrevented || e.detail > 1) return;
    const channel = link.dataset.measureChannel;
    const asset = link.dataset.measureAsset;
    if (channel) track('contact_channel_opened', {channel}, crypto.randomUUID());
    else if (asset) track('template_download_requested', {asset_code:asset, format:link.dataset.measureFormat}, crypto.randomUUID());
  });
  void check();
  setInterval(() => void check(), 15000);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) void check();});
}
