const MAX_HTML_LENGTH = 2000;

/**
 * Builds a deterministic prompt asking the LLM to act as an accessibility
 * expert for a single axe-core violation.
 * @param {object} violation  normalized axe violation (has id, impact, description, help, helpUrl, tags, nodes)
 * @returns {string} the user prompt
 */
export function buildPrompt(violation) {
  const html = truncate(violation.html, MAX_HTML_LENGTH);
  const tags = Array.isArray(violation.tags) ? violation.tags.join(', ') : '';

  return [
    'You are a senior accessibility (a11y) expert helping a junior web developer.',
    'Explain the following axe-core accessibility violation in plain, beginner-friendly language.',
    '',
    'Respond with STRICT JSON only (no markdown fences, no extra text) matching this exact shape:',
    '{',
    '  "problem": "what the issue is, in plain language",',
    '  "whyItMatters": "who it affects and the real-world impact",',
    '  "suggestedFix": "step-by-step recommended fix",',
    '  "correctedHtml": "the corrected HTML example, or an empty string if not applicable",',
    '  "wcagReference": "the WCAG guideline/success criterion name and official link"',
    '}',
    '',
    'Input data:',
    `Violation ID: ${violation.id}`,
    `Impact: ${violation.impact}`,
    `Description: ${violation.description}`,
    `Help: ${violation.help}`,
    `Help URL: ${violation.helpUrl}`,
    `Relevant tags: ${tags}`,
    '',
    `Offending HTML:`,
    '```html',
    `${html}`,
    '```',
  ].join('\n');
}

function truncate(html = '') {
  const str = String(html);
  if (str.length <= MAX_HTML_LENGTH) return str;
  return `${str.slice(0, MAX_HTML_LENGTH)}\n… [truncated]`;
}
