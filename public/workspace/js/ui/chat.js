// js/ui/chat.js
// ─── Chat rendering: messages, typing indicator, message actions ──────────────
import { escHtml } from '../utils/helpers.js';

// ── Internal helpers ─────────────────────────────────────────────────────────

function scrollBottom() {
  const chatArea = document.getElementById('chat-area');
  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
}

function getMessageActionsHtml() {
  return `<div class="msg-actions">
    <button class="msg-action-btn" onclick="copyLastMessage(this)" title="Copy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
    <button class="msg-action-btn speaker-btn" onclick="window.playAudioForMsg(this)" title="Read aloud">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
    </button>
    <button class="msg-action-btn" onclick="alert('Share')" title="Share">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
    </button>
  </div>`;
}

// ── Exported rendering functions ─────────────────────────────────────────────

/**
 * Append a user or bot message bubble to the messages list.
 * @param {'user'|'bot'} role
 * @param {string} text
 */
export function addMessage(role, text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div>`;
  msgs.appendChild(div);
  scrollBottom();
}

/**
 * Append a formatted bot message with optional sources and execution trace.
 * @param {{ answer: string, sources?: Array, provider_used?: string, trace?: Array }} data
 */
export function addBotMessage(data) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';

  let sourcesHtml = '';
  if (data.sources && data.sources.length) {
    sourcesHtml = `<div class="sources" style="margin-top: 12px;">
      <details class="source-item" style="border: 1px solid var(--border,#333); border-radius: 6px;">
        <summary style="cursor:pointer; padding: 6px 12px; font-weight: 500; font-size: 13px; color: var(--text-secondary,#aaa);">
          Sources (${data.sources.length})
        </summary>
        <div class="source-item-content" style="padding: 10px 12px; border-top: 1px solid var(--border,#333); background: var(--bg-sidebar,#1a1a1a);">
          ${data.sources.map((s, idx) => {
            const pageLabel = s.page ? `Page ${s.page}` : `Section ${s.chunk_id || idx + 1}`;
            const simPercent = s.similarity != null ? (s.similarity * 100).toFixed(0) + '%' : 'N/A';
            return `
            <div style="margin-bottom: 8px; font-size: 12.5px;">
              <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--text-primary,#fff);">
                <span>${escHtml(s.filename)} (${escHtml(pageLabel)})</span>
                <span style="color:var(--text-secondary,#888);">${simPercent}</span>
              </div>
              <div style="color:var(--text-secondary,#aaa); margin-top:2px; font-size:12px;">
                ${escHtml(s.text_preview || s.text || '')}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </details>
    </div>`;
  }

  let formattedAnswer = escHtml(data.answer)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  if (!formattedAnswer.startsWith('<p>')) formattedAnswer = '<p>' + formattedAnswer + '</p>';

  // Attach trace modal trigger if trace exists
  let traceHtml = '';
  if (data.trace && data.trace.length) {
    const traceId = 'trace-' + Math.random().toString(36).slice(2);
    window['_axonTraces'] = window['_axonTraces'] || {};
    window['_axonTraces'][traceId] = data.trace;

    traceHtml = `
      <div style="margin-top: 8px; font-size: 12px;">
        <button onclick="window._showTraceModal('${traceId}')" style="background:none; border:none; color:var(--text-secondary,#888); text-decoration:underline; cursor:pointer; padding:0;">
          View steps (${data.trace.length} steps)
        </button>
      </div>
    `;
  }

  div.innerHTML = `<div class="msg-bubble">${formattedAnswer}</div>${sourcesHtml}${traceHtml}${getMessageActionsHtml()}`;
  msgs.appendChild(div);
  scrollBottom();
}

// ── Global Trace Modal Viewer ──────────────────────────────────────────────────
window._showTraceModal = function(traceId) {
  const trace = window['_axonTraces']?.[traceId];
  if (!trace) return;

  let modal = document.getElementById('trace-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trace-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }

  const stepsHtml = trace.map((s, idx) => `
    <div style="padding: 10px 0; border-bottom: 1px solid var(--border,#333);">
      <div style="display:flex; justify-content:space-between; font-weight:600; font-size:13px; color:var(--text-primary,#fff);">
        <span>${escHtml(s.name)}</span>
        ${s.time_ms != null ? `<span style="color:var(--text-secondary,#888); font-size:12px;">${s.time_ms.toFixed(1)} ms</span>` : ''}
      </div>
      <div style="font-size:12.5px; color:var(--text-secondary,#aaa); margin-top:4px;">
        ${escHtml(s.details)}
      </div>
    </div>
  `).join('');

  modal.innerHTML = `
    <div style="background:var(--bg-sidebar,#1a1a1a); border:1px solid var(--border,#333); border-radius:10px; width:450px; max-width:90vw; padding:20px; box-shadow:0 8px 32px rgba(0,0,0,0.5);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; font-size:16px; font-weight:600; color:var(--text-primary,#fff);">Execution Steps</h3>
        <button onclick="document.getElementById('trace-modal').style.display='none'" style="background:none; border:none; color:var(--text-secondary,#888); font-size:18px; cursor:pointer;">&times;</button>
      </div>
      <div style="max-height:350px; overflow-y:auto;">${stepsHtml}</div>
    </div>
  `;
  modal.style.display = 'flex';
};

/**
 * Append a plain bot message (errors, system notices).
 * @param {string} text
 */
export function addSimpleBotMessage(text) {
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
  scrollBottom();
}

/**
 * Append an animated typing indicator and return the element for removal.
 * @returns {HTMLElement}
 */
export function addTyping() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(div);
  scrollBottom();
  return div;
}
