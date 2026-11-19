import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';
import { BrandVisual } from '@/components/ui/BrandVisual';
import { previewImageUrl } from '@/utils/cloudinary-image';

import { archiveGalleryItem, createGalleryItem, listGallery, updateGalleryItem } from '../api';
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
  Select,
  TextInput,
} from '../components/AdminUI';
import { MediaUploadField } from '../components/MediaUploadField';
import { useToast } from '../toast';
import {
  visualVariants,
  type AdminGalleryItem,
  type GalleryInput,
  type VisualVariant,
} from '../types';

type GalleryForm = {
  title: string;
  alt: string;
  category: string;
  cloudId: string;
  imageUrl: string;
  variant: VisualVariant;
  published: boolean;
};

type Errors = Partial<Record<keyof GalleryForm, string>>;

function GalleryEditor({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: AdminGalleryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<GalleryForm>(() => ({
    title: item?.title ?? '',
    alt: item?.alt ?? '',
    category: item?.category ?? '',
    cloudId: item?.cloudId ?? '',
    imageUrl: item?.imageUrl ?? '',
    variant: item?.variant ?? 'arch',
    published: Boolean(item?.publishedAt),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: GalleryInput) =>
      item ? updateGalleryItem(item.id, input) : createGalleryItem(input),
    onSuccess: () => {
      push({ title: item ? 'Gallery item updated' : 'Gallery item created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields as Errors);
      push({
        title: 'The gallery item could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};

    if (!form.title.trim()) next.title = 'A title is required.';
    if (!form.alt.trim()) next.alt = 'Alternative text is required for accessibility.';
    if (!form.category.trim()) next.category = 'A category is required.';
    if (!form.cloudId.trim()) next.cloudId = 'A media reference is required.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate({
      title: form.title.trim(),
      alt: form.alt.trim(),
      category: form.category.trim(),
      cloudId: form.cloudId.trim(),
      variant: form.variant,
      publishedAt: form.published ? new Date().toISOString() : null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit ${item.title}` : 'New gallery item'}
      description="Images are referenced by their Cloudinary public ID."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="gallery-form" busy={save.isPending}>
            {item ? 'Save changes' : 'Create item'}
          </AdminButton>
        </>
      }
    >
      <form id="gallery-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="gallery-title" required error={errors.title}>
            <TextInput
              id="gallery-title"
              autoFocus
              value={form.title}
              invalid={Boolean(errors.title)}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field label="Category" htmlFor="gallery-category" required error={errors.category}>
            <TextInput
              id="gallery-category"
              value={form.category}
              invalid={Boolean(errors.category)}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
            />
          </Field>
        </div>

        <Field
          label="Alternative text"
          htmlFor="gallery-alt"
          required
          hint="Describe the image for screen readers."
          error={errors.alt}
        >
          <TextInput
            id="gallery-alt"
            value={form.alt}
            invalid={Boolean(errors.alt)}
            onChange={(event) => setForm((current) => ({ ...current, alt: event.target.value }))}
          />
        </Field>

        <MediaUploadField
          id="gallery-cloud"
          label="Image"
          folder="gallery"
          publicId={form.cloudId}
          previewUrl={form.imageUrl || null}
          alt={form.alt}
          error={errors.cloudId}
          hint="Uploads go to the Blue Miror Cloudinary gallery folder. Only the public ID is saved with the item."
          onChange={(asset) =>
            setForm((current) => ({
              ...current,
              cloudId: asset?.publicId ?? '',
              imageUrl: asset?.url ?? '',
            }))
          }
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Visual style"
            htmlFor="gallery-variant"
            hint="Used while the real image is pending."
          >
            <Select
              id="gallery-variant"
              value={form.variant}
              onChange={(event) =>
                setForm((current) => ({ ...current, variant: event.target.value as VisualVariant }))
              }
            >
              {visualVariants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </Select>
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
              Publish to the public gallery
            </label>
          </div>
        </div>

        <div className="border border-brand-line bg-white/60 p-4">
          <p className="text-[0.625rem] tracking-[0.18em] text-brand-muted uppercase">Preview</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {form.imageUrl ? (
              <img
                src={previewImageUrl(form.imageUrl, 800) ?? form.imageUrl}
                alt={form.alt.trim() || form.title || 'Gallery image preview'}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <BrandVisual
                variant={form.variant}
                label={form.title || 'Untitled image'}
                className="aspect-[4/5]"
              />
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function GalleryPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGalleryItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminGalleryItem | null>(null);

  const gallery = useQuery({ queryKey: ['admin', 'gallery'], queryFn: listGallery });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => archiveGalleryItem(id),
    onSuccess: () => {
      push({ title: 'Gallery item archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The item could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const togglePublish = useMutation({
    mutationFn: (item: AdminGalleryItem) =>
      updateGalleryItem(item.id, {
        publishedAt: item.publishedAt ? null : new Date().toISOString(),
      }),
    onSuccess: (_data, item) => {
      push({ title: item.publishedAt ? 'Item unpublished' : 'Item published', tone: 'success' });
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The publish state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = gallery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Gallery"
        description="Manage the images shown on the public gallery. Every entry keeps its original public asset reference."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New image
          </AdminButton>
        }
      />

      <Alert tone="info">
        Images upload directly to the Blue Miror Cloudinary account. Before-and-after imagery needs
        documented patient consent, and must never imply guaranteed results.
      </Alert>

      {gallery.isLoading ? (
        <ListSkeleton rows={3} />
      ) : gallery.isError ? (
        <Panel title="Gallery could not be loaded">
          <p className="text-sm text-brand-muted">
            {gallery.error instanceof Error ? gallery.error.message : 'Unknown error.'}
          </p>
          <AdminButton variant="secondary" className="mt-4" onClick={() => void gallery.refetch()}>
            Try again
          </AdminButton>
        </Panel>
      ) : items.length === 0 ? (
        <EmptyNotice title="No gallery images yet">
          Add the first image reference to build the public gallery.
        </EmptyNotice>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="border border-brand-line bg-brand-porcelain">
              {item.imageUrl ? (
                <img
                  src={previewImageUrl(item.imageUrl, 640) ?? item.imageUrl}
                  alt={item.alt || item.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full border-b border-brand-line object-cover"
                />
              ) : (
                <BrandVisual variant={item.variant} label={item.title} className="aspect-[4/3]" />
              )}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-indigo">{item.title}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">{item.category}</p>
                  </div>
                  <Badge tone={item.publishedAt ? 'published' : 'draft'}>
                    {item.publishedAt ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p
                  className="truncate font-mono text-[0.6875rem] text-brand-muted"
                  title={item.cloudId}
                >
                  {item.cloudId || 'No media reference'}
                </p>
                <p className="text-xs leading-5 text-brand-muted">{item.alt}</p>
                <div className="flex flex-wrap gap-2 pt-1">
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
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && !gallery.isLoading && !gallery.isError ? (
        <p className="flex items-center gap-2 text-xs text-brand-muted">
          <ImageOff aria-hidden="true" size={14} /> No images are published to the public gallery
          yet.
        </p>
      ) : null}

      {editorOpen ? (
        <GalleryEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          item={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this image?"
        message={`"${pendingDelete?.title ?? ''}" will be removed from the public gallery. The media asset itself is not deleted.`}
        confirmLabel="Archive image"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
