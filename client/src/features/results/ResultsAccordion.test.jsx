import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsAccordion from './ResultsAccordion.jsx';
import * as api from '../../services/api.js';

const violations = [
  {
    id: 'image-alt-abc',
    ruleId: 'image-alt',
    impact: 'serious',
    description: 'Ensures <img> elements have alternate text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
    html: '<img src="cat.png" />',
  },
  {
    id: 'color-contrast-def',
    ruleId: 'color-contrast',
    impact: 'critical',
    description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
    html: '<p style="color:#999">Low contrast text</p>',
  },
];

describe('ResultsAccordion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an empty state when there are no violations', () => {
    render(<ResultsAccordion url="https://example.com" violations={[]} />);
    expect(screen.getByText(/no wcag issues/i)).toBeInTheDocument();
  });

  it('renders a summary with total count', () => {
    render(
      <ResultsAccordion
        url="https://example.com"
        pageTitle="Example"
        counts={{ total: 2, serious: 1, critical: 1 }}
        violations={violations}
      />,
    );
    expect(screen.getByText(/2 issues found/i)).toBeInTheDocument();
  });

  it('renders one accordion per violation', () => {
    render(
      <ResultsAccordion url="https://example.com" counts={{ total: 2 }} violations={violations} />,
    );
    expect(screen.getAllByText('image-alt').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('color-contrast').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the Get Help dialog and shows the AI explanation', async () => {
    vi.spyOn(api, 'explainViolation').mockResolvedValue({
      explanation: {
        problem: 'Missing alt text',
        whyItMatters: 'Screen readers cannot describe the image',
        suggestedFix: 'Add an alt attribute',
        correctedHtml: '<img src="cat.png" alt="A cat" />',
        wcagReference: 'WCAG 1.1.1',
      },
    });

    const user = userEvent.setup();
    render(
      <ResultsAccordion url="https://example.com" counts={{ total: 1 }} violations={violations} />,
    );

    // Open the first accordion so its Get help button is visible.
    await user.click(screen.getAllByText('image-alt')[0]);
    await user.click(screen.getAllByRole('button', { name: /get help/i })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('Missing alt text')).toBeInTheDocument();
    expect(screen.getByText(/screen readers cannot describe/i)).toBeInTheDocument();
    expect(api.explainViolation).toHaveBeenCalledWith(violations[0]);
  });

  it('shows an error message when the AI request fails', async () => {
    vi.spyOn(api, 'explainViolation').mockRejectedValue(new Error('AI provider is down'));

    const user = userEvent.setup();
    render(
      <ResultsAccordion url="https://example.com" counts={{ total: 1 }} violations={violations} />,
    );

    await user.click(screen.getAllByText('image-alt')[0]);
    await user.click(screen.getAllByRole('button', { name: /get help/i })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('AI provider is down');
  });

  it('shows a retry button on error and retries the request', async () => {
    vi.spyOn(api, 'explainViolation')
      .mockRejectedValueOnce(new Error('OpenCode Zen is having a temporary server problem'))
      .mockResolvedValueOnce({
        explanation: { problem: 'Fixed on retry', whyItMatters: '', suggestedFix: '', correctedHtml: '', wcagReference: '' },
      });

    const user = userEvent.setup();
    render(
      <ResultsAccordion url="https://example.com" counts={{ total: 1 }} violations={violations} />,
    );

    await user.click(screen.getAllByText('image-alt')[0]);
    await user.click(screen.getAllByRole('button', { name: /get help/i })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't get an explanation/i);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Fixed on retry')).toBeInTheDocument();
    expect(api.explainViolation).toHaveBeenCalledTimes(2);
  });
});
