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
    <button class="msg-action-btn" onclick="alert('Read aloud')" title="Speaker">
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
 * Append a formatted bot message with optional sources and provider badge.
 * @param {{ answer: string, sources?: Array, provider_used?: string }} data
 */
export function addBotMessage(data) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg bot';

  let sourcesHtml = '';
  if (data.sources && data.sources.length) {
    sourcesHtml = `<div class="sources">
      <div class="source-heading">Sources</div>
      ${data.sources.slice(0, 3).map((s, idx) => `
        <details class="source-item">
          <summary>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            ${escHtml(s.filename)}
            <span style="color:var(--text-secondary);font-weight:normal;font-size:12px;margin-left:auto;">Section ${s.chunk_id || idx + 1}</span>
          </summary>
          <div class="source-item-content">
            <div style="margin-bottom:8px;font-weight:500;color:var(--text-primary);">Relevance: ${(s.similarity * 100).toFixed(0)}%</div>
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

  const providerHtml = data.provider_used
    ? `<div class="provider-badge">via ${escHtml(data.provider_used)}</div>`
    : '';

  div.innerHTML = `<div class="msg-bubble">${formattedAnswer}</div>${sourcesHtml}${providerHtml}${getMessageActionsHtml()}`;
  msgs.appendChild(div);
  scrollBottom();
}

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
