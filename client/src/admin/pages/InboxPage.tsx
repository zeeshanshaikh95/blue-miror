import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Mail, MessageCircle, Search, Star, X } from 'lucide-react';

import {
  getAppointment,
  getContactSubmission,
  getEnquiry,
  getInboxSummary,
  getSettings,
  getTestimonialSubmission,
  listAppointments,
  listContactSubmissions,
  listEnquiries,
  listTestimonialSubmissions,
  moderateTestimonial,
  updateAppointment,
  updateContactSubmission,
  updateEnquiry,
} from '../api';
import {
  AdminButton,
  Alert,
  Badge,
  ConfirmDialog,
  EmptyNotice,
  Field,
  ListSkeleton,
  Modal,
  PageHeader,
  Select,
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { formatDate } from '../format';
import { useToast } from '../toast';
import {
  appointmentStatusLabels,
  appointmentStatusTransitions,
  type AdminAppointment,
  type AdminContactSubmission,
  type AdminEnquiry,
  type AdminSettings,
  type AppointmentStatus,
  type ContactStatus,
  type EnquiryStatus,
  type InboxSummary,
  type TestimonialSubmission,
} from '../types';

type TabKey = 'appointments' | 'enquiries' | 'contact' | 'testimonials';

/** The four record shapes rendered by one row layout. */
type InboxRow = {
  id: string;
  createdAt: string;
  status?: string;
  bookingRef?: string;
  fullName?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  serviceName?: string | null;
  preferredDate?: string;
  preferredTime?: string;
  subject?: string | null;
  message?: string | null;
  quote?: string;
  publishedAt?: string | null;
  isArchived?: boolean;
};

const tabs: Array<{ key: TabKey; label: string; statuses: string[] }> = [
  {
    key: 'appointments',
    label: 'Appointments',
    statuses: ['all', 'pending', 'contacted', 'confirmed', 'rescheduled', 'completed', 'cancelled'],
  },
  { key: 'enquiries', label: 'Enquiries', statuses: ['all', 'new', 'contacted', 'closed'] },
  {
    key: 'contact',
    label: 'Contact messages',
    statuses: ['all', 'new', 'in_progress', 'closed'],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    statuses: ['all', 'pending', 'published', 'archived'],
  },
];

const statusLabels: Record<string, string> = {
  ...appointmentStatusLabels,
  new: 'New',
  in_progress: 'In progress',
  closed: 'Closed',
};

const testimonialLabels: Record<string, string> = {
  pending: 'Pending review',
  published: 'Published',
  archived: 'Archived',
};

function statusTone(status: string): 'published' | 'draft' | 'neutral' | 'featured' {
  if (['confirmed', 'completed', 'published'].includes(status)) return 'published';
  if (['cancelled', 'closed', 'archived'].includes(status)) return 'neutral';
  if (['contacted', 'rescheduled', 'in_progress'].includes(status)) return 'featured';
  return 'draft';
}

function whatsappHrefFor(
  settings: AdminSettings | null,
  appointment: AdminAppointment,
): string | null {
  const whatsapp = settings?.whatsapp;

  if (!whatsapp?.enabled) return null;

  const digits = `${whatsapp.countryCode ?? ''}${whatsapp.number ?? ''}`.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;

  const template = whatsapp.bookingMessageTemplate ?? whatsapp.defaultMessage;

  const message = template
    ? template.replace(/\{([a-z][a-z0-9_]*)\}/gi, (match, key: string) => {
        const values: Record<string, string> = {
          reference: appointment.bookingRef,
          name: appointment.fullName,
          service: appointment.serviceName ?? 'Not selected',
          date: appointment.preferredDate,
          time: appointment.preferredTime,
        };
        return values[key] ?? match;
      })
    : `Hello, this is Blue Miror regarding booking ${appointment.bookingRef}.`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border border-brand-line bg-brand-porcelain p-4">
      <p className="font-display text-3xl leading-none text-brand-indigo">{value}</p>
      <p className="mt-2 text-[0.5625rem] font-medium tracking-[0.16em] text-brand-muted uppercase">
        {label}
      </p>
      <div className={`mt-3 h-px w-8 ${tone}`} aria-hidden="true" />
    </div>
  );
}

