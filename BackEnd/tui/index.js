const http = require('http');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

// ---------- API helpers ----------
const BASE = 'http://localhost:3000/api';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---------- Screen ----------
const screen = blessed.screen({
  smartCSR: true,
  title: 'El Imperio del Dinero - TUI',
});

// ---------- App state ----------
const state = {
  accounts: [],
  users: [],
  categories: [],
  analytics: null,
  portfolio: [],
};

// ---------- Dashboard screen ----------
function showDashboard() {
  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  // Summary cards
  const summaryBox = grid.set(0, 0, 3, 12, blessed.box, {
    label: ' Resumen ',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
  });

  // Category table
  const catTable = grid.set(3, 0, 5, 6, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    label: ' Categorías ',
    border: { type: 'line' },
    style: { border: { fg: 'green' }, header: { fg: 'yellow' } },
    columnWidth: [24, 10, 10],
  });

  // Monthly bar chart
  const monthChart = grid.set(3, 6, 5, 6, contrib.bar, {
    label: ' Tendencia Mensual ',
    border: { type: 'line' },
    style: { border: { fg: 'magenta' } },
    barWidth: 6,
    barSpacing: 4,
    xOffset: 2,
    maxHeight: 9,
  });

  // Account balance table
  const balTable = grid.set(8, 0, 4, 12, contrib.table, {
    keys: true,
    fg: 'white',
    label: ' Cuentas ',
    border: { type: 'line' },
    style: { border: { fg: 'yellow' }, header: { fg: 'cyan' } },
    columnWidth: [20, 10, 14, 10, 12],
  });

  // Help bar
  const helpBar = blessed.box({
    bottom: 0,
    height: 1,
    left: 0,
    right: 0,
    content: ' {green-fg}[F1]{/green-fg} Añadir transacción  {green-fg}[F2]{/green-fg} Portafolio  {green-fg}[q]{/green-fg} Salir',
    tags: true,
    style: { bg: 'black', fg: 'white' },
  });
  screen.append(helpBar);

  function refresh() {
    Promise.all([
      api('GET', '/analytics/summary'),
      api('GET', '/categories'),
      api('GET', '/accounts'),
    ]).then(([analyticsRes, catRes, accRes]) => {
      state.analytics = analyticsRes.data;
      state.categories = catRes.data;
      state.accounts = accRes.data;

      // Summary
      const s = analyticsRes.data.summary || {};
      summaryBox.setContent(
        `\n Ingresos: ${s.totalIncome?.toFixed(2) ?? 0}\n` +
        ` Gastos:   ${s.totalExpense?.toFixed(2) ?? 0}\n` +
        ` Neto:     ${s.netFlow?.toFixed(2) ?? 0}\n` +
        ` Txns:     ${s.transactionCount ?? 0}`
      );

      // Categories table
      const cats = analyticsRes.data.topCategories || [];
      catTable.setData({
        headers: ['Categoría', 'Total', 'Tipo'],
        data: cats.slice(0, 10).map((c) => [c.categoryName, c.total.toFixed(2), c.type]),
      });

      // Monthly chart
      const trend = analyticsRes.data.monthlyTrend || [];
      const labels = trend.map((t) => t.month.slice(-2));
      const incomes = trend.map((t) => t.income);
      const expenses = trend.map((t) => t.expense);
      if (labels.length) {
        monthChart.setData({
          titles: labels,
          data: incomes.map((v, i) => ({ title: labels[i], value: Math.round(v) })),
        });
      }

      // Accounts balance table
      const balPromises = accRes.data.map((a) =>
        api('GET', `/accounts/${a.id}/balance`).then((r) => ({ ...a, balance: r.data.balance ?? 0 }))
      );
      return Promise.all(balPromises);
    }).then((acctsWithBalance) => {
      balTable.setData({
        headers: ['Cuenta', 'Tipo', 'Saldo', 'Usuario', 'Institución'],
        data: acctsWithBalance.map((a) => [
          a.name,
          a.type,
          a.balance.toFixed(2),
          a.userId?.toString() ?? '-',
          a.institutionId?.toString() ?? '-',
        ]),
      });
      screen.render();
    }).catch(() => {});
  }

  refresh();
  setInterval(refresh, 30000);

  screen.key(['f1'], () => { grid.destroy(); showAddTransaction(); });
  screen.key(['f2'], () => { grid.destroy(); showPortfolio(); });
  screen.key(['q', 'Q'], () => process.exit(0));
  screen.render();
}

