/**
 * DEPRECATED: Hardcoded demo data has been REMOVED.
 * All data now comes from the backend API (/api/rejects, /api/data/live-status).
 *
 * This file is intentionally kept empty. The frontend app.js handles:
 * - Loading data from API
 * - Falling back to an empty state with clear messaging when no data is available
 * - Showing data source badges (Excel Live | Cache | Demo Fallback)
 *
 * If you need demo data for offline testing, set EXCEL_FILE_PATH to a valid file
 * or the backend will automatically use a small built-in demo fallback with clear labeling.
 */
window.DEMO_DATA = null;
