/**
 * Host half of the Usage & Stats bundle.
 *
 * Reads the profile's real session logs through `ctx.sessionQuery`, folds every
 * provider-reported `assistant/message` usage record into per-session token
 * totals and calendar buckets, samples machine CPU/memory, and serves the
 * aggregate over one authenticated same-origin route:
 *
 *   GET /api/local-usage-stats
 *
 * The browser half never reads session files. It calls this route, which is
 * owner-only through the Connection Fetch registry.
 */
import { arch, cpus, freemem, hostname, loadavg, platform, totalmem, uptime } from 'node:os';

const ROUTE = '/api/local-usage-stats';
const HOUR_MS = 60 * 60 * 1000;
const CPU_SAMPLE_MS = 2000;
const CPU_HISTORY = 90;

export const inject = ['connection', 'sessionQuery'];

function count(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function emptyUsage() {
  return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, total: 0, requests: 0 };
}

function addToUsage(target, usage) {
  const input = count(usage && usage.inputTokens);
  const cacheRead = count(usage && usage.cacheReadTokens);
  const cacheWrite = count(usage && usage.cacheWriteTokens);
  const output = count(usage && usage.outputTokens);
  const reported = count(usage && usage.totalTokens);
  const total = reported > 0 ? reported : input + cacheRead + cacheWrite + output;
  target.input += input;
  target.cacheRead += cacheRead;
  target.cacheWrite += cacheWrite;
  target.output += output;
  target.total += total;
  target.requests += 1;
  return { input, cacheRead, cacheWrite, output, total };
}

