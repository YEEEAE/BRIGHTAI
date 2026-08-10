// Top navigation bar (React island). Renders role-aware links and a
// login/logout affordance. Hydrated client-side for the logout POST form.

import { useState } from 'react';

interface SessionLike {
  userId: number;
  username: string;
  role: 'admin' | 'manager' | 'supervisor' | 'employee';
  fullName: string;
}

interface NavbarProps {
  session: SessionLike | null;
}

const ROLE_LINKS: Record<SessionLike['role'], { href: string; label: string }[]> = {
  admin: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin', label: 'Admin' },
    { href: '/manager', label: 'Tasks' },
  ],
  manager: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/manager', label: 'Tasks' },
  ],
  supervisor: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/supervisor', label: 'Tasks' },
  ],
  employee: [{ href: '/employee', label: 'My Tasks' }],
};

export default function Navbar({ session }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const links = session ? ROLE_LINKS[session.role] : [];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-semibold text-slate-900">
            QC Tasks
          </a>
          {links.length > 0 && (
            <ul className="hidden items-center gap-4 sm:flex">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                <span className="font-medium text-slate-900">{session.fullName}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-500">
                  {session.role}
                </span>
              </span>
              <form action="/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <a
              href="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Sign in
            </a>
          )}
          {/* Mobile menu toggle (role links only) */}
          {links.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {open && links.length > 0 && (
        <ul className="border-t border-slate-200 bg-white px-4 py-2 sm:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
