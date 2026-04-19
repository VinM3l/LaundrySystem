// ═══════════════════════════════════════════════════
//  LAUNDRY — app.js
//  localStorage · no backend yet
// ═══════════════════════════════════════════════════

const PRICES     = { wash: 100, dry: 90, rush: 50, extraPerLoad: 20 };
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

// ── DATA ──────────────────────────────────────────
function loadData() {
  try { const s = localStorage.getItem('laundry_data'); if (s) return JSON.parse(s); } catch(e) {}
  return { transactions: [], expenses: [] };
}
function saveData() {
  try { localStorage.setItem('laundry_data', JSON.stringify(DB)); } catch(e) {}
}

let DB = loadData();
if (!DB.transactions) DB.transactions = [];
if (!DB.expenses)     DB.expenses     = [];

// ── TOAST ─────────────────────────────────────────
function toast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

// ── INIT ──────────────────────────────────────────
function initApp() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tDate').value = today;
  document.getElementById('eDate').value = today;
  document.getElementById('sidebarDate').textContent =
    new Date().toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  updateWeekday();
  calcPrice();
  showPage('dashboard', document.getElementById('nav-dashboard'));
}

// ── PAGES ─────────────────────────────────────────
function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');

  const titles = { dashboard:'Dashboard', receipts:'Receipts', expenses:'Expenses' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  closeSidebar();

  if (page === 'dashboard') renderDashboard();
  if (page === 'receipts')  { populateMonthFilter(); renderReceipts(); }
  if (page === 'expenses')  renderExpenses();
}

// ── SIDEBAR ───────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sbOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('open');
}

// ── TRANSACTION MODAL ─────────────────────────────
function openTxModal() {
  document.getElementById('txOverlay').classList.add('open');
  setTimeout(() => document.getElementById('tCustomer').focus(), 100);
}
function closeTxModal() {
  document.getElementById('txOverlay').classList.remove('open');
}
function handleTxOverlayClick(e) {
  if (e.target === document.getElementById('txOverlay')) closeTxModal();
}

// ── CALENDAR MODAL ────────────────────────────────
function openCalModal() {
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  renderCalendar();
  document.getElementById('calOverlay').classList.add('open');
}
function closeCalModal() {
  document.getElementById('calOverlay').classList.remove('open');
  closeDayPanel();
}
function handleCalOverlayClick(e) {
  if (e.target === document.getElementById('calOverlay')) closeCalModal();
}

// ── PRICE CALC ────────────────────────────────────
function calcPrice() {
  const loads = parseInt(document.getElementById('tLoads').value) || 1;
  const rush  = parseInt(document.getElementById('tRush').value);
  const pload = parseInt(document.getElementById('tPload').value);
  const half  = parseInt(document.getElementById('tHalf').value);

  let total = loads * (PRICES.wash + PRICES.dry);
  if (rush)  total += PRICES.rush;
  if (pload) total += loads * PRICES.extraPerLoad;
  if (half)  total = total / 2;

  document.getElementById('priceDisplay').textContent = '₱' + total.toLocaleString();
  let parts = [`${loads} load${loads > 1 ? 's' : ''} × ₱${PRICES.wash + PRICES.dry}`];
  if (rush)  parts.push('rush +₱50');
  if (pload) parts.push(`extra +₱${loads * PRICES.extraPerLoad}`);
  if (half)  parts.push('half price');
  document.getElementById('priceBreakdown').textContent = parts.join('  ·  ');
  return total;
}

function updateWeekday() {
  const d = document.getElementById('tDate').value;
  if (!d) return;
  document.getElementById('tWeekday').value =
    ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(d + 'T00:00:00').getDay()];
}

