/* eslint-disable react-refresh/only-export-components -- the provider and its hook intentionally share this module. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AdminThemeValue = {
  dark: boolean;
  toggle: () => void;
};

const STORAGE_KEY = 'blue-miror:admin-theme';

const AdminThemeContext = createContext<AdminThemeValue | null>(null);

function initialDark(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    // localStorage can be unavailable in private modes; fall through to system.
  }

  if (typeof window.matchMedia !== 'function') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Admin-only theme. Applies the `admin-dark` class to the document root while
 * the admin area is mounted, and removes it again on unmount so the public site
 * always keeps its ivory palette.
 */
export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('admin-dark', dark);

    try {
      window.localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // Persisting is best-effort only.
    }

    return () => root.classList.remove('admin-dark');
  }, [dark]);

  const toggle = useCallback(() => setDark((current) => !current), []);
  const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme(): AdminThemeValue {
  const value = useContext(AdminThemeContext);

  if (!value) {
    throw new Error('useAdminTheme must be used inside AdminThemeProvider.');
  }

  return value;
}
