// Frontend Service to trigger Code Execution via backend POST /api/run

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const runCodeAPI = async ({ source_code, language_id, stdin = '', roomId, idToken }) => {
  if (!source_code || !source_code.trim()) {
    throw new Error('Cannot execute empty source code.');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code,
      language_id: Number(language_id),
      stdin: stdin || '',
      roomId: roomId || undefined,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Execution failed with status ${response.status}`);
  }

  return data;
};

export const fetchRunHistoryAPI = async (idToken) => {
  const headers = {};
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/run/history`, {
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch execution history.');
  }

  return data.history || [];
};

export const fetchSupportedLanguages = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/run/languages`);
    if (res.ok) {
      const data = await res.json();
      return data.languages;
    }
  } catch (err) {
    console.warn('Could not fetch languages from backend, using local fallback:', err.message);
  }
  return null;
};

