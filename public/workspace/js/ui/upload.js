// js/ui/upload.js
// ─── Multi-file upload: validation, drag-and-drop, per-file status rows ───────
import { API, fetchWithWakeupRetry } from '../utils/api.js';
import { showToast } from '../utils/helpers.js';
import { docs, pollTimers, renderDocs, updateScopeSelect, pollStatus } from './documents.js';

const ALLOWED_EXTS   = ['pdf', 'txt', 'docx'];
const MAX_FILE_SIZE  = 10 * 1024 * 1024;  // 10 MB
const MAX_FILES      = 10;

// ── Upload status panel ───────────────────────────────────────────────────────
// A lightweight overlay in the input area showing per-file progress.
let _statusPanel = null;

function _getOrCreatePanel() {
  if (_statusPanel) return _statusPanel;
  _statusPanel = document.createElement('div');
  _statusPanel.id = 'upload-status-panel';
  _statusPanel.style.cssText = `
    position: fixed; bottom: 90px; right: 24px; z-index: 1000;
    width: 320px; max-height: 400px; overflow-y: auto;
    background: var(--bg-sidebar, #1a1a1a);
    border: 1px solid var(--border, #2d2d2d);
    border-radius: 10px; padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  `;
  document.body.appendChild(_statusPanel);
  return _statusPanel;
}

function _setFileRow(rowId, filename, state, detail) {
  const panel = _getOrCreatePanel();
  let row = document.getElementById(rowId);
  if (!row) {
    row = document.createElement('div');
    row.id = rowId;
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle,#222);font-size:13px;';
    panel.appendChild(row);
  }

  const icons = {
    uploading:  '⏳',
    queued:     '🔄',
    processing: '⚙️',
    ready:      '✅',
    failed:     '❌',
    rejected:   '⛔',
    error:      '⚠️',
  };
  const icon    = icons[state] || '·';
  const nameStr = filename.length > 24 ? filename.slice(0, 22) + '…' : filename;
  const detailStr = detail ? `<span style="color:var(--text-secondary,#888);font-size:11px;"> – ${detail.slice(0,60)}</span>` : '';

  row.innerHTML = `
    <span style="flex-shrink:0;">${icon}</span>
    <span style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
      ${nameStr}${detailStr}
    </span>`;
}

function _removePanel() {
  if (_statusPanel) {
    setTimeout(() => {
      if (_statusPanel) { _statusPanel.remove(); _statusPanel = null; }
    }, 4000);
  }
}

// ── Core upload logic ─────────────────────────────────────────────────────────

export async function uploadFiles(fileList) {
  const files = Array.from(fileList).slice(0, MAX_FILES);
  if (!files.length) return;

  // Client-side pre-validation
  const toUpload = [];
  for (const file of files) {
    const ext    = file.name.split('.').pop().toLowerCase();
    const rowId  = 'urow-' + Math.random().toString(36).slice(2);
    file._rowId  = rowId;

    if (!ALLOWED_EXTS.includes(ext)) {
      _setFileRow(rowId, file.name, 'rejected', `Unsupported type .${ext}`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      _setFileRow(rowId, file.name, 'rejected', 'File too large (max 10 MB)');
      continue;
    }
    if (file.size === 0) {
      _setFileRow(rowId, file.name, 'rejected', 'File is empty');
      continue;
    }
    _setFileRow(rowId, file.name, 'uploading');
    toUpload.push(file);
  }

  if (!toUpload.length) return;

  // Build FormData with all accepted files
  const form = new FormData();
  for (const file of toUpload) form.append('files', file);

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/documents/upload', {
      method: 'POST',
      body: form,
    });
    const d = await r.json();

    if (!r.ok) {
      for (const file of toUpload) {
        _setFileRow(file._rowId, file.name, 'error', d.detail || 'Upload failed');
      }
      return;
    }

    // Process per-file results
    const results = d.results || [];
    for (const res of results) {
      const file = toUpload.find(f => f.name === res.filename) || { _rowId: 'urow-' + res.filename, name: res.filename };
      const rowId = file._rowId || 'urow-' + res.filename;

      if (res.status === 'queued' && res.document_id) {
        _setFileRow(rowId, res.filename, 'queued');

        // Add to docs list immediately
        docs.unshift({
          document_id: res.document_id,
          filename:    res.filename,
          status:      'pending',
          chunk_count: null,
          error_detail: null,
          created_at:  new Date().toISOString(),
        });

        // Poll with UI row update on completion
        pollTimers[res.document_id] = setInterval(async () => {
          const updated = await pollStatus(res.document_id);
          if (updated) {
            const state = updated.status === 'ready'  ? 'ready'
                        : updated.status === 'failed' ? 'failed'
                        : 'processing';
            _setFileRow(rowId, res.filename, state,
              updated.status === 'failed' ? updated.error_detail : null
            );
            if (state === 'ready' || state === 'failed') {
              clearInterval(pollTimers[res.document_id]);
              delete pollTimers[res.document_id];
              _checkAllDone();
            }
          }
        }, 2000);

      } else {
        // rejected or error from server
        _setFileRow(rowId, res.filename, res.status || 'error', res.error);
      }
    }

    renderDocs();
    updateScopeSelect();

  } catch {
    for (const file of toUpload) {
      _setFileRow(file._rowId, file.name, 'error', 'Cannot connect to API');
    }
  }

  const fi = document.getElementById('file-input');
  if (fi) fi.value = '';
}

function _checkAllDone() {
  // Remove panel if no more in-progress rows
  const hasPending = Object.keys(pollTimers).length > 0;
  if (!hasPending) _removePanel();
}

// ── PDF preview (single file) ─────────────────────────────────────────────────
export function showPdfPreview(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) return;
  const pane = document.getElementById('pdf-pane');
  const btn  = document.getElementById('floating-pdf-toggle');
  if (!pane) return;
  pane.classList.remove('collapsed');
  if (btn) btn.style.display = 'none';
  const content = pane.querySelector('.pdf-pane-content');
  if (content) {
    const pdfUrl = URL.createObjectURL(file);
    content.innerHTML = `<iframe src="${pdfUrl}#view=Fit" width="100%" height="100%" style="border:none;"></iframe>`;
    content.style.padding = '0';
  }
}

// ── Drag-and-drop setup ───────────────────────────────────────────────────────
export function initDragDrop() {
  const zone = document.querySelector('.input-container') || document.getElementById('chat-area');
  if (!zone) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.outline = '2px dashed var(--text-secondary, #888)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.outline = '';
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.outline = '';
    const files = e.dataTransfer?.files;
    if (files?.length) {
      uploadFiles(files);
      if (files.length === 1) showPdfPreview(files[0]);
    }
  });
}

// ── Global event handlers (called from HTML) ──────────────────────────────────
window.handleFileSelect = function(e) {
  const files = e.target.files;
  if (files?.length) {
    uploadFiles(files);
    if (files.length === 1) showPdfPreview(files[0]);
  }
};
