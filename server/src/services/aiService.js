import { config } from '../config.js';
import { buildPrompt } from './promptBuilder.js';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Calls OpenCode Zen (OpenAI-compatible chat completions) to explain a
 * violation. Parses the LLM's strict JSON reply into a structured shape.
 * Retries transient provider failures (empty replies, rate limits, 5xx).
 * @param {object} violation  normalized axe violation
 * @returns {Promise<object>} { problem, whyItMatters, suggestedFix, correctedHtml, wcagReference }
 */
export async function explainViolation(violation) {
  if (!config.zen.apiKey) {
    const error = new AiError('AI help is not configured yet. Ask an admin to set OPENCODE_ZEN_API.');
    error.transient = false;
    error.detail = 'Missing OPENCODE_ZEN_API environment variable.';
    error.status = 503;
    throw error;
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await attemptSingle(violation);
    if (result.ok) return result.value;

    lastError = result.error;
    // Non-transient failures (e.g. bad request) are thrown immediately.
    if (!result.error.transient) break;
    // Exhausted retries.
    if (attempt >= MAX_ATTEMPTS) break;

    await sleep(RETRY_DELAY_MS);
  }
  throw lastError;
}

/**
 * Makes one request to the provider.
 * @returns {Promise<{ ok: true, value: object } | { ok: false, error: AiError }>}
 */
async function attemptSingle(violation) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.zen.timeoutMs);

  try {
    const response = await fetch(config.zen.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.zen.apiKey}`,
      },
      body: JSON.stringify({
        model: config.zen.model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              'You return strict JSON only. You never include markdown fences, commentary, or trailing prose.',
          },
          { role: 'user', content: buildPrompt(violation) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return {
        ok: false,
        error: providerHttpError(response.status, detail),
      };
    }

    const payload = await response.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (!raw) {
      return {
        ok: false,
        error: makeAiError(
          'OpenCode Zen returned an empty response. This is a temporary issue on the AI provider’s side — please try again in a moment.',
          'OpenCode Zen returned an empty response.',
          true,
          502,
        ),
      };
    }
    return { ok: true, value: parseExplanation(raw, violation.id) };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        ok: false,
        error: makeAiError(
          'OpenCode Zen took too long to respond. This is a temporary issue on the AI provider’s side — please try again.',
          `Request aborted after ${config.zen.timeoutMs}ms.`,
          true,
          502,
        ),
      };
    }
    return {
      ok: false,
      error: makeAiError(
        'Could not reach OpenCode Zen. This is an issue with the AI provider or your network, not with your scan — please try again.',
        `Network error: ${error.message}`,
        true,
        502,
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Builds a user friendly message for a non 2xx HTTP response from the provider. */
function providerHttpError(status, detail) {
  const snippet = detail.slice(0, 200) || '(no response body)';

  if (status === 429) {
    return makeAiError(
      'OpenCode Zen is receiving too many requests right now (rate limit). Please wait a moment and try again.',
      `OpenCode Zen returned HTTP 429: ${snippet}`,
      true,
      502,
    );
  }
  if (status >= 500) {
    return makeAiError(
      'OpenCode Zen is having a temporary server problem right now. This is on the AI provider’s side, not your scan — please try again in a moment.',
      `OpenCode Zen returned HTTP ${status}: ${snippet}`,
      true,
      502,
    );
  }
  // 4xx (e.g. 400/401/422) — likely a request-side problem, not transient.
  return makeAiError(
    `OpenCode Zen rejected the request (HTTP ${status}). This may be a problem with the app configuration — please try again, and contact support if it keeps happening.`,
    `OpenCode Zen returned HTTP ${status}: ${snippet}`,
    false,
    400,
  );
}

/**
 * Creates an AiError carrying:
 *  - `message`: user facing text (what the UI shows)
 *  - `detail`:  technical text (what gets logged)
 *  - `transient`: whether a retry is worth it
 *  - `status`: optional HTTP status for the response
 */
function makeAiError(message, detail, transient, status) {
  const error = new AiError(message);
  error.detail = detail;
  error.transient = Boolean(transient);
  if (status) error.status = status;
  return error;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @see above */
export function parseExplanation(raw, ruleId = 'unknown') {
  const text = String(raw).trim();
  const json = extractJsonObject(text);

  if (!json) {
    return fallback(text, ruleId);
  }

  const parsed = safeParse(sanitizeJson(json));
  if (!parsed || typeof parsed !== 'object') {
    return fallback(text, ruleId);
  }

  return {
    problem: pickString(parsed.problem),
    whyItMatters: pickString(parsed.whyItMatters),
    suggestedFix: pickString(parsed.suggestedFix),
    correctedHtml: pickString(parsed.correctedHtml),
    wcagReference: pickString(parsed.wcagReference) || `Axe rule: ${ruleId}`,
  };
}

/**
 * Extracts the first balanced JSON object from arbitrary model output.
 * Unlike a greedy regex, this tracks string literals and brace depth, so it
 * stops at the exact matching `}` instead of over capturing trailing prose.
 * Strips optional markdown code fences before scanning.
 */
function extractJsonObject(text) {
  let source = text;
  const fence = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) source = fence[1];

  const start = source.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * JSON.stringify can't be used here because models frequently emit literal
 * newlines, carriage returns, or tabs *inside* string values rather than as
 * \n, \r, \t escapes. That makes JSON.parse throw. This walks the text and
 * escapes only the control characters that appear inside string literals
 * (while leaving already-escaped sequences and structural whitespace intact).
 */
function sanitizeJson(text) {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      out += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
    }
    out += ch;
  }
  return out;
}

/**
 * Returns a friendly string for a field, unwrapping JSON that the model
 * accidentally nested (e.g. putting the whole response inside "problem").
 */
function pickString(value) {
  if (typeof value === 'string') {
    const nested = safeParse(value);
    // If the value is itself a JSON object, recover its readable content.
    if (nested && typeof nested === 'object') {
      return pickString(nested.problem || nested.explanation || JSON.stringify(nested, null, 2));
    }
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    return pickString(value.problem || value.explanation || JSON.stringify(value, null, 2));
  }
  return typeof value === 'string' ? value : '';
}

function fallback(text, ruleId) {
  const clean = text
    .replace(/```(?:json)?\n?/gi, '')
    .replace(/```/g, '')
    .trim();
  return {
    problem: clean,
    whyItMatters: '',
    suggestedFix: '',
    correctedHtml: '',
    wcagReference: `Axe rule: ${ruleId}`,
  };
}

export class AiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiError';
  }
}