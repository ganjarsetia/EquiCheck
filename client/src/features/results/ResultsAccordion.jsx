import ViolationItem from './ViolationItem.jsx';
import { impactClass } from './impact.js';

export default function ResultsAccordion({ url, pageTitle, counts, violations }) {
  if (!violations || violations.length === 0) {
    return (
      <section className="results results-empty" aria-label="Scan results">
        <h2>Scan complete</h2>
        <p>
          Great news! no WCAG issues were detected on <strong>{url}</strong>.
        </p>
      </section>
    );
  }

  const countEntries = Object.entries(counts || {}).filter(([key]) => key !== 'total');

  return (
    <section className="results" aria-label="Scan results">
      <header className="results-header">
        <h2>Scan results</h2>
        <p className="results-sub">
          {pageTitle ? `“${pageTitle}”` : url} - {counts?.total ?? violations.length} issue
          {counts?.total === 1 ? '' : 's'} found
        </p>
        {countEntries.length > 0 && (
          <div className="counts">
            {countEntries.map(([impact, count]) => (
              <span key={impact} className={`count ${impactClass(impact)}`}>
                {impact}: {count}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="accordion">
        {violations.map((violation) => (
          <details key={violation.id} className="accordion-item">
            <summary>
              <span className={`impact impact-label ${impactClass(violation.impact)}`}>
                {violation.impact}
              </span>
              <span className="accordion-title">{violation.ruleId}</span>
            </summary>
            <ViolationItem violation={violation} />
          </details>
        ))}
      </div>
    </section>
  );
}
