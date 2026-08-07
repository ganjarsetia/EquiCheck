import { useState } from 'react';
import { explainViolation } from '../../services/api.js';
import AiHelpDialog from './AiHelpDialog.jsx';
import { impactClass } from './impact.js';

export default function ViolationItem({ violation }) {
  const [helpState, setHelpState] = useState({ open: false, data: null, error: '' });

  const openHelp = async () => {
    setHelpState({ open: true, data: null, error: '' });
    try {
      const { explanation } = await explainViolation(violation);
      setHelpState({ open: true, data: explanation, error: '' });
    } catch (err) {
      setHelpState({ open: true, data: null, error: err.message });
    }
  };

  const impactClassName = impactClass(violation.impact);

  return (
    <div className="violation-item">
      <header className="violation-header">
        <div className="violation-title">
          <span className={`impact impact-label ${impactClassName}`}>{violation.impact}</span>
          <span className="rule-id">{violation.ruleId}</span>
        </div>
        <button
          type="button"
          className="get-help-button"
          onClick={openHelp}
          disabled={helpState.open && !helpState.data && !helpState.error}
        >
          {helpState.open && !helpState.data && !helpState.error ? 'Loading…' : 'Get help'}
        </button>
      </header>

      <p className="violation-description">{violation.description}</p>

      <details className="violation-details">
        <summary>View HTML snippet</summary>
        <pre className="html-snippet">
          <code>{violation.html}</code>
        </pre>
      </details>

      {violation.helpUrl && (
        <a className="wcag-link" href={violation.helpUrl} target="_blank" rel="noreferrer noopener">
          WCAG reference ↗
        </a>
      )}

      <AiHelpDialog
        open={helpState.open}
        error={helpState.error}
        explanation={helpState.data}
        onRetry={openHelp}
        onClose={() => setHelpState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
