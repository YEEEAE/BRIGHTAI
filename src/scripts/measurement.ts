// Call only at validated interaction boundaries. Never pass input text or IDs.
const attempts = new WeakMap<Element, {started:boolean; completed:boolean}>();
function emit(name:string, properties:Record<string,string>) {
  try {
    const detail={name, properties, eventId:crypto.randomUUID(), accepted:false};
    window.dispatchEvent(new CustomEvent('brightai:measurement', {detail}));
    return detail.accepted;
  } catch { return false; }
}
export function resetLab(root:Element) {attempts.delete(root);}
export function startLab(root:Element, product:string) {
  if (attempts.has(root)) return;
  const accepted=emit('lab_started', {product});
  attempts.set(root, {started:accepted,completed:false});
}
export function completeLab(root:Element, product:string) {
  const attempt=attempts.get(root);
  if (!attempt?.started || attempt.completed) return;
  attempt.completed=true;
  emit('scenario_completed', {product,scenario_code:'guided-demo-v1',evidence_level:'demo_client'});
}
