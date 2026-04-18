// ─── AUTH — Login & Role Access Control ──────────────────────────────────────
//
// ROLES:
//   owner  → full access to everything
//   staff  → add transactions only (no expenses, no summary financials, no delete)
//
// TO CHANGE PASSWORDS: edit the ACCOUNTS object below.
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNTS = {
  owner: { password: 'owner123', role: 'owner', label: 'Owner' },
  staff: { password: 'staff123', role: 'staff', label: 'Staff' },
};

const ROLE_PAGES = {
  owner: ['dashboard', 'calendar', 'receipts', 'expenses'],
  staff: ['dashboard', 'receipts'],
};

let currentUser = null;

function loadSession() {
  try { const s = sessionStorage.getItem('Laundry_session'); if (s) currentUser = JSON.parse(s); } catch(e) {}
}
function saveSession() {
  try { sessionStorage.setItem('Laundry_session', JSON.stringify(currentUser)); } catch(e) {}
}
function clearSession() {
  currentUser = null;
  try { sessionStorage.removeItem('Laundry_session'); } catch(e) {}
}

function isOwner()       { return currentUser?.role === 'owner'; }
function canAccess(page) { return ROLE_PAGES[currentUser?.role]?.includes(page) ?? false; }

function tryLogin() {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');

  const account = ACCOUNTS[username];
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
  document.getElementById('sessionRole').textContent = currentUser.role === 'owner' ? '🛡 Owner' : '👤 Staff';

  // Hide owner-only nav items from staff
  const ownerOnly = ['nav-expenses', 'nav-calendar'];
  ownerOnly.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isOwner() ? '' : 'none';
  });
}

function guardedShowPage(page, el) {
  if (!canAccess(page)) {
    toast('🚫 You don\'t have access to that page');
    return;
  }
  showPage(page, el);
}

function bootAuth() {
  loadSession();
  if (currentUser) { showApp(); } else { showLogin(); }
}

document.addEventListener('DOMContentLoaded', () => {
  const pw = document.getElementById('loginPassword');
  if (pw) pw.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  const un = document.getElementById('loginUsername');
  if (un) un.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  bootAuth();
});
