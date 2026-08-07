const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body
  }

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }

  return body;
}

export async function scanUrl(url) {
  return request('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function explainViolation(violation) {
  return request('/api/explain', {
    method: 'POST',
    body: JSON.stringify({ violation }),
  });
}
