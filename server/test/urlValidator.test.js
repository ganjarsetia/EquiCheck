import { describe, it, expect } from 'vitest';
import { validateUrl } from '../src/utils/urlValidator.js';

describe('validateUrl', () => {
  it('accepts a valid https URL', () => {
    expect(validateUrl('https://example.com')).toEqual({ ok: true, url: 'https://example.com/' });
  });

  it('accepts a valid http URL', () => {
    expect(validateUrl('http://example.com/page')).toMatchObject({ ok: true });
  });

  it('rejects empty input', () => {
    expect(validateUrl('').ok).toBe(false);
    expect(validateUrl(undefined).ok).toBe(false);
    expect(validateUrl(null).ok).toBe(false);
  });

  it('rejects non-http protocols', () => {
    expect(validateUrl('ftp://example.com').ok).toBe(false);
    expect(validateUrl('file:///etc/passwd').ok).toBe(false);
    expect(validateUrl('javascript:alert(1)').ok).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(validateUrl('not a url').ok).toBe(false);
    expect(validateUrl('example.com').ok).toBe(false);
  });

  it('rejects URLs without a hostname', () => {
    expect(validateUrl('https://').ok).toBe(false);
  });
});
