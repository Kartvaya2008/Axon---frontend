// js/main.js
// ─── Application entry point ──────────────────────────────────────────────────
// Imports are resolved natively by the browser (ES modules, no build step).

import { API, fetchWithWakeupRetry } from './utils/api.js';
import { showToast }                  from './utils/helpers.js';
import {
  docs, loadDocuments, renderDocs, updateScopeSelect, deleteDoc
} from './ui/documents.js';
import { uploadFile }                 from './ui/upload.js';
import {
  addMessage, addBotMessage, addSimpleBotMessage, addTyping
} from './ui/chat.js';
import './ui/settings.js'; // side-effect: registers theme + modal handlers

// ── State ─────────────────────────────────────────────────────────────────────
let isBackendOffline = false;

// ── Health check ──────────────────────────────────────────────────────────────
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
// Expose so documents.js polling can trigger a health refresh
window._axonCheckHealth = checkHealth;

// ── Chat ──────────────────────────────────────────────────────────────────────
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
  const body = { question: q, top_k: 5 };
  if (scope) body.document_id = scope;

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/query/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    typingEl.remove();
    r.ok ? addBotMessage(d) : addSimpleBotMessage('Error: ' + (d.detail || 'Something went wrong.'));
  } catch {
    typingEl.remove();
    addSimpleBotMessage('Error: Cannot connect to the server. Please check your connection.');
  } finally {
    if (inputContainer) inputContainer.classList.remove('generating');
  }
};

// ── Sidebar & PDF pane toggles ────────────────────────────────────────────────
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (overlay) {
      if (!isCollapsed && window.innerWidth <= 768) {
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open-mobile');
      } else {
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open-mobile');
      }
    }
  }
};

window.togglePdfPane = function() {
  const pane = document.getElementById('pdf-pane');
  const btn  = document.getElementById('floating-pdf-toggle');
  if (!pane) return;
  pane.classList.toggle('collapsed');
  if (btn) btn.style.display = pane.classList.contains('collapsed') ? 'flex' : 'none';
};

// ── Expose globals needed by inline HTML handlers ─────────────────────────────
window.loadDocuments = loadDocuments;
window.deleteDoc     = deleteDoc;

// ── Boot ──────────────────────────────────────────────────────────────────────
checkHealth();
loadDocuments();
setInterval(checkHealth, 10000);
