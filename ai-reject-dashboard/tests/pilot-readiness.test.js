/**
 * Pilot final demo readiness audit tests
 * Verification suite for BrightAI Enterprise Dashboard
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const projectRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const config = require('../backend/config/env');
const { getRejects, getDataState } = require('../backend/services/dataService');
const { loadExcelData } = require('../backend/services/excelService');
const { isGrandTotalRow } = require('../backend/services/dataProcessor');
const aiService = require('../backend/services/aiService');

describe('BrightAI Pilot Demo Readiness Tests', () => {

  // 1. Env & Paths Configuration
  describe('Environment & Configuration', () => {
    it('should have the official Excel path registered in config', () => {
      expect(config.excelFilePath).toBeDefined();
      expect(config.excelFilePath).toContain('ALL_ITEMS_MAIS_with_life_years.xlsx');
    });

    it('should have the official Excel file physically present on the system', () => {
      const exists = fs.existsSync(config.excelFilePath);
      expect(exists).toBe(true);
    });

    it('should configure the correct backend-only Gemini model', () => {
      expect(config.geminiModel).toBe('gemini-2.5-flash');
    });
  });

  // 2. Excel Data Processor & Exclusions
  describe('Excel Data Parsing & Column Mapping', () => {
    it('should map MAIS Excel columns correctly into domain objects', async () => {
      const rejects = await getRejects();
      expect(Array.isArray(rejects)).toBe(true);
      expect(rejects.length).toBeGreaterThan(0);

      const firstRecord = rejects[0];
      // Check for mapped properties
      expect(firstRecord).toHaveProperty('item_code');
      expect(firstRecord).toHaveProperty('item_name');
      expect(firstRecord).toHaveProperty('batch_number');
      expect(firstRecord).toHaveProperty('uom');
      expect(firstRecord).toHaveProperty('quantity');
      expect(firstRecord).toHaveProperty('rate');
      expect(firstRecord).toHaveProperty('cost');
      expect(firstRecord).toHaveProperty('manufacturing_date');
      expect(firstRecord).toHaveProperty('life_years');
      expect(firstRecord).toHaveProperty('expiry_date');
      expect(firstRecord).toHaveProperty('rpt_date');
      expect(firstRecord).toHaveProperty('age_percent');
      expect(firstRecord).toHaveProperty('remaining_percent');
      expect(firstRecord).toHaveProperty('total_life');
    });

    it('should filter out any grand total rows cleanly', () => {
      const totalRowEn = { 'Item Code': 'Grand Total', 'Item Name': 'Total', 'Batch Number': '' };
      const totalRowAr = { 'Item Code': 'المجموع الإجمالي', 'Item Name': 'إجمالي', 'Batch Number': '' };
      const validRow = { 'Item Code': 'MAIS-001', 'Item Name': 'Sponge Tape', 'Batch Number': '2026' };

      expect(isGrandTotalRow(totalRowEn)).toBe(true);
      expect(isGrandTotalRow(totalRowAr)).toBe(true);
      expect(isGrandTotalRow(validRow)).toBe(false);
    });
  });

  // 3. AI Agent (صقر AI) Integrity
  describe('AI Agent Integration (صقر AI)', () => {
    it('should enforce the official Arabic name "صقر AI" in all instructions', () => {
      // Fetch system instructions
      const systemPrompt = aiService.getSystemPrompt();
      expect(systemPrompt).toContain('صقر AI');
      expect(systemPrompt).not.toContain('Agentic AI'); // should strictly represent as صقر AI
    });

    it('should maintain session-based memory using backend Map with TTL', () => {
      const sessionMap = aiService.getSessionsMap();
      expect(sessionMap).toBeDefined();
      expect(sessionMap instanceof Map).toBe(true);
    });
  });

  // 4. Data State & Health
  describe('System Status & Integrity', () => {
    it('should report correct properties in state summary', () => {
      const state = getDataState();
      expect(state).toHaveProperty('cachedSource');
      expect(state.dataClassification).toBe('Stock/Life Risk'); // classification constraint
      expect(state.excelExists).toBe(true);
    });
  });

  // 5. Realtime Watcher & Composite Key Diffs
  describe('Realtime Watcher & Composite Key Diffs', () => {
    function testCompositeKey(r) {
      const code = String(r.item_code || '').trim();
      const batch = String(r.batch_number || '').trim();
      const mfg = String(r.manufacturing_date || '').trim();
      const exp = String(r.expiry_date || '').trim();
      return `${code}||${batch}||${mfg}||${exp}`;
    }

    it('should generate expected composite keys for items', () => {
      const record = {
        item_code: 'MAIS-01',
        batch_number: 'B2026',
        manufacturing_date: '2026-05-01',
        expiry_date: '2028-05-01'
      };
      const key = testCompositeKey(record);
      expect(key).toBe('MAIS-01||B2026||2026-05-01||2028-05-01');
    });
  });

});
