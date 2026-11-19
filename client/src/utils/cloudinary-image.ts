/**
 * Return a right-sized Cloudinary delivery URL for previews.
 *
 * Uploads are stored at their original resolution. Rendering a phone-sized
 * original inside a small admin thumbnail forces the browser to decode the whole
 * image, which made the editors stall. This rewrites Cloudinary URLs so the
 * preview is fetched at a bounded width with automatic format and quality.
 *
 * Non-Cloudinary URLs (or empty values) are returned unchanged.
 */
export function previewImageUrl(url: string | null | undefined, width = 480): string | null {
  const value = url?.trim();
  if (!value) return null;

  const marker = '/image/upload/';
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return value;

  const head = value.slice(0, markerIndex + marker.length);
  const tail = value.slice(markerIndex + marker.length);
  const [first, ...rest] = tail.split('/');
  const hasTransformation = rest.length > 0 && /(^|,)[a-z]{1,2}_/.test(first);
  const assetPath = hasTransformation ? rest.join('/') : tail;

  return `${head}f_auto,q_auto,w_${width}/${assetPath}`;
}
