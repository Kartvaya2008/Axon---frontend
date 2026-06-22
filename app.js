// ─── Configuration ──────────────────────────────────────────────────────────
const API = 'http://localhost:8000';
let docs = [];
let pollTimers = {};
let isBackendOffline = false;

// ─── Health & Status ─────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const r = await fetch(API + '/health', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    isBackendOffline = false;
    const el = document.getElementById('indexed-chunks');
    if (el) el.textContent = d.indexed_chunks || 0;
  } catch {
    isBackendOffline = true;
  }
}



// ─── Documents ───────────────────────────────────────────────────────────────
async function loadDocuments() {
  try {
    const r = await fetch(API + '/api/v1/documents/', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    docs = d.documents || [];
    renderDocs();
    updateScopeSelect();
  } catch {
    renderDocs();
  }
}

function renderDocs() {
  const list = document.getElementById('doc-list');
  const totalEl = document.getElementById('total-docs');
  if (totalEl) totalEl.textContent = docs.length;

  const pillsContainer = document.getElementById('docs-pills');
  if (pillsContainer) {
    pillsContainer.innerHTML = docs.slice(0, 10).map(doc => `
      <div class="doc-pill" title="${doc.filename}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>${doc.filename.length > 20 ? doc.filename.substring(0,20)+'...' : doc.filename}</span>
        <button class="doc-pill-remove" onclick="deleteDoc('${doc.document_id}', event)" title="Delete document">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }

  const totalStorageEl = document.getElementById('total-storage');
  if (totalStorageEl) {
    const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
    const mb = (totalChunks * 2) / 1024;
    totalStorageEl.textContent = mb.toFixed(2) + ' MB';
  }

  if (!docs.length) {
    list.innerHTML = '<div style="padding: 10px 28px; font-size: 13px; color: var(--text-secondary);">No documents yet.</div>';
    return;
  }
  list.innerHTML = docs.map(doc => {
    const label = {ready:'Ready',pending:'Pending',processing:'Processing...',failed:'Failed'}[doc.status] || doc.status;
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
      <button class="doc-delete" onclick="deleteDoc('${doc.document_id}',event)" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
  }).join('');

  docs.filter(d => d.status === 'pending' || d.status === 'processing').forEach(d => {
    if (!pollTimers[d.document_id]) {
      pollTimers[d.document_id] = setInterval(() => pollStatus(d.document_id), 2000);
    }
  });
}

function formatDate(ts) {
  if (!ts) return 'Added recently';
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return 'Added recently'; }
}

async function pollStatus(id) {
  try {
    const r = await fetch(API + '/api/v1/documents/' + id + '/status');
    const d = await r.json();
    const idx = docs.findIndex(x => x.document_id === id);
    if (idx !== -1) { docs[idx] = {...docs[idx], ...d}; renderDocs(); updateScopeSelect(); }
    if (d.status === 'ready' || d.status === 'failed') {
      clearInterval(pollTimers[id]); delete pollTimers[id]; checkHealth();
    }
  } catch {}
}

function updateScopeSelect() {
  const sel = document.getElementById('doc-scope');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Search all documents</option>' +
    docs.filter(d => d.status === 'ready').map(d =>
      `<option value="${d.document_id}">${d.filename}</option>`
    ).join('');
  sel.value = cur;
}

async function deleteDoc(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this document?')) return;
  try { await fetch(API + '/api/v1/documents/' + id, {method:'DELETE'}); } catch {}
  docs = docs.filter(d => d.document_id !== id);
  renderDocs(); updateScopeSelect(); checkHealth();
}

// ─── File Upload ──────────────────────────────────────────────────────────────
window.handleFileSelect = function(e) {
  const file = e.target.files[0];
  if (file) uploadFile(file);
};

function showToast(msg, duration=3000) {
  const toast = document.getElementById('upload-toast');
  if(!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

async function uploadFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','txt','docx'].includes(ext)) { alert('Only PDF, TXT and DOCX files are supported.'); return; }
  if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10 MB.'); return; }

  function showPdfPreview(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pane = document.getElementById('pdf-pane');
      const btn = document.getElementById('floating-pdf-toggle');
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

  showToast('Uploading ' + file.name + '...', 100000);
  showPdfPreview(file);

  const form = new FormData();
  form.append('file', file);
  try {
    const r = await fetch(API + '/api/v1/documents/upload', {method:'POST', body:form});
    const d = await r.json();
    if (r.ok) {
      showToast('Document uploaded successfully.', 3000);
      docs.unshift({document_id: d.document_id, filename: d.filename, status: 'pending', chunk_count: null, created_at: new Date().toISOString()});
      renderDocs(); updateScopeSelect();
      pollTimers[d.document_id] = setInterval(() => pollStatus(d.document_id), 2000);
    } else {
      showToast('Error: ' + (d.detail || 'Upload failed'), 4000);
    }
  } catch {
    showToast('Cannot connect to API.', 4000);
  }
  document.getElementById('file-input').value = '';
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
window.autoResize = function(textarea) {
  textarea.style.height = '24px';
  textarea.style.height = textarea.scrollHeight + 'px';
};

window.handleKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendQuestion(); }
};

window.useSuggest = function(q) {
  const inp = document.getElementById('question-input');
  inp.value = q;
  window.autoResize(inp);
  window.sendQuestion();
};

window.sendQuestion = async function() {
  const input = document.getElementById('question-input');
  const q = input.value.trim();
  if (!q) return;

  const inputArea = document.querySelector('.input-area');
  if (inputArea && !inputArea.classList.contains('chat-active')) {
    inputArea.classList.add('chat-active');
  }

  const inputContainer = document.querySelector('.input-container');
  if (inputContainer) inputContainer.classList.add('generating');

  // Removed hasReady check to allow normal text-to-text chat

  document.getElementById('empty-state')?.remove();

  addMessage('user', q);
  input.value = '';
  input.style.height = '24px';

  const chatArea = document.getElementById('chat-area');
  chatArea.scrollTop = chatArea.scrollHeight;

  if (isBackendOffline) {
    addSimpleBotMessage('Error: Cannot connect to the backend. Please ensure the server is running.');
    if (inputContainer) inputContainer.classList.remove('generating');
    return;
  }


  const typingEl = addTyping();
  const scope = document.getElementById('doc-scope').value;
  const body = {question: q, top_k: 5};
  if (scope) body.document_id = scope;

  try {
    const r = await fetch(API + '/api/v1/query/', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const d = await r.json();
    typingEl.remove();
    if (r.ok) {
      addBotMessage(d);
    } else {
      addSimpleBotMessage('Error: ' + (d.detail || 'Something went wrong.'));
    }
  } catch {
    typingEl.remove();
    addSimpleBotMessage('Error: Cannot connect to the server. Please check your connection.');
  } finally {
    if (inputContainer) inputContainer.classList.remove('generating');
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────
  
function addSimpleBotMessage(text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  let formatted = escHtml(text)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  if (!formatted.startsWith('<p>')) formatted = '<p>' + formatted + '</p>';
  div.innerHTML = `<div class="msg-bubble">${formatted}</div>${getMessageActionsHtml()}`;
  msgs.appendChild(div);
  document.getElementById('chat-area').scrollTop = 99999;
}

// ─── Message Rendering ────────────────────────────────────────────────────────
function addMessage(role, text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div>`;
  msgs.appendChild(div);
  document.getElementById('chat-area').scrollTop = 99999;
}

function addBotMessage(data) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  
  let sourcesHtml = '';
  if (data.sources && data.sources.length) {
    sourcesHtml = `<div class="sources">
      <div class="source-heading">Sources</div>
      ${data.sources.slice(0,3).map((s, idx) => `
        <details class="source-item">
          <summary>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            ${escHtml(s.filename)}
            <span style="color:var(--text-secondary);font-weight:normal;font-size:12px;margin-left:auto;">Section ${s.chunk_id || idx+1}</span>
          </summary>
          <div class="source-item-content">
            <div style="margin-bottom:8px;font-weight:500;color:var(--text-primary);">Relevance: ${(s.similarity*100).toFixed(0)}%</div>
            ${escHtml(s.text_preview || s.text || '')}
          </div>
        </details>
      `).join('')}
    </div>`;
  }

  let formattedAnswer = escHtml(data.answer)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  if (!formattedAnswer.startsWith('<p>')) formattedAnswer = '<p>' + formattedAnswer + '</p>';

  let providerHtml = '';
  if (data.provider_used) {
    providerHtml = `<div class="provider-badge">via ${escHtml(data.provider_used)}</div>`;
  }

  div.innerHTML = `<div class="msg-bubble">${formattedAnswer}</div>${sourcesHtml}${providerHtml}${getMessageActionsHtml()}`;
  msgs.appendChild(div);
  
  const chatArea = document.getElementById('chat-area');
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addTyping() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(div);
  
  const chatArea = document.getElementById('chat-area');
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

checkHealth();
loadDocuments();
setInterval(checkHealth, 10000);

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
};

window.togglePdfPane = function() {
  const pane = document.getElementById('pdf-pane');
  const btn = document.getElementById('floating-pdf-toggle');
  if (pane) {
    pane.classList.toggle('collapsed');
    if (btn) {
      btn.style.display = pane.classList.contains('collapsed') ? 'flex' : 'none';
    }
  }
};

function getMessageActionsHtml() {
  return `<div class="msg-actions">
    <button class="msg-action-btn" onclick="alert('Copy text')" title="Copy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
    <button class="msg-action-btn" onclick="alert('Read aloud')" title="Speaker">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
    </button>
    <button class="msg-action-btn" onclick="alert('Share')" title="Share">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
    </button>
  </div>`;
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
window.openSettingsModal = function() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }
};

window.closeSettingsModal = function(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
};

// ─── Theme Management ─────────────────────────────────────────────────────────
window.changeTheme = function() {
  const theme = document.getElementById('theme-select').value;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
window.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
});
