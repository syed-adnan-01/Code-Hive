// Frontend Service for AI Debugging and Code Suggestion (IDE Extension Plan Section 6)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getHeaders = (idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  } else {
    headers['Authorization'] = 'Bearer demo-user-token';
  }
  return headers;
};

// 1. AI Debug: Explain execution error and generate structured code fix
export const debugCodeAPI = async ({ code, language, stderr, stdin = '', idToken }) => {
  if (!code) throw new Error('Source code is required for AI debugging.');
  if (!stderr) throw new Error('Error output (stderr) is required for AI debugging.');

  const res = await fetch(`${BACKEND_URL}/api/ai/debug`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({
      code,
      language,
      stderr,
      stdin,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze code with AI.');
  }

  return data.debug;
};

// 2. AI Suggest: Inline code completion (prefix + suffix continuation)
export const suggestCodeAPI = async ({ prefix, suffix = '', language, idToken }) => {
  if (!prefix) return { suggestion: '' };

  const res = await fetch(`${BACKEND_URL}/api/ai/suggest`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({
      prefix,
      suffix,
      language,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch AI code suggestion.');
  }

  return data;
};
