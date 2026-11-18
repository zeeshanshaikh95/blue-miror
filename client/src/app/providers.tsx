import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import { queryClient } from '@/lib/query-client';

type AppProvidersProps = {
  children: ReactNode;
};

// GitHub Pages project sites serve the app from a sub-path; keep React Router
// in sync with the Vite base so links and deep links resolve correctly.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>{children}</BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
