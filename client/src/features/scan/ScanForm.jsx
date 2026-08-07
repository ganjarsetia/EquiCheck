import { useState } from 'react';

const PLACEHOLDER = 'https://example.com';

export default function ScanForm({ onScan, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL to scan.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError('The URL must start with http:// or https://');
      return;
    }
    setError('');
    onScan(trimmed);
  };

  return (
    <form className="scan-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="scan-url" className="scan-label">
        Enter a webpage URL
      </label>
      <div className="scan-row">
        <input
          id="scan-url"
          type="url"
          value={url}
          placeholder={PLACEHOLDER}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'scan-url-error' : undefined}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="scan-button" disabled={isLoading}>
          {isLoading ? 'Scanning…' : 'Scan'}
        </button>
      </div>
      {error && (
        <p id="scan-url-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