function dayKey(time) {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthKey(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function bumpBucket(map, key, usage) {
  let bucket = map[key];
  if (!bucket) {
    bucket = map[key] = emptyUsage();
  }
  bucket.input += usage.input;
  bucket.cacheRead += usage.cacheRead;
  bucket.cacheWrite += usage.cacheWrite;
  bucket.output += usage.output;
  bucket.total += usage.total;
  bucket.requests += 1;
  return bucket;
}

function bumpModel(record, model, usage, time) {
  if (!record.models[model]) {
    record.models[model] = emptyUsage();
  }
  const bucket = record.models[model];
  bucket.input += usage.input;
  bucket.cacheRead += usage.cacheRead;
  bucket.cacheWrite += usage.cacheWrite;
  bucket.output += usage.output;
  bucket.total += usage.total;
  bucket.requests += 1;

  const month = monthKey(time);
  if (!record.months[month]) record.months[month] = {};
  if (!record.months[month][model]) record.months[month][model] = emptyUsage();
  const monthBucket = record.months[month][model];
  monthBucket.input += usage.input;
  monthBucket.cacheRead += usage.cacheRead;
  monthBucket.cacheWrite += usage.cacheWrite;
  monthBucket.output += usage.output;
  monthBucket.total += usage.total;
  monthBucket.requests += 1;
}

function textOfContent(content) {
  if (!Array.isArray(content)) return '';
  for (const block of content) {
    if (block && block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
      return block.text.trim();
    }
  }
  return '';
}

function createRecord(header, live) {
  const createdAt = count(header && header.createdAt);
  return {
    id: header && header.id ? String(header.id) : '',
    title: null,
    cwd: header && typeof header.cwd === 'string' ? header.cwd : null,
    createdAt,
    live: Boolean(live),
    seeded: Boolean(header && header.isSeeded),
    usage: emptyUsage(),
    models: {},
    months: {},
    hours: {},
    days: {},
    turns: 0,
    steps: 0,
    currentModel: null,
    contextWindow: null,
    firstUser: null,
    firstAt: createdAt || null,
    lastAt: createdAt || null,
    lastSeq: -1
  };
}

function foldEvent(record, event) {
  if (!event || typeof event !== 'object') return;
  if (typeof event.seq === 'number') {
    if (event.seq <= record.lastSeq) return;
    record.lastSeq = event.seq;
  }
  const time = count(event.time);
  if (time > 0) {
    if (!record.firstAt || time < record.firstAt) record.firstAt = time;
    if (!record.lastAt || time > record.lastAt) record.lastAt = time;
  }

  const data = event.data || {};
  switch (event.type) {
    case 'session/title':
      if (data && typeof data.title === 'string' && data.title.trim()) record.title = data.title.trim();
      break;
    case 'user/message': {
      const text = textOfContent(data.content) || textOfContent(data.message && data.message.content);
      if (!record.firstUser && text) record.firstUser = text.slice(0, 240);
      break;
    }
    case 'request/context':
      if (data.provider && data.model) record.currentModel = `${data.provider}/${data.model}`;
      if (count(data.contextWindow)) record.contextWindow = count(data.contextWindow);
      break;
    case 'request/header': {
      const config = data.header && data.header.config;
      if (config && config.provider && config.model) record.currentModel = `${config.provider}/${config.model}`;
      break;
    }
    case 'turn/start':
      record.turns += 1;
      break;
    case 'step/end':
      record.steps += 1;
      break;
    case 'assistant/message': {
      if (!data.usage || typeof data.usage !== 'object') break;
      const parts = addToUsage(record.usage, data.usage);
      const at = time || Date.now();
      const hour = Math.floor(at / HOUR_MS) * HOUR_MS;
      bumpBucket(record.hours, String(hour), parts);
      bumpBucket(record.days, dayKey(at), parts);
      bumpModel(record, record.currentModel || 'unknown', parts, at);
      break;
    }
    default:
      break;
  }
}

function usageView(usage) {
  return {
    input: usage.input,
    cacheRead: usage.cacheRead,
    cacheWrite: usage.cacheWrite,
    output: usage.output,
    total: usage.total,
    requests: usage.requests
  };
}

function modelsView(models) {
  const out = {};
  for (const [key, usage] of Object.entries(models)) out[key] = usageView(usage);
  return out;
}

function timelineView(map, keyName) {
  return Object.entries(map)
    .map(([key, usage]) => ({
      [keyName]: keyName === 'at' ? Number(key) : key,
      ...usageView(usage)
    }))
    .sort((a, b) => (keyName === 'at' ? a.at - b.at : String(a.date).localeCompare(String(b.date))));
}

function mergeUsage(target, usage) {
  target.input += count(usage.input);
  target.cacheRead += count(usage.cacheRead);
  target.cacheWrite += count(usage.cacheWrite);
  target.output += count(usage.output);
  target.total += count(usage.total);
  target.requests += count(usage.requests);
  return target;
}

function emptyTotals() {
  return {
    input: 0,
    cacheRead: 0,
    cacheWrite: 0,
    output: 0,
    total: 0,
    requests: 0,
    turns: 0,
    steps: 0,
    conversations: 0,
    storedConversations: 0,
    firstAt: null,
    lastAt: null
  };
}

function createCpuSampler() {
  const cpuCount = cpus().length || 1;
  const model = (cpus()[0] && cpus()[0].model ? cpus()[0].model : '').trim();
  const history = [];
  let previous = null;
  let latest = null;

  function ticks() {
    const list = cpus();
    const cores = [];
    let idle = 0;
    let total = 0;
    for (let index = 0; index < list.length; index += 1) {
      const times = list[index].times;
      const coreTotal = times.user + times.nice + times.sys + times.idle + times.irq;
      cores.push({ total: coreTotal, idle: times.idle });
      total += coreTotal;
      idle += times.idle;
    }
    return { cores, idle, total };
  }

  function sample() {
    const now = Date.now();
    const current = ticks();
    const processUsage = process.cpuUsage();
    if (previous) {
      const deltaTotal = current.total - previous.total;
      const deltaIdle = current.idle - previous.idle;
      const systemPercent = deltaTotal > 0 ? ((deltaTotal - deltaIdle) / deltaTotal) * 100 : 0;
      const elapsedMicros = Math.max(1, (now - previous.at) * 1000);
      const processMicros = Math.max(0,
        (processUsage.user - previous.process.user) + (processUsage.system - previous.process.system));
      const processCorePercent = (processMicros / elapsedMicros) * 100;
      const processPercent = processCorePercent / cpuCount;
      const perCore = current.cores.map((core, index) => {
        const old = previous.cores[index];
        if (!old) return { index, percent: 0 };
        const coreDelta = core.total - old.total;
        return {
          index,
          percent: coreDelta > 0 ? Math.max(0, Math.min(100, ((coreDelta - (core.idle - old.idle)) / coreDelta) * 100)) : 0
        };
      });
      latest = {
        at: now,
        systemPercent: Math.max(0, Math.min(100, systemPercent)),
        processPercent: Math.max(0, Math.min(100, processPercent)),
        processCorePercent: Math.max(0, Math.min(100, processCorePercent)),
        perCore,
        load: loadavg(),
        coreCount: cpuCount,
        model,
        host: hostname(),
        platform: platform(),
        arch: arch(),
        memory: {
          total: totalmem(),
          free: freemem(),
          used: Math.max(0, totalmem() - freemem()),
          processRss: process.memoryUsage().rss
        },
        uptime: uptime(),
        processUptime: process.uptime()
      };
      history.push({ at: now, system: latest.systemPercent, process: latest.processPercent });
      if (history.length > CPU_HISTORY) history.shift();
    }
    previous = { at: now, total: current.total, idle: current.idle, cores: current.cores, process: processUsage };
  }

  return {
    start() {
      sample();
      const timer = setInterval(sample, CPU_SAMPLE_MS);
      if (typeof timer.unref === 'function') timer.unref();
      return () => clearInterval(timer);
    },
    view() {
      if (!latest) {
        return {
          sampling: true,
          coreCount: cpuCount,
          model,
          host: hostname(),
          platform: platform(),
          arch: arch(),
          memory: {
            total: totalmem(),
            free: freemem(),
            used: Math.max(0, totalmem() - freemem()),
            processRss: process.memoryUsage().rss
          },
          load: loadavg(),
          uptime: uptime(),
          processUptime: process.uptime(),
          perCore: [],
          history: []
        };
      }
      return {
        sampling: false,
        ...latest,
        history: history.slice()
      };
    }
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

export function apply(ctx) {
  const records = new Map();
  const errors = [];
  const cpu = createCpuSampler();
  let built = false;
  let building = null;
  let queued = [];

  ctx.effect(() => cpu.start(), 'usage-stats: CPU sampler');

  ctx.on('session/event', (session, event) => {
    const id = session && session.header && session.header.id;
    if (!id) return;
    if (!built) {
      queued.push({ id, header: session.header, event });
      return;
    }
    let record = records.get(id);
    if (!record) {
      record = createRecord(session.header, true);
      records.set(id, record);
    }
    record.live = true;
    foldEvent(record, event);
  });

  function summarize(session, events) {
    const record = createRecord(session, true);
    for (const event of events) foldEvent(record, event);
    return record;
  }

  async function build() {
    const listed = await ctx.sessionQuery.listSessions();
    let cursor = 0;
    const workers = new Array(Math.min(3, Math.max(1, listed.length))).fill(0).map(async () => {
      while (cursor < listed.length) {
        const index = cursor;
        cursor += 1;
        const row = listed[index];
        const header = row.header;
        if (!header || !header.id) continue;
        try {
          const loaded = await ctx.sessionQuery.readSession(header.id);
          const record = summarize(loaded.session || header, loaded.events || []);
          record.live = Boolean(row.live);
          records.set(header.id, record);
        } catch (error) {
          errors.push({
            id: String(header.id),
            message: error && error.message ? String(error.message) : 'unreadable session'
          });
          const fallback = createRecord(header, Boolean(row.live));
          records.set(header.id, fallback);
        }
      }
    });
    await Promise.all(workers);
    built = true;
    const pending = queued;
    queued = [];
    for (const item of pending) {
      let record = records.get(item.id);
      if (!record) {
        record = createRecord(item.header, true);
        records.set(item.id, record);
      }
      record.live = true;
      foldEvent(record, item.event);
    }
  }

  function ensureBuilt() {
    if (built) return Promise.resolve();
    if (!building) {
      building = build().catch((error) => {
        building = null;
        throw error;
      });
    }
    return building;
  }

  function snapshot() {
    const totals = emptyTotals();
    const allHours = {};
    const allDays = {};
    const month = monthKey(Date.now());
    const monthModels = {};
    const sessions = [];
    let live = 0;
    let persisted = 0;

    for (const record of records.values()) {
      if (record.live) live += 1;
      else persisted += 1;
      totals.turns += record.turns;
      totals.steps += record.steps;
      if (((record.usage && record.usage.total) || 0) > 0) {
        totals.conversations += 1;
        mergeUsage(totals, record.usage);
        if (record.firstAt && (!totals.firstAt || record.firstAt < totals.firstAt)) totals.firstAt = record.firstAt;
        if (record.lastAt && (!totals.lastAt || record.lastAt > totals.lastAt)) totals.lastAt = record.lastAt;
        for (const [key, usage] of Object.entries(record.hours)) {
          if (!allHours[key]) allHours[key] = emptyUsage();
          const bucket = allHours[key];
          bucket.input += usage.input;
          bucket.cacheRead += usage.cacheRead;
          bucket.cacheWrite += usage.cacheWrite;
          bucket.output += usage.output;
          bucket.total += usage.total;
          bucket.requests += usage.requests;
        }
        for (const [key, usage] of Object.entries(record.days)) {
          if (!allDays[key]) allDays[key] = emptyUsage();
          const bucket = allDays[key];
          bucket.input += usage.input;
          bucket.cacheRead += usage.cacheRead;
          bucket.cacheWrite += usage.cacheWrite;
          bucket.output += usage.output;
          bucket.total += usage.total;
          bucket.requests += usage.requests;
        }
        const monthUsage = record.months[month] || {};
        for (const [model, usage] of Object.entries(monthUsage)) {
          if (!monthModels[model]) monthModels[model] = emptyUsage();
          const bucket = monthModels[model];
          bucket.input += usage.input;
          bucket.cacheRead += usage.cacheRead;
          bucket.cacheWrite += usage.cacheWrite;
          bucket.output += usage.output;
          bucket.total += usage.total;
          bucket.requests += usage.requests;
        }
      } else if (record.turns > 0) {
        totals.conversations += 1;
      }

      if (record.usage.total > 0) {
        sessions.push({
          id: record.id,
          title: record.title,
          firstUser: record.firstUser,
          cwd: record.cwd,
          createdAt: record.createdAt || null,
          firstAt: record.firstAt,
          lastAt: record.lastAt,
          live: record.live,
          seeded: record.seeded,
          model: record.currentModel,
          contextWindow: record.contextWindow,
          turns: record.turns,
          steps: record.steps,
          usage: usageView(record.usage),
          models: modelsView(record.models),
          monthModels: modelsView(record.months[month] || {})
        });
      }
    }

    sessions.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
    totals.storedConversations = records.size;
    const monthTotals = emptyUsage();
    for (const usage of Object.values(monthModels)) mergeUsage(monthTotals, usage);

    return {
      version: 1,
      generatedAt: Date.now(),
      month,
      totals,
      monthUsage: usageView(monthTotals),
      monthModels: modelsView(monthModels),
      sessions,
      timeline: {
        hours: timelineView(allHours, 'at'),
        days: timelineView(allDays, 'date')
      },
      cpu: cpu.view(),
      source: {
        live,
        persisted,
        unreadable: errors.length
      },
      errors: errors.slice(0, 20)
    };
  }

  ctx.effect(() => {
    const dispose = ctx.connection.fetch.register({
      path: ROUTE,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async () => {
        try {
          await ensureBuilt();
          return json(snapshot());
        } catch (error) {
          return json({
            error: 'usage-stats-unavailable',
            message: error && error.message ? String(error.message) : 'Unable to read session statistics.'
          }, 500);
        }
      }
    });
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  }, 'usage-stats: local statistics route');
}
