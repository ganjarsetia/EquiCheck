import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { explainViolation, parseExplanation } from '../src/services/aiService.js';
import { config } from '../src/config.js';

const violation = {
  id: 'image-alt',
  impact: 'serious',
  description: 'Images must have alternate text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  html: '<img src="cat.png" />',
};

describe('explainViolation', () => {
  const originalKey = config.zen.apiKey;
  const originalFetch = global.fetch;

  beforeEach(() => {
    config.zen.apiKey = 'test-key';
    config.zen.model = 'deepseek-v4-flash-free';
    config.zen.timeoutMs = 1000;
  });

  afterEach(() => {
    config.zen.apiKey = originalKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('posts to the Zen endpoint with auth and model', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ problem: 'P' }) } }],
      }),
    });

    await explainViolation(violation);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(config.zen.baseUrl);
    expect(options.headers.Authorization).toBe('Bearer test-key');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.model).toBe('deepseek-v4-flash-free');
    expect(body.messages).toHaveLength(2);
  });

  it('returns a parsed explanation on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                problem: 'Missing alt text',
                whyItMatters: 'Screen readers cannot describe the image',
                suggestedFix: 'Add an alt attribute',
                correctedHtml: '<img src="cat.png" alt="A cat" />',
                wcagReference: 'WCAG 1.1.1 Non-text Content',
              }),
            },
          },
        ],
      }),
    });

    const result = await explainViolation(violation);
    expect(result.problem).toBe('Missing alt text');
    expect(result.correctedHtml).toContain('alt="A cat"');
  });

  it('throws a friendly error when the API key is missing', async () => {
    config.zen.apiKey = '';
    await expect(explainViolation(violation)).rejects.toThrow(/OPENCODE_ZEN_API/);
  });

  it('throws a friendly provider error on rate-limit response', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' });
    await expect(explainViolation(violation)).rejects.toThrow(/OpenCode Zen is receiving too many requests/);
  });

  it('attaches provider failures to the provider, not the app', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    await expect(explainViolation(violation)).rejects.toThrow(/OpenCode Zen is having a temporary server problem/);
  });

  it('throws a friendly error on empty content', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) });
    await expect(explainViolation(violation)).rejects.toThrow(/empty response/);
  });

  it('retries a transient empty response and succeeds on a later attempt', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ problem: 'Retried OK' }) } }],
        }),
      });

    const result = await explainViolation(violation);
    expect(result.problem).toBe('Retried OK');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws a friendly provider error on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(explainViolation(violation)).rejects.toThrow(/Could not reach OpenCode Zen/);
  });
});

describe('parseExplanation', () => {
  it('parses a valid JSON response', () => {
    const result = parseExplanation(
      '{"problem":"P","whyItMatters":"W","suggestedFix":"F","correctedHtml":"<p>x</p>","wcagReference":"R"}',
      'rule',
    );
    expect(result).toEqual({
      problem: 'P',
      whyItMatters: 'W',
      suggestedFix: 'F',
      correctedHtml: '<p>x</p>',
      wcagReference: 'R',
    });
  });

  it('tolerates markdown fences around JSON', () => {
    const result = parseExplanation('```json\n{"problem":"P"}\n```', 'rule');
    expect(result.problem).toBe('P');
  });

  it('falls back to plain text when parsing fails', () => {
    const result = parseExplanation('Just some prose', 'rule');
    expect(result.problem).toBe('Just some prose');
    expect(result.wcagReference).toBe('Axe rule: rule');
  });

  it('extracts JSON even when trailing prose follows the closing brace', () => {
    const raw =
      '{"problem":"P","whyItMatters":"W","suggestedFix":"F","correctedHtml":"<p>x</p>","wcagReference":"R"}\n\nHope this helps!';
    const result = parseExplanation(raw, 'rule');
    expect(result.problem).toBe('P');
    expect(result.wcagReference).toBe('R');
  });

  it('recovers readable text when the model nests the whole response under problem', () => {
    const raw = `{
  "problem": {
    "problem": "The image has redundant alt text",
    "whyItMatters": "It reads the same phrase twice",
    "suggestedFix": "Set alt to an empty string",
    "correctedHtml": "<img alt=\\"\\"/>",
    "wcagReference": "axe rule"
  },
  "whyItMatters": "",
  "suggestedFix": "",
  "correctedHtml": "",
  "wcagReference": ""
}`;
    const result = parseExplanation(raw, 'rule');
    expect(result.problem).toBe('The image has redundant alt text');
  });

  it('does not output raw JSON in the problem field', () => {
    const raw = `{"problem":"{ \\"problem\\": \\"Good text\\" }","whyItMatters":"","suggestedFix":"","correctedHtml":"","wcagReference":""}`;
    const result = parseExplanation(raw, 'rule');
    expect(result.problem).not.toContain('"problem"');
    expect(result.problem).toBe('Good text');
  });

  it('escapes literal newlines/tabs inside JSON strings', () => {
    const raw = '{"problem":"line one\nline two\twith tab","whyItMatters":"W","wcagReference":"R"}';
    const result = parseExplanation(raw, 'rule');
    expect(result.problem).toBe('line one\nline two\twith tab');
    expect(result.wcagReference).toBe('R');
  });

  it('handles escaped backslashes followed by literal newlines', () => {
    const raw = '{"problem":"path\\\\to\\\\file\nnext", "wcagReference":""}';
    const result = parseExplanation(raw, 'rule');
    expect(result.problem).toBe('path\\to\\file\nnext');
  });
});
