import { config } from 'zod/v4/core';

// Better Auth initializes schemas during module loading. Configure Zod
// before the Neon client module runs so validation works under CSP.
config({ jitless: true });
