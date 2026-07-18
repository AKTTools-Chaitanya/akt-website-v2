/**
 * Build an absolute media URL from the react-api's (path, file) pair. The API returns images as
 * a base path (e.g. https://akinfotools.com/assets/upload/category/) + a filename, EXCEPT product
 * `pro_image` which is already absolute. This normalizes both.
 */
export function mediaUrl(path?: string | null, file?: string | null): string {
  const f = (file ?? '').trim();
  if (!f) return '';
  if (/^https?:\/\//i.test(f)) return f; // already absolute (e.g. pro_image)
  const p = (path ?? '').trim().replace(/\/+$/, '');
  return p ? `${p}/${f}` : f;
}
