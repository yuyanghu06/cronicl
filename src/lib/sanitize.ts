const SAFE_PROTOCOLS = ['https:', 'http:', 'data:'];

/**
 * Returns the URL if it uses a safe protocol (https, http, data),
 * or undefined if the URL is missing, empty, or uses an unsafe protocol
 * (e.g. javascript:, vbscript:).
 */
export function sanitizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    if (SAFE_PROTOCOLS.includes(parsed.protocol)) return url;
  } catch {
    // Malformed URL
  }
  return undefined;
}
