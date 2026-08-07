import { Router } from 'express';
import { validateUrl } from '../utils/urlValidator.js';
import { scanUrl } from '../services/scanService.js';
import { normalizeViolations } from '../services/normalizeViolations.js';

const router = Router();

/**
 * POST /api/scan
 * Body: { url: string }
 * Runs an axe-core scan on the URL and returns normalized violations.
 */
router.post('/', async (req, res, next) => {
  const { url } = req.body || {};
  const validation = validateUrl(url);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const { violations, pageTitle } = await scanUrl(validation.url);
    const normalized = normalizeViolations(violations);
    const summary = groupByImpact(normalized);

    return res.json({
      url: validation.url,
      pageTitle,
      scanCompletedAt: new Date().toISOString(),
      violations: normalized,
      counts: { total: normalized.length, ...summary },
    });
  } catch (error) {
    next(classifyScanError(error));
  }
});

function groupByImpact(items) {
  return items.reduce((acc, item) => {
    acc[item.impact] = (acc[item.impact] || 0) + 1;
    return acc;
  }, {});
}

/** Maps Playwright/navigation failures to friendly HTTP errors. */
function classifyScanError(error) {
  const msg = String(error?.message || '');
  const isTimeout = /Timeout|timed out/i.test(msg);
  const isNav = /net::|navigat|ETIMEDOUT|ECONNREFUSED|ERR_/i.test(msg);
  const err = new Error(
    isTimeout
      ? 'The page took too long to load. Try again or check that the URL is reachable.'
      : isNav
        ? 'Failed to load the page. Check that the URL is publicly reachable and HTTPS.'
        : 'The scan could not be completed.',
  );
  err.status = isTimeout ? 504 : isNav ? 422 : 500;
  return err;
}

export default router;
