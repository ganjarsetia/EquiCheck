import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env from server dir, falling back to the repo root
dotenv.config({ quiet: true });
dotenv.config({ path: '../.env', quiet: true });

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR_DEFAULT = path.resolve(serverDir, '../logs');

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const config = {
  port: toInt(process.env.PORT, 3001),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || true,
  zen: {
    apiKey: process.env.OPENCODE_ZEN_API || '',
    model: process.env.ZEN_MODEL || 'deepseek-v4-flash-free',
    baseUrl: 'https://opencode.ai/zen/v1/chat/completions',
    timeoutMs: toInt(process.env.ZEN_TIMEOUT_MS, 60000),
  },
  scan: {
    timeoutMs: toInt(process.env.SCAN_TIMEOUT_MS, 30000),
    maxNodesPerViolation: toInt(process.env.MAX_NODES_PER_VIOLATION, 5),
    maxHtmlLength: toInt(process.env.MAX_HTML_LENGTH, 2000),
  },
  log: {
    dir: process.env.LOG_DIR || LOG_DIR_DEFAULT,
    file: process.env.LOG_FILE || 'equicheck.log',
    level: process.env.LOG_LEVEL || 'info',
  },
};
