import { Outlet } from 'react-router-dom';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MobileBookingBar } from '@/components/layout/MobileBookingBar';
import { PreviewBar } from '@/components/layout/PreviewBar';
import { BackToTop, ScrollProgress } from '@/components/layout/ScrollUtilities';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-brand-ivory">
      <ScrollToTop />
      <ScrollProgress />
      <a
        href="#main-content"
        className="sr-only z-50 border border-brand-gold bg-brand-porcelain px-4 py-3 text-sm text-brand-indigo focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PreviewBar />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
      <BackToTop />
      <MobileBookingBar />
    </div>
  );
}
