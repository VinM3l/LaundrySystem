// ─── AUTH ─────────────────────────────────────────────────────────────────────
// Change passwords here. Plain text is fine for a local internal tool.
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNTS = {
  owner: { password: 'owner123', role: 'owner', label: 'Owner' },
  staff: { password: 'staff123', role: 'staff', label: 'Staff'  },
};

const ROLE_PAGES = {
  owner: ['dashboard', 'receipts', 'expenses'],
  staff: ['dashboard', 'receipts'],
};

let currentUser = null;

function loadSession() {
  try { const s = sessionStorage.getItem('laundry_session'); if (s) currentUser = JSON.parse(s); } catch(e) {}
}
function saveSession() {
  try { sessionStorage.setItem('laundry_session', JSON.stringify(currentUser)); } catch(e) {}
}
function clearSession() {
  currentUser = null;
  try { sessionStorage.removeItem('laundry_session'); } catch(e) {}
}

function isOwner()       { return currentUser?.role === 'owner'; }
function canAccess(page) { return ROLE_PAGES[currentUser?.role]?.includes(page) ?? false; }

function tryLogin() {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const account  = ACCOUNTS[username];

  if (!account || account.password !== password) {
    errEl.textContent = 'Incorrect username or password.';
    errEl.style.display = 'block';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
    return;
  }

  currentUser = { username, role: account.role, label: account.label };
  saveSession();
  showApp();
}

function logout() {
  clearSession();
  showLogin();
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appShell').style.display    = 'none';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').style.display = 'none';
  setTimeout(() => document.getElementById('loginUsername').focus(), 50);
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display    = 'flex';
  applyRoleUI();
  initApp();
}

function applyRoleUI() {
  document.getElementById('sessionUser').textContent = currentUser.label;
  document.getElementById('sessionAvatar').textContent = currentUser.label[0].toUpperCase();
  document.getElementById('sessionRole').textContent = currentUser.role === 'owner' ? '🛡 Owner' : '👤 Staff';

  // Hide expenses nav from staff
  const expNav = document.getElementById('nav-expenses');
  if (expNav) expNav.style.display = isOwner() ? '' : 'none';
}

function guardedShowPage(page, el) {
  if (!canAccess(page)) {
    toast('🚫 You don\'t have access to that page.');
    return;
  }
  showPage(page, el);
}

// Boot on load
document.addEventListener('DOMContentLoaded', () => {
  // Enter key on login
  ['loginPassword','loginUsername'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  });
  loadSession();
  if (currentUser) { showApp(); } else { showLogin(); }
});
