/**
 * page-view.js — DEPRECATED (2026-07-18, CRO audit Prompt 5).
 *
 * Replaced by src/scripts/analytics.js, which handles page_view in addition
 * to every other event in the unified taxonomy. This file is kept as a
 * no-op so any stale <script> reference in the build doesn't throw.
 *
 * If you see this file being imported anywhere, the import is stale and
 * should be replaced with the unified analytics module.
 */
(function () {
  'use strict';
  // intentional no-op — analytics.js owns page_view now
})();
