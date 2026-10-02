// js/utils/helpers.js
// ─── Shared pure utilities ────────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} s
 * @returns {string}
 */
export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/**
 * Format an ISO date string into a short, human-readable date.
 * @param {string} ts
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return 'Added recently';
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Added recently';
  }
}

/**
 * Show a toast notification.
 * @param {string} msg
 * @param {number} [duration=3000]
 */
export function showToast(msg, duration = 3000) {
  const toast = document.getElementById('upload-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}
