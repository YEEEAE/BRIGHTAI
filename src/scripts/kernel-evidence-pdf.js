/**
 * src/scripts/kernel-evidence-pdf.js — PROMPT-11: PDF.js viewer for /kernel/evidence/.
 *
 * Replaces the slow iframe srcdoc preview with a real PDF.js canvas renderer:
 *   - Lazy-loads pdfjs-dist + pdf-lib (dynamic import) only when the preview
 *     modal opens — no cost on page load.
 *   - Generates a real PDF from the evidence metadata via pdf-lib (the demo
 *     items have no physical PDF file), then renders it with pdfjs-dist.
 *   - Controls: prev/next page, zoom in/out, RTL-aware page navigation.
 *   - Mobile-friendly: controls wrap, canvas scales to container width.
 *
 * CSP: worker-src 'self' blob: allows the worker from /js/pdf.worker.mjs
 * (same origin). script-src 'self' allows the Astro-bundled module.
 *
 * Architecture (per brain.md CSP-FIX rule): this file lives in src/scripts/
 * and is imported via a <script> tag in evidence.astro so Astro bundles the
 * npm deps (pdfjs-dist, pdf-lib). It is NOT a public/js static file because
 * it imports npm packages that must be bundled.
 *
 * Determinism: no Math.random/Date.now in the PDF generation — the PDF
 * content is derived purely from the evidence metadata passed in.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Set the worker source to the same-origin static copy (CSP-safe).
pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.mjs';

// ── Small polyfill for Promise.withResolvers (pdfjs-dist v6 needs it) ──
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

/**
 * Build a real PDF (via pdf-lib) from evidence metadata. Deterministic —
 * content derived only from the passed data. Returns a Uint8Array.
 *
 * @param {object} data - Evidence metadata (id, title, trace, hash, query,
 *   status, risk, sector, pack, retention, cert, signed, size).
 * @returns {Promise<Uint8Array>} PDF bytes.
 */
async function buildEvidencePdf(data) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  const mint = rgb(0.18, 0.83, 0.65);   // #2dd4a7
  const ink = rgb(0.95, 0.97, 1);       // #f2f6ff
  const mid = rgb(0.65, 0.71, 0.8);     // #a7b4cc
  const dim = rgb(0.4, 0.45, 0.56);     // #66748f

  // Header
  page.drawText('BrightAI Kernel — Evidence File', { x: margin, y, size: 20, font: bold, color: mint });
  y -= 28;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: mid });
  y -= 24;

  const label = (text) => {
    page.drawText(text.toUpperCase(), { x: margin, y, size: 8, font: bold, color: dim });
    y -= 14;
  };
  const value = (text) => {
    page.drawText(String(text || '—'), { x: margin, y, size: 11, font, color: ink });
    y -= 22;
  };

  label('Evidence ID');
  value(data.id);
  label('Title');
  value(data.title);
  label('Query');
  value(data.query);
  label('Trace ID');
  value(data.trace);
  label('Hash (SHA-256)');
  value(data.hash);
  label('Risk Score');
  value(data.risk + ' / 100');
  label('Status');
  value(data.status);
  label('Sector');
  value(data.sector);
  label('Compliance Pack');
  value(data.pack);
  label('Retention');
  value(data.retention);
  label('Certificate');
  value(data.cert);
  label('Size');
  value(data.size);
  label('Signed');
  value(data.signed);

  // Footer
  page.drawLine({ start: { x: margin, y: margin + 20 }, end: { x: width - margin, y: margin + 20 }, thickness: 1, color: mid });
  page.drawText('هذا ملف تجريبي — في الإنتاج يُولّد فعلياً من Kernel API.', {
    x: margin, y: margin, size: 8, font, color: dim,
  });

  return doc.save();
}

/**
 * Render a single page of a PDF document to a canvas at the given scale.
 *
 * @param {import('pdfjs-dist').PDFDocumentProxy} pdf - Loaded PDF document.
 * @param {number} pageNumber - 1-based page number.
 * @param {HTMLCanvasElement} canvas - Target canvas.
 * @param {number} scale - Zoom scale.
 * @returns {Promise<void>}
 */
async function renderPage(pdf, pageNumber, canvas, scale) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  // Match canvas backing store to the viewport (devicePixelRatio-aware).
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  await page.render({ canvasContext: ctx, viewport }).promise;
}