// ---------- Add Transaction screen ----------
function showAddTransaction() {
  const form = blessed.form({
    parent: screen,
    keys: true,
    left: 'center',
    top: 'center',
    width: 50,
    height: 14,
    border: { type: 'line' },
    label: ' Nueva Transacción ',
    style: { border: { fg: 'green' } },
  });

  const typeSelect = blessed.select({
    parent: form,
    top: 1,
    left: 2,
    width: 20,
    height: 3,
    items: ['Gasto', 'Ingreso', 'Transferencia'],
    style: { fg: 'white', bg: 'blue' },
    value: 'Gasto',
  });

  const amountInput = blessed.textbox({
    parent: form,
    top: 4,
    left: 2,
    width: 20,
    height: 1,
    inputOnFocus: true,
    style: { fg: 'white', bg: 'black' },
    border: { type: 'line' },
    label: ' Monto ',
  });

  const descInput = blessed.textbox({
    parent: form,
    top: 6,
    left: 2,
    width: 44,
    height: 1,
    inputOnFocus: true,
    style: { fg: 'white', bg: 'black' },
    border: { type: 'line' },
    label: ' Descripción ',
  });

  const submitBtn = blessed.button({
    parent: form,
    top: 9,
    left: 2,
    width: 20,
    height: 1,
    content: ' Guardar ',
    style: { fg: 'black', bg: 'green' },
  });

  const cancelBtn = blessed.button({
    parent: form,
    top: 9,
    left: 24,
    width: 20,
    height: 1,
    content: ' Cancelar ',
    style: { fg: 'black', bg: 'red' },
  });

  const msg = blessed.box({
    parent: form,
    top: 11,
    left: 2,
    width: 44,
    height: 1,
    content: '',
  });

  submitBtn.on('press', () => {
    const type = typeSelect.value;
    const rawAmount = parseFloat(amountInput.value);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      msg.setContent('{red-fg}Monto inválido{/red-fg}');
      screen.render();
      return;
    }

    let amount = type === 'Gasto' ? -rawAmount : rawAmount;
    if (!state.accounts.length) {
      msg.setContent('{red-fg}No hay cuentas disponibles{/red-fg}');
      screen.render();
      return;
    }

    const catName = type === 'Ingreso' ? 'Nómina' : type === 'Transferencia' ? 'Transferencia' : 'Alimentación';
    const cat = state.categories.find((c) => c.name === catName) || state.categories[0];

    api('POST', '/transactions', {
      account_id: state.accounts[0].id,
      category_id: cat?.id ?? 1,
      amount,
      date: new Date().toISOString().slice(0, 10),
      description: descInput.value || (type === 'Gasto' ? 'Gasto rápido' : 'Ingreso rápido'),
    }).then((r) => {
      if (r.status === 201) {
        msg.setContent('{green-fg}Transacción creada{/green-fg}');
        setTimeout(() => { form.destroy(); showDashboard(); }, 1000);
      } else {
        msg.setContent(`{red-fg}Error: ${JSON.stringify(r.data)}{/red-fg}`);
      }
      screen.render();
    });
  });

  cancelBtn.on('press', () => { form.destroy(); showDashboard(); });

  form.key(['escape'], () => { form.destroy(); showDashboard(); });

  amountInput.focus();
  screen.render();
}

// ---------- Portfolio screen ----------
function showPortfolio() {
  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  const portfolioTable = grid.set(0, 0, 6, 12, contrib.table, {
    keys: true,
    fg: 'white',
    label: ' Portafolio ',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, header: { fg: 'yellow' } },
    columnWidth: [16, 10, 10, 10, 14, 14],
  });

  const balanceTable = grid.set(6, 0, 6, 12, contrib.table, {
    keys: true,
    fg: 'white',
    label: ' Saldos por Cuenta ',
    border: { type: 'line' },
    style: { border: { fg: 'green' }, header: { fg: 'cyan' } },
    columnWidth: [20, 10, 14, 10, 12],
  });

  Promise.all([
    api('GET', '/portfolio/summary'),
    api('GET', '/accounts'),
  ]).then(([portRes, accRes]) => {
    const holdings = portRes.data || [];
    portfolioTable.setData({
      headers: ['Activo', 'Ticker', 'Cant.', 'Precio', 'Persona', 'Cuenta'],
      data: holdings.map((h) => [
        h.assetName || '-',
        h.ticker || '-',
        String(h.quantity ?? 0),
        (h.avgBuyPrice ?? 0).toFixed(2),
        h.userName || '-',
        h.accountName || '-',
      ]),
    });

    const balPromises = accRes.data.map((a) =>
      api('GET', `/accounts/${a.id}/balance`).then((r) => ({ ...a, balance: r.data.balance ?? 0 }))
    );
    return Promise.all(balPromises);
  }).then((accts) => {
    balanceTable.setData({
      headers: ['Cuenta', 'Tipo', 'Saldo', 'Usuario', 'Institución'],
      data: accts.map((a) => [
        a.name,
        a.type,
        a.balance.toFixed(2),
        String(a.userId ?? '-'),
        String(a.institutionId ?? '-'),
      ]),
    });
    screen.render();
  });

  const helpBar = blessed.box({
    bottom: 0, height: 1, left: 0, right: 0,
    content: ' {green-fg}[Esc]{/green-fg} Volver al dashboard  {green-fg}[q]{/green-fg} Salir',
    tags: true, style: { bg: 'black', fg: 'white' },
  });
  screen.append(helpBar);

  screen.key(['escape'], () => { grid.destroy(); helpBar.destroy(); showDashboard(); });
  screen.key(['q', 'Q'], () => process.exit(0));
  screen.render();
}

// ---------- Start ----------
showDashboard();
