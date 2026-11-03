export const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ى/g, 'ي').replace(/(^|\s)ال(?=[\u0621-\u064a]{3})/g, '$1');
export function matches(entry, state, topics) {
  const text = normalize([entry.title, entry.text, entry.tag, ...entry.topics.map(id => topics.find(t => t[0] === id)?.[1] ?? id)].join(' '));
  return normalize(state.q).trim().split(/\s+/).every(word => text.includes(word)) && (!state.topic || entry.topics.includes(state.topic)) && (!state.type || entry.tag === state.type) && (!state.products.length || state.products.some(id => entry.products.includes(id)));
}
