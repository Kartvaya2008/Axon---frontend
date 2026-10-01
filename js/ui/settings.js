// js/ui/settings.js
// ─── Settings modal + theme management ───────────────────────────────────────

// ── Theme ────────────────────────────────────────────────────────────────────

/** Apply and persist the chosen theme. */
window.changeTheme = function() {
  const theme = document.getElementById('theme-select').value;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// Apply saved theme immediately (before DOMContentLoaded to avoid FOUC)
(function applyInitialTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  window.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('theme-select');
    if (sel) sel.value = saved;
  });
})();

// ── Modal ────────────────────────────────────────────────────────────────────

window.openSettingsModal = function() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('visible'));
};

window.closeSettingsModal = function(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
};
