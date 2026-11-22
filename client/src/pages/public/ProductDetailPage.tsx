import { Check } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { JsonLd } from '@/components/seo/JsonLd';
import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { LoadingState } from '@/components/ui/LoadingState';
import { useProduct } from '@/hooks/use-public-content';
import { ApiError } from '@/lib/api-client';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const productQuery = useProduct(slug);

  if (productQuery.isPending) {
    return (
      <>
        <Seo title="Loading product" noindex />
        <section className="py-16 sm:py-20">
          <Container>
            <LoadingState label="Loading product" cards={1} />
          </Container>
        </section>
      </>
    );
  }

  if (productQuery.isError) {
    const notFound =
      productQuery.error instanceof ApiError && productQuery.error.status === 404;

    return (
      <>
        <Seo title={notFound ? 'Product not found' : 'Product unavailable'} noindex />
        <section className="py-20 sm:py-28">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Products', to: '/products' },
                { label: 'Not found' },
              ]}
            />
            <div className="mt-10">
              {notFound ? (
                <EmptyState
                  eyebrow="Product not found"
                  title="This product is not available"
                  action={
                    <ButtonLink to="/products" variant="secondary">
                      View all products
                    </ButtonLink>
                  }
                >
                  The page may have moved, or the product may not currently be listed. The product
                  shelf is the best place to continue.
                </EmptyState>
              ) : (
                <ErrorState
                  title="This product could not be loaded"
                  message="The product page is temporarily unavailable. Please try again."
                  onRetry={() => void productQuery.refetch()}
                />
              )}
            </div>
          </Container>
        </section>
      </>
    );
  }

  const product = productQuery.data;
  const paragraphs =
    product.description.length > 0 ? product.description : [product.shortDescription];

  const siteUrl = (import.meta.env.VITE_SITE_URL?.trim() || 'http://localhost:5173').replace(
    /\/+$/,
    '',
  );
  const productUrl = `${siteUrl}/products/${product.slug}/`;
  const priceValue = product.price?.match(/₹\s?([\d,]+)/)?.[1]?.replace(/,/g, '');

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    category: product.category,
    description: product.shortDescription,
    url: productUrl,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    ...(priceValue
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: priceValue,
            availability: 'https://schema.org/InStock',
            url: productUrl,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${productUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products/` },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <Seo
        title={`${product.name}${product.brand ? ` — ${product.brand}` : ''}`}
        description={product.shortDescription}
      />
      <JsonLd data={[productSchema, breadcrumbSchema]} />

      <section className="py-10 sm:py-14">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Products', to: '/products' },
              { label: product.name },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
            <div className="group relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 border border-brand-gold/25 transition-colors duration-500 group-hover:border-brand-gold/50"
              />
              <div className="relative overflow-hidden border border-brand-line bg-brand-porcelain p-3">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.brand ? `${product.name} by ${product.brand}` : product.name}
                    loading="eager"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="grid aspect-[4/5] w-full place-items-center bg-brand-indigo-deep">
                    <span className="font-display text-6xl text-brand-gold">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 ring-1 ring-inset ring-brand-ivory/20"
                />

                {product.isFeatured ? (
                  <span className="absolute top-6 left-6 border border-brand-gold/60 bg-brand-ivory/95 px-3 py-1.5 text-[0.58rem] font-medium tracking-[0.16em] text-brand-indigo uppercase">
                    Popular
                  </span>
                ) : null}
              </div>
            </div>

            <div className="lg:pt-2">
              <Eyebrow>{product.brand ?? product.category}</Eyebrow>
              <h1 className="mt-4 font-display text-[clamp(2.4rem,4.8vw,3.8rem)] leading-[0.98] text-brand-indigo">
                {product.name}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-brand-muted">
                {product.shortDescription}
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-brand-line py-5 text-sm">
                <div>
                  <dt className="text-[0.58rem] tracking-[0.16em] text-brand-muted uppercase">
                    Category
                  </dt>
                  <dd className="mt-1 font-medium text-brand-indigo">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-[0.58rem] tracking-[0.16em] text-brand-muted uppercase">
                    Brand
                  </dt>
                  <dd className="mt-1 font-medium text-brand-indigo">{product.brand ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[0.58rem] tracking-[0.16em] text-brand-muted uppercase">
                    Size
                  </dt>
                  <dd className="mt-1 font-medium text-brand-indigo">{product.size ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[0.58rem] tracking-[0.16em] text-brand-muted uppercase">
                    Price
                  </dt>
                  <dd className="mt-1 font-medium text-brand-gold-deep">
                    {product.price ?? 'Ask in salon'}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <BookingLink
                  serviceName={product.name}
                  label="Enquire about this product"
                />
                <ButtonLink to="/products" variant="secondary">
                  Back to products
                </ButtonLink>
              </div>

              <p className="mt-4 max-w-md text-xs leading-6 text-brand-muted">
                Availability, shades and pricing are confirmed in the salon or over WhatsApp.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-12 border-t border-brand-line pt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <div>
              <section aria-labelledby="product-overview-heading">
                <Eyebrow>About the product</Eyebrow>
                <h2
                  id="product-overview-heading"
                  className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] leading-[1] text-brand-indigo"
                >
                  Why we work with it.
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-brand-muted">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              {product.features.length > 0 ? (
                <section
                  aria-labelledby="product-features-heading"
                  className="mt-12 border-t border-brand-line pt-10"
                >
                  <Eyebrow>Product features</Eyebrow>
                  <h2
                    id="product-features-heading"
                    className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                  >
                    The details that matter.
                  </h2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {product.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 border border-brand-line bg-brand-porcelain p-4 text-sm leading-6 text-brand-muted"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-brand-gold-deep"
                          size={16}
                          strokeWidth={1.6}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-brand-line bg-brand-porcelain p-5">
                <p className="text-[0.58rem] tracking-[0.16em] text-brand-muted uppercase">
                  Ask about this product
                </p>
                <p className="mt-2 font-display text-xl leading-snug text-brand-indigo">
                  Check shades and availability with us.
                </p>
                <div className="mt-4">
                  <BookingLink
                    serviceName={product.name}
                    label="Enquire on WhatsApp"
                    variant="secondary"
                    className="w-full"
                  />
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
