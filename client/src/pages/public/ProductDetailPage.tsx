import { Check } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Seo } from '@/components/seo/Seo';
import { BookingLink } from '@/components/ui/BookingLink';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PageHero } from '@/components/ui/PageHero';
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
        <section className="py-20 sm:py-28">
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

  return (
    <>
      <Seo
        title={product.name}
        description={product.shortDescription}
      />

      <PageHero
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Products', to: '/products' },
              { label: product.name },
            ]}
          />
        }
        eyebrow={product.brand ?? product.category}
        title={product.name}
        intro={product.shortDescription}
        aside={
          <div className="border border-brand-line bg-brand-porcelain p-5">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.brand ? `${product.name} by ${product.brand}` : product.name}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full border border-brand-line object-cover"
              />
            ) : null}

            <dl className="mt-5 space-y-3 text-sm">
              {product.brand ? (
                <div className="flex items-center justify-between gap-3 border-b border-brand-line pb-3">
                  <dt className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
                    Brand
                  </dt>
                  <dd className="font-medium text-brand-indigo">{product.brand}</dd>
                </div>
              ) : null}
              {product.size ? (
                <div className="flex items-center justify-between gap-3 border-b border-brand-line pb-3">
                  <dt className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
                    Size
                  </dt>
                  <dd className="font-medium text-brand-indigo">{product.size}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[0.62rem] tracking-[0.14em] text-brand-muted uppercase">
                  Price
                </dt>
                <dd className="font-medium text-brand-gold-deep">
                  {product.price ?? 'Ask in salon'}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <BookingLink />
            </div>
          </div>
        }
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
            <div>
              <section aria-labelledby="product-overview-heading">
                <Eyebrow>About the product</Eyebrow>
                <h2
                  id="product-overview-heading"
                  className="mt-4 font-display text-[clamp(2.1rem,4vw,3.3rem)] leading-[0.99] text-brand-indigo"
                >
                  Why we work with it.
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-brand-muted">
                  {(product.description.length > 0 ? product.description : [product.shortDescription]).map(
                    (paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ),
                  )}
                </div>
              </section>

              {product.features.length > 0 ? (
                <section
                  aria-labelledby="product-features-heading"
                  className="mt-14 border-t border-brand-line pt-10"
                >
                  <Eyebrow>Product features</Eyebrow>
                  <h2
                    id="product-features-heading"
                    className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl"
                  >
                    The details that matter.
                  </h2>
                  <ul className="mt-6 space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-7 text-brand-muted">
                        <Check
                          aria-hidden="true"
                          className="mt-1.5 shrink-0 text-brand-gold-deep"
                          size={16}
                          strokeWidth={1.5}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-14 border-t border-brand-line pt-10">
                <Eyebrow>Availability</Eyebrow>
                <h2 className="mt-4 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl">
                  Shown in the salon, confirmed in person.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
                  Shades, stock and pricing are confirmed at your visit or over WhatsApp. Ask us
                  about the product you are interested in and we will check availability for you.
                </p>
                <div className="mt-6">
                  <BookingLink />
                </div>
              </section>
            </div>

            <aside className="lg:pt-2">
              <div className="border border-brand-line bg-brand-porcelain p-5">
                <p className="text-[0.62rem] tracking-[0.16em] text-brand-muted uppercase">
                  Product category
                </p>
                <p className="mt-2 font-display text-xl text-brand-indigo">{product.category}</p>
                <div className="mt-5">
                  <ButtonLink to="/products" variant="secondary">
                    Back to products
                  </ButtonLink>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
