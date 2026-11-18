import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';

import { archiveCategory, createCategory, listCategories, updateCategory } from '../api';
import {
  AdminButton,
  Alert,
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
import { useToast } from '../toast';
import { slugPattern, slugify } from '../forms';
import type { AdminCategory } from '../types';

type CategoryForm = { name: string; slug: string; description: string };
type Errors = { name?: string; slug?: string };

function CategoryEditor({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: AdminCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CategoryForm>(() => ({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const { push } = useToast();

  const save = useMutation({
    mutationFn: () =>
      category
        ? updateCategory(category.slug, {
            name: form.name.trim(),
            description: form.description.trim() || null,
          })
        : createCategory({
            slug: form.slug.trim(),
            name: form.name.trim(),
            description: form.description.trim() || null,
          }),
    onSuccess: () => {
      push({ title: category ? 'Category updated' : 'Category created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) {
        setErrors(error.fields as Errors);
      }
      push({
        title: 'The category could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};

    if (!form.name.trim()) next.name = 'A category name is required.';
    else if (form.name.trim().length > 90) next.name = 'Use 90 characters or fewer.';

    if (!category) {
      if (!form.slug.trim()) next.slug = 'A slug is required.';
      else if (!slugPattern.test(form.slug.trim()) || form.slug.length > 150)
        next.slug = 'Use lowercase letters, numbers and single hyphens.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={category ? `Edit ${category.name}` : 'New category'}
      description={
        category
          ? 'The slug cannot be changed after creation because services reference it.'
          : 'Categories group services on the public treatments pages.'
      }
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="category-form" busy={save.isPending}>
            {category ? 'Save changes' : 'Create category'}
          </AdminButton>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Name" htmlFor="category-name" required error={errors.name}>
          <TextInput
            id="category-name"
            autoFocus
            value={form.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug: !slugEdited && !category ? slugify(name) : current.slug,
              }));
            }}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="category-slug"
          required={!category}
          hint={category ? 'Locked after creation.' : 'Lowercase, hyphens only.'}
          error={errors.slug}
        >
          <TextInput
            id="category-slug"
            value={form.slug}
            disabled={Boolean(category)}
            invalid={Boolean(errors.slug)}
            onChange={(event) => {
              setSlugEdited(true);
              setForm((current) => ({ ...current, slug: event.target.value }));
            }}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="category-description"
          hint="Also used as the category description in listings (180 characters)."
        >
          <TextArea
            id="category-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="min-h-20"
          />
        </Field>
      </form>
    </Modal>
  );
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (slug: string) => archiveCategory(slug),
    onSuccess: () => {
      push({ title: 'Category archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The category could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = categories.data?.items ?? [];
  const pendingUsage = pendingDelete?.serviceCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Categories"
        description="Group services for the public treatment listings. Slugs are referenced by services, so they cannot be changed."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New category
          </AdminButton>
        }
      />

      {pendingDelete && pendingUsage > 0 ? (
        <Alert tone="error">
          “{pendingDelete.name}” is used by {pendingUsage} service
          {pendingUsage === 1 ? '' : 's'}. Reassign those services to another category before
          archiving it. The clinic API does not support bulk reassignment, so this is blocked here
          to prevent services pointing at a missing category.
        </Alert>
      ) : null}

      {categories.isLoading ? (
        <ListSkeleton rows={4} />
      ) : categories.isError ? (
        <Panel title="Categories could not be loaded">
          <p className="text-sm text-brand-muted">
            {categories.error instanceof Error ? categories.error.message : 'Unknown error.'}
          </p>
          <AdminButton
            variant="secondary"
            className="mt-4"
            onClick={() => void categories.refetch()}
          >
            Try again
          </AdminButton>
        </Panel>
      ) : items.length === 0 ? (
        <EmptyNotice title="No categories yet">
          Create a category before adding services — every service belongs to one.
        </EmptyNotice>
      ) : (
        <div className="overflow-x-auto border border-brand-line bg-brand-porcelain">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-brand-line bg-brand-ivory/70">
              <tr className="text-[0.5625rem] tracking-[0.18em] text-brand-muted uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Slug
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Services
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {items.map((category) => {
                const usage = category.serviceCount ?? 0;

                return (
                  <tr key={category.slug}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-brand-indigo">{category.name}</p>
                      {category.description ? (
                        <p className="mt-1 max-w-md text-xs leading-5 text-brand-muted">
                          {category.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-brand-muted">
                      {category.slug}
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted">{usage}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(category);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil aria-hidden="true" size={13} /> Edit
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="danger"
                          disabled={usage > 0}
                          title={
                            usage > 0
                              ? 'Reassign the services in this category first.'
                              : 'Archive this category'
                          }
                          onClick={() => setPendingDelete(category)}
                        >
                          <Trash2 aria-hidden="true" size={13} /> Archive
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen ? (
        <CategoryEditor
          key={editing?.slug ?? 'new'}
          open={editorOpen}
          category={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete) && pendingUsage === 0}
        title="Archive this category?"
        message={`"${pendingDelete?.name ?? ''}" will no longer appear in admin or public listings. It contains no services.`}
        confirmLabel="Archive category"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.slug)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
