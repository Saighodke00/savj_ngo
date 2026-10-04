import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    // Avoid caching for admin dashboard where data changes frequently
    cache: 'no-store',
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data.data;
}