// ── ADD TRANSACTION ───────────────────────────────
function addTransaction() {
  const customer = document.getElementById('tCustomer').value.trim();
  if (!customer) { toast('⚠️ Please enter a customer name.'); return; }

  const total = calcPrice();
  const paid  = parseInt(document.getElementById('tPaid').value);

  DB.transactions.unshift({
    id:       Date.now(),
    date:     document.getElementById('tDate').value,
    weekday:  document.getElementById('tWeekday').value,
    staff:    document.getElementById('tIncharge').value,
    customer,
    weight:   parseFloat(document.getElementById('tWeight').value) || 0,
    machine:  document.getElementById('tMachine').value,
    loads:    parseInt(document.getElementById('tLoads').value) || 1,
    rush:     parseInt(document.getElementById('tRush').value),
    pload:    parseInt(document.getElementById('tPload').value),
    half:     parseInt(document.getElementById('tHalf').value),
    notes:    document.getElementById('tNotes').value,
    total, pay: parseFloat(document.getElementById('tPay').value) || 0,
    paid, datePaid: paid ? document.getElementById('tDate').value : ''
  });

  saveData();
  closeTxModal();
  resetTxForm();
  toast('✅ Transaction saved.');

  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage === 'dashboard') renderDashboard();
  if (activePage === 'receipts')  renderReceipts();
}

function resetTxForm() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tDate').value     = today;
  document.getElementById('tIncharge').value = '';
  document.getElementById('tCustomer').value = '';
  document.getElementById('tWeight').value   = '';
  document.getElementById('tMachine').value  = '';
  document.getElementById('tLoads').value    = 1;
  document.getElementById('tRush').value     = 0;
  document.getElementById('tPload').value    = 0;
  document.getElementById('tHalf').value     = 0;
  document.getElementById('tNotes').value    = '';
  document.getElementById('tPay').value      = '';
  document.getElementById('tPaid').value     = 0;
  updateWeekday(); calcPrice();
}

function markPaid(id) {
  const tx = DB.transactions.find(t => t.id === id);
  if (!tx) return;
  tx.paid = 1; tx.datePaid = new Date().toISOString().split('T')[0];
  saveData(); toast('✅ Marked as paid.');
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage === 'dashboard') renderDashboard();
  if (activePage === 'receipts')  renderReceipts();
}

function deleteTx(id) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return;
  DB.transactions = DB.transactions.filter(t => t.id !== id);
  saveData(); toast('🗑 Deleted.');
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage === 'dashboard') renderDashboard();
  if (activePage === 'receipts')  renderReceipts();
}

// ══════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════
function renderDashboard() {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const monthTx = DB.transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const revenue  = monthTx.filter(t => t.paid).reduce((s, t) => s + t.total, 0);
  const pending  = monthTx.filter(t => !t.paid).reduce((s, t) => s + t.total, 0);
  const expTotal = DB.expenses
    .filter(e => { if (!e.date) return false; const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; })
    .reduce((s, e) => s + e.amount * e.qty, 0);
  const net = revenue - expTotal;

  // Stats
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Revenue · ${MONTH_NAMES[month]}</div>
      <div class="stat-val">₱${revenue.toLocaleString()}</div>
      <div class="stat-sub">Paid transactions</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending</div>
      <div class="stat-val" style="color:var(--amber)">₱${pending.toLocaleString()}</div>
      <div class="stat-sub">Unpaid this month</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expenses</div>
      <div class="stat-val">₱${expTotal.toLocaleString()}</div>
      <div class="stat-sub">${MONTH_NAMES[month]}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Net Profit</div>
      <div class="stat-val" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}">₱${net.toLocaleString()}</div>
      <div class="stat-sub">Revenue − Expenses</div>
    </div>
  `;

  // Unpaid
  const unpaid = DB.transactions.filter(t => !t.paid);
  document.getElementById('unpaidCount').textContent = unpaid.length;
  document.getElementById('unpaidBody').innerHTML = unpaid.length
    ? unpaid.map(t => `
        <tr>
          <td style="font-weight:600;">${t.customer}</td>
          <td class="muted">${t.date || '—'}</td>
          <td class="mono">₱${t.total.toLocaleString()}</td>
          <td><button class="btn btn-sm" onclick="markPaid(${t.id})">Mark paid</button></td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align:center;padding:28px 12px;color:var(--text3);">All caught up — no unpaid transactions.</td></tr>';

  // Recent (last 8)
  const recent   = DB.transactions.slice(0, 8);
  const recentEl = document.getElementById('recentList');
  recentEl.innerHTML = recent.length
    ? recent.map(t => `
        <div class="recent-item">
          <div>
            <div class="recent-name">${t.customer}</div>
            <div class="recent-meta">${t.date || ''}${t.staff ? ' · ' + t.staff : ''} · ${t.loads} load${t.loads > 1 ? 's' : ''}</div>
          </div>
          <div>
            <div class="recent-amt">₱${t.total.toLocaleString()}</div>
            <div class="recent-status"><span class="badge ${t.paid ? 'badge-paid' : 'badge-unpaid'}">${t.paid ? 'Paid' : 'Unpaid'}</span></div>
          </div>
        </div>
      `).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:20px 0;">No transactions yet.</div>';
}

