import { Router } from 'express';
import { explainViolation } from '../services/aiService.js';

const router = Router();

const REQUIRED_FIELDS = ['ruleId', 'impact', 'html'];

/**
 * POST /api/explain
 * Body: violation object (from a scan result).
 * Sends the offending HTML + axe data to the LLM and returns an explanation.
 */
router.post('/', async (req, res, next) => {
  const violation = (req.body || {}).violation || req.body;

  if (!violation || typeof violation !== 'object') {
    return res.status(400).json({ error: 'A violation object is required.' });
  }

  const missing = REQUIRED_FIELDS.filter(
    (field) => typeof violation[field] !== 'string' || !violation[field],
  );
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }

  try {
    const explanation = await explainViolation(violation);
    return res.json({ explanation });
  } catch (error) {
    next(error);
  }
});

export default router;
