import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { getSettings, saveSettings } from '../api';
import {
  AdminButton,
  Alert,
  Badge,
  Checkbox,
  Field,
  ListSkeleton,
  PageHeader,
  Panel,
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { datetimeLocalToIso, isoToDatetimeLocal } from '../format';
import { useToast } from '../toast';
import { emptyHomepage, emptySettings, type AdminHomepage, type AdminSettings } from '../types';

type SettingsDraft = Omit<AdminSettings, 'legal' | 'homepage'> & {
  legal: { lastUpdated: string | null };
  legalInput: string;
  homepage: AdminHomepage;
};

/**
 * Only schema fields are copied: the API returns `_id`, `id`, `__v` and
 * timestamps on read, and its write schema rejects unknown keys.
 */
function toDraft(settings: AdminSettings | null): SettingsDraft {
  const source = settings ?? emptySettings;

  return {
    site: source.site,
    brand: source.brand,
    contact: source.contact,
    whatsapp: source.whatsapp,
    booking: source.booking,
    social: source.social,
    seo: source.seo,
    legal: { ...source.legal },
    legalInput: isoToDatetimeLocal(source.legal.lastUpdated),
    homepage: { ...emptyHomepage, ...(source.homepage ?? {}) },
  };
}

function fromDraft(draft: SettingsDraft): AdminSettings {
  return {
    site: draft.site,
    brand: draft.brand,
    contact: draft.contact,
    whatsapp: draft.whatsapp,
    booking: draft.booking,
    social: draft.social,
    seo: draft.seo,
    homepage: draft.homepage,
    legal: {
      lastUpdated: draft.legalInput
        ? datetimeLocalToIso(draft.legalInput)
        : draft.legal.lastUpdated,
    },
  };
}

function nullIfEmpty(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

function SettingsForm({ settings }: { settings: AdminSettings | null }) {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [baseline, setBaseline] = useState<{ draft: SettingsDraft; json: string }>(() => {
    const initial = toDraft(settings);
    return { draft: initial, json: JSON.stringify(initial) };
  });
  const [draft, setDraft] = useState<SettingsDraft>(baseline.draft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => JSON.stringify(draft) !== baseline.json, [draft, baseline.json]);

  useEffect(() => {
    if (!dirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (input: AdminSettings) => saveSettings(input),
    onSuccess: (saved) => {
      const next = toDraft(saved);
      setBaseline({ draft: next, json: JSON.stringify(next) });
      setDraft(next);
      setErrors({});
      push({ title: 'Website settings saved', tone: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['public-content'] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      push({
        title: 'The settings could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!draft.site.name.trim()) next['site.name'] = 'The clinic name is required.';
    if (!draft.site.category.trim()) next['site.category'] = 'A clinic category is required.';
    if (!draft.site.defaultDescription.trim())
      next['site.defaultDescription'] = 'A default description is required.';
    if (!draft.brand.logoUrl.trim()) next['brand.logoUrl'] = 'A logo path is required.';
    if (!draft.brand.logoAlt.trim()) next['brand.logoAlt'] = 'Logo alternative text is required.';
    if (!draft.booking.note.trim()) next['booking.note'] = 'Booking instructions are required.';
    if (!draft.whatsapp.cta.booking.trim())
      next['whatsapp.cta.booking'] = 'A booking button label is required.';
    if (!draft.whatsapp.cta.serviceEnquiry.trim())
      next['whatsapp.cta.serviceEnquiry'] = 'A service enquiry label is required.';
    if (!draft.whatsapp.cta.floating.trim())
      next['whatsapp.cta.floating'] = 'A floating button label is required.';
    if (!draft.seo.defaultTitle.trim())
      next['seo.defaultTitle'] = 'A default SEO title is required.';
    if (!draft.seo.defaultDescription.trim())
      next['seo.defaultDescription'] = 'A default meta description is required.';

    if (draft.whatsapp.enabled && !draft.whatsapp.number?.trim()) {
      next['whatsapp.number'] = 'A WhatsApp number is required when WhatsApp is enabled.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      push({ title: 'Check the highlighted settings', tone: 'error' });
      return;
    }

    const payload = fromDraft(draft);
    save.mutate({
      ...payload,
      contact: {
        ...payload.contact,
        phone: payload.contact.phone ? payload.contact.phone.trim() : null,
        email: payload.contact.email ? payload.contact.email.trim() : null,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 pb-24">
      <PageHeader
        eyebrow="Configuration"
        title="Website settings"
        description="These values feed the public website. Everything is stored through the authenticated admin API."
        actions={
          <Badge tone={settings ? 'published' : 'draft'}>
            {settings ? 'Saved configuration' : 'Not configured yet'}
          </Badge>
        }
      />

      {!settings ? (
        <Alert tone="info">
          No settings document exists yet, so the public site is showing its labelled preview
          fallbacks. Complete the required fields and save to publish real clinic configuration.
        </Alert>
      ) : null}

      <Panel title="General" description="Clinic identity and the logo used across the site.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Clinic / website name"
            htmlFor="setting-site-name"
            required
            error={errors['site.name']}
          >
            <TextInput
              id="setting-site-name"
              value={draft.site.name}
              invalid={Boolean(errors['site.name'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  site: { ...current.site, name: event.target.value },
                }))
              }
            />
          </Field>
          <Field
            label="Clinic category"
            htmlFor="setting-site-category"
            required
            error={errors['site.category']}
          >
            <TextInput
              id="setting-site-category"
              value={draft.site.category}
              invalid={Boolean(errors['site.category'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  site: { ...current.site, category: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Tagline" htmlFor="setting-site-tagline" hint="Optional, 120 characters.">
            <TextInput
              id="setting-site-tagline"
              value={draft.site.tagline ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  site: { ...current.site, tagline: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field
            label="Logo path"
            htmlFor="setting-brand-url"
            required
            error={errors['brand.logoUrl']}
            hint="Public path or full URL to the crest."
          >
            <TextInput
              id="setting-brand-url"
              value={draft.brand.logoUrl}
              invalid={Boolean(errors['brand.logoUrl'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  brand: { ...current.brand, logoUrl: event.target.value },
                }))
              }
            />
          </Field>
          <Field
            label="Logo alternative text"
            htmlFor="setting-brand-alt"
            required
            error={errors['brand.logoAlt']}
          >
            <TextInput
              id="setting-brand-alt"
              value={draft.brand.logoAlt}
              invalid={Boolean(errors['brand.logoAlt'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  brand: { ...current.brand, logoAlt: event.target.value },
                }))
              }
            />
          </Field>
          <Field
            label="Default description"
            htmlFor="setting-site-description"
            required
            error={errors['site.defaultDescription']}
          >
            <TextArea
              id="setting-site-description"
              value={draft.site.defaultDescription}
              invalid={Boolean(errors['site.defaultDescription'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  site: { ...current.site, defaultDescription: event.target.value },
                }))
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Contact" description="Phone, email, address, map links and opening hours.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="setting-phone">
            <TextInput
              id="setting-phone"
              value={draft.contact.phone ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, phone: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Email" htmlFor="setting-email">
            <TextInput
              id="setting-email"
              type="email"
              value={draft.contact.email ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, email: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Address" htmlFor="setting-address">
            <TextInput
              id="setting-address"
              value={draft.contact.address ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, address: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field
            label="WhatsApp display text"
            htmlFor="setting-whatsapp-display"
            hint="Shown instead of the raw number."
          >
            <TextInput
              id="setting-whatsapp-display"
              value={draft.contact.whatsappDisplay ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, whatsappDisplay: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Map URL" htmlFor="setting-maps">
            <TextInput
              id="setting-maps"
              value={draft.contact.mapsUrl ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, mapsUrl: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Directions URL" htmlFor="setting-directions">
            <TextInput
              id="setting-directions"
              value={draft.contact.directionsUrl ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: { ...current.contact, directionsUrl: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-6">
          <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
            Business hours
          </p>
          <div className="mt-3 space-y-2">
            {draft.contact.hours.map((entry, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <TextInput
                  aria-label={`Hours ${index + 1} label`}
                  placeholder="Monday"
                  value={entry.label}
                  onChange={(event) => {
                    const hours = [...draft.contact.hours];
                    hours[index] = { ...entry, label: event.target.value };
                    setDraft((current) => ({ ...current, contact: { ...current.contact, hours } }));
                  }}
                />
                <TextInput
                  aria-label={`Hours ${index + 1} value`}
                  placeholder="9:00 – 18:00"
                  value={entry.value}
                  onChange={(event) => {
                    const hours = [...draft.contact.hours];
                    hours[index] = { ...entry, value: event.target.value };
                    setDraft((current) => ({ ...current, contact: { ...current.contact, hours } }));
                  }}
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove hours row ${index + 1}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      contact: {
                        ...current.contact,
                        hours: current.contact.hours.filter((_, i) => i !== index),
                      },
                    }))
                  }
                >
                  <Trash2 aria-hidden="true" size={14} />
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                contact: {
                  ...current.contact,
                  hours: [...current.contact.hours, { label: '', value: '' }],
                },
              }))
            }
          >
            <Plus aria-hidden="true" size={14} /> Add hours row
          </AdminButton>
        </div>

        <div className="mt-6">
          <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
            Social links
          </p>
          <div className="mt-3 space-y-2">
            {draft.social.map((entry, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <TextInput
                  aria-label={`Social ${index + 1} label`}
                  placeholder="Instagram"
                  value={entry.label}
                  onChange={(event) => {
                    const social = [...draft.social];
                    social[index] = { ...entry, label: event.target.value };
                    setDraft((current) => ({ ...current, social }));
                  }}
                />
                <TextInput
                  aria-label={`Social ${index + 1} URL`}
                  placeholder="https://"
                  value={entry.url}
                  onChange={(event) => {
                    const social = [...draft.social];
                    social[index] = { ...entry, url: event.target.value };
                    setDraft((current) => ({ ...current, social }));
                  }}
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove social row ${index + 1}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      social: current.social.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 aria-hidden="true" size={14} />
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                social: [...current.social, { label: '', url: '' }],
              }))
            }
          >
            <Plus aria-hidden="true" size={14} /> Add social link
          </AdminButton>
        </div>
      </Panel>

      <Panel
        title="WhatsApp and booking"
        description="One central configuration for every WhatsApp call to action on the website."
      >
        <div className="space-y-5">
          <label className="flex items-center gap-3 text-sm text-brand-indigo">
            <input
              type="checkbox"
              checked={draft.whatsapp.enabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  whatsapp: { ...current.whatsapp, enabled: event.target.checked },
                }))
              }
              className="size-4 accent-brand-indigo"
            />
            Enable WhatsApp contact across the website
          </label>

          <Checkbox
            id="setting-wa-floating"
            label="Show the floating WhatsApp button"
            description="Hidden automatically whenever WhatsApp is disabled or unconfigured."
            checked={draft.whatsapp.showFloatingButton ?? true}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                whatsapp: { ...current.whatsapp, showFloatingButton: event.target.checked },
              }))
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Country code" htmlFor="setting-wa-code" hint="Including the plus sign.">
              <TextInput
                id="setting-wa-code"
                value={draft.whatsapp.countryCode ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: { ...current.whatsapp, countryCode: nullIfEmpty(event.target.value) },
                  }))
                }
              />
            </Field>
            <Field
              label="WhatsApp number"
              htmlFor="setting-wa-number"
              error={errors['whatsapp.number']}
            >
              <TextInput
                id="setting-wa-number"
                value={draft.whatsapp.number ?? ''}
                invalid={Boolean(errors['whatsapp.number'])}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: { ...current.whatsapp, number: nullIfEmpty(event.target.value) },
                  }))
                }
              />
            </Field>
            <Field
              label="Default message"
              htmlFor="setting-wa-default"
              hint="Sent when a visitor opens WhatsApp."
            >
              <TextArea
                id="setting-wa-default"
                value={draft.whatsapp.defaultMessage ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      defaultMessage: nullIfEmpty(event.target.value),
                    },
                  }))
                }
              />
            </Field>
            <Field label="Booking message template" htmlFor="setting-wa-booking" hint="Optional.">
              <TextArea
                id="setting-wa-booking"
                value={draft.whatsapp.bookingMessageTemplate ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      bookingMessageTemplate: nullIfEmpty(event.target.value),
                    },
                  }))
                }
              />
            </Field>
            <Field label="Service enquiry template" htmlFor="setting-wa-enquiry" hint="Optional.">
              <TextArea
                id="setting-wa-enquiry"
                value={draft.whatsapp.serviceEnquiryTemplate ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      serviceEnquiryTemplate: nullIfEmpty(event.target.value),
                    },
                  }))
                }
              />
            </Field>
            <Field
              label="Response expectation"
              htmlFor="setting-booking-response"
              hint="Shown near booking calls to action."
            >
              <TextInput
                id="setting-booking-response"
                value={draft.booking.responseExpectation ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    booking: {
                      ...current.booking,
                      responseExpectation: nullIfEmpty(event.target.value),
                    },
                  }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Booking CTA label"
              htmlFor="setting-cta-booking"
              required
              error={errors['whatsapp.cta.booking']}
            >
              <TextInput
                id="setting-cta-booking"
                value={draft.whatsapp.cta.booking}
                invalid={Boolean(errors['whatsapp.cta.booking'])}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      cta: { ...current.whatsapp.cta, booking: event.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field
              label="Service enquiry label"
              htmlFor="setting-cta-service"
              required
              error={errors['whatsapp.cta.serviceEnquiry']}
            >
              <TextInput
                id="setting-cta-service"
                value={draft.whatsapp.cta.serviceEnquiry}
                invalid={Boolean(errors['whatsapp.cta.serviceEnquiry'])}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      cta: { ...current.whatsapp.cta, serviceEnquiry: event.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field
              label="Floating button label"
              htmlFor="setting-cta-floating"
              required
              error={errors['whatsapp.cta.floating']}
            >
              <TextInput
                id="setting-cta-floating"
                value={draft.whatsapp.cta.floating}
                invalid={Boolean(errors['whatsapp.cta.floating'])}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    whatsapp: {
                      ...current.whatsapp,
                      cta: { ...current.whatsapp.cta, floating: event.target.value },
                    },
                  }))
                }
              />
            </Field>
          </div>

          <Checkbox
            id="setting-booking-enabled"
            label="Accept new appointment requests"
            description="Turning this off hides the booking form without deleting any stored request."
            checked={draft.booking.enabled ?? true}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                booking: { ...current.booking, enabled: event.target.checked },
              }))
            }
          />

          <Field
            label="Booking instructions"
            htmlFor="setting-booking-note"
            required
            error={errors['booking.note']}
            hint="Shown wherever booking is offered. State clearly that a request is not a confirmed appointment."
          >
            <TextArea
              id="setting-booking-note"
              value={draft.booking.note}
              invalid={Boolean(errors['booking.note'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  booking: { ...current.booking, note: event.target.value },
                }))
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="SEO" description="Default metadata used when a page has no specific values.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Default SEO title"
            htmlFor="setting-seo-title"
            required
            error={errors['seo.defaultTitle']}
          >
            <TextInput
              id="setting-seo-title"
              value={draft.seo.defaultTitle}
              invalid={Boolean(errors['seo.defaultTitle'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seo: { ...current.seo, defaultTitle: event.target.value },
                }))
              }
            />
          </Field>
          <Field
            label="Canonical base URL"
            htmlFor="setting-seo-canonical"
            hint="Optional, e.g. https://bluemiror.com"
          >
            <TextInput
              id="setting-seo-canonical"
              value={draft.seo.canonicalBaseUrl ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seo: { ...current.seo, canonicalBaseUrl: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field
            label="Default meta description"
            htmlFor="setting-seo-description"
            required
            error={errors['seo.defaultDescription']}
            className="sm:col-span-2"
          >
            <TextArea
              id="setting-seo-description"
              value={draft.seo.defaultDescription}
              invalid={Boolean(errors['seo.defaultDescription'])}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seo: { ...current.seo, defaultDescription: event.target.value },
                }))
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Legal" description="Displayed on the legal pages.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Last updated" htmlFor="setting-legal-updated">
            <TextInput
              id="setting-legal-updated"
              type="datetime-local"
              value={draft.legalInput}
              onChange={(event) =>
                setDraft((current) => ({ ...current, legalInput: event.target.value }))
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Homepage"
        description="Hero copy, introduction and which sections appear. Blank fields keep the current designed copy."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Hero heading"
            htmlFor="setting-home-heading"
            hint="Leave blank to keep the designed headline."
          >
            <TextInput
              id="setting-home-heading"
              value={draft.homepage.heroHeading ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, heroHeading: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Hero image URL" htmlFor="setting-home-image" hint="Optional.">
            <TextInput
              id="setting-home-image"
              value={draft.homepage.heroImageUrl ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, heroImageUrl: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field
            label="Hero description"
            htmlFor="setting-home-description"
            className="sm:col-span-2"
          >
            <TextArea
              id="setting-home-description"
              value={draft.homepage.heroDescription ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: {
                    ...current.homepage,
                    heroDescription: nullIfEmpty(event.target.value),
                  },
                }))
              }
            />
          </Field>
          <Field label="Hero button label" htmlFor="setting-home-cta-label">
            <TextInput
              id="setting-home-cta-label"
              value={draft.homepage.heroCtaLabel ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, heroCtaLabel: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Hero button destination" htmlFor="setting-home-cta-href">
            <TextInput
              id="setting-home-cta-href"
              value={draft.homepage.heroCtaHref ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, heroCtaHref: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field label="Introduction heading" htmlFor="setting-home-about-heading">
            <TextInput
              id="setting-home-about-heading"
              value={draft.homepage.aboutHeading ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, aboutHeading: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
          <Field
            label="Introduction body"
            htmlFor="setting-home-about-body"
            className="sm:col-span-2"
          >
            <TextArea
              id="setting-home-about-body"
              value={draft.homepage.aboutBody ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, aboutBody: nullIfEmpty(event.target.value) },
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['showFeatured', 'Show featured treatments'],
              ['showGallery', 'Show the gallery preview'],
              ['showFaqs', 'Show the FAQ preview'],
            ] as const
          ).map(([key, label]) => (
            <Checkbox
              key={key}
              id={`setting-home-${key}`}
              label={label}
              checked={draft.homepage[key]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homepage: { ...current.homepage, [key]: event.target.checked },
                }))
              }
            />
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-brand-line bg-brand-ivory/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-brand-muted">
            {dirty ? 'You have unsaved changes.' : 'All changes are saved.'}
          </p>
          <div className="flex gap-3">
            <AdminButton
              variant="secondary"
              disabled={!dirty || save.isPending}
              onClick={() => setDraft(baseline.draft)}
            >
              Discard changes
            </AdminButton>
            <AdminButton type="submit" busy={save.isPending} disabled={!dirty}>
              Save settings
            </AdminButton>
          </div>
        </div>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings });

  if (settings.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Configuration" title="Website settings" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (settings.isError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Configuration" title="Website settings" />
        <Panel title="Settings could not be loaded">
          <p className="text-sm text-brand-muted">
            {settings.error instanceof Error ? settings.error.message : 'Unknown error.'}
          </p>
          <AdminButton variant="secondary" className="mt-4" onClick={() => void settings.refetch()}>
            Try again
          </AdminButton>
        </Panel>
      </div>
    );
  }

  return <SettingsForm settings={settings.data ?? null} />;
}
