import crypto from 'node:crypto';
import { config } from '../config.js';

/**
 * Normalises raw axe-core violations into a compact, frontend friendly shape.
 * Each node becomes its own item with a stable id, an HTML snippet and the
 * failure summary, ready to be shown in the UI and sent to the LLM.
 * @param {object[]} violations raw axe results
 * @returns {object[]}
 */
export function normalizeViolations(violations = []) {
  return violations
    .map((violation) =>
      violation.nodes.slice(0, config.scan.maxNodesPerViolation).map((node) => {
        const id = `${violation.id}-${hash(node.target.join(' '))}`;
        return {
          id,
          ruleId: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          html: truncate(node.html),
          target: node.target,
          failureSummary: node.failureSummary || '',
          checks: {
            any: node.any.map((c) => ({ id: c.id, message: c.message })),
            all: node.all.map((c) => ({ id: c.id, message: c.message })),
            none: node.none.map((c) => ({ id: c.id, message: c.message })),
          },
        };
      }),
    )
    .flat();
}

function truncate(html = '') {
  const str = String(html);
  if (str.length <= config.scan.maxHtmlLength) return str;
  return `${str.slice(0, config.scan.maxHtmlLength)}…`;
}

function hash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8);
}
