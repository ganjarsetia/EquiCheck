import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const LOG_DIR = config.log.dir;
const LOG_FILE = path.join(LOG_DIR, config.log.file);
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVELS[config.log.level] ?? 20;

try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // non-fatal: falls back to console-only logging
}

function serialize(args) {
  return args
    .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
    .join(' ');
}

function safeStringify(value) {
  try {
    const out = JSON.stringify(value, null, 2);
    return out === undefined ? String(value) : out;
  } catch {
    return String(value);
  }
}

function write(level, args) {
  const line = `[${new Date().toISOString()}] [${level}] ${serialize(args)}\n`;
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](line.trim());
  if (LEVELS[level] >= MIN_LEVEL) {
    try {
      fs.appendFileSync(LOG_FILE, line);
    } catch {
      // never let logging break a request
    }
  }
}

export const logger = {
  debug: (...args) => LEVELS.debug >= MIN_LEVEL && write('debug', args),
  info: (...args) => LEVELS.info >= MIN_LEVEL && write('info', args),
  warn: (...args) => LEVELS.warn >= MIN_LEVEL && write('warn', args),
  error: (...args) => LEVELS.error >= MIN_LEVEL && write('error', args),
};