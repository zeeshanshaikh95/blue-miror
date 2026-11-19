import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Container } from '@/components/ui/Container';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminAuthBoundary, RequireAdmin } from '@/admin/AdminAuth';
import { AdminLayout } from '@/admin/layout/AdminLayout';

const HomePage = lazy(() =>
  import('@/pages/public/HomePage').then((module) => ({ default: module.HomePage })),
);
const AboutPage = lazy(() =>
  import('@/pages/public/AboutPage').then((module) => ({ default: module.AboutPage })),
);
const TreatmentsPage = lazy(() =>
  import('@/pages/public/TreatmentsPage').then((module) => ({ default: module.TreatmentsPage })),
);
const TreatmentDetailPage = lazy(() =>
  import('@/pages/public/TreatmentDetailPage').then((module) => ({
    default: module.TreatmentDetailPage,
  })),
);
const ProductsPage = lazy(() =>
  import('@/pages/public/ProductsPage').then((module) => ({ default: module.ProductsPage })),
);
const ProductDetailPage = lazy(() =>
  import('@/pages/public/ProductDetailPage').then((module) => ({
    default: module.ProductDetailPage,
  })),
);
const GalleryPage = lazy(() =>
  import('@/pages/public/GalleryPage').then((module) => ({ default: module.GalleryPage })),
);
const TestimonialsPage = lazy(() =>
  import('@/pages/public/TestimonialsPage').then((module) => ({
    default: module.TestimonialsPage,
  })),
);
const TeamPage = lazy(() =>
  import('@/pages/public/TeamPage').then((module) => ({ default: module.TeamPage })),
);
const ContactPage = lazy(() =>
  import('@/pages/public/ContactPage').then((module) => ({ default: module.ContactPage })),
);
const FaqsPage = lazy(() =>
  import('@/pages/public/FaqsPage').then((module) => ({ default: module.FaqsPage })),
);
const BookPage = lazy(() =>
  import('@/pages/public/BookPage').then((module) => ({ default: module.BookPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import('@/pages/public/LegalPages').then((module) => ({
    default: module.PrivacyPolicyPage,
  })),
);
const TermsPage = lazy(() =>
  import('@/pages/public/LegalPages').then((module) => ({ default: module.TermsPage })),
);
const MedicalDisclaimerPage = lazy(() =>
  import('@/pages/public/LegalPages').then((module) => ({
    default: module.MedicalDisclaimerPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/public/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);

// Admin routes are code-split so the public site's initial bundle is unchanged.
const AdminLoginPage = lazy(() =>
  import('@/admin/pages/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })),
);
const OverviewPage = lazy(() =>
  import('@/admin/pages/OverviewPage').then((module) => ({ default: module.OverviewPage })),
);
const ServicesPage = lazy(() =>
  import('@/admin/pages/ServicesPage').then((module) => ({ default: module.ServicesPage })),
);
const ProductsPageAdmin = lazy(() =>
  import('@/admin/pages/ProductsPage').then((module) => ({ default: module.ProductsPage })),
);
const CategoriesPage = lazy(() =>
  import('@/admin/pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })),
);
const GalleryPageAdmin = lazy(() =>
  import('@/admin/pages/GalleryPage').then((module) => ({ default: module.GalleryPage })),
);
const TeamPageAdmin = lazy(() =>
  import('@/admin/pages/TeamPage').then((module) => ({ default: module.TeamPage })),
);
const TestimonialsPageAdmin = lazy(() =>
  import('@/admin/pages/TestimonialsPage').then((module) => ({
    default: module.TestimonialsPage,
  })),
);
const FaqsPageAdmin = lazy(() =>
  import('@/admin/pages/FaqsPage').then((module) => ({ default: module.FaqsPage })),
);
const SettingsPage = lazy(() =>
  import('@/admin/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const AccountPage = lazy(() =>
  import('@/admin/pages/AccountPage').then((module) => ({ default: module.AccountPage })),
);

const InboxPage = lazy(() =>
  import('@/admin/pages/InboxPage').then((module) => ({ default: module.InboxPage })),
);

function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-[50vh] border-b border-brand-line bg-brand-ivory py-16"
    >
      <Container>
        <div className="h-2 w-20 animate-pulse bg-brand-line" />
        <div className="mt-6 h-16 w-2/3 animate-pulse bg-brand-line/80 sm:h-20" />
        <div className="mt-5 h-4 w-1/2 animate-pulse bg-brand-line" />
      </Container>
    </div>
  );
}

function Suspended({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export function App() {
  return (
    <Routes>
      {/* Admin is a separate shell; it never renders inside the public layout. */}
      <Route path="/admin" element={<AdminAuthBoundary />}>
        <Route
          path="login"
          element={
            <Suspended>
              <AdminLoginPage />
            </Suspended>
          }
        />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route
            index
            element={
              <Suspended>
                <OverviewPage />
              </Suspended>
            }
          />
          <Route
            path="inbox"
            element={
              <Suspended>
                <InboxPage />
              </Suspended>
            }
          />
          <Route
            path="services"
            element={
              <Suspended>
                <ServicesPage />
              </Suspended>
            }
          />
          <Route
            path="products"
            element={
              <Suspended>
                <ProductsPageAdmin />
              </Suspended>
            }
          />
          <Route
            path="categories"
            element={
              <Suspended>
                <CategoriesPage />
              </Suspended>
            }
          />
          <Route
            path="gallery"
            element={
              <Suspended>
                <GalleryPageAdmin />
              </Suspended>
            }
          />
          <Route
            path="team"
            element={
              <Suspended>
                <TeamPageAdmin />
              </Suspended>
            }
          />
          <Route
            path="testimonials"
            element={
              <Suspended>
                <TestimonialsPageAdmin />
              </Suspended>
            }
          />
          <Route
            path="faqs"
            element={
              <Suspended>
                <FaqsPageAdmin />
              </Suspended>
            }
          />
          <Route
            path="settings"
            element={
              <Suspended>
                <SettingsPage />
              </Suspended>
            }
          />
          <Route
            path="account"
            element={
              <Suspended>
                <AccountPage />
              </Suspended>
            }
          />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route
          index
          element={
            <Suspended>
              <HomePage />
            </Suspended>
          }
        />
        <Route
          path="about"
          element={
            <Suspended>
              <AboutPage />
            </Suspended>
          }
        />
        <Route
          path="treatments"
          element={
            <Suspended>
              <TreatmentsPage />
            </Suspended>
          }
        />
        <Route
          path="treatments/:slug"
          element={
            <Suspended>
              <TreatmentDetailPage />
            </Suspended>
          }
        />
        <Route
          path="products"
          element={
            <Suspended>
              <ProductsPage />
            </Suspended>
          }
        />
        <Route
          path="products/:slug"
          element={
            <Suspended>
              <ProductDetailPage />
            </Suspended>
          }
        />
        <Route
          path="gallery"
          element={
            <Suspended>
              <GalleryPage />
            </Suspended>
          }
        />
        <Route
          path="testimonials"
          element={
            <Suspended>
              <TestimonialsPage />
            </Suspended>
          }
        />
        <Route
          path="team"
          element={
            <Suspended>
              <TeamPage />
            </Suspended>
          }
        />
        <Route
          path="contact"
          element={
            <Suspended>
              <ContactPage />
            </Suspended>
          }
        />
        <Route
          path="faqs"
          element={
            <Suspended>
              <FaqsPage />
            </Suspended>
          }
        />
        <Route
          path="book"
          element={
            <Suspended>
              <BookPage />
            </Suspended>
          }
        />
        <Route
          path="privacy-policy"
          element={
            <Suspended>
              <PrivacyPolicyPage />
            </Suspended>
          }
        />
        <Route
          path="terms"
          element={
            <Suspended>
              <TermsPage />
            </Suspended>
          }
        />
        <Route
          path="medical-disclaimer"
          element={
            <Suspended>
              <MedicalDisclaimerPage />
            </Suspended>
          }
        />
        <Route
          path="*"
          element={
            <Suspended>
              <NotFoundPage />
            </Suspended>
          }
        />
      </Route>
    </Routes>
  );
}
