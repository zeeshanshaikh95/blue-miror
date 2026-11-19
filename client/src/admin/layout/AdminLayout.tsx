import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderTree,
  Inbox,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Menu,
  Moon,
  Package,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';

import { cn } from '@/utils/cn';

import { getInboxSummary } from '../api';
import { useAdminAuth } from '../auth-context';
import { useAdminTheme } from '../theme';
import { ToastProvider } from '../components/AdminUI';

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { to: '/admin/services', label: 'Services', icon: Sparkles },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/team', label: 'Team', icon: Users },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/faqs', label: 'FAQs', icon: BookOpen },
  { to: '/admin/settings', label: 'Website settings', icon: Settings },
  { to: '/admin/account', label: 'Account', icon: KeyRound },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/inbox': 'Inbox',
  '/admin/services': 'Services',
  '/admin/categories': 'Categories',
  '/admin/gallery': 'Gallery',
  '/admin/team': 'Team',
  '/admin/testimonials': 'Testimonials',
  '/admin/faqs': 'FAQs',
  '/admin/settings': 'Website settings',
  '/admin/account': 'Account',
};

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return '—';

  const date = new Date(expiresAt);
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function AdminLayout() {
  const { admin, expiresAt, signOut } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const inboxSummary = useQuery({
    queryKey: ['admin', 'inbox', 'summary'],
    queryFn: getInboxSummary,
    staleTime: 30_000,
  });
  const inboxCount = inboxSummary.data?.inboxTotal ?? 0;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useAdminTheme();

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const title =
    pageTitles[location.pathname] ??
    pageTitles[
      Object.keys(pageTitles).find((path) => location.pathname.startsWith(`${path}/`)) ?? ''
    ] ??
    'Admin';

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-brand-ivory lg:flex">
        <a
          href="#admin-main"
          className="sr-only z-50 border border-brand-gold bg-brand-porcelain px-4 py-3 text-sm text-brand-indigo focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to dashboard content
        </a>

        {/* Sidebar */}
        <aside
          className={cn(
            'admin-sidebar z-40 w-full shrink-0 bg-brand-indigo-deep text-brand-ivory lg:w-68 lg:min-h-dvh',
            mobileOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-5">
            <div>
              <p className="font-display text-2xl leading-none text-brand-ivory">Blue Miror</p>
              <p className="mt-1 text-[0.5625rem] tracking-[0.24em] text-brand-gold uppercase">
                Admin studio
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="text-brand-ivory/80 lg:hidden"
              aria-label="Close navigation"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          <nav aria-label="Admin" className="px-3 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-10 items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'border-brand-gold bg-white/8 text-brand-ivory'
                            : 'border-transparent text-brand-ivory/70 hover:border-white/20 hover:bg-white/5 hover:text-brand-ivory',
                        )
                      }
                    >
                      <Icon aria-hidden="true" size={16} strokeWidth={1.5} />
                      {item.label}
                      {item.to === '/admin/inbox' && inboxCount > 0 ? (
                        <span className="ml-auto border border-brand-gold/60 bg-brand-gold/20 px-1.5 py-0.5 text-[0.5625rem] font-medium text-brand-ivory">
                          {inboxCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto hidden px-5 py-6 lg:block">
            <div className="border-t border-white/10 pt-4">
              <p className="text-[0.5625rem] tracking-[0.2em] text-brand-ivory/45 uppercase">
                Session ends
              </p>
              <p className="mt-1 text-sm text-brand-ivory/80">{formatExpiry(expiresAt)}</p>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-brand-line bg-brand-ivory/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                className="border border-brand-line bg-brand-porcelain p-2 text-brand-indigo lg:hidden"
              >
                {mobileOpen ? (
                  <X aria-hidden="true" size={18} />
                ) : (
                  <Menu aria-hidden="true" size={18} />
                )}
              </button>
              <div>
                <p className="text-[0.5625rem] tracking-[0.22em] text-brand-muted uppercase">
                  Admin dashboard
                </p>
                <p className="font-display text-lg leading-tight text-brand-indigo">{title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium text-brand-indigo">{admin?.email ?? 'Admin'}</p>
                <p className="text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase">
                  {admin?.role ?? 'admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex min-h-9 items-center gap-2 border border-brand-line bg-brand-porcelain px-3 text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase hover:border-brand-indigo/40"
              >
                {dark ? (
                  <Sun aria-hidden="true" size={14} strokeWidth={1.75} />
                ) : (
                  <Moon aria-hidden="true" size={14} strokeWidth={1.75} />
                )}
                <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex min-h-9 items-center gap-2 border border-brand-line bg-brand-porcelain px-3 text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase hover:border-brand-indigo/40"
              >
                <LogOut aria-hidden="true" size={14} strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </header>

          <main
            id="admin-main"
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
          >
            <Outlet />
          </main>

          <footer className="border-t border-brand-line px-4 py-4 text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase sm:px-6 lg:px-8">
            Blue Miror admin · Content management only
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
