const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Validates a URL string for scanning.
 * Only http/https URLs are allowed (SSRF guardrail for a prototype).
 * @param {string} value
 * @returns {{ ok: true, url: string } | { ok: false, error: string }}
 */
export function validateUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, error: 'A URL is required.' };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return {
      ok: false,
      error: 'The URL is invalid. It must be a full URL such as https://example.com.',
    };
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { ok: false, error: 'Only http:// and https:// URLs are supported.' };
  }

  if (!parsed.hostname) {
    return { ok: false, error: 'The URL must include a hostname.' };
  }

  return { ok: true, url: parsed.toString() };
}