/**
 * Initialize the PDF viewer inside the preview modal. Called when the
 * preview modal opens with evidence data.
 *
 * @param {object} data - Evidence metadata (same shape as buildEvidencePdf).
 * @param {HTMLElement} root - The preview modal root element.
 * @returns {Promise<void>}
 */
export async function initPdfViewer(data, root) {
  const canvas = root.querySelector('[data-kernel-evidence-pdf-canvas]');
  const pageLabel = root.querySelector('[data-kernel-evidence-pdf-page]');
  const prevBtn = root.querySelector('[data-kernel-evidence-pdf-prev]');
  const nextBtn = root.querySelector('[data-kernel-evidence-pdf-next]');
  const zoomInBtn = root.querySelector('[data-kernel-evidence-pdf-zoom-in]');
  const zoomOutBtn = root.querySelector('[data-kernel-evidence-pdf-zoom-out]');
  const loading = root.querySelector('[data-kernel-evidence-pdf-loading]');
  const errorBox = root.querySelector('[data-kernel-evidence-pdf-error]');
  const viewer = root.querySelector('[data-kernel-evidence-pdf-viewer]');

  if (!canvas || !viewer) return;

  // Reset state.
  if (loading) loading.hidden = false;
  if (errorBox) errorBox.hidden = true;
  if (viewer) viewer.hidden = true;

  let pdf = null;
  let currentPage = 1;
  let scale = 1.5;

  const updateControls = () => {
    if (!pdf) return;
    if (pageLabel) pageLabel.textContent = currentPage + ' / ' + pdf.numPages;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= pdf.numPages;
  };

  const render = async () => {
    if (!pdf) return;
    await renderPage(pdf, currentPage, canvas, scale);
    updateControls();
  };

  try {
    // Build the PDF bytes from evidence metadata (deterministic).
    const bytes = await buildEvidencePdf(data);
    // Load into pdfjs-dist.
    pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    currentPage = 1;
    scale = 1.5;
    if (loading) loading.hidden = true;
    if (viewer) viewer.hidden = false;
    await render();
  } catch (err) {
    if (loading) loading.hidden = true;
    if (errorBox) {
      errorBox.hidden = false;
      errorBox.textContent = 'تعذّر عرض ملف الدليل. جرّب التنزيل بدلاً من ذلك.';
    }
    // eslint-disable-next-line no-console
    console.error('[kernel-evidence-pdf] render failed:', err);
    return;
  }

  // ── Controls (RTL-aware: prev/next follow reading direction) ──
  const onPrev = () => { if (currentPage > 1) { currentPage -= 1; render(); } };
  const onNext = () => { if (pdf && currentPage < pdf.numPages) { currentPage += 1; render(); } };
  const onZoomIn = () => { scale = Math.min(scale + 0.25, 4); render(); };
  const onZoomOut = () => { scale = Math.max(scale - 0.25, 0.5); render(); };

  if (prevBtn) prevBtn.addEventListener('click', onPrev);
  if (nextBtn) nextBtn.addEventListener('click', onNext);
  if (zoomInBtn) zoomInBtn.addEventListener('click', onZoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', onZoomOut);

  // Keyboard: ArrowLeft/ArrowRight follow RTL (right = previous, left = next).
  const onKey = (e) => {
    if (e.key === 'ArrowRight') onPrev();
    else if (e.key === 'ArrowLeft') onNext();
    else if (e.key === '+' || e.key === '=') onZoomIn();
    else if (e.key === '-') onZoomOut();
  };
  root.addEventListener('keydown', onKey);

  // Cleanup listeners when the modal closes (avoid leaks).
  const cleanup = () => {
    root.removeEventListener('keydown', onKey);
    if (prevBtn) prevBtn.removeEventListener('click', onPrev);
    if (nextBtn) nextBtn.removeEventListener('click', onNext);
    if (zoomInBtn) zoomInBtn.removeEventListener('click', onZoomIn);
    if (zoomOutBtn) zoomOutBtn.removeEventListener('click', onZoomOut);
    if (pdf) { try { pdf.destroy(); } catch (_) { /* noop */ } }
    pdf = null;
  };
  root.addEventListener('kernel:evidence-pdf-close', cleanup, { once: true });
}