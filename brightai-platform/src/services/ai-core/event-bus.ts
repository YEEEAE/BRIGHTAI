import type { AiEvent, AiEventType } from "./types";

type Listener = (event: AiEvent) => void;

const MAX_EVENTS = 500;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export class AiEventBus {
  private listeners = new Set<Listener>();
  private events: AiEvent[] = [];

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(traceId: string, type: AiEventType, payload?: Record<string, unknown>) {
    const event: AiEvent = {
      id: createId(),
      traceId,
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  getTraceEvents(traceId: string) {
    return this.events.filter((event) => event.traceId === traceId);
  }
}

const aiEventBus = new AiEventBus();
export default aiEventBus;