export function InboxPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [tab, setTab] = useState<TabKey>('appointments');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);

  const config = tabs.find((item) => item.key === tab) ?? tabs[0];

  const summary = useQuery({
    queryKey: ['admin', 'inbox', 'summary'],
    queryFn: getInboxSummary,
    staleTime: 30_000,
  });

  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings });

  const queryArgs = { page, limit: 10, ...(q ? { q } : {}), status };

  const appointments = useQuery({
    queryKey: ['admin', 'inbox', 'appointments', queryArgs],
    queryFn: () => listAppointments(queryArgs),
    placeholderData: keepPreviousData,
    enabled: tab === 'appointments',
  });
  const enquiries = useQuery({
    queryKey: ['admin', 'inbox', 'enquiries', queryArgs],
    queryFn: () => listEnquiries(queryArgs),
    placeholderData: keepPreviousData,
    enabled: tab === 'enquiries',
  });
  const contacts = useQuery({
    queryKey: ['admin', 'inbox', 'contact', queryArgs],
    queryFn: () => listContactSubmissions(queryArgs),
    placeholderData: keepPreviousData,
    enabled: tab === 'contact',
  });
  const testimonials = useQuery({
    queryKey: ['admin', 'inbox', 'testimonials', queryArgs],
    queryFn: () => listTestimonialSubmissions(queryArgs),
    placeholderData: keepPreviousData,
    enabled: tab === 'testimonials',
  });

  const active = {
    appointments,
    enquiries,
    contact: contacts,
    testimonials,
  }[tab];

  const detail = useQuery({
    queryKey: ['admin', 'inbox', 'detail', tab, selectedId],
    queryFn: async () => {
      if (!selectedId) throw new Error('No record selected.');
      if (tab === 'appointments') return getAppointment(selectedId);
      if (tab === 'enquiries') return getEnquiry(selectedId);
      if (tab === 'contact') return getContactSubmission(selectedId);
      return getTestimonialSubmission(selectedId);
    },
    enabled: Boolean(selectedId),
  });

  function invalidateAll() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'inbox'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  }

  const save = useMutation({
    mutationFn: async (input: {
      tab: TabKey;
      id: string;
      status?: string;
      adminNotes?: string | null;
      note?: string;
    }) => {
      if (input.tab === 'appointments') {
        return updateAppointment(input.id, {
          status: input.status as AppointmentStatus | undefined,
          adminNotes: input.adminNotes,
          note: input.note,
        });
      }
      if (input.tab === 'enquiries') {
        return updateEnquiry(input.id, {
          status: input.status as EnquiryStatus | undefined,
          adminNotes: input.adminNotes,
        });
      }
      return updateContactSubmission(input.id, {
        status: input.status as ContactStatus | undefined,
        adminNotes: input.adminNotes,
      });
    },
    onSuccess: () => {
      push({ title: 'Submission updated', tone: 'success' });
      invalidateAll();
    },
    onError: (error: unknown) =>
      push({
        title: 'The update could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const moderate = useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'unpublish' | 'archive' }) =>
      moderateTestimonial(input.id, input.action),
    onSuccess: (_data, variables) => {
      push({
        title:
          variables.action === 'approve'
            ? 'Story published'
            : variables.action === 'archive'
              ? 'Story archived'
              : 'Story unpublished',
        tone: 'success',
      });
      setConfirmArchive(null);
      invalidateAll();
    },
    onError: (error: unknown) =>
      push({
        title: 'The story could not be updated',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  function changeTab(next: TabKey) {
    setTab(next);
    setPage(1);
    setStatus('all');
    setSelectedId(null);
  }

  const rows = (active.data?.items ?? []) as Array<
    AdminAppointment | AdminEnquiry | AdminContactSubmission | TestimonialSubmission
  >;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Submissions"
        description="Every appointment request, question, message and client story, exactly as it was submitted. Nothing is auto-confirmed or auto-published. Unread enquiries stay until handled; handled enquiries are kept for 24 hours, up to the newest 50."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pending appointments"
          value={summary.data?.pendingAppointments ?? 0}
          tone="bg-brand-gold"
        />
        <SummaryCard
          label="New enquiries"
          value={summary.data?.newEnquiries ?? 0}
          tone="bg-brand-indigo"
        />
        <SummaryCard
          label="New contact messages"
          value={summary.data?.newContactMessages ?? 0}
          tone="bg-brand-azure"
        />
        <SummaryCard
          label="Stories awaiting review"
          value={summary.data?.pendingTestimonials ?? 0}
          tone="bg-brand-gold-deep"
        />
      </div>

      <div role="tablist" aria-label="Inbox sections" className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={tab === item.key}
            onClick={() => changeTab(item.key)}
            className={`min-h-10 border px-4 py-2 text-[0.625rem] font-medium tracking-[0.14em] uppercase transition-colors ${
              tab === item.key
                ? 'border-brand-indigo bg-brand-indigo text-brand-ivory'
                : 'border-brand-line bg-brand-porcelain text-brand-muted hover:border-brand-indigo/40'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="border border-brand-line bg-brand-porcelain">
        <form
          className="flex flex-col gap-3 border-b border-brand-line p-4 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setQ(searchInput);
            setPage(1);
          }}
        >
          <div className="flex-1">
            <label
              htmlFor="inbox-search"
              className="text-[0.625rem] font-medium tracking-[0.14em] text-brand-muted uppercase"
            >
              Search
            </label>
            <div className="mt-2 flex items-center border border-brand-line bg-brand-ivory px-3">
              <Search aria-hidden="true" size={14} className="text-brand-muted" />
              <input
                id="inbox-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Reference, name, phone or treatment"
                className="w-full bg-transparent px-2 py-2 text-sm text-brand-indigo focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:w-52">
            <label
              htmlFor="inbox-status"
              className="text-[0.625rem] font-medium tracking-[0.14em] text-brand-muted uppercase"
            >
              Status
            </label>
            <Select
              id="inbox-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="mt-2"
            >
              {config.statuses.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All statuses' : (statusLabels[value] ?? value)}
                </option>
              ))}
            </Select>
          </div>

          <AdminButton type="submit" variant="secondary">
            Apply
          </AdminButton>
        </form>

        {active.isLoading ? (
          <div className="p-4">
            <ListSkeleton rows={4} />
          </div>
        ) : active.isError ? (
          <div className="space-y-4 p-4">
            <Alert tone="error">
              {active.error instanceof Error
                ? active.error.message
                : 'The inbox could not be loaded.'}
            </Alert>
            <AdminButton variant="secondary" onClick={() => void active.refetch()}>
              Try again
            </AdminButton>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyNotice title={`No ${config.label.toLowerCase()} yet`}>
              {q || status !== 'all'
                ? 'No records match this search and filter. Try clearing them.'
                : 'New submissions from the website will appear here.'}
            </EmptyNotice>
          </div>
        ) : (
          <ul className="divide-y divide-brand-line">
            {rows.map((row) => {
              const item = row as InboxRow;
              const rowStatus =
                tab === 'testimonials'
                  ? item.isArchived
                    ? 'archived'
                    : item.publishedAt
                      ? 'published'
                      : 'pending'
                  : (item.status ?? 'new');

              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-brand-ivory sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-indigo">
                        {tab === 'appointments'
                          ? `${item.bookingRef} · ${item.fullName}`
                          : tab === 'testimonials'
                            ? item.name
                            : `${item.name} · ${tab === 'contact' ? item.email : item.phone}`}
                      </p>
                      <p className="mt-1 truncate text-xs text-brand-muted">
                        {tab === 'appointments'
                          ? `${item.serviceName ?? 'No treatment selected'} · ${item.preferredDate} at ${item.preferredTime}`
                          : tab === 'enquiries'
                            ? (item.message ?? '')
                            : tab === 'contact'
                              ? `${item.subject ?? 'No subject'} · ${item.message}`
                              : (item.quote ?? '')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[0.625rem] tracking-[0.12em] text-brand-muted uppercase">
                        {formatDate(item.createdAt)}
                      </span>
                      <Badge tone={statusTone(rowStatus)}>
                        {(tab === 'testimonials'
                          ? testimonialLabels[rowStatus]
                          : statusLabels[rowStatus]) ?? rowStatus}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-brand-line p-4">
          <p className="text-xs text-brand-muted">
            {active.data
              ? `${active.data.total} record${active.data.total === 1 ? '' : 's'} · page ${active.data.page} of ${Math.max(1, active.data.totalPages)}`
              : '—'}
          </p>
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant="secondary"
              disabled={!active.data || page >= Math.max(1, active.data.totalPages)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </AdminButton>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={
          tab === 'appointments'
            ? 'Appointment request'
            : tab === 'enquiries'
              ? 'Enquiry'
              : tab === 'contact'
                ? 'Contact message'
                : 'Testimonial submission'
        }
        description="Stored exactly as submitted through the website."
        size="lg"
      >
        {detail.isLoading ? <ListSkeleton rows={3} /> : null}
        {detail.isError ? (
          <Alert tone="error">
            {detail.error instanceof Error
              ? detail.error.message
              : 'This record could not be loaded.'}
          </Alert>
        ) : null}

        {tab === 'appointments' && detail.data ? (
          <AppointmentDetail
            key={(detail.data as AdminAppointment).id}
            appointment={detail.data as AdminAppointment}
            settings={settings.data ?? null}
            busy={save.isPending}
            onSave={(input) =>
              save.mutate({
                tab: 'appointments',
                id: (detail.data as AdminAppointment).id,
                ...input,
              })
            }
          />
        ) : null}

        {tab === 'enquiries' && detail.data ? (
          <SimpleDetail
            key={(detail.data as AdminEnquiry).id}
            name={(detail.data as AdminEnquiry).name}
            phone={(detail.data as AdminEnquiry).phone}
            email={(detail.data as AdminEnquiry).email}
            context={(detail.data as AdminEnquiry).serviceName}
            message={(detail.data as AdminEnquiry).message}
            createdAt={(detail.data as AdminEnquiry).createdAt}
            status={(detail.data as AdminEnquiry).status}
            statuses={['new', 'contacted', 'closed']}
            adminNotes={(detail.data as AdminEnquiry).adminNotes}
            busy={save.isPending}
            onSave={(input) =>
              save.mutate({ tab: 'enquiries', id: (detail.data as AdminEnquiry).id, ...input })
            }
          />
        ) : null}

        {tab === 'contact' && detail.data ? (
          <SimpleDetail
            key={(detail.data as AdminContactSubmission).id}
            name={(detail.data as AdminContactSubmission).name}
            phone={(detail.data as AdminContactSubmission).phone}
            email={(detail.data as AdminContactSubmission).email}
            context={(detail.data as AdminContactSubmission).subject}
            message={(detail.data as AdminContactSubmission).message}
            createdAt={(detail.data as AdminContactSubmission).createdAt}
            status={(detail.data as AdminContactSubmission).status}
            statuses={['new', 'in_progress', 'closed']}
            adminNotes={(detail.data as AdminContactSubmission).adminNotes}
            busy={save.isPending}
            onSave={(input) =>
              save.mutate({
                tab: 'contact',
                id: (detail.data as AdminContactSubmission).id,
                ...input,
              })
            }
          />
        ) : null}

        {tab === 'testimonials' && detail.data ? (
          <TestimonialDetail
            key={(detail.data as TestimonialSubmission).id}
            submission={detail.data as TestimonialSubmission}
            busy={moderate.isPending}
            onModerate={(action) => {
              if (action === 'archive') {
                setConfirmArchive((detail.data as TestimonialSubmission).id);
                return;
              }
              moderate.mutate({ id: (detail.data as TestimonialSubmission).id, action });
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmArchive)}
        title="Archive this story?"
        message="The story will be removed from the website and kept in the archive. It will not appear to the public again unless it is restored and published."
        confirmLabel="Archive story"
        busy={moderate.isPending}
        onCancel={() => setConfirmArchive(null)}
        onConfirm={() =>
          confirmArchive && moderate.mutate({ id: confirmArchive, action: 'archive' })
        }
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-brand-line py-2 text-sm last:border-b-0">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="text-right text-brand-indigo">{value}</dd>
    </div>
  );
}

function AppointmentDetail({
  appointment,
  settings,
  busy,
  onSave,
}: {
  appointment: AdminAppointment;
  settings: AdminSettings | null;
  busy: boolean;
  onSave: (input: { status?: string; adminNotes?: string | null; note?: string }) => void;
}) {
  const allowed = [appointment.status, ...appointmentStatusTransitions[appointment.status]];
  const [status, setStatus] = useState(appointment.status);
  const [note, setNote] = useState('');
  const [adminNotes, setAdminNotes] = useState(appointment.adminNotes ?? '');
  const whatsappHref = whatsappHrefFor(settings, appointment);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase">
            Booking reference
          </p>
          <p className="font-display text-2xl text-brand-indigo">{appointment.bookingRef}</p>
        </div>
        <Badge tone={statusTone(appointment.status)}>
          {appointmentStatusLabels[appointment.status]}
        </Badge>
      </div>

      <dl>
        <DetailRow label="Customer" value={appointment.fullName} />
        <DetailRow label="Phone" value={appointment.phone} />
        <DetailRow label="Email" value={appointment.email} />
        <DetailRow label="Treatment" value={appointment.serviceName ?? 'Not selected'} />
        <DetailRow label="Preferred date" value={appointment.preferredDate} />
        <DetailRow label="Preferred time" value={appointment.preferredTime} />
        <DetailRow label="Submitted" value={formatDate(appointment.createdAt)} />
        <DetailRow label="Message" value={appointment.message} />
      </dl>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 border border-brand-gold bg-brand-gold/10 px-4 py-2 text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase"
        >
          <MessageCircle aria-hidden="true" size={15} />
          Open WhatsApp
        </a>
      ) : (
        <Alert tone="info">
          WhatsApp is not configured in website settings, so no handoff link is available. The
          customer’s phone number is shown above.
        </Alert>
      )}

      <p className="text-xs leading-6 text-brand-muted">
        Opening WhatsApp does not message the customer and does not confirm the appointment. Send
        the message yourself, then record what happened below.
      </p>

      <div className="space-y-4 border-t border-brand-line pt-4">
        <Field label="Update status" htmlFor="appointment-status">
          <Select
            id="appointment-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as AppointmentStatus)}
          >
            {allowed.map((value) => (
              <option key={value} value={value}>
                {appointmentStatusLabels[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Reason for the change"
          htmlFor="appointment-note"
          hint="Optional. Stored with the status history."
        >
          <TextInput
            id="appointment-note"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        <Field
          label="Internal notes"
          htmlFor="appointment-admin-notes"
          hint="Never shown to the customer."
        >
          <TextArea
            id="appointment-admin-notes"
            rows={3}
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
          />
        </Field>

        <AdminButton
          busy={busy}
          disabled={status === appointment.status && adminNotes === (appointment.adminNotes ?? '')}
          onClick={() =>
            onSave({
              ...(status !== appointment.status ? { status, note: note || undefined } : {}),
              adminNotes: adminNotes.trim() ? adminNotes.trim() : null,
            })
          }
        >
          Save changes
        </AdminButton>
      </div>

      <div className="border-t border-brand-line pt-4">
        <p className="text-[0.625rem] font-medium tracking-[0.14em] text-brand-muted uppercase">
          Status history
        </p>
        <ol className="mt-3 space-y-2">
          {appointment.statusHistory.map((entry, index) => (
            <li key={`${entry.status}-${entry.at}-${index}`} className="text-xs text-brand-muted">
              <span className="text-brand-indigo">{appointmentStatusLabels[entry.status]}</span> ·{' '}
              {formatDate(entry.at)}
              {entry.note ? ` · ${entry.note}` : ''}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SimpleDetail({
  name,
  phone,
  email,
  context,
  message,
  createdAt,
  status,
  statuses,
  adminNotes,
  busy,
  onSave,
}: {
  name: string;
  phone: string | null;
  email: string | null;
  context: string | null;
  message: string;
  createdAt: string;
  status: string;
  statuses: string[];
  adminNotes: string | null;
  busy: boolean;
  onSave: (input: { status?: string; adminNotes?: string | null }) => void;
}) {
  const [nextStatus, setNextStatus] = useState(status);
  const [notes, setNotes] = useState(adminNotes ?? '');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-2xl text-brand-indigo">{name}</p>
        <Badge tone={statusTone(status)}>{statusLabels[status] ?? status}</Badge>
      </div>

      <dl>
        <DetailRow label="Phone" value={phone} />
        <DetailRow label="Email" value={email} />
        <DetailRow label={context ? 'Subject / treatment' : 'Context'} value={context} />
        <DetailRow label="Submitted" value={formatDate(createdAt)} />
      </dl>

      <div className="border border-brand-line bg-brand-ivory p-4">
        <p className="text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase">Message</p>
        <p className="mt-2 text-sm leading-7 whitespace-pre-line text-brand-indigo">{message}</p>
      </div>

      <div className="space-y-4 border-t border-brand-line pt-4">
        <Field label="Status" htmlFor="submission-status">
          <Select
            id="submission-status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value)}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value] ?? value}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Internal notes"
          htmlFor="submission-notes"
          hint="Never shown to the customer."
        >
          <TextArea
            id="submission-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        <AdminButton
          busy={busy}
          disabled={nextStatus === status && notes === (adminNotes ?? '')}
          onClick={() =>
            onSave({
              ...(nextStatus !== status ? { status: nextStatus } : {}),
              adminNotes: notes.trim() ? notes.trim() : null,
            })
          }
        >
          Save changes
        </AdminButton>
      </div>
    </div>
  );
}

function TestimonialDetail({
  submission,
  busy,
  onModerate,
}: {
  submission: TestimonialSubmission;
  busy: boolean;
  onModerate: (action: 'approve' | 'unpublish' | 'archive') => void;
}) {
  const bucket = submission.isArchived
    ? 'archived'
    : submission.publishedAt
      ? 'published'
      : 'pending';
  const hasConsent = Boolean(submission.consentStoredAt);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-2xl text-brand-indigo">{submission.name}</p>
        <Badge tone={statusTone(bucket)}>{testimonialLabels[bucket]}</Badge>
      </div>

      <dl>
        <DetailRow label="Treatment" value={submission.treatment} />
        <DetailRow label="Submitted" value={formatDate(submission.createdAt)} />
        <DetailRow
          label="Consent recorded"
          value={submission.consentStoredAt ? formatDate(submission.consentStoredAt) : null}
        />
        <DetailRow
          label="Published"
          value={submission.publishedAt ? formatDate(submission.publishedAt) : null}
        />
      </dl>

      <div className="border border-brand-line bg-brand-ivory p-4">
        <p className="text-[0.625rem] tracking-[0.14em] text-brand-muted uppercase">
          Client’s words (unedited)
        </p>
        <p className="mt-2 font-display text-lg leading-relaxed text-brand-indigo">
          “{submission.quote}”
        </p>
      </div>

      {!hasConsent ? (
        <Alert tone="error">
          No consent timestamp is stored for this story. It cannot be published until consent is
          recorded — the API rejects publication without it.
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-brand-line pt-4 sm:flex-row">
        <AdminButton
          busy={busy}
          disabled={!hasConsent || bucket === 'published'}
          onClick={() => onModerate('approve')}
        >
          Approve &amp; publish
        </AdminButton>
        <AdminButton
          variant="secondary"
          disabled={busy || bucket !== 'published'}
          onClick={() => onModerate('unpublish')}
        >
          <X aria-hidden="true" size={14} />
          Unpublish
        </AdminButton>
        <AdminButton
          variant="danger"
          disabled={busy || bucket === 'archived'}
          onClick={() => onModerate('archive')}
        >
          Archive
        </AdminButton>
      </div>

      <p className="flex items-start gap-2 text-xs leading-6 text-brand-muted">
        <Star aria-hidden="true" size={14} className="mt-1 shrink-0 text-brand-gold-deep" />
        Stories are published exactly as the client wrote them. Do not edit a quote without the
        client’s permission.
      </p>
      <p className="flex items-start gap-2 text-xs leading-6 text-brand-muted">
        <CalendarClock
          aria-hidden="true"
          size={14}
          className="mt-1 shrink-0 text-brand-gold-deep"
        />
        <Mail aria-hidden="true" size={14} className="mt-1 shrink-0 text-brand-gold-deep" />
        Pending stories are never returned by the public testimonials endpoint.
      </p>
    </div>
  );
}

export type { InboxSummary };
