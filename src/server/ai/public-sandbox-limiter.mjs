const response = (status, code, reply) => Response.json({code, reply, fallback:status!==200}, {status, headers:{'Cache-Control':'no-store'}});

// Public provider egress is disabled until separately approved.
export const publicSandbox = () => response(503, 'DISABLED');
