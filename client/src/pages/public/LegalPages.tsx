import type { ReactNode } from 'react';

import { Seo } from '@/components/seo/Seo';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ContentBadge } from '@/components/ui/ContentBadge';
import { PageHero } from '@/components/ui/PageHero';

type LegalSection = {
  heading: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  eyebrow: string;
  sections: LegalSection[];
  children?: ReactNode;
};

function LegalPage({ title, intro, eyebrow, sections, children }: LegalPageProps) {
  return (
    <>
      <Seo title={title} description={intro} noindex />

      <PageHero
        eyebrow={eyebrow}
        title={title}
        intro={intro}
        aside={
          <div className="border-l border-brand-gold/60 pl-5">
            <ContentBadge>Draft template</ContentBadge>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              This page is a drafting framework, not final legal wording. It must be reviewed by the
              clinic and a qualified legal adviser before publication.
            </p>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container className="max-w-4xl">
          <div className="border border-brand-gold/45 bg-brand-gold/5 px-5 py-4">
            <p className="text-sm leading-7 text-brand-muted">
              <strong className="font-medium text-brand-indigo">Status:</strong> draft, awaiting
              clinic and legal review. Bracketed details are intentionally unresolved.
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-3xl leading-tight text-brand-indigo">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-brand-muted">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {children}

          <div className="mt-14 border-t border-brand-line pt-8">
            <p className="text-sm leading-7 text-brand-muted">
              Questions about this draft should be directed to the clinic’s legal reviewer.
            </p>
            <div className="mt-5">
              <ButtonLink to="/contact" variant="secondary">
                Contact page
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="A drafting framework for how Blue Miror may handle personal information. The final policy requires the clinic’s legal entity, jurisdiction and retention decisions."
      sections={[
        {
          heading: 'Who we are',
          body: [
            'The data controller will be [legal entity], operating as Blue Miror in [jurisdiction]. The final privacy contact and business address are not yet supplied.',
          ],
        },
        {
          heading: 'Information we may collect',
          body: [
            'When an appointment request or contact message is enabled, the website may collect the name, phone number, optional email address, selected treatment and message supplied by the visitor.',
            'No sensitive medical history is intended to be collected through the public website. Any future collection of health information will require a separate legal and clinical review.',
          ],
        },
        {
          heading: 'How information may be used',
          body: [
            'Information may be used to respond to an enquiry, review an appointment request, provide requested services and maintain the security of the website. The final purposes, lawful bases and third-party processors must be confirmed by the clinic’s adviser.',
          ],
        },
        {
          heading: 'Retention and your choices',
          body: [
            'Retention periods are not yet defined: [retention period]. The final policy must explain how a visitor can request access, correction or deletion, and how a complaint can be raised.',
          ],
        },
        {
          heading: 'Cookies and analytics',
          body: [
            'No analytics or marketing cookies are configured in this preview. If they are added, the final policy and consent experience must be reviewed before launch.',
          ],
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms & conditions"
      intro="A drafting framework for the use of the Blue Miror website. Final terms require the clinic’s legal entity, governing law and approved appointment policy."
      sections={[
        {
          heading: 'Using this website',
          body: [
            'This website is provided for general information about Blue Miror and its services. Final terms must set out acceptable use, intellectual property ownership and any restrictions.',
          ],
        },
        {
          heading: 'Appointment requests',
          body: [
            'An appointment request is not a confirmed appointment. The clinic reviews requests and confirms availability separately. [Approved appointment policy to be inserted.]',
          ],
        },
        {
          heading: 'Website content',
          body: [
            'Treatment names, descriptions, images, prices and availability are placeholders until approved by the clinic. Content may change without notice.',
          ],
        },
        {
          heading: 'Liability and governing law',
          body: [
            'The final liability wording, governing law and dispute process must be supplied by the clinic’s legal adviser for [jurisdiction]. Nothing on this draft is legal advice.',
          ],
        },
      ]}
    />
  );
}

export function MedicalDisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Medical information"
      title="Medical disclaimer"
      intro="A drafting framework for the health-related information on this website. Final wording requires clinic and medical review."
      sections={[
        {
          heading: 'General information only',
          body: [
            'The treatment information on this website is general information, not medical advice, a diagnosis or a recommendation for a particular person.',
            'Suitability, risks, aftercare and expected outcomes can only be assessed in a consultation with an appropriately qualified professional.',
          ],
        },
        {
          heading: 'No guaranteed outcomes',
          body: [
            'No treatment result is guaranteed. Any benefits described in final approved content must be worded as possibilities rather than promises.',
          ],
        },
        {
          heading: 'Urgent concerns',
          body: [
            'If you have an urgent medical concern, contact the appropriate emergency or healthcare service in your location. Do not rely on this website for urgent help.',
          ],
        },
        {
          heading: 'Before treatment',
          body: [
            'The clinic must provide approved pre-treatment information, consent wording and aftercare guidance. This preview does not replace any of those documents.',
          ],
        },
      ]}
    />
  );
}
