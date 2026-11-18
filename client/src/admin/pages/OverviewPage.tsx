import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import {
  getInboxSummary,
  getSettings,
  listAppointments,
  listCategories,
  listFaqs,
  listGallery,
  listServices,
  listTeam,
  listTestimonials,
} from '../api';
import { AdminButton, Badge, ListSkeleton, PageHeader, Panel } from '../components/AdminUI';

type StatTone = 'indigo' | 'gold' | 'azure';

function StatCard({
  label,
  value,
  detail,
  to,
  tone = 'indigo',
}: {
  label: string;
  value: number | string;
  detail?: string;
  to: string;
  tone?: StatTone;
}) {
  const accent = {
    indigo: 'bg-brand-indigo',
    gold: 'bg-brand-gold',
    azure: 'bg-brand-azure',
  } as const;

  return (
    <Link
      to={to}
      className="group border border-brand-line bg-brand-porcelain p-5 transition-colors hover:border-brand-indigo/35"
    >
      <div className="flex items-start justify-between">
        <div className={`h-px w-8 ${accent[tone]}`} aria-hidden="true" />
        <ArrowUpRight
          aria-hidden="true"
          size={14}
          className="text-brand-muted transition-colors group-hover:text-brand-indigo"
        />
      </div>
      <p className="mt-4 font-display text-4xl leading-none text-brand-indigo">{value}</p>
      <p className="mt-3 text-[0.625rem] font-medium tracking-[0.18em] text-brand-muted uppercase">
        {label}
      </p>
      {detail ? <p className="mt-1 text-xs leading-5 text-brand-muted">{detail}</p> : null}
    </Link>
  );
}

