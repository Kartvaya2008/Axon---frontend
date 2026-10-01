// js/ui/upload.js
// ─── File upload: validation, PDF preview, FormData POST ─────────────────────
import { API, fetchWithWakeupRetry } from '../utils/api.js';
import { showToast } from '../utils/helpers.js';
import { docs, pollTimers, renderDocs, updateScopeSelect, pollStatus } from './documents.js';

// ── PDF Preview ──────────────────────────────────────────────────────────────
function showPdfPreview(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const pane = document.getElementById('pdf-pane');
    const btn  = document.getElementById('floating-pdf-toggle');
    if (pane) {
      pane.classList.remove('collapsed');
      if (btn) btn.style.display = 'none';
      const content = pane.querySelector('.pdf-pane-content');
      if (content) {
        const pdfUrl = URL.createObjectURL(file);
        content.innerHTML = `<iframe src="${pdfUrl}#view=Fit" width="100%" height="100%" style="border:none;"></iframe>`;
        content.style.padding = '0';
      }
    }
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────
export async function uploadFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'txt'].includes(ext)) {
    alert('Only PDF and TXT files are supported.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('File too large. Max 10 MB.');
    return;
  }

  showToast('Uploading ' + file.name + '...', 100000);
  showPdfPreview(file);

  const form = new FormData();
  form.append('file', file);

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/documents/upload', { method: 'POST', body: form });
    const d = await r.json();
    if (r.ok) {
      showToast('Document uploaded successfully.', 3000);
      // Prepend to shared docs array
      docs.unshift({
        document_id: d.document_id,
        filename: d.filename,
        status: 'pending',
        chunk_count: null,
        created_at: new Date().toISOString()
      });
      renderDocs();
      updateScopeSelect();
      pollTimers[d.document_id] = setInterval(() => pollStatus(d.document_id), 2000);
    } else {
      showToast('Error: ' + (d.detail || 'Upload failed'), 4000);
    }
  } catch {
    showToast('Cannot connect to API.', 4000);
  }

  const fi = document.getElementById('file-input');
  if (fi) fi.value = '';
}

// ── Global event handler (called from HTML onchange) ─────────────────────────
window.handleFileSelect = function(e) {
  const file = e.target.files[0];
  if (file) uploadFile(file);
};
