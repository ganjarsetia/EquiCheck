import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanUrl } from '../src/services/scanService.js';

vi.mock('playwright', () => ({
  chromium: { launch: vi.fn() },
}));

vi.mock('@axe-core/playwright', () => ({
  default: vi.fn(),
}));

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const fakePage = { title: vi.fn(), waitForTimeout: vi.fn() };

function makeBrowser() {
  return {
    newContext: vi
      .fn()
      .mockResolvedValue({ newPage: vi.fn().mockResolvedValue(fakePage), close: vi.fn().mockResolvedValue() }),
    close: vi.fn().mockResolvedValue(),
  };
}

describe('scanUrl retry behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromium.launch.mockResolvedValue(makeBrowser());
    fakePage.title.mockResolvedValue('Test title');
    fakePage.waitForTimeout.mockResolvedValue(undefined);
    fakePage.goto = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns violations and closes the browser', async () => {
    AxeBuilder.mockImplementation(() => ({
      withTags: vi.fn().mockReturnThis(),
      analyze: vi.fn().mockResolvedValue({ violations: [{ id: 'image-alt' }] }),
    }));

    const result = await scanUrl('https://example.com');
    expect(result.violations).toHaveLength(1);
    expect(result.pageTitle).toBe('Test title');
  });

  it('navigates with domcontentloaded to avoid waiting on heavy assets', async () => {
    AxeBuilder.mockImplementation(() => ({
      withTags: vi.fn().mockReturnThis(),
      analyze: vi.fn().mockResolvedValue({ violations: [] }),
    }));

    await scanUrl('https://example.com');
    const [argUrl, opts] = fakePage.goto.mock.calls[0];
    expect(argUrl).toBe('https://example.com');
    expect(opts.waitUntil).toBe('domcontentloaded');
  });

  it('retries when the execution context is destroyed by navigation, then succeeds', async () => {
    const navError = new Error('page.evaluate: Execution context was destroyed, most likely because of a navigation');
    const analyze = vi
      .fn()
      .mockRejectedValueOnce(navError)
      .mockResolvedValueOnce({ violations: [{ id: 'html-has-lang' }] });

    AxeBuilder.mockImplementation(() => ({
      withTags: vi.fn().mockReturnThis(),
      analyze,
    }));

    const result = await scanUrl('https://example.com');
    expect(result.violations).toHaveLength(1);
    expect(analyze).toHaveBeenCalledTimes(2);
    expect(fakePage.waitForTimeout).toHaveBeenCalled();
  });

  it('throws a friendly error if the page keeps navigating', async () => {
    AxeBuilder.mockImplementation(() => ({
      withTags: vi.fn().mockReturnThis(),
      analyze: vi.fn().mockRejectedValue(
        new Error('Execution context was destroyed, most likely because of a navigation'),
      ),
    }));

    await expect(scanUrl('https://example.com')).rejects.toThrow(/did not settle/);
  });

  it('propagates genuine failures (not context-destroyed)', async () => {
    AxeBuilder.mockImplementation(() => ({
      withTags: vi.fn().mockReturnThis(),
      analyze: vi.fn().mockRejectedValue(new Error('Something else broke')),
    }));

    await expect(scanUrl('https://example.com')).rejects.toThrow(/Something else broke/);
  });
});