// Top navigation bar (React island). Renders a role-aware, grouped primary
// navigation (Dashboard · Tasks · Search · Findings · Laboratory · Reports)
// with a "More" menu for administrative destinations, the notifications bell
// with a live unread count + latest-notifications dropdown, and the account
// cluster. Hydrated client-side for the dropdown interactions and the logout
// POST form. Navigation groups follow docs/UI-DESIGN-SYSTEM.md §5.

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

interface NavLink {
  href: string;
  label: string;
}

interface RoleNav {
  primary: NavLink[];
  /** Administrative destinations — one level deep, still one click away. */
  more: NavLink[];
}

const ROLE_NAV: Record<SessionLike['role'], RoleNav> = {
  admin: {
    primary: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/manager', label: 'Tasks' },
      { href: '/search', label: 'Search' },
      { href: '/findings', label: 'Findings' },
      { href: '/lab', label: 'Laboratory' },
      { href: '/reports', label: 'Reports' },
    ],
    more: [
      { href: '/manager/requests', label: 'Delete Requests' },
      { href: '/manager/workload', label: 'Team Workload' },
      { href: '/admin/users', label: 'User Management' },
      { href: '/admin/templates', label: 'Task Templates' },
      { href: '/admin/settings', label: 'Backups & Settings' },
      { href: '/admin/system-health', label: 'System Health' },
    ],
  },
  manager: {
    primary: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/manager', label: 'Tasks' },
      { href: '/search', label: 'Search' },
      { href: '/findings', label: 'Findings' },
      { href: '/lab', label: 'Laboratory' },
      { href: '/reports', label: 'Reports' },
    ],
    more: [
      { href: '/manager/requests', label: 'Delete Requests' },
      { href: '/manager/workload', label: 'Team Workload' },
    ],
  },
  supervisor: {
    primary: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/supervisor', label: 'Tasks' },
      { href: '/search', label: 'Search' },
      { href: '/findings', label: 'Findings' },
      { href: '/lab', label: 'Laboratory' },
      { href: '/reports', label: 'Reports' },
    ],
    more: [{ href: '/manager/workload', label: 'Team Workload' }],
  },
  // Employees have NO dashboard link (CORE BUSINESS RULE #1) and no
  // administrative destinations.
  employee: {
    primary: [
      { href: '/employee', label: 'My Tasks' },
      { href: '/search', label: 'Search' },
      { href: '/findings', label: 'Findings' },
      { href: '/lab', label: 'Laboratory' },
    ],
    more: [],
  },
};

/** Mobile menu groups — intentionally designed sections, not a wrapped row. */
interface MobileGroup {
  heading: string;
  links: NavLink[];
}

function mobileGroups(role: SessionLike['role']): MobileGroup[] {
  const nav = ROLE_NAV[role];
  const groups: MobileGroup[] = [{ heading: 'Workspace', links: [...nav.primary] }];
  if (nav.more.length > 0) groups.push({ heading: 'Administration', links: nav.more });
  return groups;
}

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

/** Active-section detection: exact path or a child of the section root.
 *  Computed after mount — islands render on the server too, where `window`
 *  does not exist (a render-time `window.location` crashed streaming). */
function isActive(href: string, path: string): boolean {
  if (!path) return false;
  if (path === href) return true;
  return href !== '/' && path.startsWith(`${href}/`);
}

