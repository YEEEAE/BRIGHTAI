// Sanitized markdown-subset renderer for SOP/WI document content (PROMPT 41,
// page reference §40). The app has no markdown library (package.json), so this
// module renders a deliberately small, safe subset — the exact content kinds
// the editor promises: headings, paragraphs, numbered procedures, bullets,
// tables, warnings, notes, checklists and safe links.
//
// SECURITY MODEL: this is a generate-and-escape renderer, NOT a pass-through
// sanitizer. User input never reaches the output as HTML: every text node is
// HTML-escaped, every tag is produced by this module from a hard-coded
// allowlist, and no raw HTML/attributes ever pass through. That makes it
// structurally immune to <script>, event handlers and attribute injection.
// URLs are additionally validated against an allowlist (http/https/mailto/
// relative) so the only hyperlinks that render are safe ones. The renderer
// returns the sanitized HTML that the service stores in
// lab_document_versions.content_html_sanitized (the source of truth is always
// content_md; the HTML is a server-side cache, migration 013).

import { LAB_DOCUMENT_CONTENT_MAX } from './policy';

export { LAB_DOCUMENT_CONTENT_MAX };

/** Escape a text node so it can never be interpreted as markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Only these URL schemes may become hyperlinks. Relative links (/, #, ./ and
 * ../) are allowed — they stay on the same site. Anything else (javascript:,
 * data:, vbscript:, ...) renders as escaped text, never as an <a href>.
 */
const SAFE_LINK_SCHEMES = new Set(['http', 'https', 'mailto']);

export function isSafeLinkUrl(raw: string): boolean {
  const url = raw.trim();
  if (url === '') return false;
  if (/^(\.{0,2}\/|#|\/)/.test(url)) return true;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  if (!scheme) return false;
  return SAFE_LINK_SCHEMES.has(scheme[1].toLowerCase());
}

/** Inline-safe hyperlink with rel="noopener noreferrer" (external targets open in a new tab). */
function linkHtml(url: string, label: string): string {
  const href = escapeHtml(url.trim());
  const isExternal = /^https?:/i.test(url.trim());
  return `<a href="${href}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
}

/**
 * Inline renderer for a single text run: bold, italic, inline code and links.
 * Text is escaped by default; only the four inline tokens are interpreted, and
 * each one is re-rendered through the same escapers.
 */
function renderInline(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    // Inline code: `code`
    if (ch === '`') {
      const end = source.indexOf('`', i + 1);
      if (end !== -1) {
        out += `<code>${escapeHtml(source.slice(i + 1, end))}</code>`;
        i = end + 1;
        continue;
      }
      out += escapeHtml(ch);
      i += 1;
      continue;
    }
    // Link: [label](url) — url must pass isSafeLinkUrl or it renders as text.
    if (ch === '[') {
      const close = source.indexOf(']', i + 1);
      if (close !== -1 && source[close + 1] === '(') {
        const closeParen = source.indexOf(')', close + 2);
        if (closeParen !== -1) {
          const label = source.slice(i + 1, close);
          const url = source.slice(close + 2, closeParen);
          if (isSafeLinkUrl(url)) {
            out += linkHtml(url, renderInline(label));
            i = closeParen + 1;
            continue;
          }
        }
      }
    }
    // Bold: **text**
    if (ch === '*' && source[i + 1] === '*') {
      const end = source.indexOf('**', i + 2);
      if (end !== -1) {
        out += `<strong>${renderInline(source.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    }
    // Italic: *text*
    if (ch === '*' && source[i + 1] !== '*') {
      const end = source.indexOf('*', i + 1);
      if (end !== -1) {
        out += `<em>${renderInline(source.slice(i + 1, end))}</em>`;
        i = end + 1;
        continue;
      }
    }
    out += escapeHtml(ch);
    i += 1;
  }
  return out;
}

interface PipeRow {
  cells: string[];
}

/** Split a pipe-table line into cells. */
function splitPipeRow(line: string): string[] {
  const trimmed = line.trim();
  const body = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return body.split('|').map((c) => c.trim());
}

/** True when a line is a GFM table separator (--- / :--: etc). */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return false;
  const cells = splitPipeRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

/**
 * Render the document content subset (headings / paragraphs / numbered steps /
 * bullets / tables / warnings / notes / checklists / safe links) to sanitized
 * HTML. Content length is enforced against LAB_DOCUMENT_CONTENT_MAX.
 */
export function renderDocumentContent(markdown: string): string {
  const content = typeof markdown === 'string' ? markdown : '';
  if (content.length > LAB_DOCUMENT_CONTENT_MAX) {
    throw new Error(`Document content must be ${LAB_DOCUMENT_CONTENT_MAX} characters or fewer.`);
  }
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') {
      i += 1;
      continue;
    }

    // Heading: #..###### → <h2>..<h6> (page already has a single <h1>).
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Pipe table: header row + separator row.
    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitPipeRow(lines[i]);
      i += 2;
      const rows: PipeRow[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim() !== '') {
        rows.push({ cells: splitPipeRow(lines[i]) });
        i += 1;
      }
      const ths = header.map((h) => `<th scope="col">${renderInline(h)}</th>`).join('');
      const trs = rows
        .map((r) => `<tr>${r.cells.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
        .join('');
      out.push(`<div class="doc-table-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`);
      continue;
    }

    // Blockquote → warning/note callout or plain blockquote.
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const first = quoteLines[0] ?? '';
      const marker = /^\[!(WARNING|NOTE|CAUTION|INFO|TIP)\]\s*$/.exec(first);
      if (marker) {
        const kind = marker[1].toUpperCase();
        const body = renderInline(quoteLines.slice(1).join(' '));
        const cls = kind === 'WARNING' || kind === 'CAUTION' ? 'doc-callout-warning' : 'doc-callout-note';
        out.push(`<div class="doc-callout ${cls}"><p class="doc-callout-label">${kind === 'WARNING' || kind === 'CAUTION' ? 'Warning' : 'Note'}</p><p>${body}</p></div>`);
      } else {
        out.push(`<blockquote>${renderInline(quoteLines.join(' '))}</blockquote>`);
      }
      continue;
    }

    // Checklist item: "- [ ]" / "- [x]".
    const checklist = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(trimmed);
    if (checklist) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(lines[i].trim());
        if (!m) break;
        const checked = m[1].toLowerCase() === 'x';
        const box = checked
          ? '<span class="doc-checkbox doc-checkbox-checked" aria-hidden="true">✓</span>'
          : '<span class="doc-checkbox" aria-hidden="true"></span>';
        items.push(`<li><label>${box}<span>${renderInline(m[2])}</span></label></li>`);
        i += 1;
      }
      out.push(`<ul class="doc-checklist">${items.join('')}</ul>`);
      continue;
    }

    // Bullet list.
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = /^[-*]\s+(.*)$/.exec(t);
        if (!m) break;
        items.push(`<li>${renderInline(m[1])}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Numbered procedure: "1. step".
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = /^\d+\.\s+(.*)$/.exec(t);
        if (!m) break;
        items.push(`<li>${renderInline(m[1])}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Paragraph: accumulate until a blank line or a new block marker.
    const para: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === '') break;
      if (/^(#{1,6})\s/.test(t)) break;
      if (t.startsWith('>')) break;
      if (/^[-*]\s+\[[ xX]\]\s/.test(t)) break;
      if (/^[-*]\s+/.test(t)) break;
      if (/^\d+\.\s+/.test(t)) break;
      para.push(t);
      i += 1;
    }
    if (para.length > 0) out.push(`<p>${renderInline(para.join(' '))}</p>`);
  }

  return out.join('\n');
}