// ══════════════════════════════════════════════════
//  CALENDAR (rendered inside modal)
// ══════════════════════════════════════════════════
function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
  closeDayPanel();
}

function goToToday() {
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  renderCalendar();
  closeDayPanel();
}

function renderCalendar() {
  document.getElementById('calTitle').textContent = MONTH_NAMES[calMonth] + ' ' + calYear;
  // calModalTitle removed from HTML - no-op

  const monthTx = DB.transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  });

  const revenue = monthTx.filter(t => t.paid).reduce((s, t) => s + t.total, 0);
  const pending = monthTx.filter(t => !t.paid).reduce((s, t) => s + t.total, 0);
  const expMonth = DB.expenses.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  }).reduce((s, e) => s + e.amount * e.qty, 0);

  document.getElementById('calStats').innerHTML = `
    <div class="cal-stat"><div class="cal-stat-label">Revenue</div><div class="cal-stat-val">₱${revenue.toLocaleString()}</div></div>
    <div class="cal-stat"><div class="cal-stat-label">Pending</div><div class="cal-stat-val" style="color:var(--amber)">₱${pending.toLocaleString()}</div></div>
    <div class="cal-stat"><div class="cal-stat-label">Expenses</div><div class="cal-stat-val">₱${expMonth.toLocaleString()}</div></div>
  `;

  // Group by date
  const byDate = {};
  monthTx.forEach(t => { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays    = new Date(calYear, calMonth, 0).getDate();
  const today       = new Date();

  let html = '';
  DAY_NAMES.forEach(d => { html += `<div class="cal-dh">${d}</div>`; });

  // Prev month overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${prevDays - i}</div></div>`;
  }

  // This month
  for (let d = 1; d <= daysInMonth; d++) {
    const ds       = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayTx    = byDate[ds] || [];
    const isToday  = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const hasData  = dayTx.length > 0;
    const dayTotal = dayTx.reduce((s, t) => s + t.total, 0);

    let chips = dayTx.slice(0, 3).map(t => `<div class="cal-chip">${t.customer}</div>`).join('');
    if (dayTx.length > 3) chips += `<div class="cal-chip" style="background:var(--surface2);color:var(--text3);">+${dayTx.length - 3} more</div>`;

    html += `
      <div class="cal-day ${isToday ? 'is-today' : ''} ${hasData ? 'has-data' : ''}"
           ${hasData ? `onclick="openDayPanel('${ds}')"` : ''}>
        <div class="cal-day-num">${d}</div>
        ${chips}
        ${hasData ? `<div class="cal-day-total">₱${dayTotal.toLocaleString()}</div>` : ''}
      </div>
    `;
  }

  // Next month overflow
  const totalCells = firstDay + daysInMonth;
  const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainder; i++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  document.getElementById('calGrid').innerHTML = html;
}

