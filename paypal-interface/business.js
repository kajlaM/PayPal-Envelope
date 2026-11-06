/**
 * PayPal Business dashboard: the seller side of agentic commerce.
 * Built with AG Grid Community (MIT, no licence key). Community has no row grouping, master-detail or
 * AI Toolkit, so this page adds them on top of Community features:
 *   - "Group by" -> a summary grid computed from the rows that pass the current filters, with totals
 *   - "Why the agent bought" -> full-width detail rows inserted under a clicked row
 *   - "Ask the grid" -> our AI turns plain English into AG Grid filter / sort / group settings
 */
(() => {
  const { createGrid, themeQuartz } = window.agGrid;

  // ---------- Small helpers ----------
  async function request(path, body) {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || data.error || res.statusText), { status: res.status, body: data });
    return data;
  }
  const $ = (id) => document.getElementById(id);
  const usd = (n) => Number(n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const escapeHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const dayLabel = (key) => new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  let toastTimer;
  function toast(text) {
    const el = $('bizToast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
  }

  const theme = themeQuartz.withParams({
    accentColor: '#0070BA',
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 13,
    headerBackgroundColor: '#F5F7FA',
    headerFontWeight: 600,
    headerTextColor: '#444749',
    borderColor: '#E5E7EB',
    rowHoverColor: '#EBF5FB',
    selectedRowBackgroundColor: '#EBF5FB',
    wrapperBorderRadius: 12,
    oddRowBackgroundColor: '#FCFDFE',
  });

  // ---------- Shared column helpers ----------
  // Dates: compare by calendar day so "equals Nov 4" and "after Nov 2" work on timestamps.
  const dateFilterParams = {
    inRangeInclusive: true,
    comparator: (filterDay, cell) => {
      if (!cell) return -1;
      const d = new Date(cell.getFullYear(), cell.getMonth(), cell.getDate());
      return d < filterDay ? -1 : d > filterDay ? 1 : 0;
    },
  };
  const dateCol = {
    field: 'at', headerName: 'Time', width: 140, sort: 'desc', filter: 'agDateColumnFilter', filterParams: dateFilterParams,
    valueGetter: (p) => (p.data?.at ? new Date(p.data.at) : null),
    valueFormatter: (p) => fmtDate(p.value),
    getQuickFilterText: (p) => fmtDate(p.value),
  };
  const moneyCol = (field, headerName, extra = {}) => ({
    field, headerName, width: 120, type: 'rightAligned', filter: 'agNumberColumnFilter',
    valueFormatter: (p) => (p.value === null || p.value === undefined ? '–' : usd(p.value)), ...extra,
  });
  const pill = (cls) => (p) => p.value ? `<span class="biz-pill ${cls(p.value)}">${escapeHtml(p.value)}</span>` : '';
  const expander = {
    colId: 'expand', headerName: '', width: 44, maxWidth: 44, sortable: false, filter: false, resizable: false, suppressMovable: true,
    cellRenderer: (p) => p.data?.__total ? '' : `<span class="biz-chevron${expanded[current].has(p.data?.id) ? ' open' : ''}" aria-hidden="true">›</span>`,
  };

  // ---------- Grid definitions ----------
  const STATUS_CLASS = { Paid: 'ok', Pending: 'wait', Failed: 'bad' };
  const PAYPAL_CLASS = { Confirmed: 'ok', Processing: 'wait', Differs: 'bad', 'Not checked': 'info' };
  const APPROVAL_CLASS = { Autopilot: 'info', 'Picked by customer': 'ok', 'Approved by customer': 'ok' };

  const GRIDS = {
    orders: {
      el: 'gridOrders',
      hint: 'Click a row to see why the agent bought it.',
      groups: { none: 'No grouping', day: 'Day', product: 'Product', category: 'Category', storefront: 'Storefront', paidVia: 'Paid via', customer: 'Customer', approval: 'How approved', status: 'Status' },
      examples: ['orders this week over $40', 'group by product, biggest first', 'only Checkout payments', 'failed payments'],
      columns: [
        expander,
        dateCol,
        { field: 'product', headerName: 'Product', flex: 2, minWidth: 160, filter: 'agTextColumnFilter', tooltipField: 'product' },
        { field: 'category', headerName: 'Category', width: 115, filter: 'agTextColumnFilter' },
        { field: 'storefront', headerName: 'Storefront', width: 115, filter: 'agTextColumnFilter' },
        moneyCol('amount', 'Amount', { width: 110 }),
        { field: 'paidVia', headerName: 'Paid via', width: 135, filter: 'agTextColumnFilter' },
        { field: 'approval', headerName: 'How approved', width: 160, filter: 'agTextColumnFilter', cellRenderer: pill((v) => APPROVAL_CLASS[v] ?? 'info') },
        { field: 'status', headerName: 'Status', width: 100, filter: 'agTextColumnFilter', cellRenderer: pill((v) => STATUS_CLASS[v] ?? 'info'), enableCellChangeFlash: true },
        { field: 'paypal', headerName: 'PayPal check', width: 125, filter: 'agTextColumnFilter', cellRenderer: pill((v) => PAYPAL_CLASS[v] ?? 'info'), tooltipField: 'paypalNote', headerTooltip: 'Checked against PayPal\'s own records (read-only)' },
        { field: 'customer', headerName: 'Customer', width: 125, filter: 'agTextColumnFilter' },
      ],
      detailHeight: 168,
      detail: (r) => `
        <div class="biz-why">
          <div class="biz-why-col">
            <h4>Rules the agent passed</h4>
            <ul class="biz-checks">${(r.why.checks.length ? r.why.checks : ['No spending limits were set']).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
          </div>
          <div class="biz-why-col">
            <h4>Price</h4>
            <p>${escapeHtml(r.why.price)}</p>
            <h4>Approval</h4>
            <p>${escapeHtml(r.why.approval)}</p>
          </div>
          <div class="biz-why-col">
            <h4>Payment</h4>
            <p>${escapeHtml(r.paidVia)} · ${escapeHtml(r.status)}</p>
            <p>${r.paypal === 'Confirmed' ? '✅' : r.paypal === 'Differs' ? '⚠️' : r.paypal === 'Processing' ? '⏳' : '·'} ${escapeHtml(r.paypalNote)}</p>
            <p class="biz-muted">PayPal ref ${escapeHtml(r.paypalRef || '–')}</p>
          </div>
        </div>`,
    },
    missed: {
      el: 'gridMissed',
      hint: 'Click a row to see exactly why the sale was lost.',
      groups: { none: 'No grouping', reason: 'Reason', product: 'Product', category: 'Category', storefront: 'Storefront', day: 'Day', customer: 'Customer' },
      examples: ['too expensive for the customer', 'group by reason', 'headphones only', 'missed this week over $20'],
      columns: [
        expander,
        dateCol,
        { field: 'product', headerName: 'Product the agent wanted', flex: 2, minWidth: 220, filter: 'agTextColumnFilter', tooltipField: 'product' },
        { field: 'reason', headerName: 'Why it was lost', width: 230, filter: 'agTextColumnFilter', cellRenderer: pill(() => 'warn') },
        moneyCol('amount', 'Your price'),
        moneyCol('customerLimit', 'Customer limit', { headerTooltip: "The most the customer's rules let the agent pay in one purchase" }),
        moneyCol('marketLow', 'Market low', {
          width: 125, headerTooltip: 'Lowest price for the same product at any store right now (Channel3)',
          cellRenderer: (p) => p.data?.__total ? '' : p.value != null
            ? `<span class="${p.value < p.data.amount ? 'biz-under' : ''}">${usd(p.value)}</span>`
            : `<span class="biz-muted">${marketLoaded ? '–' : '…'}</span>`,
        }),
        { field: 'cheapestAt', headerName: 'Cheapest at', width: 125, filter: 'agTextColumnFilter', headerTooltip: 'Store with the market low (Channel3)' },
        {
          field: 'marketTrend', headerName: '90-day trend', width: 125, filter: 'agTextColumnFilter',
          headerTooltip: "Is the market price low, typical or high vs the last 90 days (Channel3 price history)",
          cellRenderer: (p) => p.value ? `<span class="biz-pill ${{ low: 'ok', typical: 'info', high: 'warn' }[p.value]}">${escapeHtml(p.value)}</span>` : '',
        },
        { field: 'category', headerName: 'Category', width: 120, filter: 'agTextColumnFilter' },
        { field: 'storefront', headerName: 'Storefront', width: 120, filter: 'agTextColumnFilter' },
        { field: 'customer', headerName: 'Customer', width: 130, filter: 'agTextColumnFilter' },
      ],
      detailHeight: 150,
      detail: (r) => `
        <div class="biz-why biz-why-3">
          <div class="biz-why-col">
            <h4>What happened</h4>
            <p>${escapeHtml(r.detail)}</p>
            ${r.allReasons.length > 1 ? `<p class="biz-muted">All reasons: ${r.allReasons.map(escapeHtml).join(' · ')}</p>` : ''}
          </div>
          <div class="biz-why-col">
            <h4>Market right now <span class="biz-c3">Channel3</span></h4>
            ${r.market
              ? `<p>${r.market.stores.map((st) => `${escapeHtml(st.store)} ${usd(st.price)}`).join(' · ')}</p>
                 ${r.market.average != null ? `<p class="biz-muted">${r.market.days}-day average ${usd(r.market.average)}, so the best price today is ${escapeHtml({ low: 'a low one', typical: 'typical', high: 'high' }[r.market.trend] ?? r.market.trend)}</p>` : ''}`
              : `<p class="biz-muted">${marketLoaded ? 'No confident match for this product in Channel3.' : 'Checking other stores…'}</p>`}
          </div>
          <div class="biz-why-col">
            <h4>What would have won it</h4>
            <p>${escapeHtml(advice(r))}</p>
          </div>
        </div>`,
    },
  };

  function advice(r) {
    const m = r.market;
    if (/price limit/.test(r.reason) && r.customerLimit !== null && r.amount > r.customerLimit) {
      const target = m && m.marketLow < r.customerLimit ? m.marketLow : r.customerLimit;
      return `A price of ${usd(target)} or less (${usd(r.amount - target)} lower)${m && m.marketLow < r.amount ? `: ${m.cheapestAt} already sells it at ${usd(m.marketLow)}` : ''}.`;
    }
    if (/another option/.test(r.reason) && m && m.marketLow < r.amount) return `${m.cheapestAt} sells it at ${usd(m.marketLow)} (${usd(r.amount - m.marketLow)} less than you). Matching that price would have made you the pick.`;
    if (/Price changed/.test(r.reason)) return 'Keep the listed price and the checkout price the same.';
    if (/could not be checked/.test(r.reason)) return 'Show the price clearly on the product page so agents can verify it.';
    if (/Shop not on/.test(r.reason)) return 'Customers choose allowed shops; being listed with PayPalVault as a trusted merchant helps.';
    if (/Bill did not match/.test(r.reason)) return 'Send a PayPal invoice for the exact amount before the due date.';
    if (/another option/.test(r.reason)) return 'A lower price or better rating than the option the customer chose.';
    if (/budget ran out/.test(r.reason)) return 'Nothing on your side: the customer had no budget left.';
    if (/Payment error/.test(r.reason)) return 'A PayPal payment error; nothing was charged and the agent can try again.';
    if (/said no/.test(r.reason)) return 'The customer declined when the agent asked them.';
    if (/changed their rules/.test(r.reason)) return 'Nothing on your side: the customer changed their rules mid-purchase.';
    return 'Nothing on your side: the customer\'s own rules stopped it.';
  }

  // ---------- State ----------
  let current = 'orders';
  const data = { orders: [], missed: [] };
  const apis = {};
  const expanded = { orders: new Set(), missed: new Set() };
  const groupBy = { orders: 'none', missed: 'reason' };
  const askNote = { orders: '', missed: '' };

  // ---------- List grids ----------
  const detailId = (id) => `${id}::why`;
  const isDetail = (row) => Boolean(row?.__detail);

  function makeListGrid(name) {
    const def = GRIDS[name];
    return createGrid($(def.el), {
      theme,
      columnDefs: def.columns,
      defaultColDef: { sortable: true, resizable: true, filter: true, floatingFilter: false, menuTabs: [] },
      rowData: [],
      getRowId: (p) => (isDetail(p.data) ? detailId(p.data.id) : p.data.id),
      animateRows: true,
      tooltipShowDelay: 400,
      // Full-width "why" rows (Community): a copy of the parent row, so every filter treats them alike.
      isFullWidthRow: (p) => isDetail(p.rowNode.data),
      fullWidthCellRenderer: (p) => {
        const box = document.createElement('div');
        box.className = 'biz-detail';
        box.innerHTML = def.detail(p.data);
        return box;
      },
      getRowHeight: (p) => (isDetail(p.data) ? def.detailHeight : 44),
      // Keep each "why" row directly under its parent, whatever the sort.
      postSortRows: (p) => {
        const nodes = p.nodes;
        const details = new Map();
        const rest = [];
        for (const n of nodes) (isDetail(n.data) ? details.set(n.data.id, n) : rest.push(n));
        nodes.length = 0;
        for (const n of rest) {
          nodes.push(n);
          const d = details.get(n.data.id);
          if (d) nodes.push(d);
        }
      },
      onRowClicked: (p) => { if (!isDetail(p.data) && !p.data?.__total) toggleDetail(name, p.data); },
      onFilterChanged: () => afterChange(name),
      onSortChanged: () => afterChange(name),
      onRowDataUpdated: () => afterChange(name),
      overlayNoRowsTemplate: name === 'orders'
        ? '<span class="biz-empty">No AI-agent orders match. Try “Reset view”.</span>'
        : '<span class="biz-empty">No missed sales match. Agents bought everything they wanted.</span>',
      rowClassRules: { 'biz-row-open': (p) => !isDetail(p.data) && expanded[name].has(p.data?.id) },
      pinnedBottomRowData: [],
    });
  }

  function toggleDetail(name, row) {
    const api = apis[name];
    const open = expanded[name];
    if (open.has(row.id)) {
      open.delete(row.id);
      api.applyTransaction({ remove: [{ ...row, __detail: true }] });
    } else {
      open.add(row.id);
      api.applyTransaction({ add: [{ ...row, __detail: true }] });
    }
    const node = api.getRowNode(row.id);
    if (node) api.redrawRows({ rowNodes: [node] });
  }

  /** Rows (not "why" rows) that pass the current filters and search. */
  function visibleRows(name) {
    const rows = [];
    apis[name].forEachNodeAfterFilterAndSort((n) => { if (n.data && !isDetail(n.data)) rows.push(n.data); });
    return rows;
  }

  function afterChange(name) {
    const rows = visibleRows(name);
    const api = apis[name];
    const total = rows.reduce((s, r) => s + (name === 'orders' && r.status === 'Failed' ? 0 : r.amount), 0);
    api.setGridOption('pinnedBottomRowData', rows.length ? [{
      id: '__total', at: null, product: `${rows.length} ${name === 'orders' ? (rows.length === 1 ? 'order' : 'orders') : (rows.length === 1 ? 'missed sale' : 'missed sales')}`,
      amount: total, customerLimit: null, __total: true,
    }] : []);
    if (name === current && groupBy[name] !== 'none') renderSummary();
    if (name === 'missed') renderInsights();
    chartsSoon();
    $(`count${name === 'orders' ? 'Orders' : 'Missed'}`).textContent = String(data[name].length);
  }

  // ---------- Grouping (summary grid with totals) ----------
  const summaryApi = createGrid($('gridSummary'), {
    theme,
    columnDefs: [],
    rowData: [],
    defaultColDef: { sortable: true, resizable: true, filter: true },
    getRowId: (p) => p.data.key,
    onRowClicked: (p) => { if (!p.data.__total) drillInto(p.data); },
    rowClass: 'biz-summary-row',
    getRowHeight: () => 46,
    pinnedBottomRowData: [],
  });

  const keyOf = (row, by) => (by === 'day' ? dayKey(row.at) : String(row[by] ?? '') || '(none)');

  function summaryColumns(name, by) {
    const label = GRIDS[name].groups[by];
    const groupCol = {
      field: 'label', headerName: label, flex: 2, minWidth: 290, sortable: true,
      cellRenderer: (p) => p.data.__total ? `<strong>${escapeHtml(p.value)}</strong>` : `<span class="biz-group-label">${escapeHtml(p.value)}</span><span class="biz-drill">View ${p.data.count} ›</span>`,
      comparator: by === 'day' ? (_a, _b, na, nb) => (na.data.key < nb.data.key ? -1 : 1) : undefined,
    };
    if (name === 'orders') {
      return [
        groupCol,
        { field: 'count', headerName: 'Orders', width: 110, type: 'rightAligned', filter: 'agNumberColumnFilter' },
        moneyCol('revenue', 'Revenue', { sort: 'desc', width: 140 }),
        moneyCol('avg', 'Avg order'),
        { field: 'customers', headerName: 'Customers', width: 120, type: 'rightAligned' },
        { field: 'last', headerName: 'Last order', width: 150, valueFormatter: (p) => fmtDate(p.value) },
      ];
    }
    return [
      groupCol,
      { field: 'count', headerName: 'Attempts', width: 110, type: 'rightAligned', filter: 'agNumberColumnFilter', sort: 'desc' },
      moneyCol('revenue', 'Sales lost', { width: 125 }),
      moneyCol('avgPrice', 'Avg price', { width: 115 }),
      moneyCol('avgLimit', 'Avg limit', { width: 115, headerTooltip: "Average of the customers' per-purchase limits" }),
      { field: 'insight', headerName: 'What agents wanted', flex: 3, minWidth: 260, wrapText: true, autoHeight: true, cellClass: 'biz-insight-cell', sortable: false },
    ];
  }

  function summarise(name, by, rows) {
    const groups = new Map();
    for (const r of rows) {
      const key = keyOf(r, by);
      const g = groups.get(key) ?? { key, rows: [] };
      g.rows.push(r);
      groups.set(key, g);
    }
    const avg = (list) => (list.length ? list.reduce((s, n) => s + n, 0) / list.length : null);
    return [...groups.values()].map(({ key, rows: list }) => {
      const label = by === 'day' ? dayLabel(key) : key;
      if (name === 'orders') {
        const paid = list.filter((r) => r.status !== 'Failed');
        const revenue = paid.reduce((s, r) => s + r.amount, 0);
        return {
          key, label, count: list.length, revenue, avg: paid.length ? revenue / paid.length : null,
          customers: new Set(list.map((r) => r.customer)).size,
          last: list.map((r) => r.at).sort().at(-1),
        };
      }
      const limits = list.map((r) => r.customerLimit).filter((n) => n !== null);
      return {
        key, label, count: list.length,
        revenue: list.reduce((s, r) => s + r.amount, 0),
        avgPrice: avg(list.map((r) => r.amount)),
        avgLimit: avg(limits),
        insight: insightFor(list),
      };
    });
  }

  /** "AI agents wanted 2 Headphones at up to $80; you priced them at $89." */
  function insightFor(list) {
    const over = list.filter((r) => /price limit/.test(r.reason) && r.customerLimit !== null && r.amount > r.customerLimit);
    if (over.length) {
      const what = commonName(over);
      const maxLimit = Math.max(...over.map((r) => r.customerLimit));
      const prices = over.map((r) => r.amount);
      const priced = Math.min(...prices) === Math.max(...prices) ? usd(prices[0]) : `${usd(Math.min(...prices))}–${usd(Math.max(...prices))}`;
      const market = over.map((r) => r.market).filter(Boolean).sort((a, b) => a.marketLow - b.marketLow)[0];
      return `AI agents wanted ${over.length} ${what} at up to ${usd(maxLimit)}; you priced ${over.length === 1 ? 'it' : 'them'} at ${priced}.${market ? ` ${market.cheapestAt} sells it at ${usd(market.marketLow)}.` : ''}`;
    }
    const top = [...list.reduce((m, r) => m.set(r.reason, (m.get(r.reason) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0];
    return `${list.length} ${commonName(list)} · mostly “${top[0].toLowerCase()}”. ${advice(list[0])}`;
  }

  function commonName(list) {
    const cats = [...new Set(list.map((r) => r.category).filter(Boolean))];
    const items = list.length === 1 ? 'item' : 'items';
    return cats.length === 1 ? `${items} (${cats[0]})` : items;
  }

  let summaryShape = '';
  function renderSummary() {
    const by = groupBy[current];
    const groups = summarise(current, by, visibleRows(current));
    // New grouping: fresh columns and their default sort. Same grouping: keep the user's sort.
    if (summaryShape !== `${current}:${by}`) {
      summaryShape = `${current}:${by}`;
      const cols = summaryColumns(current, by);
      summaryApi.setGridOption('columnDefs', cols);
      summaryApi.applyColumnState({ state: cols.filter((c) => c.sort).map((c) => ({ colId: c.field, sort: c.sort })), defaultState: { sort: null } });
    }
    summaryApi.setGridOption('rowData', groups);
    const count = groups.reduce((s, g) => s + g.count, 0);
    const revenue = groups.reduce((s, g) => s + g.revenue, 0);
    summaryApi.setGridOption('pinnedBottomRowData', groups.length ? [{ key: '__total', __total: true, label: `Total · ${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`, count, revenue }] : []);
  }

  /** Clicking a group: filter the list to that group and show its rows. */
  async function drillInto(group) {
    const by = groupBy[current];
    const api = apis[current];
    if (by === 'day') {
      const model = api.getFilterModel();
      model.at = { filterType: 'date', type: 'equals', dateFrom: `${group.key} 00:00:00` };
      api.setFilterModel(model);
    } else {
      const model = api.getFilterModel();
      model[by] = { filterType: 'text', type: 'equals', filter: group.key };
      api.setFilterModel(model);
    }
    setGroupBy('none');
    toast(`Showing ${group.count} ${current === 'orders' ? 'orders' : 'missed sales'}: ${group.label}`);
  }

  function setGroupBy(value) {
    groupBy[current] = value;
    $('bizGroupBy').value = value;
    const grouped = value !== 'none';
    $('gridSummary').classList.toggle('hidden', !grouped);
    $(GRIDS[current].el).classList.toggle('hidden', grouped);
    $('bizHint').textContent = grouped ? 'Click a group to see its rows.' : GRIDS[current].hint;
    if (grouped) renderSummary();
  }

  // ---------- Missed-sales insight cards (the seller's view of agentic commerce) ----------
  function renderInsights() {
    const box = $('bizInsights');
    const rows = data.missed;
    if (current !== 'missed' || !rows.length) return box.classList.add('hidden');
    const groups = summarise('missed', 'reason', rows).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
    box.innerHTML = groups.map((g) => `
      <button type="button" class="biz-insight" data-reason="${escapeHtml(g.key)}">
        <span class="biz-insight-top"><span class="biz-pill warn">${escapeHtml(g.label)}</span><span class="biz-insight-n">${g.count}×</span></span>
        <strong>${usd(g.revenue)} not sold</strong>
        <span>${escapeHtml(g.insight)}</span>
      </button>`).join('');
    box.classList.remove('hidden');
  }

  $('bizInsights').addEventListener('click', (e) => {
    const card = e.target.closest('.biz-insight');
    if (!card) return;
    const model = apis.missed.getFilterModel();
    model.reason = { filterType: 'text', type: 'equals', filter: card.dataset.reason };
    apis.missed.setFilterModel(model);
    setGroupBy('none');
  });

  // ---------- Tabs, toolbar ----------
  function switchTab(name) {
    current = name;
    document.querySelectorAll('.biz-tab').forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    $('gridOrders').classList.add('hidden');
    $('gridMissed').classList.add('hidden');
    const select = $('bizGroupBy');
    select.innerHTML = Object.entries(GRIDS[name].groups).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    $('bizSearch').value = apis[name].getGridOption('quickFilterText') ?? '';
    $('bizAskExamples').innerHTML = GRIDS[name].examples.map((t) => `<button type="button" class="biz-chip">${escapeHtml(t)}</button>`).join('');
    showAskNote(askNote[name]);
    setGroupBy(groupBy[name]);
    renderInsights();
  }

  document.querySelectorAll('.biz-tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  $('bizGroupBy').addEventListener('change', (e) => setGroupBy(e.target.value));
  $('bizSearch').addEventListener('input', (e) => apis[current].setGridOption('quickFilterText', e.target.value));

  function resetView() {
    const api = apis[current];
    api.setFilterModel(null);
    api.setGridOption('quickFilterText', '');
    api.applyColumnState({ state: [{ colId: 'at', sort: 'desc' }], defaultState: { sort: null } });
    $('bizSearch').value = '';
    askNote[current] = '';
    showAskNote('');
    setGroupBy(current === 'missed' ? 'reason' : 'none');
  }
  $('bizReset').addEventListener('click', resetView);

  $('bizExport').addEventListener('click', () => {
    const grouped = groupBy[current] !== 'none';
    const file = `${current === 'orders' ? 'ai-agent-orders' : 'missed-sales'}${grouped ? `-by-${groupBy[current]}` : ''}-${dayKey(new Date())}.csv`;
    if (grouped) return summaryApi.exportDataAsCsv({ fileName: file });
    apis[current].exportDataAsCsv({
      fileName: file,
      columnKeys: GRIDS[current].columns.filter((c) => c.colId !== 'expand').map((c) => c.field),
      shouldRowBeSkipped: (p) => isDetail(p.node.data),
      processCellCallback: (p) => (p.column.getColId() === 'at' && p.value ? new Date(p.value).toISOString() : p.value),
    });
  });

  // ---------- Ask the grid in plain English ----------
  function showAskNote(text, isError = false) {
    const el = $('bizAskResult');
    el.textContent = text;
    el.classList.toggle('hidden', !text);
    el.classList.toggle('error', isError);
  }

  const DATE_OPS = { equals: 'equals', notEqual: 'notEqual', before: 'lessThan', lessThan: 'lessThan', lessThanOrEqual: 'lessThan', after: 'greaterThan', greaterThan: 'greaterThan' };

  /** The AI's answer -> an AG Grid filter model for one column. */
  function toFilter(column, f) {
    const def = GRIDS[current].columns.find((c) => c.field === column);
    const kind = column === 'at' ? 'date' : def?.filter === 'agNumberColumnFilter' ? 'number' : 'text';
    if (kind === 'date') {
      const day = (v) => `${String(v).slice(0, 10)} 00:00:00`;
      // "On or after X" -> inclusive range X..far future (date filter has no >=).
      if (f.op === 'inRange' || f.op === 'greaterThanOrEqual' || f.op === 'after') {
        return { filterType: 'date', type: 'inRange', dateFrom: day(f.value), dateTo: day(f.op === 'inRange' && f.valueTo ? f.valueTo : '2100-01-01') };
      }
      return { filterType: 'date', type: DATE_OPS[f.op] ?? 'equals', dateFrom: day(f.value) };
    }
    if (kind === 'number') {
      const type = ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange'].includes(f.op) ? f.op : 'equals';
      return { filterType: 'number', type, filter: Number(f.value), ...(type === 'inRange' ? { filterTo: Number(f.valueTo) } : {}) };
    }
    const type = ['contains', 'equals', 'notEqual'].includes(f.op) ? f.op : 'contains';
    return { filterType: 'text', type, filter: String(f.value) };
  }

  function applyAsk(result) {
    const api = apis[current];
    const model = {};
    const byColumn = new Map();
    for (const f of result.filters) byColumn.set(f.column, [...(byColumn.get(f.column) ?? []), toFilter(f.column, f)]);
    for (const [column, list] of byColumn) {
      model[column] = list.length === 1 ? list[0] : { filterType: list[0].filterType, operator: 'AND', conditions: list.slice(0, 2) };
    }
    api.setFilterModel(model);
    api.setGridOption('quickFilterText', result.search ?? '');
    $('bizSearch').value = result.search ?? '';
    if (result.sort.length) {
      api.applyColumnState({ state: result.sort.map((s, i) => ({ colId: s.column, sort: s.direction, sortIndex: i })), defaultState: { sort: null } });
    }
    setGroupBy(result.groupBy ?? 'none');
    if (result.groupBy && result.sort.some((s) => s.column === 'amount')) {
      const dir = result.sort.find((s) => s.column === 'amount').direction;
      summaryApi.applyColumnState({ state: [{ colId: 'revenue', sort: dir }], defaultState: { sort: null } });
    }
    askNote[current] = `✦ ${result.explanation}${/built-in/.test(result.model ?? '') ? ' (AI busy: answered by quick rules)' : ''}`;
    showAskNote(askNote[current]);
  }

  async function ask(text) {
    const input = $('bizAskInput');
    const button = $('bizAskBtn');
    input.value = text;
    button.disabled = true;
    button.textContent = 'Thinking…';
    showAskNote('Asking the AI to set up the grid…');
    try {
      applyAsk(await request('/biz/ask', { grid: current, text }));
    } catch (err) {
      showAskNote(`Could not do that: ${err.message}`, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Ask';
    }
  }

  $('bizAsk').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('bizAskInput').value.trim();
    if (text) ask(text);
  });
  $('bizAskExamples').addEventListener('click', (e) => {
    const chip = e.target.closest('.biz-chip');
    if (chip) ask(chip.textContent);
  });

  // ---------- Charts strip (AG Charts Community, MIT) ----------
  // The charts follow the grids: they show only the rows that pass the current filters / search / question.
  const LOST = ['#B54708', '#DC6803', '#F79009', '#FDB022', '#FEC84B', '#D0D5DD', '#98A2B3'];
  const charts = {};
  const chartBase = {
    height: 240, // same as .biz-chart: AG Charts defaults to 300px, which spilled over the grid tabs
    background: { fill: 'transparent' },
    padding: { top: 8, right: 8, bottom: 4, left: 4 },
  };
  const shortName = (t, n = 26) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  // Legend-sized names for the lost-sale reasons.
  const SHORT_REASON = {
    "Customer picked another option": 'Picked another option',
    "Customer's budget ran out": 'Budget ran out',
    "Over the customer's price limit": 'Over price limit',
    'Customer changed their rules': 'Rules changed',
    'Customer said no': 'Customer said no',
    'Price changed at checkout': 'Price changed',
    'Price could not be checked': 'Price not verified',
    "Shop not on the customer's list": 'Shop not allowed',
    "Customer's daily limit reached": 'Daily limit',
    'Looked like a repeat order': 'Looked like repeat',
    'Bill did not match': 'Bill did not match',
  };

  function chartOptions() {
    const orders = apis.orders ? visibleRows('orders') : [];
    const missedRows = apis.missed ? visibleRows('missed') : [];
    const paid = orders.filter((o) => o.status !== 'Failed');

    // Revenue per day: every day from the first order to today, so quiet days show as gaps.
    const byDay = new Map();
    for (const o of paid) byDay.set(dayKey(o.at), (byDay.get(dayKey(o.at)) ?? 0) + o.amount);
    const days = [...byDay.keys()].sort();
    const series = [];
    if (days.length) {
      const last = dayKey(new Date());
      for (let d = new Date(`${days[0]}T00:00:00`); dayKey(d) <= last && series.length < 60; d.setDate(d.getDate() + 1)) {
        series.push({ day: dayLabel(dayKey(d)), revenue: Math.round((byDay.get(dayKey(d)) ?? 0) * 100) / 100 });
      }
    }
    $('chartRevenueNote').textContent = paid.length ? `${usd(paid.reduce((s, o) => s + o.amount, 0))} total` : '';

    const products = [...paid.reduce((m, o) => m.set(o.product, (m.get(o.product) ?? 0) + o.amount), new Map())]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([product, revenue]) => ({ product: shortName(product, 20), full: product, revenue: Math.round(revenue * 100) / 100 }));

    const lostBy = [...missedRows.reduce((m, r) => m.set(r.reason, (m.get(r.reason) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
    const outcome = [{ label: 'Bought', full: 'Bought', count: orders.length }, ...lostBy.map(([label, count]) => ({ label: SHORT_REASON[label] ?? label, full: label, count }))].filter((r) => r.count > 0);
    const attempts = orders.length + missedRows.length;
    $('chartOutcomeNote').textContent = attempts ? `${Math.round((orders.length / attempts) * 100)}% bought · ${attempts} attempts` : '';

    return {
      chartRevenue: {
        ...chartBase,
        data: series,
        series: [{ type: 'bar', xKey: 'day', yKey: 'revenue', yName: 'Revenue', fill: '#0070BA', cornerRadius: 4,
          tooltip: { renderer: (p) => ({ heading: p.datum.day, data: [{ label: 'Revenue', value: usd(p.datum.revenue) }] }) } }],
        axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left', label: { formatter: (p) => `$${p.value}` } } },
        legend: { enabled: false },
      },
      chartProducts: {
        ...chartBase,
        data: products,
        series: [{ type: 'bar', direction: 'horizontal', xKey: 'product', yKey: 'revenue', yName: 'Revenue', fill: '#0070BA', cornerRadius: 4,
          // Product names sit on the bars, so long names never get clipped by the axis.
          label: { placement: 'outside-end', color: '#14171A', fontSize: 11, fontWeight: 600, formatter: (p) => `${p.datum.product} · ${usd(p.datum.revenue)}` },
          tooltip: { renderer: (p) => ({ heading: p.datum.full, data: [{ label: 'Revenue', value: usd(p.datum.revenue) }] }) } }],
        // Room on the right for the name + amount written after each bar.
        axes: { x: { type: 'category', position: 'left', label: { enabled: false } }, y: { type: 'number', position: 'bottom', max: Math.max(1, ...products.map((d) => d.revenue)) * 3, label: { enabled: false }, gridLine: { enabled: false } } },
        legend: { enabled: false },
      },
      chartOutcome: {
        ...chartBase,
        data: outcome,
        // Bars, not a donut: every reason stays readable at this size (green = bought, orange = lost).
        series: [{
          type: 'bar', direction: 'horizontal', xKey: 'label', yKey: 'count', yName: 'Attempts', cornerRadius: 4,
          itemStyler: (p) => ({ fill: p.datum.label === 'Bought' ? '#00875A' : '#DC6803' }),
          label: { placement: 'outside-end', color: '#14171A', fontSize: 11, fontWeight: 600, formatter: (p) => `${p.datum.label} · ${p.datum.count}` },
          tooltip: { renderer: (p) => ({ heading: p.datum.full, data: [{ label: p.datum.label === 'Bought' ? 'Orders' : 'Attempts', value: String(p.datum.count) }] }) },
        }],
        axes: { x: { type: 'category', position: 'left', label: { enabled: false } }, y: { type: 'number', position: 'bottom', max: Math.max(1, ...outcome.map((d) => d.count)) * 2.2, label: { enabled: false }, gridLine: { enabled: false } } },
        legend: { enabled: false },
      },
    };
  }

  function renderCharts() {
    if (!window.agCharts) return;
    const { AgCharts } = window.agCharts;
    for (const [id, options] of Object.entries(chartOptions())) {
      try {
        if (charts[id]) charts[id].update({ ...options, container: $(id) });
        else charts[id] = AgCharts.create({ ...options, container: $(id) });
      } catch (err) {
        console.warn(`Chart ${id} failed:`, err.message);
      }
    }
  }

  let chartTimer;
  function chartsSoon() {
    clearTimeout(chartTimer);
    chartTimer = setTimeout(renderCharts, 120);
  }

  // ---------- KPIs ----------
  function renderKpis() {
    const paid = data.orders.filter((o) => o.status !== 'Failed');
    const revenue = paid.reduce((s, o) => s + o.amount, 0);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = paid.filter((o) => new Date(o.at).getTime() >= weekAgo).reduce((s, o) => s + o.amount, 0);
    $('kpiRevenue').textContent = usd(revenue);
    $('kpiRevenueSub').textContent = `${usd(week)} in the last 7 days`;
    $('kpiOrders').textContent = String(data.orders.length);
    const buyers = new Set(data.orders.map((o) => o.customer)).size;
    $('kpiOrdersSub').textContent = `from ${buyers} ${buyers === 1 ? "customer's agent" : "customers' agents"}`;
    const lost = data.missed.reduce((s, m) => s + m.amount, 0);
    $('kpiMissed').textContent = usd(lost);
    $('kpiMissedSub').textContent = `${data.missed.length} attempts agents could not complete`;
    const attempts = data.orders.length + data.missed.length;
    $('kpiConversion').textContent = attempts ? `${Math.round((data.orders.length / attempts) * 100)}%` : '–';
  }

  // ---------- Live PayPal balance ----------
  async function loadBalance(fresh = false) {
    const value = $('bizBalance');
    const sub = $('bizBalanceSub');
    const btn = $('bizBalanceRefresh');
    btn.disabled = true;
    btn.classList.add('spinning');
    if (!balanceShown) sub.textContent = `Reading from the PayPal sandbox (${me.sandboxEmail})…`;
    try {
      const result = await request(`/biz/balance${fresh ? '?fresh=1' : ''}`);
      if (result.status === 'OK') {
        balanceShown = true;
        value.textContent = (result.cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        sub.textContent = `Live PayPal sandbox balance (${me.sandboxEmail}) · checked ${new Date(result.readAt).toLocaleTimeString()}`;
      } else if (result.status === 'NO_PASSWORD') {
        value.textContent = '–';
        sub.textContent = `Not connected yet: add ${result.env} to .env`;
      } else {
        sub.textContent = /Could not log in/.test(result.message)
          ? `PayPal rejected the sandbox login for ${me.sandboxEmail}: check its password in .env`
          : `Could not read the sandbox balance: ${result.message.slice(0, 120)}`;
      }
    } catch (err) {
      sub.textContent = `Could not read the sandbox balance: ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.classList.remove('spinning');
    }
  }
  let balanceShown = false;
  $('bizBalanceRefresh').addEventListener('click', () => loadBalance(true));

  // ---------- PayPal Business home: recent activity, AI teaser, nav ----------
  function renderRecent() {
    const box = $('bizRecent');
    const rows = data.orders.slice(0, 6);
    if (!rows.length) {
      box.innerHTML = '<p class="biz-muted biz-recent-empty">No payments yet. When an AI agent buys from your shop, it shows up here.</p>';
      return;
    }
    box.innerHTML = rows.map((o) => {
      const failed = o.status === 'Failed';
      return `
      <div class="tx-item" tabindex="0" data-order="${escapeHtml(o.id)}">
        <div class="tx-avatar biz-tx-avatar">${escapeHtml(o.customer.replace('Customer ', ''))}</div>
        <div class="tx-info">
          <div class="tx-title-row">
            <span class="tx-merchant">Payment from ${escapeHtml(o.customer)}</span>
            <span class="tx-amount ${failed ? 'negative' : 'positive'}">${failed ? '' : '+'}${usd(o.amount)} USD</span>
          </div>
          <div class="tx-sub-row">
            <span class="tx-meta">${escapeHtml(fmtDate(o.at))} &bull; ${escapeHtml(o.product.slice(0, 48))} &bull; via AI agent</span>
            <span class="tx-status">${escapeHtml(failed ? 'Failed' : o.status === 'Paid' ? 'Completed' : o.status)}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  $('bizRecent').addEventListener('click', (e) => {
    const row = e.target.closest('[data-order]');
    if (!row) return;
    showSection('ai-sales');
    switchTab('orders');
    const order = data.orders.find((o) => o.id === row.dataset.order);
    const node = order && apis.orders.getRowNode(order.id);
    if (node) {
      if (!expanded.orders.has(order.id)) toggleDetail('orders', order);
      setTimeout(() => apis.orders.ensureNodeVisible(node, 'middle'), 400);
      apis.orders.flashCells({ rowNodes: [node] });
    }
  });

  function renderTeaser() {
    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = data.orders.filter((o) => o.status !== 'Failed' && new Date(o.at).getTime() >= weekAgo).reduce((s, o) => s + o.amount, 0);
    $('teaserWeek').textContent = usd(week);
    $('teaserMissed').textContent = `${data.missed.length} · ${usd(data.missed.reduce((s, m) => s + m.amount, 0))}`;
  }

  const SECTIONS = { home: null, activity: 'bizActivitySection', 'ai-sales': 'aiSalesSection' };
  function showSection(name) {
    document.querySelectorAll('.nav-item').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    const id = SECTIONS[name];
    if (id) $(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const DEMO_TABS = { 'get-paid': 'Pay & Get Paid: invoices, payment links and Checkout', reports: 'Reports: statements and tax documents', help: 'Help Center and business support' };
  document.querySelectorAll('.nav-item').forEach((tab) => tab.addEventListener('click', () => {
    if (DEMO_TABS[tab.dataset.tab]) return toast(DEMO_TABS[tab.dataset.tab]);
    showSection(tab.dataset.tab);
  }));
  document.querySelectorAll('[data-tab-link]').forEach((el) => el.addEventListener('click', () => showSection(el.dataset.tabLink)));
  document.querySelectorAll('[data-demo]').forEach((el) => el.addEventListener('click', () => toast(el.dataset.demo)));
  $('bizNotificationsBtn').addEventListener('click', () => toast(data.missed.length ? `${data.missed.length} sales AI agents could not complete. Open AI agent sales → Missed sales.` : 'No new notifications'));

  // ---------- Data loading + live updates ----------
  // ---------- Channel3 market check for missed sales (loads after the grid) ----------
  let marketLoaded = false;
  let market = {};
  const withMarket = (r) => {
    const m = market[r.id];
    return { ...r, market: m ?? null, marketLow: m?.marketLow ?? null, cheapestAt: m?.cheapestAt ?? '', marketTrend: m?.trend ?? '' };
  };

  async function loadMarket() {
    try {
      market = await request('/biz/missed/market');
    } catch (err) {
      console.warn('Market check failed:', err.message);
    }
    marketLoaded = true;
    data.missed = data.missed.map(withMarket);
    const open = data.missed.filter((r) => expanded.missed.has(r.id)).map((r) => ({ ...r, __detail: true }));
    apis.missed.applyTransaction({ update: [...data.missed, ...open] });
    apis.missed.refreshCells({ force: true, columns: ['marketLow'] });
    apis.missed.redrawRows();
    renderInsights();
    if (current === 'missed' && groupBy.missed !== 'none') renderSummary();
    const matched = Object.keys(market).length;
    if (matched) toast(`Channel3: market prices found for ${matched} missed ${matched === 1 ? 'sale' : 'sales'}`);
  }

  async function load(name, { flash = false } = {}) {
    const rows = (await request(`/biz/${name}`)).map((r) => (name === 'missed' ? withMarket(r) : r));
    const api = apis[name];
    const before = new Map(data[name].map((r) => [r.id, r]));
    data[name] = rows;
    if (!flash) {
      // Keep open "why" rows open across a reload.
      const open = rows.filter((r) => expanded[name].has(r.id)).map((r) => ({ ...r, __detail: true }));
      api.setGridOption('rowData', [...rows, ...open]);
      return [];
    }
    const added = rows.filter((r) => !before.has(r.id));
    const changed = rows.filter((r) => before.has(r.id) && JSON.stringify(before.get(r.id)) !== JSON.stringify(r));
    const gone = [...before.values()].filter((r) => !rows.some((n) => n.id === r.id));
    api.applyTransaction({ add: added, update: changed, remove: gone });
    const nodes = [...added, ...changed].map((r) => api.getRowNode(r.id)).filter(Boolean);
    if (nodes.length) api.flashCells({ rowNodes: nodes, flashDuration: 1800, fadeDuration: 1200 });
    return added;
  }

  let refreshTimer;
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        const [newOrders, newMissed] = await Promise.all([load('orders', { flash: true }), load('missed', { flash: true })]);
        renderKpis();
        renderRecent();
        renderTeaser();
        if (newOrders.length) {
          const o = newOrders[0];
          toast(`New AI-agent order: ${o.product.slice(0, 60)} · ${usd(o.amount)}`);
          pulseLive();
          loadBalance(true);
        } else if (newMissed.length) {
          loadMarket();
          toast(`Missed sale: ${newMissed[0].reason}`);
          pulseLive();
        }
      } catch (err) {
        console.warn('Refresh failed:', err.message);
      }
    }, 600);
  }

  function pulseLive() {
    const el = $('bizLive');
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = Object.assign(document.createElement('script'), { src });
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.append(s);
    });
  }

  async function connectLive() {
    try {
      if (!window.io) await loadScript('/socket.io/socket.io.js');
      const socket = window.io();
      for (const event of ['ledger:updated', 'decision:created', 'proposal:created']) socket.on(event, refreshSoon);
      socket.on('connect', () => $('bizLive').classList.remove('off'));
      socket.on('disconnect', () => $('bizLive').classList.add('off'));
    } catch (err) {
      $('bizLive').classList.add('off');
      console.warn('Live updates off:', err.message);
    }
  }

  // ---------- Start ----------
  let me = null;

  $('bizLogout').addEventListener('click', async () => {
    await request('/auth/logout', {}).catch(() => {});
    location.assign('/');
  });

  async function start() {
    try {
      me = await request('/biz/me');
    } catch {
      return location.assign('/'); // not logged in as a business
    }
    document.title = `${me.name} · PayPal Business`;
    $('bizName').textContent = me.name;
    $('bizEmail').textContent = 'Business Account';
    $('bizEmail').title = `PayPal sandbox business account: ${me.sandboxEmail}`;
    $('bizAvatar').textContent = me.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const h = new Date().getHours();
    $('bizGreeting').textContent = `${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, ${me.name}`;
    // A utility gets bill-shaped examples instead of shopping ones.
    if (me.storefronts.length && me.storefronts.every((s) => /utility/i.test(s))) {
      GRIDS.orders.examples = ['bill payments this month', 'payments over $100', 'group by category', 'failed payments'];
      GRIDS.missed.examples = ['group by reason', 'amount differs from the bill', 'missed this month over $100'];
    }
    $('bizStorefronts').innerHTML = `<span class="biz-muted">Your shop</span>${me.storefronts.map((s) => `<span class="biz-store">${escapeHtml(s)}</span>`).join('')}`;

    // One shop per business: the Storefront column and grouping only help when there are several.
    if (me.storefronts.length <= 1) {
      for (const def of Object.values(GRIDS)) {
        def.columns = def.columns.filter((c) => c.field !== 'storefront');
        delete def.groups.storefront;
      }
    }
    apis.orders = makeListGrid('orders');
    apis.missed = makeListGrid('missed');
    switchTab('orders');
    loadBalance();
    await Promise.all([load('orders'), load('missed')]);
    loadMarket(); // other stores' prices (Channel3) fill in a moment later
    renderKpis();
    renderInsights();
    renderRecent();
    renderTeaser();
    // Charts measure their labels: wait for the Inter web font so names are not clipped.
    await document.fonts?.ready?.catch(() => {});
    renderCharts();
    connectLive();
  }

  start();
})();
