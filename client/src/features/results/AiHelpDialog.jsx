function Block({ label, value }) {
  if (!value) return null;
  if (label === 'Corrected HTML') {
    return (
      <section className="ai-block">
        <h4>{label}</h4>
        <pre className="html-snippet html-snippet-fix">
          <code>{value}</code>
        </pre>
      </section>
    );
  }
  return (
    <section className="ai-block">
      <h4>{label}</h4>
      <p>{value}</p>
    </section>
  );
}

export default function AiHelpDialog({ open, explanation, error, onClose, onRetry }) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI accessibility explanation"
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog-header">
          <h3>AI help</h3>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        {error && (
          <div role="alert" className="status status-error">
            <div className="error-block">
              <p className="error-heading">
                We couldn't get an explanation from the AI right now.
              </p>
              <p>{error}</p>
              {onRetry && (
                <button type="button" className="retry-button" onClick={onRetry}>
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {!error && !explanation && (
          <div role="status" className="status status-loading" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            Asking the accessibility expert…
          </div>
        )}

        {!error && explanation && (
          <div className="dialog-body">
            <Block label={VIS_LABELS.problem} value={explanation.problem} />
            <Block label={VIS_LABELS.whyItMatters} value={explanation.whyItMatters} />
            <Block label={VIS_LABELS.suggestedFix} value={explanation.suggestedFix} />
            <Block label={VIS_LABELS.correctedHtml} value={explanation.correctedHtml} />
            <Block label={VIS_LABELS.wcagReference} value={explanation.wcagReference} />
          </div>
        )}
      </div>
    </div>
  );
}

const VIS_LABELS = {
  problem: 'The problem',
  whyItMatters: 'Why it matters',
  suggestedFix: 'Suggested fix',
  correctedHtml: 'Corrected HTML',
  wcagReference: 'WCAG reference',
};
