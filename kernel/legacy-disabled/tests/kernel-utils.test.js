import { describe, expect, it, vi } from 'vitest';
import './setup.js';
import { loadKernelScript } from './setup.js';

function loadUtils() {
  loadKernelScript('kernel/assets/js/kernel-utils.js');
  return window.KernelUtils;
}

describe('KernelUtils', () => {
  it('escapes HTML tags and XSS payloads', () => {
    const utils = loadUtils();

    expect(utils.escapeHtml('<strong>BrightAI</strong>')).toBe('&lt;strong&gt;BrightAI&lt;/strong&gt;');
    expect(utils.escapeHtml(`"><img src=x onerror="alert('xss')">`)).toBe(
      '&quot;&gt;&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt;'
    );
    expect(utils.escapeHtml(null)).toBe('');
  });

  it('sanitizes dangerous HTML with the DOMParser fallback', () => {
    const utils = loadUtils();
    const result = utils.sanitizeHtml(`
      <section onclick="alert(1)">
        <a href="javascript:alert(1)" style="background:url(javascript:alert(1))">click</a>
        <script>alert('owned')</script>
        <p data-testid="safe" aria-label="safe">نص آمن</p>
      </section>
    `);

    expect(result).not.toContain('<script');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('background:url');
    expect(result).toContain('data-testid="safe"');
    expect(result).toContain('aria-label="safe"');
    expect(result).toContain('نص آمن');
  });

  it('uses DOMPurify.sanitize when DOMPurify is available', () => {
    const utils = loadUtils();
    window.DOMPurify = {
      sanitize: vi.fn(() => '<p>purified</p>'),
    };

    expect(utils.sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('<p>purified</p>');
    expect(window.DOMPurify.sanitize).toHaveBeenCalledWith(
      '<img src=x onerror=alert(1)>',
      expect.objectContaining({
        ALLOW_ARIA_ATTR: true,
        ALLOW_DATA_ATTR: true,
        ALLOWED_TAGS: expect.arrayContaining(['a', 'p', 'section']),
      })
    );
  });

  it('generates and persists user IDs and user names', () => {
    const utils = loadUtils();

    const firstId = utils.getUserId();
    const secondId = utils.getUserId();

    expect(firstId).toMatch(/^user-\d+-[a-z0-9]+$/);
    expect(secondId).toBe(firstId);
    expect(utils.getUserName()).toBe('مستخدم');
    expect(utils.getUserName('سارة')).toBe('سارة');
    expect(utils.getUserName()).toBe('سارة');
  });

  it('formats dates and numbers with the Arabic Saudi locale', () => {
    const utils = loadUtils();

    expect(utils.formatDate('2026-06-07T12:00:00.000Z')).toContain('٢٠٢٦');
    expect(utils.formatDate('2026-06-07T12:00:00.000Z')).toContain('يونيو');
    expect(utils.formatNumber(1234567)).toBe('١٬٢٣٤٬٥٦٧');
  });
});
