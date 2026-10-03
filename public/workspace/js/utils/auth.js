// public/workspace/js/utils/auth.js
// ─── Supabase Auth module ────────────────────────────────────────────────────
/* global supabase, SUPABASE_URL, SUPABASE_ANON_KEY */

// ── 1. Safe storage wrapper ───────────────────────────────────────────────────
// Edge Tracking Prevention blocks third-party storage. We catch every access
// and fall back to in-memory so the Supabase client never throws on boot.
const _safeStorage = (() => {
  const mem = new Map();
  const tryLocal = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
  return {
    getItem:    (k) => tryLocal(() => localStorage.getItem(k),    mem.get(k) ?? null),
    setItem:    (k, v) => { tryLocal(() => localStorage.setItem(k, v)); mem.set(k, v); },
    removeItem: (k) => { tryLocal(() => localStorage.removeItem(k));    mem.delete(k); },
  };
})();

// ── 2. Supabase client ────────────────────────────────────────────────────────
// IMPORTANT: create the client BEFORE touching the URL, so that
// detectSessionInUrl:true can read window.location.search internally.
let _client;
try {
  _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage:            _safeStorage,
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,   // reads ?code= / #access_token NOW
    },
  });
} catch (err) {
  console.error('[auth] Failed to create Supabase client:', err);
}

// ── 3. Module state ───────────────────────────────────────────────────────────
let _session  = null;
let _ready    = false;
const _readyCbs = [];

function _notifyReady() {
  if (_ready) return;
  _ready = true;
  _readyCbs.forEach(cb => { try { cb(_session); } catch (e) { console.error('[auth] onAuthReady cb error:', e); } });
}

// ── 4. Error display ──────────────────────────────────────────────────────────
function _showAuthError(msg) {
  try {
    const el = document.getElementById('login-error');
    if (!el) return;
    let readable = msg || 'Sign-in failed. Please try again.';
    try { readable = decodeURIComponent(readable.replace(/\+/g, ' ')); } catch {}
    if (readable.length > 200) readable = readable.slice(0, 200) + '…';
    el.textContent = readable;
    el.style.display = 'block';
  } catch {}
}

