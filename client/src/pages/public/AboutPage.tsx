import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTeam } from '@/hooks/use-public-content';

const standards = [
  {
    title: 'The consultation comes first',
    body: 'A considered conversation about your concerns, priorities and questions — before any recommendation.',
  },
  {
    title: 'Clarity over pressure',
    body: 'Plain-language explanations of suitability, risks, aftercare and next steps. No guarantees and no rushed decisions.',
  },
  {
    title: 'A service-led experience',
    body: 'Built around treatments and care, not products or a checkout. The website remains deliberately focused on the clinic.',
  },
];

export function AboutPage() {
  const teamQuery = useTeam();
  const hasTeam = (teamQuery.data?.items.length ?? 0) > 0;

  return (
    <>
      <Seo
        title="About"
        description="The approach behind Blue Miror: considered aesthetic care, clear communication and a service-led clinic experience."
      />

      <PageHero
        eyebrow="About Blue Miror"
        title={
          <>
            A clinic shaped around
            <br /> <em className="text-brand-gold-deep">the conversation</em>.
          </>
        }
        intro="Blue Miror is conceived as a calm, contemporary aesthetic clinic — premium in feeling, honest in its detail and intentionally centred on consultation."
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <p className="text-[0.6rem] tracking-[0.18em] text-brand-gold-deep uppercase">
              Content status
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              The clinic story, founder details and milestones will be published only after
              verification.
            </p>
          </div>
        }
      />

      <section className="py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-t-full border border-brand-gold/30"
            />
            <BrandVisual
              variant="drape"
              label="Clinic interior — photography pending"
              className="aspect-[4/5] rounded-t-full"
            />
          </div>

          <div>
            <Eyebrow>Our point of view</Eyebrow>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
              Beauty, without the noise.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-brand-muted">
              <p>
                The final Blue Miror story will live here — the people behind the clinic, the
                thinking that shaped it and the standards that guide every visit. Those details are
                intentionally absent until the clinic supplies and approves them.
              </p>
              <p>
                What guides the design is simpler: a service-led clinic should feel personal,
                unhurried and clear. Every page is built around that idea, with no invented
                credentials, statistics or promises.
              </p>
            </div>
            <div className="mt-7">
              <ContentBadge>Draft narrative · awaiting clinic copy</ContentBadge>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-brand-line bg-brand-porcelain py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="The standard is the experience."
            intro="These are working principles for the Blue Miror digital experience, not claims about the clinic’s history or results."
          />

          <div className="mt-12 grid gap-0 border-t border-brand-line md:grid-cols-3 md:border-l">
            {standards.map((standard, index) => (
              <div
                key={standard.title}
                className="border-b border-brand-line py-7 md:border-r md:border-b-0 md:px-7 lg:px-9"
              >
                <span className="font-display text-lg text-brand-gold-deep">0{index + 1}</span>
                <h3 className="mt-3 font-display text-2xl leading-tight text-brand-indigo">
                  {standard.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-brand-muted">{standard.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>The people</Eyebrow>
            <h2 className="mt-5 max-w-xl font-display text-[clamp(2.5rem,4.8vw,4rem)] leading-[0.96] text-brand-indigo">
              Credentials before portraits.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-brand-muted">
              Practitioner profiles are published only when names, roles and professional
              credentials have been verified. No sample names or qualifications have been invented
              for this preview.
            </p>
            <Link
              to="/team"
              className="mt-7 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-[0.67rem] font-medium tracking-[0.18em] text-brand-indigo uppercase transition-colors hover:text-brand-gold-deep"
            >
              About the team
              <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} />
            </Link>
          </div>

          <div>
            {hasTeam && teamQuery.data ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {teamQuery.data.items.map((member) => (
                  <article
                    key={member.id}
                    className="border border-brand-line bg-brand-porcelain p-5"
                  >
                    <Eyebrow>{member.designation}</Eyebrow>
                    <h3 className="mt-3 font-display text-2xl text-brand-indigo">{member.name}</h3>
                    {member.bio ? (
                      <p className="mt-3 text-sm leading-6 text-brand-muted">{member.bio}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState eyebrow="Verification in progress" title="Profiles are being prepared">
                The clinic’s team will appear here once every published role and credential has been
                checked and approved.
              </EmptyState>
            )}
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <div className="grid gap-8 border border-brand-line bg-brand-porcelain p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow>Next step</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.1rem,4vw,3.3rem)] leading-[0.98] text-brand-indigo">
                A considered place to begin.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-muted">
                Explore the treatment structure or get in touch with the clinic. Final contact
                details will appear only once verified.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <BookingLink />
              <ButtonLink to="/treatments" variant="secondary">
                Explore treatments
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
