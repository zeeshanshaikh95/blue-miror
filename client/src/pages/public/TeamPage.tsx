import { Check } from 'lucide-react';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { useTeam } from '@/hooks/use-public-content';

const servicePromises = [
  'Matched with the right stylist or therapist for your treatment',
  'A clear plan and price before we begin',
  'Aftercare you can repeat easily at home',
];

export function TeamPage() {
  const teamQuery = useTeam();
  const team = teamQuery.data?.items ?? [];

  return (
    <>
      <Seo
        title="Our team"
        description="Meet the stylists, therapists and makeup artists behind Blue Miror in Mira Road East."
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
              message="Please try again in a moment."
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
                  className="h-72 animate-pulse rounded-[1.5rem] border border-brand-line bg-brand-line/40"
                />
              ))}
            </div>
          ) : null}

          {team.length === 0 ? (
            <EmptyState
              eyebrow="In the salon"
              title="Come and meet us"
              action={<BookingLink />}
            >
              Team profiles are being updated here. In the meantime, send the clinic a message and we
              will match you with the right stylist or therapist for your treatment.
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <article
                  key={member.id}
                  className="overflow-hidden rounded-[1.75rem] border border-brand-line bg-brand-porcelain p-6"
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
              <Eyebrow>What to expect</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.5rem)] leading-[0.98] text-brand-indigo">
                The right hands for the job.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-7 text-brand-muted">
                Every appointment is handled by someone who works with your hair type, skin concern
                or occasion every day — and who explains what they are doing as they go.
              </p>
              <ul className="mt-6 space-y-3">
                {servicePromises.map((check) => (
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
              Ask for the same stylist or therapist next time and we will remember what worked. Our
              team pages will fill out as portraits and introductions are ready.
            </p>
            <div className="border-l border-brand-gold/60 pl-5">
              <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
                A note on profiles
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                We publish a team profile only with the person&rsquo;s own words and a photograph they
                are happy with.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