// ── 5. Sidebar profile ────────────────────────────────────────────────────────
function _renderProfile(session) {
  try {
    const user = session?.user;
    if (!user) return;
    const name    = user.user_metadata?.full_name || user.user_metadata?.name
                 || user.email?.split('@')[0] || 'User';
    const email   = user.email || '';
    const avatar  = user.user_metadata?.avatar_url || null;
    const initial = (name || '?').charAt(0).toUpperCase();
    const el = document.getElementById('sidebar-profile');
    if (!el) return;
    el.innerHTML = `
      <div id="profile-row" onclick="toggleProfileMenu()" style="
        display:flex;align-items:center;gap:10px;padding:10px 16px;
        cursor:pointer;border-radius:8px;transition:background 0.15s;"
        onmouseenter="this.style.background='var(--bg-hover)'"
        onmouseleave="this.style.background='transparent'">
        <div style="width:32px;height:32px;border-radius:50%;background:#3a3a3a;
          flex-shrink:0;overflow:hidden;display:flex;align-items:center;
          justify-content:center;font-size:14px;font-weight:600;color:#fff;">
          ${avatar ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;"
              onerror="this.parentElement.textContent='${initial}'">` : initial}
        </div>
        <div style="min-width:0;flex:1;overflow:hidden;">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
          <div style="font-size:11px;color:var(--text-secondary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${email}</div>
        </div>
      </div>
      <div id="profile-menu" style="display:none;margin:0 8px 8px;
        border-top:1px solid var(--border-subtle);padding-top:6px;">
        <button onclick="signOut()" style="width:100%;text-align:left;padding:8px 12px;
          background:transparent;border:none;cursor:pointer;font-size:13px;
          color:var(--text-secondary);border-radius:6px;transition:background 0.15s;"
          onmouseenter="this.style.background='var(--bg-hover)'"
          onmouseleave="this.style.background='transparent'">Log out</button>
      </div>`;
  } catch (err) {
    console.warn('[auth] _renderProfile error:', err);
  }
}

window.toggleProfileMenu = function () {
  try {
    const m = document.getElementById('profile-menu');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
  } catch {}
};

document.addEventListener('click', (e) => {
  try {
    const row  = document.getElementById('profile-row');
    const menu = document.getElementById('profile-menu');
    if (menu && menu.style.display !== 'none' && row && !row.contains(e.target)) {
      menu.style.display = 'none';
    }
  } catch {}
});

// ── 6. Show/hide helpers ──────────────────────────────────────────────────────
function _showLogin(errorMsg) {
  try {
    const ls = document.getElementById('login-screen');
    const as = document.getElementById('app-shell');
    if (ls) ls.style.display = 'flex';
    if (as) as.style.display = 'none';   // explicit none
    if (errorMsg) _showAuthError(errorMsg);
  } catch {}
}

function _showApp(session) {
  // BUG FIX: must set an explicit display value, NOT '' (empty string).
  // Setting '' removes the inline style and the CSS default "display:none" wins.
  // The app-shell needs flex to lay out sidebar + main side by side.
  try {
    const ls = document.getElementById('login-screen');
    const as = document.getElementById('app-shell');
    if (ls) ls.style.display = 'none';
    if (as) as.style.display = 'flex';   // explicit flex — never ''
    _renderProfile(session);
  } catch (err) {
    console.error('[auth] _showApp error:', err);
    // Last-resort: force-show shell even if profile render failed
    try {
      const as = document.getElementById('app-shell');
      const ls = document.getElementById('login-screen');
      if (as) as.style.display = 'flex';
      if (ls) ls.style.display = 'none';
    } catch {}
  }
}

// ── 7. URL cleanup ────────────────────────────────────────────────────────────
// IMPORTANT: called AFTER getSession() resolves successfully, NOT before.
// Calling it before strips ?code= from window.location before Supabase
// can read it for the PKCE exchange, breaking the login return.
function _cleanUrl() {
  try {
    const url = new URL(window.location.href);
    const qErr     = url.searchParams.get('error');
    const qErrDesc = url.searchParams.get('error_description');
    ['code', 'error', 'error_description', 'error_code', 'state'].forEach(p =>
      url.searchParams.delete(p)
    );
    // Remove hash fragment (implicit-flow tokens)
    url.hash = '';
    const clean = url.pathname + (url.search === '?' ? '' : url.search);
    window.history.replaceState({}, '', clean || window.location.pathname);
    return { qErr, qErrDesc };
  } catch {
    return {};
  }
}

// ── 8. Boot sequence ──────────────────────────────────────────────────────────
// Read any OAuth error from URL BEFORE we wipe it, but don't wipe yet.
let _pendingUrlError = null;
try {
  const url = new URL(window.location.href);
  const qErr     = url.searchParams.get('error');
  const qErrDesc = url.searchParams.get('error_description');
  if (qErr || qErrDesc) {
    _pendingUrlError = qErrDesc || qErr;
  }
} catch {}

if (!_client) {
  _notifyReady();
  _showLogin('Failed to initialise auth. Check browser console.');
} else {
  // Subscribe to auth state changes
  try {
    _client.auth.onAuthStateChange((event, session) => {
      try {
        _session = session;
        _notifyReady();
        if (event === 'SIGNED_IN')  _showApp(session);
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') _showLogin();
      } catch (err) {
        console.error('[auth] onAuthStateChange error:', err);
      }
    });
  } catch (err) {
    console.error('[auth] onAuthStateChange setup error:', err);
  }

  // Get/exchange session — URL is cleaned AFTER this resolves
  (async () => {
    try {
      const { data: { session }, error } = await _client.auth.getSession();

      // NOW clean the URL (code already exchanged or not needed)
      _cleanUrl();

      if (error) {
        console.error('[auth] getSession error:', error.message);
        _session = null;
        _notifyReady();
        _showLogin(error.message);
        return;
      }

      _session = session;
      _notifyReady();

      if (session) {
        _showApp(session);
      } else {
        _showLogin(_pendingUrlError);
      }
    } catch (err) {
      console.error('[auth] getSession threw:', err);
      _cleanUrl();
      _notifyReady();
      _showLogin('Unexpected error. Please refresh.');
    }
  })();
}

// ── 9. Public API ─────────────────────────────────────────────────────────────
export function getToken() {
  return _session?.access_token ?? null;
}

export function getCurrentUser() {
  if (!_session?.user) return null;
  return { id: _session.user.id, email: _session.user.email };
}

export async function signInWithGoogle() {
  try {
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';
    const { error } = await _client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
    if (error) {
      console.error('[auth] signInWithGoogle error:', error.message);
      _showAuthError(error.message);
    }
  } catch (err) {
    console.error('[auth] signInWithGoogle threw:', err);
    _showAuthError('Could not start sign-in. Please try again.');
  }
}

export async function refreshSession() {
  try {
    if (!_client) return null;
    const { data: { session }, error } = await _client.auth.refreshSession();
    if (error || !session) return null;
    _session = session;
    return session;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    const menu = document.getElementById('profile-menu');
    if (menu) menu.style.display = 'none';
    if (_client) await _client.auth.signOut();
    _session = null;
    // _showLogin() called by onAuthStateChange(SIGNED_OUT)
  } catch (err) {
    console.error('[auth] signOut error:', err);
    _showLogin();
  }
}

export function onAuthReady(cb) {
  if (_ready) { try { cb(_session); } catch {} }
  else _readyCbs.push(cb);
}

// Expose for inline onclick handlers
window.signInWithGoogle = signInWithGoogle;
window.signOut          = signOut;
