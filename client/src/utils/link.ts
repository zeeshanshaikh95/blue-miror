/**
 * GitHub Pages serves directory routes with a trailing slash and 301-redirects
 * the slash-less form. Internal links use this helper so crawlers never hit
 * those redirect hops.
 */
export function withTrailingSlash(path: string): string {
  if (!path.startsWith('/') || path === '/' || path.startsWith('//')) return path;

  const match = path.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] ?? path;
  const suffix = match?.[2] ?? '';

  if (pathname === '/') return path;

  return `${pathname.replace(/\/+$/, '')}/${suffix}`;
}
