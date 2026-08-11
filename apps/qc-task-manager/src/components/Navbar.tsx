// Top navigation bar (React island). Renders role-aware links, the
// notifications bell with a live unread count + a dropdown of the latest
// persisted notifications, and a login/logout affordance. Hydrated
// client-side for the logout POST form and the dropdown interactions.

import { useEffect, useRef, useState } from 'react';

interface SessionLike {
  userId: number;
  username: string;
  role: 'admin' | 'manager' | 'supervisor' | 'employee';
  fullName: string;
}

/** The latest persisted notifications for the dropdown (server-rendered). */
export interface NavNotification {
  id: number;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  isRead: boolean;
}

interface NavbarProps {
  user: SessionLike | null;
  /** Live alert count for the Notifications bell (0 hides the badge). */
  notificationCount?: number;
  /** Latest persisted notifications for the dropdown (newest first). */
  recentNotifications?: NavNotification[];
}

const ROLE_LINKS: Record<SessionLike['role'], { href: string; label: string }[]> = {
  admin: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/manager', label: 'Tasks' },
    { href: '/search', label: 'Search' },
    { href: '/manager/requests', label: 'Delete Requests' },
    { href: '/admin/users', label: 'Admin' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/notifications', label: 'Notifications' },
  ],
  manager: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/manager', label: 'Tasks' },
    { href: '/search', label: 'Search' },
    { href: '/manager/requests', label: 'Delete Requests' },
    { href: '/notifications', label: 'Notifications' },
  ],
  supervisor: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/supervisor', label: 'Tasks' },
    { href: '/search', label: 'Search' },
    { href: '/notifications', label: 'Notifications' },
  ],
  // Employees have NO dashboard link (CORE BUSINESS RULE #1).
  employee: [
    { href: '/employee', label: 'My Tasks' },
    { href: '/search', label: 'Search' },
    { href: '/notifications', label: 'Notifications' },
  ],
};

/** Relative-ish timestamp (e.g. "2h ago", "yesterday", or the date). */
function timeAgo(createdAt: string): string {
  const t = new Date(`${createdAt.replace(' ', 'T')}Z`).getTime();
  if (Number.isNaN(t)) return createdAt.slice(0, 10);
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return createdAt.slice(0, 10);
}

export default function Navbar({ user, notificationCount = 0, recentNotifications = [] }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const links = user ? ROLE_LINKS[user.role] : [];

  // Close the dropdown on outside click / Escape (keyboard a11y).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(ev: PointerEvent) {
      if (bellRef.current && !bellRef.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /** Clicking an item marks it read (if unread) then navigates to it. */
  function openNotification(n: NavNotification) {
    if (!n.isRead) {
      // keepalive: the navigation below must not abort the mark-read POST
      // before it reaches the server.
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST', keepalive: true }).catch(() => {});
    }
    window.location.href = n.href;
  }

  async function markAllRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) window.location.reload();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-semibold text-slate-900">
            QC Task Manager
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
          {user ? (
            <>
              {/* Notifications bell + dropdown */}
              <div ref={bellRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-label={`Notifications (${notificationCount} active)`}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={open ? 'notification-dropdown' : undefined}
                  className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                {open && (
                  <div
                    id="notification-dropdown"
                    role="menu"
                    aria-label="Recent notifications"
                    className="fixed inset-x-4 top-16 z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-w-[calc(100vw-2rem)]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      {notificationCount > 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          {notificationCount} unread
                        </span>
                      )}
                    </div>

                    <ul className="max-h-80 overflow-y-auto">
                      {recentNotifications.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-slate-500">
                          You&apos;re all caught up 🎉
                        </li>
                      )}
                      {recentNotifications.map((n) => (
                        <li key={n.id} className="border-b border-slate-50 last:border-b-0">
                          <a
                            href={n.href}
                            role="menuitem"
                            onClick={() => openNotification(n)}
                            className="flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50"
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-sky-500'}`}
                            />
                            <span className="min-w-0">
                              <span
                                className={`block truncate text-sm ${
                                  n.isRead ? 'font-normal text-slate-600' : 'font-semibold text-slate-900'
                                }`}
                              >
                                {n.title}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">{n.message}</span>
                              <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
                      <a href="/notifications" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        View all
                      </a>
                      {notificationCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          disabled={markingAll}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                        >
                          {markingAll ? 'Marking…' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="hidden text-sm text-slate-600 sm:inline">
                <span className="font-medium text-slate-900">{user.fullName}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-500">
                  {user.role}
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
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {menuOpen && links.length > 0 && (
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
