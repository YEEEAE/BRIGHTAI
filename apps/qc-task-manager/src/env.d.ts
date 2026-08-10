/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly QC_DB_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Session type attached by src/middleware.ts onto every request when the user
// is signed in. Optional because public routes (e.g. "/") may render without one.
declare namespace App {
  interface Locals {
    session?: {
      userId: number;
      username: string;
      role: 'admin' | 'manager' | 'supervisor' | 'employee';
      fullName: string;
    };
  }
}
