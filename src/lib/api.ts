import { auth } from './firebase.js';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  const token = await user.getIdToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
