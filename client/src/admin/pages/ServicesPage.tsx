import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';
import { previewImageUrl } from '@/utils/cloudinary-image';

import { archiveService, createService, listCategories, listServices, updateService } from '../api';
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
  TextArea,
  TextInput,
} from '../components/AdminUI';
import { MediaUploadField } from '../components/MediaUploadField';
import { useToast } from '../toast';
import { arrayToLines, linesToArray, slugPattern, slugify } from '../forms';
import {
  visualVariants,
  type AdminCategory,
  type AdminService,
  type ServiceInput,
  type VisualVariant,
} from '../types';

type ServiceFormState = {
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  steps: string;
  benefits: string;
  considerations: string;
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  visual: VisualVariant;
  published: boolean;
  /** Optional clinic-supplied commercial details, left blank when unknown. */
  duration: string;
  price: string;
  seoTitle: string;
  seoDescription: string;
  relatedSlugs: string;
  imagePublicId: string;
  imageUrl: string;
  imageAlt: string;
};

function blankForm(): ServiceFormState {
  return {
    name: '',
    slug: '',
    category: '',
    shortDescription: '',
    description: '',
    steps: '',
    benefits: '',
    considerations: '',
    faqs: [{ question: '', answer: '' }],
    isFeatured: false,
    visual: 'column',
    published: false,
    duration: '',
    price: '',
    seoTitle: '',
    seoDescription: '',
    relatedSlugs: '',
    imagePublicId: '',
    imageUrl: '',
    imageAlt: '',
  };
}

function formFromService(service: AdminService): ServiceFormState {
  return {
    name: service.name,
    slug: service.slug,
    category: service.category,
    shortDescription: service.shortDescription,
    description: arrayToLines(service.description),
    steps: arrayToLines(service.steps),
    benefits: arrayToLines(service.benefits),
    considerations: arrayToLines(service.considerations),
    faqs: service.faqs.length > 0 ? service.faqs : [{ question: '', answer: '' }],
    isFeatured: service.isFeatured,
    visual: service.visual,
    published: Boolean(service.publishedAt),
    duration: service.duration ?? '',
    price: service.price ?? '',
    seoTitle: service.seo?.title ?? '',
    seoDescription: service.seo?.description ?? '',
    relatedSlugs: (service.relatedSlugs ?? []).join(', '),
    imagePublicId: service.image?.publicId ?? '',
    imageUrl: service.image?.url ?? '',
    imageAlt: service.image?.alt ?? '',
  };
}

type FormErrors = Record<string, string>;

function validate(form: ServiceFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'A service name is required.';
  else if (form.name.trim().length > 120) errors.name = 'Use 120 characters or fewer.';

  if (!form.slug.trim()) errors.slug = 'A URL slug is required.';
  else if (!slugPattern.test(form.slug.trim()) || form.slug.length > 150)
    errors.slug = 'Use lowercase letters, numbers and single hyphens.';

  if (!form.category.trim()) errors.category = 'Choose or enter a category.';

  if (!form.shortDescription.trim()) errors.shortDescription = 'A short description is required.';
  else if (form.shortDescription.trim().length > 240)
    errors.shortDescription = 'Use 240 characters or fewer.';

  if (linesToArray(form.description).length === 0)
    errors.description = 'Add at least one overview paragraph.';

  if (linesToArray(form.steps).length === 0) errors.steps = 'Add at least one step.';
  if (linesToArray(form.benefits).length === 0) errors.benefits = 'Add at least one benefit.';
  if (linesToArray(form.considerations).length === 0)
    errors.considerations = 'Add at least one consideration.';

  if (form.price.trim().length > 80) errors.price = 'Use 80 characters or fewer.';
  if (form.duration.trim().length > 80) errors.duration = 'Use 80 characters or fewer.';
  if (form.seoTitle.trim().length > 90) errors.seoTitle = 'Use 90 characters or fewer.';
  if (form.seoDescription.trim().length > 320)
    errors.seoDescription = 'Use 320 characters or fewer.';

  const related = relatedSlugList(form.relatedSlugs);
  if (related.some((slug) => !slugPattern.test(slug)))
    errors.relatedSlugs = 'Use lowercase slugs separated by commas.';
  else if (related.length > 6) errors.relatedSlugs = 'Choose up to 6 related services.';
  else if (related.includes(form.slug.trim()))
    errors.relatedSlugs = 'A service cannot be related to itself.';

  if (form.imagePublicId.trim() && !form.imageUrl.trim())
    errors.imageUrl = 'Upload the image again so its delivery URL is stored.';

  const faqs = form.faqs.filter((faq) => faq.question.trim() || faq.answer.trim());
  if (faqs.length === 0) errors.faqs = 'Add at least one question and answer.';
  if (faqs.some((faq) => !faq.question.trim())) errors.faqs = 'Every FAQ needs a question.';
  if (faqs.some((faq) => !faq.answer.trim())) errors.faqs = 'Every FAQ needs an answer.';

  return errors;
}

