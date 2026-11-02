/**
 * A deliberately tiny, fully deterministic attention model.
 *
 * It is NOT a trained language model. It exists so the 3D scene can show real
 * softmax(QK^T / sqrt(d)) arithmetic for every token pair, with stable numbers
 * across reloads and no network or model files.
 */

export const PROMPTS = [
  {
    id: 'cat',
    tokens: ['the', 'cat', 'sat', 'on', 'the'],
    queryDefault: 1,
    correct: 0,
    candidates: [
      { token: 'mat', p: 0.61 },
      { token: 'floor', p: 0.19 },
      { token: 'roof', p: 0.12 },
      { token: 'moon', p: 0.08 },
    ],
  },
  {
    id: 'attention',
    tokens: ['attention', 'is', 'all', 'you'],
    queryDefault: 0,
    correct: 0,
    candidates: [
      { token: 'need', p: 0.56 },
      { token: 'want', p: 0.23 },
      { token: 'get', p: 0.14 },
      { token: 'do', p: 0.07 },
    ],
  },
  {
    id: 'reads',
    tokens: ['the', 'model', 'reads', 'every'],
    queryDefault: 2,
    correct: 0,
    candidates: [
      { token: 'token', p: 0.52 },
      { token: 'word', p: 0.25 },
      { token: 'line', p: 0.15 },
      { token: 'page', p: 0.08 },
    ],
  },
];

const DIM = 8;
const HEAD_DIM = 4;
export const HEAD_COUNT = 3;

export function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function matVec(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - max));
  const total = exps.reduce((sum, value) => sum + value, 0) || 1;
  return exps.map((value) => value / total);
}

function makeProjection(random) {
  return Array.from({ length: DIM }, () =>
    Array.from({ length: HEAD_DIM }, () => random() * 1.5 - 0.75),
  );
}

/** Build embeddings, positional signals and per-head attention weights. */
export function buildModel(prompt) {
  const tokens = prompt.tokens;
  const embeddings = tokens.map((token, position) => {
    const random = mulberry32(hashString(token) + position * 7919);
    const base = Array.from({ length: DIM }, () => random() * 2 - 1);
    return base.map((value, dimension) => {
      const angle = position / Math.pow(10000, (2 * dimension) / DIM);
      return value + (dimension % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
    });
  });

  const heads = Array.from({ length: HEAD_COUNT }, (_, headIndex) => {
    const random = mulberry32(0x51ed + headIndex * 104729);
    const wq = makeProjection(random);
    const wk = makeProjection(random);
    const queries = embeddings.map((vector) => matVec(wq, vector));
    const keys = embeddings.map((vector) => matVec(wk, vector));
    const weights = queries.map((query) => {
      const scores = keys.map((key) => dot(query, key) / Math.sqrt(HEAD_DIM));
      return softmax(scores);
    });
    return { weights };
  });

  return { tokens, embeddings, heads, dim: DIM, headDim: HEAD_DIM };
}

/** Pick the index of the most attended key for one query and head. */
export function topKey(weights, query) {
  const row = weights[query] || [];
  let best = 0;
  for (let i = 1; i < row.length; i += 1) if (row[i] > row[best]) best = i;
  return best;
}
