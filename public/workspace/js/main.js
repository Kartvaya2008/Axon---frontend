// js/main.js
// ─── Application entry point ──────────────────────────────────────────────────
// Imports are resolved natively by the browser (ES modules, no build step).

import { API, fetchWithWakeupRetry } from './utils/api.js';
import { showToast }                  from './utils/helpers.js';
import { onAuthReady }                from './utils/auth.js';
import {
  docs, loadDocuments, renderDocs, updateScopeSelect, deleteDoc
} from './ui/documents.js';
import { uploadFiles, initDragDrop } from './ui/upload.js';
import {
  addMessage, addBotMessage, addSimpleBotMessage, addTyping
} from './ui/chat.js';
import './ui/settings.js'; // side-effect: registers theme + modal handlers

// ── State ─────────────────────────────────────────────────────────────────────
let isBackendOffline = false;
/** Conversation history for context: [{role:'user'|'assistant', content:string}] */
let chatHistory = [];

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
    addSimpleBotMessage('Could not reach the server. Please check your connection and try again.');
    if (inputContainer) inputContainer.classList.remove('generating');
    return;
  }

  const typingEl = addTyping();
  const scope = document.getElementById('doc-scope').value;

  // Send last 12 messages (6 turns) as history
  const historyToSend = chatHistory.slice(-12);

  const body = { question: q, top_k: 7, history: historyToSend };
  if (scope) body.document_id = scope;

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/query/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    typingEl.remove();
    if (r.ok) {
      // Add user turn then assistant turn to history
      chatHistory.push({ role: 'user', content: q });
      chatHistory.push({ role: 'assistant', content: d.answer || '' });
      // Keep at most 20 turns
      if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
      addBotMessage(d);
    } else {
      addSimpleBotMessage('Error: ' + (d.detail || 'Something went wrong.'));
    }
  } catch {
    typingEl.remove();
    addSimpleBotMessage('Could not reach the server. Please check your connection.');
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

// ── Voice / Speech Handlers ───────────────────────────────────────────────────
let currentAudio = null;
let currentAudioBtn = null;

window.playAudioForMsg = async function(btn) {
  const msgEl = btn.closest('.msg');
  if (!msgEl) return;
  const bubble = msgEl.querySelector('.msg-bubble');
  if (!bubble) return;
  const text = bubble.innerText.trim();
  if (!text) return;

  // Toggle stop if already playing this message
  if (currentAudio && currentAudioBtn === btn) {
    currentAudio.pause();
    currentAudio = null;
    currentAudioBtn = null;
    btn.style.opacity = '1';
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    if (currentAudioBtn) currentAudioBtn.style.opacity = '1';
  }

  btn.style.opacity = '0.5';
  currentAudioBtn = btn;

  try {
    const r = await fetchWithWakeupRetry(API + '/api/v1/speech/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 3000) })
    });

    if (r.status === 501) {
      showToast('Voice is not set up yet');
      btn.style.opacity = '1';
      return;
    }

    if (!r.ok) {
      showToast('Failed to synthesize speech');
      btn.style.opacity = '1';
      return;
    }

    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      btn.style.opacity = '1';
      currentAudio = null;
      currentAudioBtn = null;
    };
    audio.play();
  } catch (err) {
    console.error('TTS failed:', err);
    showToast('Failed to synthesize speech');
    btn.style.opacity = '1';
  }
};

let mediaRecorder = null;
let audioChunks = [];

window.toggleVoiceRecord = async function() {
  const micBtn = document.getElementById('mic-btn');
  const input = document.getElementById('question-input');

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    if (micBtn) micBtn.style.color = '';
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Audio recording is not supported in this browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      showToast('Transcribing audio...');
      try {
        const r = await fetchWithWakeupRetry(API + '/api/v1/speech/stt', {
          method: 'POST',
          body: formData
        });

        if (r.status === 501) {
          showToast('Voice is not set up yet');
          return;
        }

        if (!r.ok) {
          showToast('Failed to transcribe audio');
          return;
        }

        const data = await r.json();
        if (data.text) {
          input.value = data.text;
          window.autoResize(input);
        }
      } catch (err) {
        console.error('STT failed:', err);
        showToast('Failed to transcribe audio');
      }
    };

    mediaRecorder.start();
    if (micBtn) micBtn.style.color = '#ef4444';
    showToast('Recording... click mic again to stop');
  } catch (err) {
    console.error('Microphone permission denied / error:', err);
    showToast('Microphone access denied or unavailable.');
  }
};

// ── Expose globals needed by inline HTML handlers ─────────────────────────────
window.loadDocuments = loadDocuments;
window.deleteDoc     = deleteDoc;

// ── Boot ──────────────────────────────────────────────────────────────────────
onAuthReady((session) => {
  if (!session) return;

  // Show health status in background — never block UI
  checkHealth().catch(() => { isBackendOffline = true; });

  // Initialize drag & drop uploading
  initDragDrop();

  // Load documents; show inline error in doc list if it fails, never crash
  loadDocuments().catch(err => {
    console.error('[main] loadDocuments failed:', err);
    const list = document.getElementById('doc-list');
    if (list) list.innerHTML =
      '<div style="padding:10px 28px;font-size:13px;color:#e05a5a;">Could not load documents. Check your connection.</div>';
  });
});

// Periodic health ping — only when app is visible
setInterval(() => {
  try {
    const as = document.getElementById('app-shell');
    if (as && as.style.display !== 'none') checkHealth().catch(() => {});
  } catch {}
}, 10000);
