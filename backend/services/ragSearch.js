const fs = require('fs');
const path = require('path');
const { config } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');

const SITE_ROOT = path.resolve(__dirname, '../..');
const PAGES_ROOT = path.join(SITE_ROOT, 'frontend/pages');
const DOCS_ROOT = path.join(SITE_ROOT, 'docs');
const ROOT_HTML_FILES = ['index.html', 'docs.html'];

const INDEX_REFRESH_MS = clampNumber(process.env.RAG_INDEX_REFRESH_MS, 5 * 60 * 1000, 30 * 1000, 60 * 60 * 1000);
const MAX_FILES = clampNumber(process.env.RAG_MAX_FILES, 180, 20, 2000);
const MAX_FILE_BYTES = clampNumber(process.env.RAG_MAX_FILE_BYTES, 500 * 1024, 50 * 1024, 3 * 1024 * 1024);
const CHUNK_SIZE = clampNumber(process.env.RAG_CHUNK_SIZE_CHARS, 900, 300, 1600);
const CHUNK_OVERLAP = clampNumber(process.env.RAG_CHUNK_OVERLAP_CHARS, 180, 50, 500);
const MIN_CHUNK_CHARS = clampNumber(process.env.RAG_MIN_CHUNK_CHARS, 130, 80, 600);
const DEFAULT_RETRIEVAL_LIMIT = 10;

const SEARCH_SYSTEM_PROMPT = `
أنت محرك بحث RAG لموقع BrightAI.
أجب اعتماداً فقط على المقاطع المسترجعة.

أعد JSON فقط بهذا الشكل:
{
  "answer": "إجابة عربية مباشرة",
  "sources": [
    {
      "sourceId": "S1",
      "title": "عنوان المصدر",
      "url": "/path",
      "quote": "مقتطف قصير داعم"
    }
  ],
  "relatedResults": [
    {
      "title": "عنوان صفحة",
      "url": "/path",
      "description": "وصف مختصر"
    }
  ]
}

قواعد مهمة:
- استخدم sourceId من المقاطع المعطاة فقط.
- لا تضف روابط خارجية.
- إذا المعلومات ناقصة، صرّح بذلك بوضوح.
- answer من 2 إلى 4 جمل كحد أقصى.
- sources من 2 إلى 5 عناصر عند توفرها.
`;

let indexCache = {
  builtAt: 0,
  entries: [],
  idf: new Map()
};

function isGeminiConfigured() {
  return !!config.gemini.apiKey && config.gemini.apiKey !== 'YOUR_KEY_HERE';
}

function clampNumber(rawValue, defaultValue, min, max) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return defaultValue;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeArabic(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '');
}

function normalizeForSearch(text) {
  return normalizeArabic(text)
    .replace(/[^0-9a-z\u0600-\u06ff\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const normalized = normalizeForSearch(text);
  if (!normalized) return [];

  return normalized
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 2);
}

function decodeHtmlEntities(value) {
  if (!value) return '';

  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    });
}

function extractTagContent(html, regex) {
  const match = html.match(regex);
  return decodeHtmlEntities(match?.[1] || '').replace(/\s+/g, ' ').trim();
}

function extractMetaDescription(html) {
  const metaRegex = /<meta[^>]+(?:name|property)=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i;
  return extractTagContent(html, metaRegex);
}

function cleanHtmlToText(html) {
  if (!html) return '';

  const cleaned = String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  return decodeHtmlEntities(cleaned).replace(/\s+/g, ' ').trim();
}

function chunkText(text) {
  if (!text) return [];

  const chunks = [];
  const safeStep = Math.max(100, CHUNK_SIZE - CHUNK_OVERLAP);
  let cursor = 0;

  while (cursor < text.length) {
    const fragment = text.slice(cursor, cursor + CHUNK_SIZE).trim();
    if (fragment.length >= MIN_CHUNK_CHARS) {
      chunks.push(fragment);
    }

    if (cursor + CHUNK_SIZE >= text.length) break;
    cursor += safeStep;
  }

  return chunks;
}

