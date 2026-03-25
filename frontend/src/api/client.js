const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Request failed');
  }

  return res.json();
}

export function fetchOverview() {
  return request('/overview');
}

export function fetchNotices() {
  return request('/notices');
}

export function fetchStudents() {
  return request('/students');
}

export function fetchResults() {
  return request('/results');
}

export function authenticate({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}
