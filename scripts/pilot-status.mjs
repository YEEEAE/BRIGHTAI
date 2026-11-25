// Run on a monitoring host. Publish stdout atomically to the separate status origin.
// Input is a UTC-minute journey log: minute,ok (0/1). Missing minutes count as unavailable.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  samples: { type: 'string' }, from: { type: 'string' }, until: { type: 'string' },
  incident: { type: 'string' }, restored: { type: 'string' },
  lastWrite: { type: 'string' }, recoveredWrite: { type: 'string' }
} });
function instant(value) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) throw Error('Expected UTC timestamp with seconds');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== value) throw Error('Invalid date');
  return time;
}
const start = instant(values.from), end = instant(values.until);
const minutes = (end - start) / 60000;
if (start % 60000 || end % 60000 || minutes <= 0 || minutes > 44640 || end > Date.now()) throw Error('Invalid observation window');
const samples = new Map();
for (const line of readFileSync(values.samples, 'utf8').split(/\r?\n/).filter(Boolean)) {
  const [stamp, outcome, ...extra] = line.split(',');
  const time = instant(stamp);
  if (extra.length || time % 60000 || !['0','1'].includes(outcome) || samples.has(time)) throw Error('Invalid or duplicate sample');
  if (time >= start && time < end) samples.set(time, Number(outcome));
}
const successful = [...samples.values()].reduce((sum, value) => sum + value, 0);
let recovery = 'لا يوجد تمرين استعادة مسجّل لهذه الفترة.';
if ([values.incident, values.restored, values.lastWrite, values.recoveredWrite].some(Boolean)) {
  const incident = instant(values.incident), restored = instant(values.restored);
  const lastWrite = instant(values.lastWrite), recovered = instant(values.recoveredWrite);
  if (!(recovered <= lastWrite && lastWrite <= incident && start <= incident && incident <= restored && restored <= end)) throw Error('Invalid recovery sequence');
  recovery = 'زمن التعافي بالدقائق ' + (restored-incident)/60000 + '، وفجوة البيانات بالدقائق ' + (lastWrite-recovered)/60000 + '.';
}
const last = samples.get(end - 60000);
const state = last === undefined ? 'لا توجد عينة' : last ? 'نجحت الرحلة' : 'تعثرت الرحلة';
console.log(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>حالة خدمة BRIGHTAI</title><main><h1>حالة خدمة BRIGHTAI</h1><p>آخر دقيقة في الفترة: ${state}.</p><p>الفترة بالتوقيت العالمي: <bdi>${values.from}</bdi> إلى <bdi>${values.until}</bdi>.</p><p>التوافر المرصود ${(100 * successful / minutes).toFixed(3)}%، والدقائق بلا قياس ${minutes-samples.size} من ${minutes}.</p><p>${recovery}</p></main></html>`);