function trimSnippet(text, maxChars = 260) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars).trim()}...`;
}

function normalizeUrlFromPath(filePath) {
  const relative = path.relative(SITE_ROOT, filePath).replace(/\\/g, '/');
  if (!relative) return '/';
  return `/${relative}`;
}

function filePathPriority(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  let score = 0;

  if (normalized.includes('/sectors/')) score += 10;
  if (normalized.includes('/docs/')) score += 8;
  if (normalized.includes('/smart-medical-archive/')) score += 9;
  if (normalized.includes('/smart-automation/')) score += 8;
  if (normalized.includes('/ai-agent/')) score += 8;
  if (normalized.includes('/consultation/')) score += 7;
  if (normalized.includes('/blog/')) score += 4;
  if (normalized.includes('/blogger/')) score += 1;
  if (normalized.endsWith('/index.html')) score += 2;

  return score;
}

function walkHtmlFiles(startDir) {
  const files = [];

  if (!fs.existsSync(startDir)) {
    return files;
  }

  const stack = [startDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry || !entry.name || entry.name.startsWith('.')) continue;

      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        files.push(absolutePath);
      }
    }
  }

  return files;
}

function collectCandidateFiles() {
  const files = [];

  for (const fileName of ROOT_HTML_FILES) {
    const filePath = path.join(SITE_ROOT, fileName);
    if (fs.existsSync(filePath)) files.push(filePath);
  }

  const pageFiles = walkHtmlFiles(PAGES_ROOT);
  const docsFiles = walkHtmlFiles(DOCS_ROOT);
  pageFiles.sort((a, b) => {
    const byPriority = filePathPriority(b) - filePathPriority(a);
    if (byPriority !== 0) return byPriority;
    return a.localeCompare(b);
  });
  docsFiles.sort((a, b) => {
    const byPriority = filePathPriority(b) - filePathPriority(a);
    if (byPriority !== 0) return byPriority;
    return a.localeCompare(b);
  });

  const combined = files.concat(docsFiles, pageFiles);
  const deduped = [];
  const seen = new Set();

  for (const filePath of combined) {
    if (seen.has(filePath)) continue;
    seen.add(filePath);
    deduped.push(filePath);
    if (deduped.length >= MAX_FILES) break;
  }

  return deduped;
}

function buildTf(tokens) {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function buildIndex() {
  const entries = [];
  const candidateFiles = collectCandidateFiles();
  let docCounter = 0;

  for (const filePath of candidateFiles) {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || stats.size <= 0 || stats.size > MAX_FILE_BYTES) {
        continue;
      }

      const html = fs.readFileSync(filePath, 'utf8');
      const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || 'صفحة BrightAI';
      const h1 = extractTagContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const description = extractMetaDescription(html);
      const plainText = cleanHtmlToText(html);

      if (!plainText || plainText.length < MIN_CHUNK_CHARS) continue;

      const combinedText = [title, h1, description, plainText].filter(Boolean).join('. ');
      const chunks = chunkText(combinedText);
      const url = normalizeUrlFromPath(filePath);

      for (const chunk of chunks) {
        const tokens = tokenize(`${title} ${description} ${chunk}`);
        if (tokens.length < 3) continue;

        docCounter += 1;
        entries.push({
          id: `doc-${docCounter}`,
          title,
          description: description || trimSnippet(chunk, 140),
          url,
          chunk,
          snippet: trimSnippet(chunk, 260),
          tokens,
          tf: buildTf(tokens),
          tokenSet: new Set(tokens),
          weights: new Map(),
          norm: 1
        });
      }
    } catch (error) {
      continue;
    }
  }

  const idf = new Map();
  if (!entries.length) {
    return {
      builtAt: Date.now(),
      entries: [],
      idf
    };
  }

  const df = new Map();
  for (const entry of entries) {
    for (const term of entry.tokenSet) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const totalDocs = entries.length;
  for (const [term, docFreq] of df.entries()) {
    const value = Math.log((totalDocs + 1) / (docFreq + 1)) + 1;
    idf.set(term, value);
  }

  for (const entry of entries) {
    let normSq = 0;
    for (const [term, count] of entry.tf.entries()) {
      const idfValue = idf.get(term) || 0;
      if (!idfValue) continue;
      const weight = (1 + Math.log(count)) * idfValue;
      entry.weights.set(term, weight);
      normSq += weight * weight;
    }
    entry.norm = Math.sqrt(normSq) || 1;
  }

  return {
    builtAt: Date.now(),
    entries,
    idf
  };
}

function getIndex() {
  const isFresh = (
    Array.isArray(indexCache.entries) &&
    indexCache.entries.length > 0 &&
    Date.now() - indexCache.builtAt < INDEX_REFRESH_MS
  );

  if (isFresh) return indexCache;

  indexCache = buildIndex();
  return indexCache;
}

function buildQueryWeights(tokens, idf) {
  const tf = buildTf(tokens);
  const weights = new Map();
  let normSq = 0;

  for (const [term, count] of tf.entries()) {
    const idfValue = idf.get(term) || 0;
    if (!idfValue) continue;
    const weight = (1 + Math.log(count)) * idfValue;
    weights.set(term, weight);
    normSq += weight * weight;
  }

  return {
    weights,
    norm: Math.sqrt(normSq) || 1
  };
}

function retrieveRelevantChunks(query, options = {}) {
  const safeQuery = sanitizeUserInput(query || '');
  const tokens = tokenize(safeQuery);
  if (!tokens.length) return [];

  const { entries, idf } = getIndex();
  if (!entries.length) return [];

  const queryVector = buildQueryWeights(tokens, idf);
  if (!queryVector.weights.size) return [];

  const normalizedQuery = normalizeForSearch(safeQuery);
  const scored = [];

  for (const entry of entries) {
    let dotProduct = 0;
    let matchedTokenCount = 0;

    for (const [term, queryWeight] of queryVector.weights.entries()) {
      const entryWeight = entry.weights.get(term);
      if (!entryWeight) continue;
      dotProduct += queryWeight * entryWeight;
      matchedTokenCount += 1;
    }

    if (dotProduct <= 0) continue;

    const baseScore = dotProduct / (queryVector.norm * entry.norm);
    const coverage = matchedTokenCount / queryVector.weights.size;

    let score = baseScore + (coverage * 0.12);
    const normalizedTitle = normalizeForSearch(entry.title);
    if (normalizedTitle && normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
      score += 0.2;
    }

    scored.push({
      ...entry,
      score
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const limit = clampNumber(options.limit, DEFAULT_RETRIEVAL_LIMIT, 1, 20);
  const maxPerUrl = clampNumber(options.maxPerUrl, 2, 1, 4);
  const selected = [];
  const perUrlCounter = new Map();

  for (const item of scored) {
    const currentCount = perUrlCounter.get(item.url) || 0;
    if (currentCount >= maxPerUrl) continue;

    perUrlCounter.set(item.url, currentCount + 1);
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected.map((item, index) => ({
    sourceId: `S${index + 1}`,
    title: item.title,
    url: item.url,
    description: item.description,
    snippet: item.snippet,
    score: Number(item.score.toFixed(5))
  }));
}

function parseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    const objectStart = text.indexOf('{');
    const objectEnd = text.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
      const fragment = text.slice(objectStart, objectEnd + 1);
      try {
        return JSON.parse(fragment);
      } catch (innerError) {
        return null;
      }
    }
  }

  return null;
}

function normalizeUrl(url) {
  return String(url || '').replace(/[<>"'`]/g, '').trim();
}

