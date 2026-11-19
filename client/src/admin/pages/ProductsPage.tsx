import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { previewImageUrl } from '@/utils/cloudinary-image';

import { archiveProduct, createProduct, listProducts, updateProduct } from '../api';
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
  TextInput,
  TextArea,
} from '../components/AdminUI';
import { MediaUploadField } from '../components/MediaUploadField';
import { useToast } from '../toast';
import { arrayToLines, linesToArray, slugPattern, slugify } from '../forms';
import type { AdminProduct, ProductInput } from '../types';

type ProductFormState = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  features: string;
  price: string;
  size: string;
  isFeatured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  imagePublicId: string;
  imageUrl: string;
  imageAlt: string;
};

function blankForm(): ProductFormState {
  return {
    name: '',
    slug: '',
    brand: '',
    category: '',
    shortDescription: '',
    description: '',
    features: '',
    price: '',
    size: '',
    isFeatured: false,
    published: false,
    seoTitle: '',
    seoDescription: '',
    imagePublicId: '',
    imageUrl: '',
    imageAlt: '',
  };
}

function formFromProduct(product: AdminProduct): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand ?? '',
    category: product.category,
    shortDescription: product.shortDescription,
    description: arrayToLines(product.description),
    features: arrayToLines(product.features),
    price: product.price ?? '',
    size: product.size ?? '',
    isFeatured: product.isFeatured,
    published: Boolean(product.publishedAt),
    seoTitle: product.seo?.title ?? '',
    seoDescription: product.seo?.description ?? '',
    imagePublicId: product.image?.publicId ?? '',
    imageUrl: product.image?.url ?? '',
    imageAlt: product.image?.alt ?? '',
  };
}

type FormErrors = Record<string, string>;

function validate(form: ProductFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'A product name is required.';
  else if (form.name.trim().length > 120) errors.name = 'Use 120 characters or fewer.';

  if (!form.slug.trim()) errors.slug = 'A URL slug is required.';
  else if (!slugPattern.test(form.slug.trim()) || form.slug.length > 150)
    errors.slug = 'Use lowercase letters, numbers and single hyphens.';

  if (!form.category.trim()) errors.category = 'A category is required.';
  if (!form.shortDescription.trim()) errors.shortDescription = 'A short description is required.';
  else if (form.shortDescription.trim().length > 240)
    errors.shortDescription = 'Use 240 characters or fewer.';

  if (form.price.trim().length > 80) errors.price = 'Use 80 characters or fewer.';
  if (form.size.trim().length > 80) errors.size = 'Use 80 characters or fewer.';
  if (form.seoTitle.trim().length > 90) errors.seoTitle = 'Use 90 characters or fewer.';
  if (form.seoDescription.trim().length > 320)
    errors.seoDescription = 'Use 320 characters or fewer.';

  if (form.imagePublicId.trim() && !form.imageUrl.trim())
    errors.imageUrl = 'Upload the image again so its delivery URL is stored.';

  return errors;
}

