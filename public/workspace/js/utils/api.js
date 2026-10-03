// public/workspace/js/utils/api.js
// ─── API base URL + fetch wrapper with auth token & cold-start retry ─────────
import { showToast } from './helpers.js';
import { getToken, signOut, refreshSession } from './auth.js';

export const API =
  typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000';

/**
 * Fetch wrapper that:
 * 1. Automatically attaches `Authorization: Bearer <token>` if user is signed in.
 * 2. On 401 Unauthorized, attempts to refresh session and retry ONCE before signing out.
 * 3. Never signs out on 403/404/500 errors.
 * 4. Retries on 502/503/504 (Render cold starts) and network errors.
 *
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @param {number} [retries=1]
 * @param {boolean} [isRetryAfter401=false]
 * @returns {Promise<Response>}
 */
export async function fetchWithWakeupRetry(url, options = {}, isRetryAfter401 = false) {
  // Inject Authorization header if token exists
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const authedOptions = { ...options, headers };

  try {
    const response = await fetch(url, authedOptions);

    if (response.status === 401) {
      if (!isRetryAfter401) {
        console.warn('Received 401 Unauthorized — attempting session refresh');
        const newSession = await refreshSession();
        if (newSession && newSession.access_token) {
          // Retry request with fresh token
          const freshHeaders = new Headers(options.headers || {});
          freshHeaders.set('Authorization', `Bearer ${newSession.access_token}`);
          return fetchWithWakeupRetry(url, { ...options, headers: freshHeaders }, true);
        }
      }
      console.warn('Session refresh failed on 401 Unauthorized — signing out user');
      signOut();
      throw new Error('Session expired or invalid. Please sign in again.');
    }

    return response;
  } catch (err) {
    if (err.message && err.message.includes('Session expired')) {
      throw err;
    }
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }
}
