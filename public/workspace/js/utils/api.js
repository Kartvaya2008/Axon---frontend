// js/utils/api.js
// ─── API base URL + fetch wrapper with cold-start retry ──────────────────────
import { showToast } from './helpers.js';

export const API =
  typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000';

/**
 * Fetch wrapper that automatically retries on 502/503/504 (Render free-tier
 * cold starts) and on network errors, showing a toast while waiting.
 *
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @param {number} [retries=1]
 * @returns {Promise<Response>}
 */
export async function fetchWithWakeupRetry(url, options = {}, retries = 1) {
  try {
    const response = await fetch(url, options);
    if (!response.ok && [502, 503, 504].includes(response.status) && retries > 0) {
      showToast('Server is waking up (free plan), please wait up to a minute', 10000);
      await new Promise(res => setTimeout(res, 5000));
      return fetchWithWakeupRetry(url, options, retries - 1);
    }
    return response;
  } catch (err) {
    if (retries > 0) {
      showToast('Server is waking up (free plan), please wait up to a minute', 10000);
      await new Promise(res => setTimeout(res, 5000));
      return fetchWithWakeupRetry(url, options, retries - 1);
    }
    throw err;
  }
}