function relatedSlugList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toInput(form: ServiceFormState): ServiceInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    category: form.category.trim(),
    shortDescription: form.shortDescription.trim(),
    description: linesToArray(form.description),
    steps: linesToArray(form.steps),
    benefits: linesToArray(form.benefits),
    considerations: linesToArray(form.considerations),
    faqs: form.faqs
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
      .filter((faq) => faq.question && faq.answer),
    isFeatured: form.isFeatured,
    visual: form.visual,
    publishedAt: form.published ? new Date().toISOString() : null,
    duration: form.duration.trim() || null,
    price: form.price.trim() || null,
    seo: {
      title: form.seoTitle.trim() || null,
      description: form.seoDescription.trim() || null,
    },
    relatedSlugs: relatedSlugList(form.relatedSlugs),
    image: form.imagePublicId.trim()
      ? {
          publicId: form.imagePublicId.trim(),
          url: form.imageUrl.trim(),
          alt: form.imageAlt.trim(),
        }
      : null,
  };
}

function ServiceEditor({
  open,
  service,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  service: AdminService | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceFormState>(() =>
    service ? formFromService(service) : blankForm(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [slugEdited, setSlugEdited] = useState(Boolean(service));
  const { push } = useToast();

  const save = useMutation({
    mutationFn: (input: ServiceInput) =>
      service ? updateService(service.id, input) : createService(input),
    onSuccess: () => {
      push({
        title: service ? 'Service updated' : 'Service created',
        tone: 'success',
      });
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) {
        setErrors(error.fields);
      }
      push({
        title: 'The service could not be saved',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    },
  });

  function update<K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      push({ title: 'Check the highlighted fields', tone: 'error' });
      return;
    }

    save.mutate(toInput(form));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={service ? `Edit ${service.name}` : 'New service'}
      description="Fields marked with an asterisk are required by the clinic API."
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="service-form" busy={save.isPending}>
            {service ? 'Save changes' : 'Create service'}
          </AdminButton>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {Object.keys(errors).length > 0 ? (
          <Alert tone="error">
            <strong className="font-medium">This service is missing required details:</strong>{' '}
            {[
              ['name', 'service name'],
              ['slug', 'slug'],
              ['category', 'category'],
              ['shortDescription', 'short description'],
              ['description', 'overview'],
              ['steps', 'steps'],
              ['benefits', 'benefits'],
              ['considerations', 'considerations'],
              ['faqs', 'at least one FAQ'],
              ['imageUrl', 'a valid image upload'],
            ]
              .filter(([key]) => errors[key as keyof typeof errors])
              .map(([, label]) => label)
              .join(', ')}
            .
          </Alert>
        ) : null}

        {categories.length === 0 ? (
          <Alert tone="info">
            No categories exist yet. Create one in <strong>Categories</strong> first, then come back
            to add this service.
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Service name" htmlFor="service-name" required error={errors.name}>
            <TextInput
              id="service-name"
              value={form.name}
              invalid={Boolean(errors.name)}
              autoFocus
              onChange={(event) => {
                const name = event.target.value;
                update('name', name);
                if (!slugEdited) update('slug', slugify(name));
              }}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="service-slug"
            required
            hint="Used in the public URL /treatments/<slug>."
            error={errors.slug}
          >
            <TextInput
              id="service-slug"
              value={form.slug}
              invalid={Boolean(errors.slug)}
              onChange={(event) => {
                setSlugEdited(true);
                update('slug', event.target.value);
              }}
            />
          </Field>

          <Field
            label="Category"
            htmlFor="service-category"
            required
            hint="Set from the categories you have created."
            error={errors.category}
          >
            <Select
              id="service-category"
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Visual style" htmlFor="service-visual" required>
            <Select
              id="service-visual"
              value={form.visual}
              onChange={(event) => update('visual', event.target.value as VisualVariant)}
            >
              {visualVariants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Short description"
          htmlFor="service-short"
          required
          hint="Used on cards and listing pages (240 characters)."
          error={errors.shortDescription}
        >
          <TextArea
            id="service-short"
            value={form.shortDescription}
            invalid={Boolean(errors.shortDescription)}
            onChange={(event) => update('shortDescription', event.target.value)}
            className="min-h-20"
          />
        </Field>

        <div className="grid gap-5 border border-brand-line bg-brand-ivory/60 p-4 sm:grid-cols-2">
          <Field
            label="Price (optional)"
            htmlFor="service-price"
            hint="Enter only a price the clinic has approved. Leave blank when none has been supplied — nothing is displayed publicly."
            error={errors.price}
          >
            <TextInput
              id="service-price"
              value={form.price}
              invalid={Boolean(errors.price)}
              onChange={(event) => update('price', event.target.value)}
            />
          </Field>
          <Field
            label="Duration (optional)"
            htmlFor="service-duration"
            hint="For example “45 minutes”. Leave blank when the clinic has not confirmed it."
            error={errors.duration}
          >
            <TextInput
              id="service-duration"
              value={form.duration}
              invalid={Boolean(errors.duration)}
              onChange={(event) => update('duration', event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Overview"
          htmlFor="service-description"
          required
          hint="One paragraph per line."
          error={errors.description}
        >
          <TextArea
            id="service-description"
            value={form.description}
            invalid={Boolean(errors.description)}
            onChange={(event) => update('description', event.target.value)}
            className="min-h-28"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Procedure steps"
            htmlFor="service-steps"
            required
            hint="One per line."
            error={errors.steps}
          >
            <TextArea
              id="service-steps"
              value={form.steps}
              invalid={Boolean(errors.steps)}
              onChange={(event) => update('steps', event.target.value)}
            />
          </Field>
          <Field
            label="Benefits"
            htmlFor="service-benefits"
            required
            hint="One per line."
            error={errors.benefits}
          >
            <TextArea
              id="service-benefits"
              value={form.benefits}
              invalid={Boolean(errors.benefits)}
              onChange={(event) => update('benefits', event.target.value)}
            />
          </Field>
          <Field
            label="Considerations"
            htmlFor="service-considerations"
            required
            hint="Suitability notes. One per line."
            error={errors.considerations}
          >
            <TextArea
              id="service-considerations"
              value={form.considerations}
              invalid={Boolean(errors.considerations)}
              onChange={(event) => update('considerations', event.target.value)}
            />
          </Field>
        </div>

        <fieldset className="border border-brand-line bg-white/60 p-4">
          <legend className="px-1 text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
            Search listing
          </legend>
          <div className="grid gap-4">
            <Field
              label="SEO title (optional)"
              htmlFor="service-seo-title"
              hint="Shown in search results. Falls back to the service name when blank."
              error={errors.seoTitle}
            >
              <TextInput
                id="service-seo-title"
                value={form.seoTitle}
                invalid={Boolean(errors.seoTitle)}
                onChange={(event) => update('seoTitle', event.target.value)}
              />
            </Field>
            <Field
              label="SEO description (optional)"
              htmlFor="service-seo-description"
              error={errors.seoDescription}
            >
              <TextArea
                id="service-seo-description"
                value={form.seoDescription}
                invalid={Boolean(errors.seoDescription)}
                onChange={(event) => update('seoDescription', event.target.value)}
                className="min-h-20"
              />
            </Field>
            <Field
              label="Related services (optional)"
              htmlFor="service-related"
              hint="Comma-separated slugs of up to six other services, for example skin-consultation, led-therapy."
              error={errors.relatedSlugs}
            >
              <TextInput
                id="service-related"
                value={form.relatedSlugs}
                invalid={Boolean(errors.relatedSlugs)}
                onChange={(event) => update('relatedSlugs', event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border border-brand-line bg-white/60 p-4">
          <legend className="px-1 text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
            Service image
          </legend>
          <div className="space-y-4">
            <MediaUploadField
              id="service-image"
              label="Image"
              folder="services"
              publicId={form.imagePublicId}
              previewUrl={form.imageUrl || null}
              alt={form.imageAlt}
              error={errors.imageUrl}
              hint="Optional. Uploads are stored in the Blue Miror Cloudinary services folder."
              onChange={(asset) =>
                setForm((current) => ({
                  ...current,
                  imagePublicId: asset?.publicId ?? '',
                  imageUrl: asset?.url ?? '',
                }))
              }
            />
            {form.imagePublicId ? (
              <Field
                label="Image alternative text"
                htmlFor="service-image-alt"
                hint="Describe the image for screen readers."
              >
                <TextInput
                  id="service-image-alt"
                  value={form.imageAlt}
                  onChange={(event) => update('imageAlt', event.target.value)}
                />
              </Field>
            ) : null}

            {form.imageUrl ? (
              <div>
                <p className="text-[0.625rem] tracking-[0.18em] text-brand-muted uppercase">
                  Image preview
                </p>
                <img
                  src={previewImageUrl(form.imageUrl, 800) ?? form.imageUrl}
                  alt={form.imageAlt.trim() || 'Service image preview'}
                  decoding="async"
                  className="mt-2 aspect-[4/3] w-full max-w-sm border border-brand-line object-cover"
                />
              </div>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="border border-brand-line bg-white/60 p-4">
          <legend className="px-1 text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
            FAQs
          </legend>
          {errors.faqs ? (
            <p role="alert" className="mb-3 text-xs text-[#8a3b34]">
              {errors.faqs}
            </p>
          ) : null}
          <div className="space-y-3">
            {form.faqs.map((faq, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <TextInput
                  aria-label={`FAQ ${index + 1} question`}
                  placeholder="Question"
                  value={faq.question}
                  onChange={(event) => {
                    const next = [...form.faqs];
                    next[index] = { ...faq, question: event.target.value };
                    update('faqs', next);
                  }}
                />
                <TextInput
                  aria-label={`FAQ ${index + 1} answer`}
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(event) => {
                    const next = [...form.faqs];
                    next[index] = { ...faq, answer: event.target.value };
                    update('faqs', next);
                  }}
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    update(
                      'faqs',
                      form.faqs.filter((_, i) => i !== index),
                    )
                  }
                  disabled={form.faqs.length === 1}
                  aria-label={`Remove FAQ ${index + 1}`}
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
            onClick={() => update('faqs', [...form.faqs, { question: '', answer: '' }])}
          >
            <Plus aria-hidden="true" size={14} /> Add FAQ
          </AdminButton>
        </fieldset>

        <div className="flex flex-col gap-3 border border-brand-line bg-brand-ivory/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-brand-indigo">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => update('isFeatured', event.target.checked)}
              className="size-4 accent-brand-indigo"
            />
            Feature this service on the homepage
          </label>
          <label className="flex items-center gap-3 text-sm text-brand-indigo">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => update('published', event.target.checked)}
              className="size-4 accent-brand-indigo"
            />
            Publish on the public website
          </label>
        </div>
      </form>
    </Modal>
  );
}

export function ServicesPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminService | null>(null);

  const services = useQuery({
    queryKey: ['admin', 'services', page, appliedSearch, category],
    queryFn: () =>
      listServices({ page, limit: 10, q: appliedSearch, category: category || undefined }),
  });

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => archiveService(id),
    onSuccess: () => {
      push({ title: 'Service archived', tone: 'success' });
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: unknown) =>
      push({
        title: 'The service could not be archived',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const togglePublish = useMutation({
    mutationFn: (service: AdminService) =>
      updateService(service.id, {
        publishedAt: service.publishedAt ? null : new Date().toISOString(),
      }),
    onSuccess: (_data, service) => {
      push({
        title: service.publishedAt ? 'Service unpublished' : 'Service published',
        tone: 'success',
      });
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['public-content'] });
    },
    onError: (error: unknown) =>
      push({
        title: 'The publish state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const toggleFeatured = useMutation({
    mutationFn: (service: AdminService) =>
      updateService(service.id, { isFeatured: !service.isFeatured }),
    onSuccess: () => {
      push({ title: 'Featured state updated', tone: 'success' });
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['public-content'] });
    },
    onError: (error: unknown) =>
      push({
        title: 'The featured state could not be changed',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      }),
  });

  const items = services.data?.items ?? [];
  const totalPages = services.data?.totalPages ?? 0;
  const noCategories = (categories.data?.total ?? 0) === 0;
  const hasFilters = appliedSearch.trim() !== '' || category !== '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Services"
        description="Create and maintain the treatment pages that appear on the public website."
        actions={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" size={15} /> New service
          </AdminButton>
        }
      />

      {noCategories ? (
        <Alert tone="info">
          Services need a category. Create one on the{' '}
          <a href="/admin/categories" className="underline underline-offset-4">
            categories page
          </a>{' '}
          before adding a service.
        </Alert>
      ) : null}

      <Panel>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedSearch(search.trim());
          }}
        >
          <Field label="Search" htmlFor="service-search" className="flex-1">
            <div className="relative">
              <TextInput
                id="service-search"
                value={search}
                placeholder="Search by name or description"
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
          <Field label="Category" htmlFor="service-filter" className="sm:w-56">
            <Select
              id="service-filter"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {(categories.data?.items ?? []).map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <AdminButton type="submit" variant="secondary" className="sm:mb-0">
            Apply
          </AdminButton>
        </form>
      </Panel>

      {services.isLoading ? (
        <ListSkeleton rows={5} />
      ) : services.isError ? (
        <Panel title="Services could not be loaded">
          <p className="text-sm text-brand-muted">
            {services.error instanceof Error ? services.error.message : 'Unknown error.'}
          </p>
          <AdminButton variant="secondary" className="mt-4" onClick={() => void services.refetch()}>
            Try again
          </AdminButton>
        </Panel>
      ) : items.length === 0 ? (
        <EmptyNotice
          title={hasFilters ? 'No services match these filters' : 'No services yet'}
          action={
            hasFilters ? (
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch('');
                  setCategory('');
                }}
              >
                Clear filters
              </AdminButton>
            ) : (
              <AdminButton
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                Create a service
              </AdminButton>
            )
          }
        >
          {hasFilters
            ? 'Try a different search term or category.'
            : 'Services published here appear on the public treatments pages.'}
        </EmptyNotice>
      ) : (
        <div className="overflow-x-auto border border-brand-line bg-brand-porcelain">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-brand-line bg-brand-ivory/70">
              <tr className="text-[0.5625rem] tracking-[0.18em] text-brand-muted uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  Service
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {items.map((service) => (
                <tr key={service.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-brand-indigo">{service.name}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">/{service.slug}</p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-brand-muted">
                      {service.shortDescription}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-brand-muted">{service.category}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={service.publishedAt ? 'published' : 'draft'}>
                        {service.publishedAt ? 'Published' : 'Draft'}
                      </Badge>
                      {service.isFeatured ? <Badge tone="featured">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(service);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil aria-hidden="true" size={13} /> Edit
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        busy={togglePublish.isPending && togglePublish.variables?.id === service.id}
                        onClick={() => togglePublish.mutate(service)}
                      >
                        {service.publishedAt ? 'Unpublish' : 'Publish'}
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        aria-label={`${service.isFeatured ? 'Unfeature' : 'Feature'} ${service.name}`}
                        aria-pressed={service.isFeatured}
                        busy={
                          toggleFeatured.isPending && toggleFeatured.variables?.id === service.id
                        }
                        onClick={() => toggleFeatured.mutate(service)}
                      >
                        <Star
                          aria-hidden="true"
                          size={13}
                          fill={service.isFeatured ? 'currentColor' : 'none'}
                        />
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        onClick={() => setPendingDelete(service)}
                      >
                        <Trash2 aria-hidden="true" size={13} /> Archive
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Service pages" className="flex items-center justify-between gap-4">
          <p className="text-xs text-brand-muted">
            Page {services.data?.page ?? 1} of {totalPages} · {services.data?.total ?? 0} services
          </p>
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </AdminButton>
          </div>
        </nav>
      ) : null}

      {editorOpen ? (
        <ServiceEditor
          key={editing?.id ?? 'new'}
          open={editorOpen}
          service={editing}
          categories={categories.data?.items ?? []}
          onClose={() => setEditorOpen(false)}
          onSaved={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Archive this service?"
        message={`"${pendingDelete?.name ?? ''}" will be removed from the public website. The record is archived, not permanently deleted.`}
        confirmLabel="Archive service"
        busy={archive.isPending}
        onConfirm={() => pendingDelete && archive.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