export function OverviewPage() {
  const services = useQuery({
    queryKey: ['admin', 'overview', 'services'],
    queryFn: () => listServices({ page: 1, limit: 48 }),
  });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories });
  const gallery = useQuery({ queryKey: ['admin', 'gallery'], queryFn: listGallery });
  const team = useQuery({ queryKey: ['admin', 'team'], queryFn: listTeam });
  const testimonials = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: listTestimonials,
  });
  const faqs = useQuery({ queryKey: ['admin', 'faqs'], queryFn: listFaqs });
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings });
  const inbox = useQuery({
    queryKey: ['admin', 'inbox', 'summary'],
    queryFn: getInboxSummary,
    staleTime: 30_000,
  });
  const recentAppointments = useQuery({
    queryKey: ['admin', 'inbox', 'appointments', 'recent'],
    queryFn: () => listAppointments({ page: 1, limit: 5 }),
  });

  const isLoading =
    services.isLoading ||
    categories.isLoading ||
    gallery.isLoading ||
    team.isLoading ||
    testimonials.isLoading ||
    faqs.isLoading ||
    settings.isLoading ||
    inbox.isLoading;

  const failed = [
    services,
    categories,
    gallery,
    team,
    testimonials,
    faqs,
    settings,
    inbox,
    recentAppointments,
  ].find((query) => query.isError);

  const serviceItems = services.data?.items ?? [];
  const published = serviceItems.filter((item) => item.publishedAt && !item.isArchived).length;
  const drafts = serviceItems.length - published;
  const featured = serviceItems.filter((item) => item.isFeatured).length;

  function retryAll() {
    void services.refetch();
    void categories.refetch();
    void gallery.refetch();
    void team.refetch();
    void testimonials.refetch();
    void faqs.refetch();
    void settings.refetch();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Content overview"
        description="Live counts from the Blue Miror API. Nothing here is estimated or simulated."
      />

      {failed ? (
        <Panel title="Some data could not be loaded">
          <p className="text-sm leading-6 text-brand-muted">
            {failed.error instanceof Error
              ? failed.error.message
              : 'The admin API did not respond as expected.'}
          </p>
          <div className="mt-4">
            <AdminButton variant="secondary" onClick={retryAll}>
              Retry
            </AdminButton>
          </div>
        </Panel>
      ) : null}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Services"
              value={services.data?.total ?? 0}
              detail={`${featured} featured`}
              to="/admin/services"
            />
            <StatCard
              label="Published services"
              value={published}
              detail="Visible on the public website"
              to="/admin/services"
              tone="gold"
            />
            <StatCard
              label="Draft services"
              value={drafts}
              detail="Not yet published"
              to="/admin/services"
              tone="azure"
            />
            <StatCard
              label="Categories"
              value={categories.data?.total ?? 0}
              to="/admin/categories"
            />
            <StatCard label="Gallery images" value={gallery.data?.total ?? 0} to="/admin/gallery" />
            <StatCard label="Team members" value={team.data?.total ?? 0} to="/admin/team" />
            <StatCard
              label="Testimonials"
              value={testimonials.data?.total ?? 0}
              to="/admin/testimonials"
            />
            <StatCard label="FAQs" value={faqs.data?.total ?? 0} to="/admin/faqs" />
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-brand-indigo">Inbox</h2>
                <p className="mt-1 text-xs leading-5 text-brand-muted">
                  Live counts of submissions waiting for a decision. Nothing is auto-confirmed or
                  auto-published.
                </p>
              </div>
              <Link
                to="/admin/inbox"
                className="text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase"
              >
                Open inbox
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pending appointments"
                value={inbox.data?.pendingAppointments ?? 0}
                detail="WhatsApp pending"
                to="/admin/inbox"
                tone="gold"
              />
              <StatCard
                label="New enquiries"
                value={inbox.data?.newEnquiries ?? 0}
                to="/admin/inbox"
              />
              <StatCard
                label="New contact messages"
                value={inbox.data?.newContactMessages ?? 0}
                to="/admin/inbox"
                tone="azure"
              />
              <StatCard
                label="Stories to review"
                value={inbox.data?.pendingTestimonials ?? 0}
                detail="Awaiting moderation"
                to="/admin/inbox"
                tone="gold"
              />
            </div>
          </div>

          <Panel
            title="Latest appointment requests"
            description="Newest first. Statuses change only when an administrator records a decision."
          >
            {recentAppointments.isLoading ? (
              <ListSkeleton rows={3} />
            ) : (recentAppointments.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm leading-6 text-brand-muted">
                No appointment requests have been submitted yet.
              </p>
            ) : (
              <ul className="divide-y divide-brand-line">
                {(recentAppointments.data?.items ?? []).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm text-brand-indigo">
                        {appointment.bookingRef} · {appointment.fullName}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {appointment.serviceName ?? 'No treatment selected'} ·{' '}
                        {appointment.preferredDate} at {appointment.preferredTime}
                      </p>
                    </div>
                    <Badge tone={appointment.status === 'pending' ? 'draft' : 'published'}>
                      {appointment.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Website configuration"
              description="Contact, WhatsApp and SEO values used across the public site."
              actions={
                <Badge tone={settings.data ? 'published' : 'draft'}>
                  {settings.data ? 'Configured' : 'Not configured'}
                </Badge>
              }
            >
              {settings.data ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-brand-line pb-3">
                    <dt className="text-brand-muted">Clinic name</dt>
                    <dd className="text-right text-brand-indigo">
                      {settings.data.site.name || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-brand-line pb-3">
                    <dt className="text-brand-muted">Contact email</dt>
                    <dd className="text-right text-brand-indigo">
                      {settings.data.contact.email ?? 'Not set'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-brand-line pb-3">
                    <dt className="text-brand-muted">WhatsApp</dt>
                    <dd className="text-right text-brand-indigo">
                      {settings.data.whatsapp.enabled && settings.data.whatsapp.number
                        ? `${settings.data.whatsapp.countryCode ?? ''} ${settings.data.whatsapp.number}`.trim()
                        : 'Disabled'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-muted">SEO title</dt>
                    <dd className="max-w-[60%] text-right text-brand-indigo">
                      {settings.data.seo.defaultTitle || '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-brand-muted">
                    No website settings have been saved yet, so the public site is using its
                    clearly-labelled preview fallbacks.
                  </p>
                  <Link
                    to="/admin/settings"
                    className="mt-4 inline-block text-xs tracking-[0.14em] text-brand-indigo uppercase underline underline-offset-4"
                  >
                    Configure website settings
                  </Link>
                </div>
              )}
            </Panel>

            <Panel title="Recently updated services">
              {serviceItems.length === 0 ? (
                <p className="text-sm leading-6 text-brand-muted">
                  No services have been created yet.{' '}
                  <Link
                    to="/admin/services"
                    className="text-brand-indigo underline underline-offset-4"
                  >
                    Create the first service
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-brand-line">
                  {[...serviceItems]
                    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
                    .slice(0, 5)
                    .map((service) => (
                      <li key={service.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-brand-indigo">{service.name}</p>
                          <p className="truncate text-xs text-brand-muted">{service.category}</p>
                        </div>
                        <Badge tone={service.publishedAt ? 'published' : 'draft'}>
                          {service.publishedAt ? 'Published' : 'Draft'}
                        </Badge>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
