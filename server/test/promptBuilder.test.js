import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/services/promptBuilder.js';

const violation = {
  id: 'image-alt',
  impact: 'serious',
  description: 'Ensures <img> elements have alternate text',
  help: 'Images must have alternate text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  tags: ['wcag2a', 'wcag111'],
  html: '<img src="cat.png" />',
};

describe('buildPrompt', () => {
  it('is deterministic for identical input', () => {
    expect(buildPrompt(violation)).toBe(buildPrompt(violation));
  });

  it('contains the violation data', () => {
    const prompt = buildPrompt(violation);
    expect(prompt).toContain('image-alt');
    expect(prompt).toContain('serious');
    expect(prompt).toContain('<img src="cat.png" />');
    expect(prompt).toContain('wcag111');
  });

  it('instructs the model to return strict JSON', () => {
    expect(buildPrompt(violation)).toContain('STRICT JSON');
  });

  it('truncates very long HTML snippets', () => {
    const long = { ...violation, html: '<div>' + 'x'.repeat(5000) + '</div>' };
    const prompt = buildPrompt(long);
    expect(prompt.length).toBeLessThan(3000);
    expect(prompt).toContain('truncated');
  });
});
