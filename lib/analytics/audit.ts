type AuditEvent = {
  route: string;
  ipHash: string;
  status: "accepted" | "blocked" | "fallback" | "failed";
  model?: string;
};

export function recordAuditEvent(event: AuditEvent): void {
  const payload = {
    ...event,
    at: new Date().toISOString()
  };

  console.info("[brightai-demo-audit]", JSON.stringify(payload));
}