function toInput(form: ProductFormState): ProductInput {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    brand: form.brand.trim() || null,
    category: form.category.trim(),
    shortDescription: form.shortDescription.trim(),
    description: linesToArray(form.description),
    features: linesToArray(form.features),
    price: form.price.trim() || null,
    size: form.size.trim() || null,
    isFeatured: form.isFeatured,
    publishedAt: form.published ? new Date().toISOString() : null,
    seo: {
      title: form.seoTitle.trim() || null,
      description: form.seoDescription.trim() || null,
    },
    image: form.imagePublicId.trim()
      ? { publicId: form.imagePublicId.trim(), url: form.imageUrl.trim(), alt: form.imageAlt.trim() }
      : null,
  };
}

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const queryClient = useQueryClient();
  const { push } = useToast();

  const products = useQuery({
    queryKey: ['admin', 'products', search],
    queryFn: () => listProducts({ q: search.trim() || undefined, limit: 50 }),
  });

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditing(null);
    setEditorOpen(false);
  }

  const archiveMutation = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => {
      push({ title: 'Product archived', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setPendingDelete(null);
    },
    onError: (error: unknown) => {
      push({ title: 'The product could not be archived', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    },
  });

  const items = products.data?.items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Products"
        description="Products shown on the public product shelf. Upload the exact image you want to display."
        actions={
          <AdminButton onClick={openCreate}>
            <Plus aria-hidden="true" size={14} /> New product
          </AdminButton>
        }
      />

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand-muted"
              size={16}
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="h-10 w-full border border-brand-line bg-brand-porcelain pr-3 pl-9 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-azure focus:outline-none"
            />
          </div>
        </div>

        {products.isLoading ? (
          <ListSkeleton rows={4} />
        ) : products.isError ? (
          <Alert tone="error">
            {products.error instanceof Error ? products.error.message : 'Products could not be loaded.'}
          </Alert>
        ) : items.length === 0 ? (
          <EmptyNotice title="No products yet">
            Add the first product to build the public shelf. Images are uploaded directly to Cloudinary.
          </EmptyNotice>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="border border-brand-line bg-brand-porcelain p-4">
                {item.imageUrl ? (
                  <img
                    src={previewImageUrl(item.imageUrl, 640) ?? item.imageUrl}
                    alt={item.image?.alt || item.name}
                    loading="eager"
                    decoding="async"
                    className="aspect-[4/5] w-full border-b border-brand-line object-cover"
                  />
                ) : null}
                <p className="mt-3 font-medium text-brand-indigo">{item.name}</p>
                <p className="text-xs text-brand-muted">{item.brand ?? item.category}</p>
                {item.price ? (
                  <p className="mt-1 text-[0.62rem] font-medium tracking-[0.14em] text-brand-gold-deep uppercase">
                    {item.price}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <AdminButton size="sm" variant="secondary" onClick={() => openEdit(item)}>
                    <Pencil aria-hidden="true" size={13} /> Edit
                  </AdminButton>
                  <AdminButton size="sm" variant="danger" onClick={() => setPendingDelete(item)}>
                    <Trash2 aria-hidden="true" size={13} /> Archive
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {editorOpen ? (
        <ProductEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          product={editing}
          onClose={closeEditor}
          onSaved={() => void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this product?"
        message="Archiving removes it from the public shelf without deleting its history."
        busy={archiveMutation.isPending}
        confirmLabel="Archive"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && archiveMutation.mutate(pendingDelete.id)}
      />
    </>
  );
}

function ProductEditor({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormState>(() =>
    product ? formFromProduct(product) : blankForm(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: ProductInput) =>
      product ? updateProduct(product.id, input) : createProduct(input),
    onSuccess: () => {
      push({ title: product ? 'Product updated' : 'Product created', tone: 'success' });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      push({
        title: 'The product could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      push({ title: 'Check the highlighted fields', tone: 'error' });
      return;
    }
    save.mutate(toInput(form));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'New product'}
      description="Products are listed on the public shelf. Upload the exact image you want to display."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="product-form" busy={save.isPending}>
            {product ? 'Save changes' : 'Create product'}
          </AdminButton>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {Object.keys(errors).length > 0 ? (
          <Alert tone="error">
            <strong className="font-medium">This product is missing required details:</strong>{' '}
            {Object.values(errors).join(', ')}.
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="product-name" required error={errors.name}>
            <TextInput
              id="product-name"
              autoFocus
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(event) => {
                const name = event.target.value;
                update('name', name);
                if (!form.slug) update('slug', slugify(name));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="product-slug" required error={errors.slug}>
            <TextInput
              id="product-slug"
              value={form.slug}
              invalid={Boolean(errors.slug)}
              onChange={(event) => update('slug', event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand" htmlFor="product-brand">
            <TextInput
              id="product-brand"
              value={form.brand}
              onChange={(event) => update('brand', event.target.value)}
            />
          </Field>
          <Field label="Category" htmlFor="product-category" required error={errors.category}>
            <TextInput
              id="product-category"
              value={form.category}
              invalid={Boolean(errors.category)}
              onChange={(event) => update('category', event.target.value)}
            />
          </Field>
        </div>

        <Field label="Short description" htmlFor="product-short" required error={errors.shortDescription}>
          <TextArea
            id="product-short"
            value={form.shortDescription}
            invalid={Boolean(errors.shortDescription)}
            onChange={(event) => update('shortDescription', event.target.value)}
            className="min-h-16"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="product-description"
          hint="One paragraph per line."
          error={errors.description}
        >
          <TextArea
            id="product-description"
            value={form.description}
            invalid={Boolean(errors.description)}
            onChange={(event) => update('description', event.target.value)}
            className="min-h-24"
          />
        </Field>

        <Field
          label="Features"
          htmlFor="product-features"
          hint="One feature per line."
          error={errors.features}
        >
          <TextArea
            id="product-features"
            value={form.features}
            invalid={Boolean(errors.features)}
            onChange={(event) => update('features', event.target.value)}
            className="min-h-20"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price" htmlFor="product-price">
            <TextInput
              id="product-price"
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
            />
          </Field>
          <Field label="Size / volume" htmlFor="product-size">
            <TextInput
              id="product-size"
              value={form.size}
              onChange={(event) => update('size', event.target.value)}
            />
          </Field>
        </div>

        <MediaUploadField
          id="product-image"
          label="Image"
          folder="gallery"
          publicId={form.imagePublicId}
          previewUrl={form.imageUrl || null}
          alt={form.imageAlt || form.name}
          error={errors.imageUrl}
          hint="Uploads go to the Blue Miror Cloudinary account. The exact image is shown on the public shelf."
          onChange={(asset) =>
            setForm((current) => ({
              ...current,
              imagePublicId: asset?.publicId ?? '',
              imageUrl: asset?.url ?? '',
            }))
          }
        />

        {form.imagePublicId ? (
          <Field label="Image alternative text" htmlFor="product-image-alt">
            <TextInput
              id="product-image-alt"
              value={form.imageAlt}
              onChange={(event) => update('imageAlt', event.target.value)}
            />
          </Field>
        ) : null}

        {form.imageUrl ? (
          <div>
            <p className="text-[0.625rem] tracking-[0.18em] text-brand-muted uppercase">Preview</p>
            <img
              src={previewImageUrl(form.imageUrl, 800) ?? form.imageUrl}
              alt={form.imageAlt.trim() || form.name || 'Product image preview'}
              className="mt-2 aspect-[4/5] w-full max-w-sm border border-brand-line object-cover"
            />
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="SEO title (optional)" htmlFor="product-seo-title">
            <TextInput
              id="product-seo-title"
              value={form.seoTitle}
              onChange={(event) => update('seoTitle', event.target.value)}
            />
          </Field>
          <Field label="SEO description (optional)" htmlFor="product-seo-description">
            <TextArea
              id="product-seo-description"
              value={form.seoDescription}
              onChange={(event) => update('seoDescription', event.target.value)}
              className="min-h-20"
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 border border-brand-line bg-brand-ivory/60 p-4 text-sm text-brand-indigo">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => update('isFeatured', event.target.checked)}
            className="size-4 accent-brand-indigo"
          />
          Feature on the public product shelf
        </label>

        <label className="flex items-center gap-3 border border-brand-line bg-brand-ivory/60 p-4 text-sm text-brand-indigo">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => update('published', event.target.checked)}
            className="size-4 accent-brand-indigo"
          />
          Publish to the public product shelf
        </label>
      </form>
    </Modal>
  );
}
