import { useState } from 'react';
import ScanForm from './features/scan/ScanForm.jsx';
import ResultsAccordion from './features/results/ResultsAccordion.jsx';
import { sortByImpact } from './features/results/impact.js';
import { scanUrl } from './services/api.js';

function App() {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const handleScan = async (url) => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await scanUrl(url);
      const sorted = sortByImpact(data.violations);
      setState({ status: 'success', data: { ...data, violations: sorted } });
    } catch (err) {
      setState({ status: 'error', data: null, error: errMsg(err) });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>EquiCheck</h1>
        <p className="app-tagline">
          Scan any webpage for accessibility issues, and get AI help to fix them.
        </p>
      </header>

      <main>
        <ScanForm onScan={handleScan} isLoading={state.status === 'loading'} />

        {state.status === 'loading' && (
          <div role="status" className="status status-loading" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            Scanning for accessibility issues…
          </div>
        )}

        {state.status === 'error' && (
          <div role="alert" className="status status-error">
            <strong>Scan failed.</strong> {state.error}
          </div>
        )}

        {state.status === 'success' && (
          <ResultsAccordion
            url={state.data.url}
            pageTitle={state.data.pageTitle}
            counts={state.data.counts}
            violations={state.data.violations}
          />
        )}
      </main>

      <footer className="app-footer">
        Built with Playwright, axe-core &amp; OpenCode Zen
        <br />
        Created By: Ganjar Setia
      </footer>
    </div>
  );
}

function errMsg(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
}

export default App;