function fallbackAnswer(query, matches) {
  if (!matches.length) {
    return 'ما لقيت صفحات كافية للإجابة بدقة. جرّب صياغة السؤال بشكل أوضح أو أضف تفاصيل أكثر.';
  }

  const topTitles = matches
    .slice(0, 2)
    .map(item => item.title)
    .filter(Boolean)
    .join('، ');

  return `بناءً على محتوى الموقع، أقرب إجابة لسؤالك "${query}" موجودة في صفحات: ${topTitles}. افتح المصادر بالأسفل للتفاصيل التنفيذية.`;
}

function fallbackResultsFromMatches(matches, maxItems = 5) {
  const deduped = [];
  const seen = new Set();

  for (const item of matches) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push({
      title: filterAIResponse(item.title || 'صفحة ذات صلة'),
      url: normalizeUrl(item.url),
      description: filterAIResponse(item.description || item.snippet || '')
    });
    if (deduped.length >= maxItems) break;
  }

  return deduped;
}

function sanitizeGeneratedPayload(rawPayload, matches, query) {
  const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
  const bySourceId = new Map(matches.map(item => [item.sourceId, item]));
  const byUrl = new Map(matches.map(item => [item.url, item]));

  const answer = filterAIResponse(String(payload.answer || '').trim()).slice(0, 1400)
    || fallbackAnswer(query, matches);

  const sourceCandidates = Array.isArray(payload.sources) ? payload.sources : [];
  const sources = [];
  const seenSourceUrls = new Set();

  for (const candidate of sourceCandidates) {
    if (!candidate || typeof candidate !== 'object') continue;

    const sourceId = String(candidate.sourceId || '').trim();
    const candidateUrl = normalizeUrl(candidate.url);
    const matched = bySourceId.get(sourceId) || byUrl.get(candidateUrl);

    if (!matched) continue;
    if (seenSourceUrls.has(matched.url)) continue;
    seenSourceUrls.add(matched.url);

    sources.push({
      sourceId: matched.sourceId,
      title: filterAIResponse(String(candidate.title || matched.title || '').trim()).slice(0, 160),
      url: matched.url,
      quote: filterAIResponse(String(candidate.quote || matched.snippet || '').trim()).slice(0, 320)
    });
  }

  if (!sources.length) {
    for (const matched of matches.slice(0, 4)) {
      sources.push({
        sourceId: matched.sourceId,
        title: matched.title,
        url: matched.url,
        quote: matched.snippet
      });
    }
  }

  const generatedResults = Array.isArray(payload.relatedResults) ? payload.relatedResults : [];
  const relatedResults = generatedResults
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      title: filterAIResponse(String(item.title || '').trim()).slice(0, 160),
      url: normalizeUrl(item.url),
      description: filterAIResponse(String(item.description || '').trim()).slice(0, 260)
    }))
    .filter(item => item.title && item.url)
    .slice(0, 5);

  const fallbackResults = fallbackResultsFromMatches(matches, 5);
  const results = relatedResults.length ? relatedResults : fallbackResults;

  return {
    answer,
    sources: sources.slice(0, 5),
    results
  };
}

