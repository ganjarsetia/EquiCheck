import { Router } from 'express';
import scanRouter from './scan.js';
import explainRouter from './explain.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/scan', scanRouter);
router.use('/explain', explainRouter);

export default router;
