// Explicit public interaction contract. No free text, URL, identity or server claims.
const products = new Set(['kernel','firewall','ledger','human-gate','risk-engine','secure-chat']);
const assets = new Set(['ai-use-policy','ai-risk-register','responsibility-evidence-matrix']);
export function publicEvent(name, properties) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return null;
  const keys = Object.keys(properties).sort().join(',');
  if (name === 'lab_started' && keys === 'product' && products.has(properties.product)) return {...properties};
  if (name === 'scenario_completed' && keys === 'evidence_level,product,scenario_code' && products.has(properties.product) && properties.evidence_level === 'demo_client' && properties.scenario_code === 'guided-demo-v1') return {...properties};
  if (name === 'template_download_requested' && keys === 'asset_code,format' && assets.has(properties.asset_code) && ['md','csv'].includes(properties.format)) return {...properties};
  if (name === 'contact_channel_opened' && keys === 'channel' && ['email','whatsapp'].includes(properties.channel)) return {...properties};
  return null;
}
export function createPublicMeasurement({send, enabled}) {
  const seen = new Set();
  return (name, properties, eventId) => {
    try {
      const safe = publicEvent(name, properties);
      if (!safe || !enabled() || typeof eventId !== 'string' || !/^[a-f0-9-]{36}$/.test(eventId) || seen.has(eventId) || seen.size >= 1000) return false;
      // Mark before sending: a synchronous reentrant listener cannot duplicate it.
      seen.add(eventId);
      send(name, {...safe, schema_version: 1, event_id: eventId});
      return true;
    } catch { return false; }
  };
}
