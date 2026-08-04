export interface Dataset {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Certificate {
  id: string;
  runId?: string;
  [key: string]: any;
}

export interface Trace {
  id: string;
  runId: string;
  timestamp: string;
  inputText: string;
  outputText: string;
  status: 'allowed' | 'blocked' | 'pending_approval' | 'error';
  riskScore: number;
  stages: any[];
  [key: string]: any;
}

export interface ScorerResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'incomplete';
  score: number;
  [key: string]: any;
}

export interface EvaluationRun {
  id: string;
  evaluationId: string;
  name: string;
  status: string;
  setup: {
    dataset: any;
    model: any;
    prompt: any;
    policy: any;
    scorers: any[];
    environment: string;
    provider: string;
    seed?: number;
    temperature?: number;
    topP?: number;
    [key: string]: any;
  };
  published: boolean;
  version: number;
  startedAt: string;
  finishedAt?: string;
  inputHash: string;
  outputHash: string;
  runHash: string;
  runtimeVersion: string;
  promptVersionHash: string;
  parentRunId?: string;
  reproducibility?: any;
  cost: {
    inputTokens: number;
    outputTokens: number;
    providerCostSar: number;
    scorerCostSar: number;
    toolCostSar: number;
    totalCostSar: number;
  };
  timing: {
    piiScanMs: number;
    riskScoreMs: number;
    policyMs: number;
    providerMs: number;
    scoringMs: number;
    totalMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  traces: Trace[];
  scorerResults: ScorerResult[];
  summary?: string;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}
