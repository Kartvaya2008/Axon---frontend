// js/ui/documents.js
// ─── Document list rendering, status polling, delete ─────────────────────────
import { API, fetchWithWakeupRetry } from '../utils/api.js';
import { formatDate, showToast } from '../utils/helpers.js';

// ── Shared state (module-level) ──────────────────────────────────────────────
export let docs = [];
export const pollTimers = {};

// ── Render ───────────────────────────────────────────────────────────────────
export function renderDocs() {
  const list = document.getElementById('doc-list');
  const totalEl = document.getElementById('total-docs');
  if (totalEl) totalEl.textContent = docs.length;

  // Pills above the input box
  const pillsContainer = document.getElementById('docs-pills');
  if (pillsContainer) {
    pillsContainer.innerHTML = docs.slice(0, 10).map(doc => `
      <div class="doc-pill" title="${doc.filename}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>${doc.filename.length > 20 ? doc.filename.substring(0, 20) + '...' : doc.filename}</span>
        <button class="doc-pill-remove" onclick="deleteDoc('${doc.document_id}', event)" title="Delete document">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }

  // Storage estimate
  const totalStorageEl = document.getElementById('total-storage');
  if (totalStorageEl) {
    const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
    totalStorageEl.textContent = ((totalChunks * 2) / 1024).toFixed(2) + ' MB';
  }

  if (!list) return;

  if (!docs.length) {
    list.innerHTML = '<div style="padding: 10px 28px; font-size: 13px; color: var(--text-secondary);">No documents yet.</div>';
    return;
  }

  list.innerHTML = docs.map(doc => {
    const label = { ready: 'Ready', pending: 'Pending', processing: 'Processing...', failed: 'Failed' }[doc.status] || doc.status;
    const dateStr = formatDate(doc.created_at);
    const sizeStr = doc.chunk_count ? (doc.chunk_count * 2) + ' KB' : '–';
    return `<div class="doc-item" id="docitem-${doc.document_id}">
      <div class="doc-info">
        <div class="doc-name" title="${doc.filename}">${doc.filename}</div>
        <div class="doc-meta">
          <span>${dateStr}</span>
          <span>${sizeStr}</span>
          <span>${label}</span>
        </div>
      </div>
      <button class="doc-delete" onclick="deleteDoc('${doc.document_id}', event)" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
  }).join('');

  // Start polling for pending/processing docs
  docs
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .forEach(d => {
      if (!pollTimers[d.document_id]) {
        pollTimers[d.document_id] = setInterval(() => pollStatus(d.document_id), 2000);
      }
    });
}

// ── Scope select ─────────────────────────────────────────────────────────────
export function updateScopeSelect() {
  const sel = document.getElementById('doc-scope');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Search all documents</option>' +
    docs
      .filter(d => d.status === 'ready')
      .map(d => `<option value="${d.document_id}">${d.filename}</option>`)
      .join('');
  sel.value = cur;
}

// ── Load documents ───────────────────────────────────────────────────────────
export async function loadDocuments() {
  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/documents/', { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    docs = d.documents || [];
    renderDocs();
    updateScopeSelect();
  } catch {
    renderDocs();
  }
}

// ── Poll status ──────────────────────────────────────────────────────────────
export async function pollStatus(id) {
  try {
    const r = await fetch(API + '/api/v1/documents/' + id + '/status');
    const d = await r.json();
    const idx = docs.findIndex(x => x.document_id === id);
    if (idx !== -1) { docs[idx] = { ...docs[idx], ...d }; renderDocs(); updateScopeSelect(); }
    if (d.status === 'ready' || d.status === 'failed') {
      clearInterval(pollTimers[id]);
      delete pollTimers[id];
      // trigger health refresh
      window._axonCheckHealth && window._axonCheckHealth();
    }
  } catch { /* network hiccup, will retry */ }
}

// ── Delete document ───────────────────────────────────────────────────────────
export async function deleteDoc(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this document?')) return;
  try { await fetch(API + '/api/v1/documents/' + id, { method: 'DELETE' }); } catch { /* ignore */ }
  docs = docs.filter(d => d.document_id !== id);
  renderDocs();
  updateScopeSelect();
  window._axonCheckHealth && window._axonCheckHealth();
}
