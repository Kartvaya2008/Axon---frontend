// js/ui/documents.js
// ─── Document list rendering, status polling, delete, view ───────────────────
import { API, fetchWithWakeupRetry } from '../utils/api.js';
import { formatDate, showToast } from '../utils/helpers.js';

// ── Shared state ──────────────────────────────────────────────────────────────
export let docs = [];
export const pollTimers = {};

// ── Status badge ──────────────────────────────────────────────────────────────
function _statusBadge(status) {
  const map = {
    ready:      { label: 'Ready',       color: '#3fb87a' },
    pending:    { label: 'Pending',     color: '#888'    },
    processing: { label: 'Processing…', color: '#e9a55c' },
    failed:     { label: 'Failed',      color: '#e05a5a' },
  };
  const s = map[status] || { label: status, color: '#888' };
  return `<span style="color:${s.color};font-size:11px;font-weight:500;">${s.label}</span>`;
}

// ── Render sidebar doc list ───────────────────────────────────────────────────
export function renderDocs() {
  const list     = document.getElementById('doc-list');
  const totalEl  = document.getElementById('total-docs');
  if (totalEl) totalEl.textContent = docs.length;

  // Pills above input
  const pillsContainer = document.getElementById('docs-pills');
  if (pillsContainer) {
    pillsContainer.innerHTML = docs.slice(0, 10).map(doc => `
      <div class="doc-pill" title="${doc.filename}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>${doc.filename.length > 20 ? doc.filename.slice(0, 20) + '…' : doc.filename}</span>
        <button class="doc-pill-remove" onclick="deleteDoc('${doc.document_id}', event)" title="Delete">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }

  // Storage estimate using actual file_size_bytes
  const totalStorageEl = document.getElementById('total-storage');
  if (totalStorageEl) {
    const totalBytes = docs.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0);
    const totalMB = totalBytes / (1024 * 1024);
    totalStorageEl.textContent = totalMB < 0.01 && totalBytes > 0 ? '<0.01 MB' : totalMB.toFixed(2) + ' MB';
  }

  if (!list) return;

  if (!docs.length) {
    list.innerHTML = '<div style="padding:10px 16px;font-size:13px;color:var(--text-secondary);">No documents yet.</div>';
    return;
  }

  list.innerHTML = docs.map(doc => {
    const dateStr   = formatDate(doc.created_at);
    const chunkStr  = doc.chunk_count ? doc.chunk_count + ' chunks' : '–';
    const isReady   = doc.status === 'ready';
    const errorTip  = doc.error_detail ? ` title="${doc.error_detail.replace(/"/g, "'")}"` : '';

    return `<div class="doc-item" id="docitem-${doc.document_id}">
      <div class="doc-info" style="flex:1;min-width:0;">
        <div class="doc-name" title="${doc.filename}">${doc.filename}</div>
        <div class="doc-meta" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--text-secondary);">${dateStr}</span>
          <span style="font-size:11px;color:var(--text-secondary);">${chunkStr}</span>
          <span${errorTip}>${_statusBadge(doc.status)}</span>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        ${isReady ? `<button class="doc-action-btn" onclick="viewDocument('${doc.document_id}', '${doc.filename.replace(/'/g, "\\'")}', event)" title="View text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>` : ''}
        <button class="doc-delete" onclick="deleteDoc('${doc.document_id}', event)" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // Poll pending/processing docs
  docs
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .forEach(d => {
      if (!pollTimers[d.document_id]) {
        pollTimers[d.document_id] = setInterval(() => pollStatus(d.document_id), 2000);
      }
    });
}

// ── Scope select ──────────────────────────────────────────────────────────────
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

// ── Load documents ────────────────────────────────────────────────────────────
export async function loadDocuments() {
  const r = await fetchWithWakeupRetry(API + '/api/v1/documents/', {
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json();
  docs    = d.documents || [];
  renderDocs();
  updateScopeSelect();
}

// ── Poll status ───────────────────────────────────────────────────────────────
// Returns the updated doc object (for upload.js to update its status rows).
export async function pollStatus(id) {
  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/documents/' + id + '/status');
    const d = await r.json();
    const idx = docs.findIndex(x => x.document_id === id || x.id === id);
    if (idx !== -1) {
      docs[idx] = { ...docs[idx], ...d };
      renderDocs();
      updateScopeSelect();
    }
    if (d.status === 'ready' || d.status === 'failed') {
      clearInterval(pollTimers[id]);
      delete pollTimers[id];
      window._axonCheckHealth && window._axonCheckHealth();
    }
    return d;
  } catch {
    return null;
  }
}

// ── Delete document ───────────────────────────────────────────────────────────
export async function deleteDoc(id, e) {
  e?.stopPropagation();
  const doc = docs.find(d => d.document_id === id);
  const name = doc?.filename || 'this document';
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  // Optimistic remove
  docs = docs.filter(d => d.document_id !== id);
  renderDocs();
  updateScopeSelect();

  try {
    await fetchWithWakeupRetry(API + '/api/v1/documents/' + id, { method: 'DELETE' });
  } catch {
    showToast('Delete failed. Please retry.', 3000);
    // Reload to restore correct state
    loadDocuments().catch(() => {});
  }

  window._axonCheckHealth && window._axonCheckHealth();
}

// ── View document text ────────────────────────────────────────────────────────
export async function viewDocument(id, filename, e) {
  e?.stopPropagation();

  // Create or show reader panel
  let panel = document.getElementById('reader-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'reader-panel';
    panel.style.cssText = `
      position: fixed; top: 0; right: 0; width: min(560px, 100vw);
      height: 100vh; background: var(--bg-sidebar, #1a1a1a);
      border-left: 1px solid var(--border, #2d2d2d);
      z-index: 9000; display: flex; flex-direction: column;
      box-shadow: -8px 0 32px rgba(0,0,0,0.5);
      transform: translateX(100%); transition: transform 0.25s ease;
    `;
    document.body.appendChild(panel);
    // Animate in
    requestAnimationFrame(() => panel.style.transform = 'translateX(0)');
  } else {
    panel.style.transform = 'translateX(0)';
  }

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:16px 20px;border-bottom:1px solid var(--border,#2d2d2d);flex-shrink:0;">
      <div style="font-size:14px;font-weight:600;color:var(--text-primary,#fff);
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80%;"
        title="${filename}">${filename}</div>
      <button onclick="closeReader()" style="background:none;border:none;cursor:pointer;
        color:var(--text-secondary,#888);padding:4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div id="reader-content" style="flex:1;overflow-y:auto;padding:20px;
      font-size:13px;line-height:1.7;color:var(--text-secondary,#ccc);
      white-space:pre-wrap;word-break:break-word;">
      <span style="color:var(--text-tertiary,#666);">Loading…</span>
    </div>`;

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/documents/' + id + '/text');
    const d = await r.json();
    const content = document.getElementById('reader-content');
    if (!content) return;
    if (!r.ok) {
      content.textContent = 'Error: ' + (d.detail || 'Could not load text.');
    } else {
      content.textContent = d.full_text || '(No text available)';
    }
  } catch (err) {
    const content = document.getElementById('reader-content');
    if (content) content.textContent = 'Failed to load document text.';
  }
}

window.viewDocument = viewDocument;
window.closeReader  = function() {
  const panel = document.getElementById('reader-panel');
  if (panel) { panel.style.transform = 'translateX(100%)'; }
};
window.deleteDoc    = deleteDoc;
