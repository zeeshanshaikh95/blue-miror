const absoluteUrlPattern = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

/**
 * Resolve a configured public asset path against the build base URL.
 *
 * Stored settings may hold root-relative paths such as `/brand/logo.png`.
 * Those must be prefixed with `import.meta.env.BASE_URL` when the site is
 * served from a sub-path, like a GitHub Pages project site.
 */
export function publicAssetUrl(value: string): string {
  if (!value || absoluteUrlPattern.test(value) || value.startsWith('data:')) {
    return value;
  }

  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const path = value.startsWith('/') ? value : `/${value}`;

  return `${base}${path}`;
}