export default function Navbar({ user, notificationCount = 0, recentNotifications = [] }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const bellRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const bellDropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const nav = user ? ROLE_NAV[user.role] : null;
  const links = nav?.primary ?? [];

  // Active navigation state (after mount; see isActive above).
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Close the dropdown and hand focus back to the bell trigger (keyboard a11y:
  // focus must return to the element that opened the menu on Escape).
  function closeDropdown() {
    setOpen(false);
    bellButtonRef.current?.focus();
  }

  // Shared dropdown plumbing: outside click closes (no focus steal), Escape
  // closes and restores focus to the trigger.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(ev: PointerEvent) {
      if (bellRef.current && !bellRef.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') closeDropdown();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(ev: PointerEvent) {
      if (moreRef.current && !moreRef.current.contains(ev.target as Node)) setMoreOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Move focus into a menu when it opens (standard menu pattern).
  useEffect(() => {
    if (!open) return;
    const first = bellDropdownRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])');
    first?.focus();
  }, [open]);

  // Trap Tab/Shift+Tab inside an open menu so keyboard users cannot tab into
  // the page behind it (WCAG 2.1.2 No Keyboard Trap in reverse).
  function trapDropdownTab(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const container = e.currentTarget;
    const focusables = Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Mobile role menu: Escape closes it and returns focus to the toggle.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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

  const primaryLinkClass = (href: string) => {
    const active = isActive(href, currentPath);
    return [
      'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3" aria-label="Primary">
        <div className="flex items-center gap-5">
          <a href="/" className="text-lg font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            QC Task Manager
          </a>
          {links.length > 0 && (
            // Role links live in the header only at xl+ (1280px). Below xl
            // everything collapses into the mobile menu (see the toggle +
            // #mobile-menu). The mobile menu stays in the DOM at every width
            // so the Laboratory link is always present for assistive tech; it
            // is just hidden by CSS.
            <ul className="hidden items-center gap-1 xl:flex">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={primaryLinkClass(l.href)} aria-current={isActive(l.href, currentPath) ? 'page' : undefined}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {nav && nav.more.length > 0 && (
            // "More" — administrative destinations, one level deep. Rendered
            // only while open so `nav a[href=…]` link counts stay 1:1.
            <div ref={moreRef} className="relative hidden xl:block">
              <button
                ref={moreButtonRef}
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-controls={moreOpen ? 'more-menu' : undefined}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                More
                <svg aria-hidden="true" className="ml-1 inline" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 3.5 5 6.5 8 3.5" />
                </svg>
              </button>
              {moreOpen && (
                <div
                  ref={moreDropdownRef}
                  id="more-menu"
                  role="menu"
                  aria-label="More sections"
                  onKeyDown={trapDropdownTab}
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {nav.more.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      aria-current={isActive(l.href, currentPath) ? 'page' : undefined}
                      className={[
                        'block px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                        isActive(l.href, currentPath) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications bell + dropdown */}
              <div ref={bellRef} className="relative">
                <button
                  ref={bellButtonRef}
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-label={`Notifications (${notificationCount} active)`}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={open ? 'notification-dropdown' : undefined}
                  className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  {notificationCount > 0 && (
                    // WCAG AA contrast: white-on-red-500 is only 3.76:1 at this
                    // size — red-600 raises it to 4.83:1 (normal text threshold).
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                {open && (
                  <div
                    ref={bellDropdownRef}
                    id="notification-dropdown"
                    role="menu"
                    aria-label="Recent notifications"
                    onKeyDown={trapDropdownTab}
                    className="fixed inset-x-4 top-16 z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-w-[calc(100vw-2rem)]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      {notificationCount > 0 && (
                        // WCAG AA contrast: red-600 on red-50 is 4.41:1 at this
                        // size — red-700 raises it to 5.91:1 (normal text threshold).
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
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

              <span className="hidden text-sm text-slate-600 xl:inline">
                <span className="font-medium text-slate-900">{user.fullName}</span>
                {/* WCAG AA: slate-500 on slate-100 is 4.34:1 at text-xs —
                    slate-600 raises it to 6.92:1 (normal text threshold). */}
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-600">
                  {user.role}
                </span>
              </span>
              {/* Account security (password change) — desktop header, next to
                  sign out; available to every role. */}
              <a
                href="/account/security"
                className="hidden rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 xl:inline"
              >
                Account
              </a>
              {/* Sign out is header-only at xl+; below xl it moves into the
                  mobile menu (keeps the right-side cluster small enough that
                  document scroll width never exceeds the viewport at 768px). */}
              <form action="/logout" method="POST" className="hidden xl:block">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <a
              href="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Sign in
            </a>
          )}
          {/* Mobile menu toggle (all sections) */}
          {nav && (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 xl:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {nav && (
        // Mobile menu — intentionally designed: grouped sections with
        // headings and full-width 44px targets, not a wrapped link row.
        // Sits OUTSIDE the <nav> landmark (as before) so `nav a[href=…]`
        // assertions keep counting only the desktop links.
        <div
          id="mobile-menu"
          aria-hidden={!menuOpen}
          className={
            menuOpen
              ? 'max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 xl:hidden'
              : 'hidden border-t border-slate-200 bg-white px-4 py-3 xl:hidden'
          }
        >
          {mobileGroups(user!.role).map((group) => (
            <div key={group.heading} className="mb-1">
              <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.heading}
              </p>
              <ul>
                {group.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      aria-current={isActive(l.href, currentPath) ? 'page' : undefined}
                      className={[
                        'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                        isActive(l.href, currentPath) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {user && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <div className="flex min-h-11 items-center gap-2 px-3">
                <span className="text-sm font-medium text-slate-900">{user.fullName}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-600">
                  {user.role}
                </span>
              </div>
              <ul>
                <li>
                  <a
                    href="/account/security"
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
                  >
                    Account security
                  </a>
                </li>
                <li className="pb-1 pt-1">
                  <form action="/logout" method="POST" className="px-3">
                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      Sign out
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
