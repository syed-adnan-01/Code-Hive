// Frontend Service for Admin Panel operations (IDE Extension Plan Section 4)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getHeaders = (idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  } else {
    // In demo mode fallback to demo-admin-token
    headers['Authorization'] = 'Bearer demo-admin-token';
  }
  return headers;
};

// 1. Languages
export const fetchAdminLanguages = async (idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/languages`, {
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch languages');
  return data.languages || [];
};

export const updateLanguageStatus = async (id, enabled, idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/languages/${id}`, {
    method: 'PATCH',
    headers: getHeaders(idToken),
    body: JSON.stringify({ enabled }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update language');
  return data.language;
};

// 2. Users
export const fetchAdminUsers = async (search = '', idToken) => {
  const url = new URL(`${BACKEND_URL}/api/admin/users`);
  if (search) url.searchParams.set('search', search);

  const res = await fetch(url.toString(), {
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data.users || [];
};

export const disableUser = async (uid, idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${uid}/disable`, {
    method: 'POST',
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to disable user');
  return data.user || data.result;
};

export const enableUser = async (uid, idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${uid}/enable`, {
    method: 'POST',
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to enable user');
  return data.user || data.result;
};

export const setUserAdminRole = async (uid, admin, idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${uid}/admin`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ admin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user role');
  return data.result;
};

// 3. Stats & Logs
export const fetchAdminStats = async (idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch statistics');
  return data.stats;
};

export const fetchAdminLogs = async (idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/logs`, {
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
  return data.logs || [];
};
