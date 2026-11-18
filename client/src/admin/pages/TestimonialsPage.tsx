import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { archiveTestimonial, createTestimonial, listTestimonials, updateTestimonial } from '../api';
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
  Panel,
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { datetimeLocalToIso, formatDate, isoToDatetimeLocal } from '../format';
import { useToast } from '../toast';
import type { AdminTestimonial, TestimonialInput } from '../types';

type TestimonialForm = {
  name: string;
  treatment: string;
  quote: string;
  consentAt: string;
  published: boolean;
};

type Errors = Partial<Record<keyof TestimonialForm, string>>;

function TestimonialEditor({
  open,
  testimonial,
  onClose,
  onSaved,
}: {
  open: boolean;
  testimonial: AdminTestimonial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TestimonialForm>(() => ({
    name: testimonial?.name ?? '',
    treatment: testimonial?.treatment ?? '',
    quote: testimonial?.quote ?? '',
    consentAt: isoToDatetimeLocal(testimonial?.consentStoredAt ?? null),
    published: Boolean(testimonial?.publishedAt),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: TestimonialInput) =>
      testimonial ? updateTestimonial(testimonial.id, input) : createTestimonial(input),
    onSuccess: () => {
      push({ title: testimonial ? 'Testimonial updated' : 'Testimonial created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields as Errors);
      push({
        title: 'The testimonial could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};

    if (!form.name.trim()) next.name = 'A display name is required.';
    if (!form.quote.trim()) next.quote = 'The testimonial text is required.';
    if (form.published && !form.consentAt)
      next.consentAt = 'Record when consent was obtained before publishing.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      name: form.name.trim(),
      treatment: form.treatment.trim() || null,
      quote: form.quote.trim(),
      consentStoredAt: datetimeLocalToIso(form.consentAt),
      publishedAt: form.published ? new Date().toISOString() : null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={testimonial ? `Edit testimonial from ${testimonial.name}` : 'New testimonial'}
      description="Only record genuine client feedback with documented consent."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="testimonial-form" busy={save.isPending}>
            {testimonial ? 'Save changes' : 'Create testimonial'}
          </AdminButton>
        </>
      }
    >
      <form id="testimonial-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Client display name"
            htmlFor="testimonial-name"
            required
            hint="Use the name the client approved for display."
            error={errors.name}
          >
            <TextInput
              id="testimonial-name"
              autoFocus
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Treatment" htmlFor="testimonial-treatment" hint="Optional.">
            <TextInput
              id="testimonial-treatment"
              value={form.treatment}
              onChange={(event) =>
                setForm((current) => ({ ...current, treatment: event.target.value }))
              }
            />
          </Field>
        </div>

        <Field label="Testimonial" htmlFor="testimonial-quote" required error={errors.quote}>
          <TextArea
            id="testimonial-quote"
            value={form.quote}
            invalid={Boolean(errors.quote)}
            onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
            className="min-h-28"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Consent recorded"
            htmlFor="testimonial-consent"
            hint="Date the client approved publication."
            error={errors.consentAt}
          >
            <TextInput
              id="testimonial-consent"
              type="datetime-local"
              value={form.consentAt}
              invalid={Boolean(errors.consentAt)}
              onChange={(event) =>
                setForm((current) => ({ ...current, consentAt: event.target.value }))
              }
            />
          </Field>

          <div className="flex items-end">
            <label className="flex items-center gap-3 text-sm text-brand-indigo">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm((current) => ({ ...current, published: event.target.checked }))
                }
                className="size-4 accent-brand-indigo"
              />
              Publish on the public testimonials page
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function TestimonialsPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminTestimonial | null>(null);

  const testimonials = useQuery({ queryKey: ['admin', 'testimonials'], queryFn: listTestimonials });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => archiveTestimonial(id),
    onSuccess: () => {
      push({ title: 'Testimonial archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The testimonial could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const togglePublish = useMutation({
    mutationFn: (item: AdminTestimonial) =>
      updateTestimonial(item.id, {
        publishedAt: item.publishedAt ? null : new Date().toISOString(),
      }),
    onSuccess: (_data, item) => {
      push({
        title: item.publishedAt ? 'Testimonial unpublished' : 'Testimonial published',
        tone: 'success',
      });
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The publish state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = testimonials.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Testimonials"
        description="Genuine client feedback, published only once consent has been recorded."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New testimonial
          </AdminButton>
        }
      />

      <Alert tone="info">
        Never write reviews on a client’s behalf. Record the consent date before publishing.
      </Alert>

      {testimonials.isLoading ? (
        <ListSkeleton rows={4} />
      ) : testimonials.isError ? (
        <Panel title="Testimonials could not be loaded">
          <p className="text-sm text-brand-muted">
            {testimonials.error instanceof Error ? testimonials.error.message : 'Unknown error.'}
          </p>
          <AdminButton
            variant="secondary"
            className="mt-4"
            onClick={() => void testimonials.refetch()}
          >
            Try again
          </AdminButton>
        </Panel>
      ) : items.length === 0 ? (
        <EmptyNotice title="No testimonials yet">
          Nothing is published to the public page until a genuine testimonial is added here.
        </EmptyNotice>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border border-brand-line bg-brand-porcelain p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-indigo">{item.name}</p>
                  <p className="text-xs text-brand-muted">
                    {item.treatment ?? 'Treatment not specified'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.publishedAt ? 'published' : 'draft'}>
                    {item.publishedAt ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge tone={item.consentStoredAt ? 'neutral' : 'draft'}>
                    {item.consentStoredAt
                      ? `Consent ${formatDate(item.consentStoredAt)}`
                      : 'No consent recorded'}
                  </Badge>
                </div>
              </div>
              <blockquote className="mt-3 border-l-2 border-brand-gold/50 pl-4 text-sm leading-7 text-brand-ink">
                “{item.quote}”
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminButton
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(item);
                    setEditorOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" size={13} /> Edit
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="ghost"
                  busy={togglePublish.isPending && togglePublish.variables?.id === item.id}
                  onClick={() => togglePublish.mutate(item)}
                >
                  {item.publishedAt ? 'Unpublish' : 'Publish'}
                </AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => setPendingDelete(item)}>
                  <Trash2 aria-hidden="true" size={13} /> Archive
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editorOpen ? (
        <TestimonialEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          testimonial={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this testimonial?"
        message={`The testimonial from "${pendingDelete?.name ?? ''}" will be removed from the public page.`}
        confirmLabel="Archive testimonial"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
