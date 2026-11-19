import { Check } from 'lucide-react';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useTeam } from '@/hooks/use-public-content';

const publicationChecks = [
  'Name and public role',
  'Verified professional credentials',
  'Approved biography',
  'A licensed photograph with permission',
];

export function TeamPage() {
  const teamQuery = useTeam();
  const team = teamQuery.data?.items ?? [];

  return (
    <>
      <Seo
        title="Our team"
        description="Blue Miror practitioner profiles are published only after names, roles and professional credentials have been verified."
        noindex
      />

      <PageHero
        eyebrow="The team"
        title={
          <>
            People behind
            <br /> <em className="text-brand-gold-deep">the care</em>.
          </>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          {teamQuery.isError ? (
            <ErrorState
              title="Team profiles could not be loaded"
              message="Please try again. No profile content has been substituted."
              onRetry={() => void teamQuery.refetch()}
            />
          ) : null}

          {teamQuery.isPending ? (
            <div
              role="status"
              aria-label="Loading team profiles"
              className="grid gap-5 md:grid-cols-3"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse border border-brand-line bg-brand-line/40"
                />
              ))}
            </div>
          ) : null}

          {team.length === 0 ? (
            <EmptyState eyebrow="Verification in progress" title="Profiles are being prepared">
              Blue Miror has not yet supplied verified practitioner names, roles or credentials. The
              team will appear here when that information has been reviewed.
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <article
                  key={member.id}
                  className="border border-brand-line bg-brand-porcelain p-6"
                >
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={`Portrait of ${member.name}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full border border-brand-line object-cover"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-t-full border border-brand-gold/50 bg-brand-indigo/5 font-display text-2xl text-brand-indigo">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <Eyebrow className="mt-5">{member.designation}</Eyebrow>
                  <h2 className="mt-3 font-display text-3xl text-brand-indigo">{member.name}</h2>
                  {member.bio ? (
                    <p className="mt-3 text-sm leading-6 text-brand-muted">{member.bio}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <div className="mt-16 grid gap-10 border-t border-brand-line pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>What we publish</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.5rem)] leading-[0.98] text-brand-indigo">
                Credentials before portraits.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-7 text-brand-muted">
                A published profile will include only information the clinic has verified and
                approved. If a credential or photograph is missing, the profile stays unpublished.
              </p>
              <ul className="mt-6 space-y-3">
                {publicationChecks.map((check) => (
                  <li key={check} className="flex gap-3 text-sm leading-7 text-brand-muted">
                    <Check
                      aria-hidden="true"
                      className="mt-1.5 shrink-0 text-brand-gold-deep"
                      size={16}
                      strokeWidth={1.5}
                    />
                    {check}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <BookingLink />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-brand-line py-12 sm:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.65fr] lg:items-end">
            <p className="max-w-2xl text-[0.98rem] leading-8 text-brand-muted sm:text-lg">
              The clinic’s practitioners will be introduced here with verified roles and
              credentials. No sample names, qualifications or portraits have been invented for this
              preview.
            </p>
            <div className="border-l border-brand-gold/60 pl-5">
              <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
                Publication standard
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Credentials first. A profile is unpublished rather than filled with assumptions.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