function openDayPanel(dateStr) {
  const dayTx = DB.transactions.filter(t => t.date === dateStr);
  const d     = new Date(dateStr + 'T00:00:00');
  document.getElementById('dayPanelTitle').textContent =
    d.toLocaleDateString('en-PH', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  document.getElementById('dayPanelBody').innerHTML = dayTx.length
    ? dayTx.map(t => `
        <tr>
          <td style="font-weight:600;">${t.customer}</td>
          <td class="muted">${t.staff || '—'}</td>
          <td>${t.loads}</td>
          <td class="mono">₱${t.total.toLocaleString()}</td>
          <td><span class="badge ${t.paid ? 'badge-paid' : 'badge-unpaid'}">${t.paid ? 'Paid' : 'Unpaid'}</span></td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3);">No transactions this day.</td></tr>';

  document.getElementById('dayPanel').style.display = 'block';
}

function closeDayPanel() {
  document.getElementById('dayPanel').style.display = 'none';
}

// ══════════════════════════════════════════════════
//  RECEIPTS
// ══════════════════════════════════════════════════
function populateMonthFilter() {
  const months = [...new Set(DB.transactions.map(t => t.date ? t.date.slice(0,7) : null).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('filterMonth');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All months</option>' +
    months.map(m => {
      const [y, mo] = m.split('-');
      return `<option value="${m}" ${m===cur?'selected':''}>${MONTH_NAMES[parseInt(mo)-1]} ${y}</option>`;
    }).join('');
}

function renderReceipts() {
  const search = (document.getElementById('searchInput').value || '').toLowerCase();
  const fPaid  = document.getElementById('filterPaid').value;
  const fMonth = document.getElementById('filterMonth').value;

  const filtered = DB.transactions.filter(t => {
    const text   = (t.customer + ' ' + t.staff + ' ' + t.notes).toLowerCase();
    const mTxt   = !search || text.includes(search);
    const mPaid  = fPaid  === '' || String(t.paid) === fPaid;
    const mMonth = !fMonth || (t.date && t.date.startsWith(fMonth));
    return mTxt && mPaid && mMonth;
  });

  const tbody = document.getElementById('receiptsBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text3);">No transactions found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((t, i) => `
    <tr>
      <td class="muted" style="font-size:11px;">${i+1}</td>
      <td>${t.date || '—'}</td>
      <td style="font-weight:600;">${t.customer}</td>
      <td class="muted">${t.staff || '—'}</td>
      <td>${t.loads}</td>
      <td class="mono">₱${t.total.toLocaleString()}</td>
      <td class="mono">${t.pay ? '₱'+t.pay.toLocaleString() : '—'}</td>
      <td>
        <span class="badge ${t.paid ? 'badge-paid' : 'badge-unpaid'}">${t.paid ? 'Paid' : 'Unpaid'}</span>
        ${t.rush ? '<span class="badge badge-rush" style="margin-left:4px;">Rush</span>' : ''}
      </td>
      <td style="display:flex;gap:4px;flex-wrap:wrap;">
        ${!t.paid ? `<button class="btn btn-sm" onclick="markPaid(${t.id})">Mark paid</button>` : ''}
        ${isOwner() ? `<button class="btn btn-sm btn-danger" onclick="deleteTx(${t.id})">Del</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════
//  EXPENSES
// ══════════════════════════════════════════════════
function addExpense() {
  const name   = document.getElementById('eName').value.trim();
  const amount = parseFloat(document.getElementById('eAmount').value);
  if (!name || !amount) { toast('⚠️ Fill in description and amount.'); return; }

  DB.expenses.push({
    id: Date.now(),
    date:   document.getElementById('eDate').value,
    name, qty: parseInt(document.getElementById('eQty').value) || 1, amount
  });
  saveData(); toast('✅ Expense added.'); renderExpenses();
  document.getElementById('eName').value   = '';
  document.getElementById('eAmount').value = '';
  document.getElementById('eQty').value    = 1;
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  DB.expenses = DB.expenses.filter(e => e.id !== id);
  saveData(); toast('🗑 Expense deleted.'); renderExpenses();
}

function renderExpenses() {
  const tbody = document.getElementById('expensesBody');
  if (!DB.expenses.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3);">No expenses logged yet.</td></tr>';
    return;
  }
  tbody.innerHTML = DB.expenses.map(e => `
    <tr>
      <td>${e.date || '—'}</td>
      <td>${e.name}</td>
      <td>${e.qty}</td>
      <td class="mono">₱${(e.amount * e.qty).toLocaleString()}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteExpense(${e.id})">Delete</button></td>
    </tr>
  `).join('');
}
