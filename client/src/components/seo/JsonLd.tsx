import { Helmet } from 'react-helmet-async';

/**
 * Renders application/ld+json. `<` is escaped so a content field can never
 * close the script element early.
 */
export function JsonLd({ data }: { data: unknown }) {
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <Helmet>
      <script type="application/ld+json">{payload}</script>
    </Helmet>
  );
}
