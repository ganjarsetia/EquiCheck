import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { config } from '../config.js';

const CONTEXT_DESTROYED = /execution context was destroyed/i;
const MAX_ANALYZE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

/**
 * Scans a URL for accessibility violations using Playwright + axe-core.
 * A fresh browser is launched per scan and always closed afterwards.
 * Retries the axe run a few times because some SPAs navigate lazily after
 * load, destroying the execution context mid run ("Execution context was
 * destroyed, most likely because of a navigation").
 * @param {string} url
 * @returns {Promise<{ violations: object[], pageTitle: string }>}
 */
export async function scanUrl(url) {
  const browser = await chromium.launch({ headless: true });
  let context;
  try {
    context = await browser.newContext({
      userAgent:
        'EquiCheck/1.0 (+https://example.com; accessibility scanner bot)',
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.scan.timeoutMs,
    });

    const results = await analyzeWithRetry(page);
    const title = await page.title().catch(() => '');
    return { violations: results.violations, pageTitle: title };
  } finally {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

/**
 * Runs AxeBuilder.analyze(), retrying when the page navigates mid-scan.
 * @param {import('playwright').Page} page
 */
async function analyzeWithRetry(page) {
  for (let attempt = 1; attempt <= MAX_ANALYZE_ATTEMPTS; attempt += 1) {
    try {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      return results;
    } catch (error) {
      const isDestroyed = CONTEXT_DESTROYED.test(String(error?.message || ''));
      if (isDestroyed && attempt < MAX_ANALYZE_ATTEMPTS) {
        // Give the SPA a moment to finish navigating, then re-run.
        await page.waitForTimeout(RETRY_DELAY_MS);
        continue;
      }
      if (isDestroyed) {
        throw new Error(
          `The page did not settle after multiple attempts (it kept navigating during the scan). ` +
          `Please try again or use a different page.`,
        );
      }
      throw error;
    }
  }
  throw new Error('Unexpected error while scanning the page.');
}