/**
 * BrightAI Skills Registry
 * Reads all skills from .agents/skills/ dynamically and exposes them via API.
 * Used by /api/skills and /api/gateway-status endpoints.
 */

const fs = require('fs');
const path = require('path');

// Path to the skills directory (relative to the project root)
const SKILLS_DIR = path.resolve(__dirname, '../../.agents/skills');

// Cache configuration
const CACHE_TTL_MS = 60_000; // 60 seconds
let _cache = null;
let _cacheTimestamp = 0;

/**
 * Categorize a skill based on its name and description.
 * @param {string} name
 * @param {string} description
 * @returns {string}
 */
function categorizeSkill(name, description) {
  const text = `${name} ${description}`.toLowerCase();

  if (/seo|sitemap|schema|indexing|hreflang|crawl|search/.test(text)) return 'seo';
  if (/frontend|design|ui|ux|rtl|css|layout/.test(text)) return 'design';
  if (/content|review|validator|copy/.test(text)) return 'content';
  if (/deploy|render|hosting/.test(text)) return 'deployment';
  if (/link|path|import|internal/.test(text)) return 'integrity';
  if (/karpathy|guideline|best.?practice|react|vercel/.test(text)) return 'coding';

  return 'general';
}

/**
 * Extract triggers/keywords from a description string.
 * Looks for quoted terms and Arabic trigger words.
 * @param {string} description
 * @returns {string[]}
 */
function extractTriggers(description) {
  const triggers = new Set();

  // Extract quoted English terms
  const quotedMatches = description.match(/"([^"]+)"/g);
  if (quotedMatches) {
    for (const match of quotedMatches) {
      triggers.add(match.replace(/"/g, '').trim());
    }
  }

  // Extract Arabic triggers after أو or commas in Arabic context
  const arabicMatches = description.match(/[\u0600-\u06FF][\u0600-\u06FF\s]+/g);
  if (arabicMatches) {
    for (const match of arabicMatches) {
      const trimmed = match.trim();
      if (trimmed.length > 3) {
        triggers.add(trimmed);
      }
    }
  }

  return [...triggers].slice(0, 20); // Cap at 20 triggers
}

/**
 * Parse YAML frontmatter from a SKILL.md file content.
 * Handles multi-line description fields using > (block scalar).
 * @param {string} content
 * @returns {{ name: string, description: string }}
 */
function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return { name: '', description: '' };

  const fmBlock = fmMatch[1];
  let name = '';
  let description = '';

  // Extract name
  const nameMatch = fmBlock.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  // Extract description — may be single-line or multi-line (using >)
  const descMatch = fmBlock.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    const firstLine = descMatch[1].trim();
    if (firstLine === '>' || firstLine === '|') {
      // Multi-line block scalar: collect indented lines after "description: >"
      const lines = fmBlock.split('\n');
      const descLineIdx = lines.findIndex(l => /^description:/.test(l));
      const collected = [];
      for (let i = descLineIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s+/.test(line)) {
          collected.push(line.trim());
        } else {
          break;
        }
      }
      description = collected.join(' ');
    } else {
      description = firstLine;
    }
  }

  return { name, description };
}

/**
 * Scan the skills directory and build the registry.
 * @returns {{ skills: object[], scannedAt: number }}
 */
function scanSkills() {
  const skills = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    return { skills, scannedAt: Date.now() };
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(SKILLS_DIR, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    const refsDir = path.join(skillDir, 'references');

    const skillEntry = {
      name: entry.name.trim(),
      description: '',
      path: `.agents/skills/${entry.name.trim()}`,
      status: 'missing',
      hasReferences: fs.existsSync(refsDir),
      category: 'general',
      triggers: []
    };

    if (fs.existsSync(skillMdPath)) {
      try {
        const content = fs.readFileSync(skillMdPath, 'utf8');
        const { name, description } = parseFrontmatter(content);

        if (name) skillEntry.name = name;
        skillEntry.description = description;
        skillEntry.status = 'available';
        skillEntry.category = categorizeSkill(skillEntry.name, description);
        skillEntry.triggers = extractTriggers(description);
      } catch (_readError) {
        skillEntry.status = 'error';
      }
    }

    skills.push(skillEntry);
  }

  // Sort alphabetically by name
  skills.sort((a, b) => a.name.localeCompare(b.name));

  return { skills, scannedAt: Date.now() };
}

/**
 * Get the skills list (cached).
 * @param {boolean} [forceRefresh=false]
 * @returns {{ skills: object[], scannedAt: number }}
 */
function getSkills(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _cache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cache;
  }

  _cache = scanSkills();
  _cacheTimestamp = now;
  return _cache;
}

/**
 * Get a summary for gateway-status.
 * @returns {{ total: number, available: number, categories: object }}
 */
function getSkillsSummary() {
  const { skills } = getSkills();
  const available = skills.filter(s => s.status === 'available').length;

  const categories = {};
  for (const skill of skills) {
    categories[skill.category] = (categories[skill.category] || 0) + 1;
  }

  return { total: skills.length, available, categories };
}

module.exports = {
  getSkills,
  getSkillsSummary,
  SKILLS_DIR
};
