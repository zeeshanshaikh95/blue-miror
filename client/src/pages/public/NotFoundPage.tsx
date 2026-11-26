import { Seo } from '@/components/seo/Seo';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" noindex />
      <section className="flex min-h-[60vh] items-center py-16 sm:py-24">
        <Container className="text-center">
          <Eyebrow>404</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] text-brand-indigo">
            This page has
            <br /> <em className="text-brand-gold-deep">moved on</em>.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-brand-muted">
            The page you are looking for does not exist. Explore the treatment structure or return
            to the beginning.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/">Return home</ButtonLink>
            <ButtonLink to="/treatments/" variant="secondary">
              Explore treatments
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