function buildGenerationPrompt(query, matches) {
  const context = matches
    .map(item => (
      `[${item.sourceId}]
العنوان: ${item.title}
الرابط: ${item.url}
الوصف: ${item.description}
المقتطف: ${item.snippet}`
    ))
    .join('\n\n');

  return `سؤال المستخدم:\n${query}\n\nمقاطع السياق:\n${context}\n\nأعد JSON فقط حسب القواعد.`;
}

async function generateAnswerWithGemini(query, matches, options = {}) {
  if (!isGeminiConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    throw error;
  }

  const activeModel = String(options.model || config.gemini.model || '').trim() || 'gemini-2.5-flash';
  const response = await fetch(`${config.gemini.endpoint}/${activeModel}:generateContent?key=${config.gemini.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SEARCH_SYSTEM_PROMPT}\n\n${buildGenerationPrompt(query, matches)}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 950
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    const error = new Error(errorText || 'GEMINI_RAG_ERROR');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const output = data?.candidates?.[0]?.content?.parts
    ?.map(part => String(part?.text || ''))
    .join('\n')
    .trim() || '';
  return parseJsonFromText(output);
}

async function searchSiteWithRag(query, options = {}) {
  const safeQuery = sanitizeUserInput(query || '').slice(0, 700);
  const activeGeminiModel = String(options.model || config.gemini.model || '').trim() || 'gemini-2.5-flash';
  const retrievalLimit = clampNumber(
    options.retrievalLimit,
    Math.max(DEFAULT_RETRIEVAL_LIMIT, options.maxSources || 5),
    4,
    20
  );

  const matches = retrieveRelevantChunks(safeQuery, { limit: retrievalLimit, maxPerUrl: 2 });

  if (!matches.length) {
    return {
      answer: 'ما ظهرت نتائج كافية داخل المحتوى الحالي. جرّب سؤال أدق أو كلمات مرتبطة بالخدمة المطلوبة.',
      sources: [],
      results: [],
      mode: 'no_matches',
      retrievalCount: 0
    };
  }

  if (options.disableGeneration === true || !isGeminiConfigured()) {
    return {
      answer: fallbackAnswer(safeQuery, matches),
      sources: matches.slice(0, 4).map(item => ({
        sourceId: item.sourceId,
        title: item.title,
        url: item.url,
        quote: item.snippet
      })),
      results: fallbackResultsFromMatches(matches, 5),
      mode: 'retrieval_only',
      retrievalCount: matches.length
    };
  }

  try {
    const generated = await generateAnswerWithGemini(safeQuery, matches, {
      model: activeGeminiModel
    });
    const normalized = sanitizeGeneratedPayload(generated, matches, safeQuery);
    return {
      ...normalized,
      mode: 'rag_gemini',
      retrievalCount: matches.length
    };
  } catch (error) {
    return {
      answer: fallbackAnswer(safeQuery, matches),
      sources: matches.slice(0, 4).map(item => ({
        sourceId: item.sourceId,
        title: item.title,
        url: item.url,
        quote: item.snippet
      })),
      results: fallbackResultsFromMatches(matches, 5),
      mode: 'retrieval_fallback',
      retrievalCount: matches.length,
      warning: error?.statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GENERATION_FAILED'
    };
  }
}

function invalidateRagIndex() {
  indexCache = {
    builtAt: 0,
    entries: [],
    idf: new Map()
  };
}

module.exports = {
  searchSiteWithRag,
  retrieveRelevantChunks,
  invalidateRagIndex
};
