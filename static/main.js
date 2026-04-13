// ─────────────────────────────────────────
//  LAUNDRY MANAGER — main.js
//  Talks to your Flask backend (app.py)
// ─────────────────────────────────────────

// ── PRICING CONSTANTS ──
const PRICES = {
  wash: 100,
  dry: 90,
  rush: 50,
  extraPerLoad: 20
};


// ── PANEL (slide-in form) ──
function openPanel() {
  document.getElementById('panel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden'; // stop background scrolling
}

function closePanel() {
  document.getElementById('panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}


// ── TABS ──
function switchTab(name, btn) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');

  if (name === 'receipts') renderReceipts();
  if (name === 'expenses') renderExpenses();
  if (name === 'summary')  renderSummary();
}


// ── PRICE CALCULATOR ──
function calcPrice() {
  const loads = parseInt(document.getElementById('t-loads').value) || 1;
  const rush  = parseInt(document.getElementById('t-rush').value);
  const pload = parseInt(document.getElementById('t-pload').value);
  const half  = parseInt(document.getElementById('t-half').value);

  let base     = loads * (PRICES.wash + PRICES.dry);
  let rushFee  = rush  ? PRICES.rush : 0;
  let extraFee = pload ? loads * PRICES.extraPerLoad : 0;
  let total    = base + rushFee + extraFee;
  if (half) total = total / 2;

  document.getElementById('price-display').textContent = '₱' + total.toLocaleString();

  let parts = [`${loads} load${loads > 1 ? 's' : ''} × ₱${PRICES.wash + PRICES.dry}`];
  if (rush)  parts.push('rush +₱50');
  if (pload) parts.push(`extra/load +₱${loads * PRICES.extraPerLoad}`);
  if (half)  parts.push('half price applied');
  document.getElementById('price-breakdown').textContent = parts.join(' · ');

  return total;
}


// ── ADD TRANSACTION ──
async function addTransaction() {
  const customer = document.getElementById('t-customer').value.trim();
  if (!customer) {
    alert('Please enter a customer name.');
    return;
  }

  const total = calcPrice();
  const paid  = parseInt(document.getElementById('t-paid').value);

  const data = {
    date:            document.getElementById('t-date').value,
    weekday:         document.getElementById('t-weekday').value,
    in_charge:       document.getElementById('t-incharge').value,
    customer_name:   customer,
    weight_kilo:     parseFloat(document.getElementById('t-weight').value) || 0,
    rush:            parseInt(document.getElementById('t-rush').value),
    num_loads:       parseInt(document.getElementById('t-loads').value) || 1,
    machine_used:    document.getElementById('t-machine').value,
    per_load:        parseInt(document.getElementById('t-pload').value),
    other_notes:     document.getElementById('t-notes').value,
    half:            parseInt(document.getElementById('t-half').value),
    pay:             parseFloat(document.getElementById('t-pay').value) || 0,
    income:          total,
    date_fully_paid: paid ? document.getElementById('t-date').value : '',
    extra_amount:    0,
    paid:            paid
  };

  try {
    const res    = await fetch('/api/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.status === 'ok') {
      closePanel();
      resetForm();
      renderReceipts(); // refresh the table immediately
    } else {
      alert('Something went wrong. Check the terminal for errors.');
    }
  } catch (err) {
    console.error(err);
    alert('Could not reach the server. Is app.py running?');
  }
}

// Clears the form back to defaults
function resetForm() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('t-date').value     = today;
  document.getElementById('t-incharge').value = '';
  document.getElementById('t-customer').value = '';
  document.getElementById('t-weight').value   = '';
  document.getElementById('t-machine').value  = '';
  document.getElementById('t-loads').value    = 1;
  document.getElementById('t-rush').value     = 0;
  document.getElementById('t-pload').value    = 0;
  document.getElementById('t-half').value     = 0;
  document.getElementById('t-notes').value    = '';
  document.getElementById('t-pay').value      = '';
  document.getElementById('t-paid').value     = 0;
  updateWeekday();
  calcPrice();
}

// Auto-fills weekday when date is picked
function updateWeekday() {
  const d = document.getElementById('t-date').value;
  if (!d) return;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  document.getElementById('t-weekday').value = days[new Date(d + 'T00:00:00').getDay()];
}


// ── RECEIPTS ──
async function renderReceipts() {
  const search     = (document.getElementById('search').value || '').toLowerCase();
  const filterPaid = document.getElementById('filter-paid').value;
  const tbody      = document.getElementById('receipts-body');

  tbody.innerHTML = '<tr><td colspan="10" class="empty">Loading...</td></tr>';

  try {
    const res  = await fetch('/api/list');
    const rows = await res.json();

    const filtered = rows.filter(t => {
      const text      = (t.customer_name + ' ' + t.in_charge + ' ' + t.other_notes).toLowerCase();
      const matchText = !search || text.includes(search);
      const matchPaid = filterPaid === '' || String(t.paid) === filterPaid;
      return matchText && matchPaid;
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty">No transactions found</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((t, i) => `
      <tr>
        <td class="muted" style="font-size:11px;">${i + 1}</td>
        <td>${t.date || '—'}</td>
        <td style="font-weight:500;">${t.customer_name}</td>
        <td class="muted">${t.in_charge || '—'}</td>
        <td>${t.weight_kilo ? t.weight_kilo + 'kg' : '—'}</td>
        <td>${t.num_loads || '—'}</td>
        <td class="mono">₱${(t.income || 0).toLocaleString()}</td>
        <td class="mono">${t.pay ? '₱' + t.pay.toLocaleString() : '—'}</td>
        <td>
          <span class="badge ${t.paid ? 'badge-paid' : 'badge-unpaid'}">
            ${t.paid ? 'Paid' : 'Unpaid'}
          </span>
          ${t.rush ? '<span class="badge badge-rush" style="margin-left:4px;">Rush</span>' : ''}
        </td>
        <td style="display:flex; gap:4px; flex-wrap:wrap;">
          ${!t.paid
            ? `<button class="btn btn-sm" onclick="markPaid(${t.id})">Mark paid</button>`
            : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${t.id})">Delete</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="10" class="empty">Failed to load. Is app.py running?</td></tr>';
  }
}

async function markPaid(id) {
  try {
    await fetch('/api/mark_paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, date_paid: new Date().toISOString().split('T')[0] })
    });
    renderReceipts();
  } catch (err) {
    alert('Could not update. Is app.py running?');
  }
}

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return;
  try {
    await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    renderReceipts();
  } catch (err) {
    alert('Could not delete. Is app.py running?');
  }
}


// ── EXPENSES ──
// Stored in browser for now — we'll move to Flask in a later step
let expenses = JSON.parse(localStorage.getItem('lm_ex') || '[]');

function saveExpenses() {
  localStorage.setItem('lm_ex', JSON.stringify(expenses));
}

function addExpense() {
  const name   = document.getElementById('e-name').value.trim();
  const amount = parseFloat(document.getElementById('e-amount').value);
  if (!name || !amount) {
    alert('Please fill in the description and amount.');
    return;
  }
  expenses.push({
    id:     Date.now(),
    date:   document.getElementById('e-date').value,
    name,
    qty:    parseInt(document.getElementById('e-qty').value) || 1,
    amount
  });
  saveExpenses();
  renderExpenses();
  document.getElementById('e-name').value   = '';
  document.getElementById('e-amount').value = '';
  document.getElementById('e-qty').value    = 1;
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

function renderExpenses() {
  const tbody = document.getElementById('expenses-body');
  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No expenses yet</td></tr>';
    return;
  }
  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${e.date || '—'}</td>
      <td>${e.name}</td>
      <td>${e.qty}</td>
      <td class="mono">₱${(e.amount * e.qty).toLocaleString()}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteExpense(${e.id})">Delete</button></td>
    </tr>
  `).join('');
}


// ── SUMMARY ──
async function renderSummary() {
  try {
    const res  = await fetch('/api/list');
    const rows = await res.json();

    const revenue       = rows.filter(t => t.paid).reduce((s, t) => s + (t.income || 0), 0);
    const pending       = rows.filter(t => !t.paid).reduce((s, t) => s + (t.income || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount * e.qty), 0);
    const net           = revenue - totalExpenses;

    document.getElementById('summary-stats').innerHTML = `
      <div class="stat">
        <div class="stat-label">Revenue (paid)</div>
        <div class="stat-value">₱${revenue.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Pending</div>
        <div class="stat-value">₱${pending.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Expenses</div>
        <div class="stat-value">₱${totalExpenses.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Net profit</div>
        <div class="stat-value" style="color:${net >= 0 ? '#1a7a45' : '#c0392b'}">
          ₱${net.toLocaleString()}
        </div>
      </div>
    `;

    const unpaid     = rows.filter(t => !t.paid);
    const unpaidBody = document.getElementById('unpaid-body');
    if (!unpaid.length) {
      unpaidBody.innerHTML = '<tr><td colspan="3" class="empty">No unpaid transactions</td></tr>';
      return;
    }
    unpaidBody.innerHTML = unpaid.map(t => `
      <tr>
        <td style="font-weight:500;">${t.customer_name}</td>
        <td class="muted">${t.date || '—'}</td>
        <td class="mono">₱${(t.income || 0).toLocaleString()}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}


// ── INIT ──
(function init() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('t-date').value = today;
  document.getElementById('e-date').value = today;
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  updateWeekday();
  calcPrice();

  // Load receipts immediately on page open
  renderReceipts();
})();
