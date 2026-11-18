import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { archiveFaq, createFaq, listFaqs, updateFaq } from '../api';
import {
  AdminButton,
  Badge,
  ConfirmDialog,
  EmptyNotice,
  Field,
  ListSkeleton,
  Modal,
  PageHeader,
  Panel,
  Select,
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { useToast } from '../toast';
import type { AdminFaq, FaqInput } from '../types';

type FaqForm = { question: string; answer: string; category: string; published: boolean };
type Errors = Partial<Record<keyof FaqForm, string>>;

function FaqEditor({
  open,
  faq,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  faq: AdminFaq | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FaqForm>(() => ({
    question: faq?.question ?? '',
    answer: faq?.answer ?? '',
    category: faq?.category ?? '',
    published: Boolean(faq?.publishedAt),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: FaqInput) => (faq ? updateFaq(faq.id, input) : createFaq(input)),
    onSuccess: () => {
      push({ title: faq ? 'FAQ updated' : 'FAQ created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields as Errors);
      push({
        title: 'The FAQ could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};

    if (!form.question.trim()) next.question = 'A question is required.';
    if (!form.answer.trim()) next.answer = 'An answer is required.';
    if (!form.category.trim()) next.category = 'A category is required.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim(),
      publishedAt: form.published ? new Date().toISOString() : null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={faq ? 'Edit FAQ' : 'New FAQ'}
      description="Answers should reflect clinic policy only — no clinical advice."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="faq-form" busy={save.isPending}>
            {faq ? 'Save changes' : 'Create FAQ'}
          </AdminButton>
        </>
      }
    >
      <form id="faq-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Question" htmlFor="faq-question" required error={errors.question}>
          <TextInput
            id="faq-question"
            autoFocus
            value={form.question}
            invalid={Boolean(errors.question)}
            onChange={(event) =>
              setForm((current) => ({ ...current, question: event.target.value }))
            }
          />
        </Field>

        <Field label="Answer" htmlFor="faq-answer" required error={errors.answer}>
          <TextArea
            id="faq-answer"
            value={form.answer}
            invalid={Boolean(errors.answer)}
            onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
            className="min-h-28"
          />
        </Field>

        <Field
          label="Category"
          htmlFor="faq-category"
          required
          hint="Groups questions on the public FAQ page."
          error={errors.category}
        >
          <TextInput
            id="faq-category"
            list="faq-category-options"
            value={form.category}
            invalid={Boolean(errors.category)}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
          />
          <datalist id="faq-category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>

        <label className="flex items-center gap-3 border border-brand-line bg-brand-ivory/60 p-4 text-sm text-brand-indigo">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
            className="size-4 accent-brand-indigo"
          />
          Publish on the public FAQs page
        </label>
      </form>
    </Modal>
  );
}

export function FaqsPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminFaq | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const faqs = useQuery({ queryKey: ['admin', 'faqs'], queryFn: listFaqs });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => archiveFaq(id),
    onSuccess: () => {
      push({ title: 'FAQ archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The FAQ could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const togglePublish = useMutation({
    mutationFn: (faq: AdminFaq) =>
      updateFaq(faq.id, { publishedAt: faq.publishedAt ? null : new Date().toISOString() }),
    onSuccess: (_data, faq) => {
      push({ title: faq.publishedAt ? 'FAQ unpublished' : 'FAQ published', tone: 'success' });
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The publish state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = useMemo(() => faqs.data?.items ?? [], [faqs.data]);
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort(),
    [items],
  );
  const filtered = items.filter((item) => {
    const matchesCategory = !category || item.category === category;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.question.toLowerCase().includes(term) ||
      item.answer.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="FAQs"
        description="Questions shown on the public FAQ page. Ordering follows the creation order returned by the API."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New FAQ
          </AdminButton>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Search" htmlFor="faq-search" className="flex-1">
            <div className="relative">
              <TextInput
                id="faq-search"
                value={search}
                placeholder="Search questions and answers"
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
              <Search
                aria-hidden="true"
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-muted"
              />
            </div>
          </Field>
          <Field label="Category" htmlFor="faq-filter" className="sm:w-56">
            <Select
              id="faq-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      {faqs.isLoading ? (
        <ListSkeleton rows={4} />
      ) : faqs.isError ? (
        <Panel title="FAQs could not be loaded">
          <p className="text-sm text-brand-muted">
            {faqs.error instanceof Error ? faqs.error.message : 'Unknown error.'}
          </p>
          <AdminButton variant="secondary" className="mt-4" onClick={() => void faqs.refetch()}>
            Try again
          </AdminButton>
        </Panel>
      ) : filtered.length === 0 ? (
        <EmptyNotice
          title={items.length === 0 ? 'No FAQs yet' : 'No FAQs match these filters'}
          action={
            items.length === 0 ? (
              <AdminButton
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                Create an FAQ
              </AdminButton>
            ) : (
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                }}
              >
                Clear filters
              </AdminButton>
            )
          }
        >
          {items.length === 0
            ? 'Published questions appear on the public FAQs page.'
            : 'Try a different search term or category.'}
        </EmptyNotice>
      ) : (
        <ul className="space-y-3">
          {filtered.map((faq) => (
            <li key={faq.id} className="border border-brand-line bg-brand-porcelain p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-brand-indigo">{faq.question}</p>
                  <p className="mt-1 text-xs text-brand-muted">{faq.category}</p>
                </div>
                <Badge tone={faq.publishedAt ? 'published' : 'draft'}>
                  {faq.publishedAt ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-brand-muted">{faq.answer}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminButton
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(faq);
                    setEditorOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" size={13} /> Edit
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="ghost"
                  busy={togglePublish.isPending && togglePublish.variables?.id === faq.id}
                  onClick={() => togglePublish.mutate(faq)}
                >
                  {faq.publishedAt ? 'Unpublish' : 'Publish'}
                </AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => setPendingDelete(faq)}>
                  <Trash2 aria-hidden="true" size={13} /> Archive
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editorOpen ? (
        <FaqEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          faq={editing}
          categories={categories}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this FAQ?"
        message={`"${pendingDelete?.question ?? ''}" will be removed from the public FAQs page.`}
        confirmLabel="Archive FAQ"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
