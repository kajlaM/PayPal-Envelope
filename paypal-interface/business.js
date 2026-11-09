/**
 * PayPal Business dashboard: the seller side of agentic commerce.
 * Everything here is built from the payments this business received. The page never talks to, slows
 * or influences any shopping agent or customer: it only reads data and shows it in AG Grid.
 *   - AG Grid Enterprise used directly: row grouping + aggregation, pivot, tool panels, Set filters,
 *     master/detail, selection + bulk actions, editing with undo/redo, status bar, Excel export,
 *     Integrated Charts and cross-filter charts, saved views (grid state)
 *   - "Ask the grid" -> our AI turns plain English into AG Grid filter / sort / group settings
 *   - Morning briefing (full-width pinned row), Stampede watch, Bought together, TV mode, Accountant report
 */
(() => {
  const { createGrid, themeQuartz, LicenseManager } = window.agGrid;
  if (window.AG_GRID_LICENSE_KEY) {
    LicenseManager?.setLicenseKey(window.AG_GRID_LICENSE_KEY);
    window.agCharts?.AgCharts?.setLicenseKey?.(window.AG_GRID_LICENSE_KEY);
  }

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

  // ---------- Integrated Charts (AG Grid Enterprise) ----------
  // Charts are made from a grid's cells and stay linked to it: filter or sort the grid and the chart
  // follows. They open in one dock under the grids (one chart at a time).
  const PAYPAL_FILLS = ['#0070BA', '#003087', '#00875A', '#DC6803', '#7C3AED', '#0EA5E9', '#B54708', '#98A2B3'];
  const chartGridOptions = {
    popupParent: document.body, // chart menus open next to the chart (the dock is outside the grid)
    cellSelection: true,
    enableCharts: true,
    chartThemes: ['paypal', 'ag-default', 'ag-vivid', 'ag-material'],
    customChartThemes: {
      paypal: {
        baseTheme: 'ag-default',
        palette: { fills: PAYPAL_FILLS, strokes: PAYPAL_FILLS },
        overrides: { common: { background: { fill: '#FFFFFF' } } },
      },
    },
    createChartContainer: (chartRef) => dockChart(chartRef),
    onChartDestroyed: (e) => {
      if (docked?.chartId === e.chartId) hideDock();
    },
  };

  let docked = null; // the chart in the dock
  let dockedFrom = ''; // which grid it came from: summary | together | stampede
  let nextChart = { title: 'Chart from your selection', from: '' };

  function dockChart(chartRef) {
    if (docked && docked.chartId !== chartRef.chartId) {
      const old = docked;
      docked = null;
      old.destroyChart();
    }
    docked = chartRef;
    dockedFrom = nextChart.from;
    $('bizChartTitle').textContent = nextChart.title;
    nextChart = { title: 'Chart from your selection', from: '' };
    const host = $('bizChartHost');
    host.replaceChildren(chartRef.chartElement);
    $('bizChartDock').classList.remove('hidden');
    requestAnimationFrame(() => $('bizChartDock').scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function hideDock() {
    docked = null;
    dockedFrom = '';
    $('bizChartHost').replaceChildren();
    $('bizChartDock').classList.add('hidden');
  }

  function closeChart() {
    const chart = docked;
    hideDock();
    chart?.destroyChart();
  }

  /** A linked chart from one grid's columns (all rows that pass its filters). */
  function chartFrom(api, from, title, params) {
    nextChart = { title, from };
    requestAnimationFrame(() => api.createRangeChart({ chartThemeName: 'paypal', ...params }));
  }

  $('bizChartClose').addEventListener('click', closeChart);

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
  const moneyCol = (field, headerName, extra = {}) => ({
    field, headerName, width: 120, type: 'rightAligned', filter: 'agNumberColumnFilter',
    valueFormatter: (p) => (p.value === null || p.value === undefined ? '–' : usd(p.value)), ...extra,
  });
  const pill = (cls) => (p) => p.value ? `<span class="biz-pill ${cls(p.value)}">${escapeHtml(p.value)}</span>` : '';
  const shortName = (t, n = 26) => (String(t).length > n ? `${String(t).slice(0, n - 1)}…` : String(t));

  const STATUS_CLASS = { Completed: 'ok', Pending: 'wait', Failed: 'bad', Reversed: 'bad' };
  const PAYPAL_CLASS = { Confirmed: 'ok', Processing: 'wait', Differs: 'bad', 'Not checked': 'info' };
  const KIND_CLASS = { sale: 'ok', refund: 'bad', fee: 'wait', transfer: 'info', other: 'info', none: 'info' };
  const TAGS = ['', 'Follow up', 'Wholesale', 'Gift', 'VIP', 'Disputed', 'Tax review'];
  /** Money that came in as a sale (agent or not) and was not failed or reversed. */
  const isSale = (o) => o.kind === 'sale' && o.status !== 'Failed' && o.status !== 'Reversed';
  const sourceHtml = (p) => p.data?.agent ? '<span class="biz-pill agent">✦ AI agent</span>' : p.value ? `<span class="biz-source-name">${escapeHtml(p.value)}</span>` : '';
  const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
  const monthLabel = (key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // ---------- State ----------
  let current = 'orders';
  const data = { orders: [] };
  const apis = {};
  const askNote = { orders: '' };
  const GRIDS = { orders: { examples: ['only AI agent payments', 'sales this week over $40', 'refunds this month', 'group by source'] } };

  // ---------- Source chips: All / AI agents / Other PayPal / Money out ----------
  let sourceFilter = 'all';
  const matchSource = (r, f = sourceFilter) => !r || f === 'all' || (f === 'agent' ? r.agent : f === 'other' ? !r.agent : r.direction === 'out');
  function setSourceFilter(f) {
    sourceFilter = f;
    document.querySelectorAll('.biz-source').forEach((c) => c.classList.toggle('active', c.dataset.source === f));
    apis.orders.onFilterChanged();
  }
  $('bizSources').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-source]');
    if (chip) setSourceFilter(chip.dataset.source);
  });
  function renderSourceCounts() {
    for (const [id, f] of [['srcAll', 'all'], ['srcAgent', 'agent'], ['srcOther', 'other'], ['srcOut', 'out']]) $(id).textContent = String(data.orders.filter((r) => matchSource(r, f)).length);
  }

  // ---------- The transactions grid: AG Grid Enterprise, used directly ----------
  // Row grouping (drag a header to the group bar) with sum aggregation and a pinned grand total, pivot mode
  // and the Columns / Filters tool panels, Set filters, master/detail (items of a transaction in a nested
  // grid), multi-row selection with bulk actions, cell editing with undo/redo (Reconciled / Tag / Note),
  // cell ranges with the aggregation status bar, Integrated Charts, cross-filter charts and Excel export.
  const group = { filter: 'agSetColumnFilter', enableRowGroup: true, enablePivot: true, chartDataType: 'category' };
  const leaf = (fn) => (p) => (p.data ? fn(p) : p.value == null ? '' : escapeHtml(p.valueFormatted ?? p.value));
  const editable = (p) => Boolean(p.data) && !p.node.rowPinned;
  const money = (field, headerName, extra = {}) => moneyCol(field, headerName, {
    aggFunc: 'sum', enableValue: true, chartDataType: 'series', width: 115,
    cellClassRules: { 'biz-neg': (p) => p.value < 0 }, ...extra,
  });

  const mainColumns = [
    {
      field: 'at', headerName: 'Time', width: 165, sort: 'desc', filter: 'agDateColumnFilter', filterParams: dateFilterParams,
      valueGetter: (p) => (p.data?.at ? new Date(p.data.at) : null), valueFormatter: (p) => fmtDate(p.value), getQuickFilterText: (p) => fmtDate(p.value),
      cellRenderer: 'agGroupCellRenderer', chartDataType: 'excluded', // ▸ opens the transaction's items (master/detail)
    },
    { colId: 'day', headerName: 'Day', hide: true, ...group, valueGetter: (p) => (p.data ? dayKey(p.data.at) : undefined), valueFormatter: (p) => (p.value ? dayLabel(p.value) : ''), filterParams: { valueFormatter: (p) => (p.value ? dayLabel(p.value) : '') } },
    { colId: 'month', headerName: 'Month', hide: true, ...group, valueGetter: (p) => (p.data ? monthKey(p.data.at) : undefined), valueFormatter: (p) => (p.value ? monthLabel(p.value) : ''), filterParams: { valueFormatter: (p) => (p.value ? monthLabel(p.value) : '') } },
    {
      field: 'product', headerName: 'Item', flex: 2, minWidth: 220, ...group, tooltipField: 'product',
      cellRenderer: leaf((p) => `${escapeHtml(p.value)}${p.data.sample ? ' <span class="biz-sample" title="Demo data (BIZ_SAMPLE_DATA=0 turns it off)">Sample</span>' : ''}`),
    },
    money('amount', 'Gross'),
    money('fee', 'Fee', { width: 100, headerTooltip: 'PayPal fee' }),
    money('net', 'Net'),
    money('sales', 'Sales', { colId: 'sales', field: undefined, hide: true, valueGetter: (p) => (p.data ? (isSale(p.data) ? p.data.amount : 0) : undefined), headerTooltip: 'Money in from sales (gross)' }),
    money('agentSales', 'AI-agent sales', { colId: 'agentSales', field: undefined, hide: true, valueGetter: (p) => (p.data ? (isSale(p.data) && p.data.agent ? p.data.amount : 0) : undefined) }),
    money('otherSales', 'Other sales', { colId: 'otherSales', field: undefined, hide: true, valueGetter: (p) => (p.data ? (isSale(p.data) && !p.data.agent ? p.data.amount : 0) : undefined) }),
    { field: 'source', headerName: 'Source', width: 160, ...group, cellRenderer: leaf(sourceHtml), tooltipField: 'source' },
    { field: 'type', headerName: 'Type', width: 175, ...group, cellRenderer: leaf((p) => `<span class="biz-pill ${p.data.status === 'Failed' ? 'bad' : KIND_CLASS[p.data.kind] ?? 'info'}">${escapeHtml(p.value)}</span>`) },
    { field: 'customer', headerName: 'Payer', width: 165, ...group, tooltipValueGetter: (p) => (p.data?.agent ? 'Anonymous buyer (paid by an AI agent)' : p.data?.payerEmail || p.value) },
    { field: 'status', headerName: 'Status', width: 120, ...group, cellRenderer: leaf(pill((v) => STATUS_CLASS[v] ?? 'info')), enableCellChangeFlash: true },
    { field: 'paypal', headerName: 'PayPal check', width: 130, ...group, cellRenderer: leaf(pill((v) => PAYPAL_CLASS[v] ?? 'info')), tooltipField: 'paypalNote', headerTooltip: 'In PayPal\'s own records (read-only)' },
    { field: 'reconciled', headerName: 'Reconciled', width: 120, cellDataType: 'boolean', editable, filter: 'agSetColumnFilter', enableRowGroup: true, chartDataType: 'excluded', headerTooltip: 'Your own bookkeeping: tick when it matches your books' },
    {
      field: 'tag', headerName: 'Tag', width: 130, editable, ...group, cellEditor: 'agRichSelectCellEditor', cellEditorParams: { values: TAGS },
      cellRenderer: leaf((p) => (p.value ? `<span class="biz-tag">${escapeHtml(p.value)}</span>` : '')),
    },
    { field: 'note', headerName: 'Note', width: 200, editable, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true, cellEditorParams: { maxLength: 500, rows: 4, cols: 40 }, filter: 'agTextColumnFilter', chartDataType: 'excluded' },
    { field: 'category', headerName: 'Category', width: 125, hide: true, ...group },
    { field: 'storefront', headerName: 'Storefront', width: 125, hide: true, ...group },
    { field: 'paypalRef', headerName: 'PayPal ID', width: 170, hide: true, filter: 'agTextColumnFilter', chartDataType: 'excluded' },
  ];

  // The items of a transaction, in a nested AG Grid (master/detail).
  const detailHeader = (r) => `
    <div class="biz-master-head">
      <div><span class="biz-muted">${escapeHtml(r.type)} · ${escapeHtml(fmtDate(r.at))}</span>
        <strong>${usd(r.amount)}</strong> gross${r.fee != null ? ` · fee ${usd(r.fee)} · <strong>${usd(r.net)}</strong> net` : ' · fee not reported yet'}</div>
      <div>${r.agent ? `<span class="biz-pill agent">✦ AI agent</span> via ${escapeHtml(r.paidVia)} · ${escapeHtml(r.customer)} (anonymous buyer)` : `${escapeHtml(r.source)} · ${escapeHtml(r.customer || '–')}${r.payerEmail ? ` · ${escapeHtml(r.payerEmail)}` : ''}`}</div>
      <div class="biz-muted">${escapeHtml(r.paypalNote)} · ID ${escapeHtml(r.paypalRef || '–')}${r.invoiceId ? ` · invoice ${escapeHtml(r.invoiceId)}` : ''}${related(r)}</div>
    </div>`;
  const related = (r) => {
    const refund = data.orders.filter((o) => o.relatedTo === r.id);
    const of = r.relatedTo ? data.orders.find((o) => o.id === r.relatedTo) : null;
    return of ? ` · for the ${usd(of.amount)} payment of ${escapeHtml(fmtDate(of.at))}`
      : refund.length ? ` · <span class="biz-neg">${refund.map((x) => `${escapeHtml(x.type)} ${usd(x.amount)}`).join(', ')}</span>` : '';
  };
  const detailCellRendererParams = {
    refreshStrategy: 'rows',
    template: (p) => `<div class="biz-master">${detailHeader(p.data)}<div data-ref="eDetailGrid" class="biz-master-grid"></div></div>`,
    detailGridOptions: {
      theme,
      columnDefs: [
        { field: 'name', headerName: 'Item', flex: 2 },
        { field: 'quantity', headerName: 'Qty', width: 80, type: 'rightAligned' },
        { colId: 'unit', headerName: 'Unit price', width: 120, type: 'rightAligned', valueGetter: (p) => (p.data.quantity ? p.data.amount / p.data.quantity : p.data.amount), valueFormatter: (p) => usd(p.value) },
        { field: 'amount', headerName: 'Amount', width: 120, type: 'rightAligned', valueFormatter: (p) => usd(p.value) },
      ],
      defaultColDef: { sortable: false, resizable: true, suppressHeaderMenuButton: true },
      domLayout: 'autoHeight',
      rowHeight: 36,
      headerHeight: 34,
      overlayNoRowsTemplate: '<span class="biz-muted">No items for this transaction.</span>',
    },
    getDetailRowData: (p) => p.successCallback(p.data.lines?.length ? p.data.lines : []),
  };

  function makeMainGrid() {
    return createGrid($('gridOrders'), {
      theme,
      columnDefs: mainColumns,
      defaultColDef: { sortable: true, resizable: true, filter: true, minWidth: 80, suppressHeaderMenuButton: true },
      autoGroupColumnDef: { headerName: 'Group', minWidth: 250, cellRendererParams: { suppressCount: false } },
      rowData: [],
      getRowId: (p) => p.data.id,
      animateRows: true,
      tooltipShowDelay: 400,
      // Grouping, aggregation, pivot
      rowGroupPanelShow: 'always',
      pivotPanelShow: 'onlyWhenPivoting',
      suppressAggFuncInHeader: true,
      grandTotalRow: 'bottom', // ('pinnedBottom' switches v36 to manual pinning, which drops the briefing row)
      groupDefaultExpanded: 0,
      sideBar: { toolPanels: ['columns', 'filters'] },
      statusBar: {
        statusPanels: [
          { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
          { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
          { statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['sum', 'avg', 'count'] } },
        ],
      },
      // Selection, ranges, charts
      rowSelection: { mode: 'multiRow', checkboxes: true, headerCheckbox: true, groupSelects: 'filteredDescendants', enableClickSelection: false },
      selectionColumnDef: { pinned: 'left', width: 48 },
      ...chartGridOptions,
      // Master/detail: a transaction's items
      masterDetail: true,
      isRowMaster: (d) => Boolean(d && !d.__briefing),
      detailRowAutoHeight: true,
      detailCellRendererParams,
      // Editing (merchant-only bookkeeping), with undo/redo
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 25,
      stopEditingWhenCellsLoseFocus: true,
      onCellValueChanged: saveEdit,
      // Source chips
      isExternalFilterPresent: () => sourceFilter !== 'all',
      doesExternalFilterPass: (node) => matchSource(node.data),
      // Morning briefing: a full-width pinned row
      pinnedTopRowData: [],
      isFullWidthRow: (p) => Boolean(p.rowNode.data?.__briefing),
      fullWidthCellRenderer: (p) => Object.assign(document.createElement('div'), { className: 'biz-briefing-wrap', innerHTML: briefingHtml(p.data) }),
      getRowHeight: (p) => (p.data?.__briefing ? 52 : undefined),
      rowHeight: 44,
      onRowClicked: (p) => { if (p.data?.__briefing) showBriefingDay(p.data); },
      onFilterChanged: () => afterChange('orders'),
      onModelUpdated: () => afterChange('orders'),
      onSelectionChanged: renderBulk,
      getContextMenuItems,
      excelStyles: [
        { id: 'header', font: { bold: true }, interior: { color: '#E8F1F8', pattern: 'Solid' } },
        { id: 'biz-neg', font: { color: '#D9381E' } },
      ],
      overlayNoRowsTemplate: '<span class="biz-empty">No transactions match. Try “Reset view”.</span>',
    });
  }

  /** Leaf rows (real transactions) that pass every filter, chip and search. */
  function visibleRows(name) {
    const rows = [];
    apis[name].forEachNodeAfterFilter((n) => { if (n.data && !n.group) rows.push(n.data); });
    return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  let afterTimer;
  function afterChange() {
    clearTimeout(afterTimer);
    afterTimer = setTimeout(() => {
      renderSourceCounts();
      renderKpis();
      $('countOrders').textContent = String(data.orders.length);
    }, 50);
  }

  // ---------- Editing: Reconciled / Tag / Note (saved for this business only) ----------
  async function saveEdit(e) {
    if (!e.data || !['reconciled', 'tag', 'note'].includes(e.colDef.field)) return;
    try {
      await request('/biz/notes', { id: e.data.id, field: e.colDef.field, value: e.newValue });
      const row = data.orders.find((o) => o.id === e.data.id);
      if (row) row[e.colDef.field] = e.newValue;
    } catch (err) {
      toast(`Could not save: ${err.message}`);
      e.node.setDataValue(e.colDef.field, e.oldValue);
    }
  }

  function renderBulk() {
    const n = apis.orders.getSelectedRows().filter((r) => !r.reconciled).length;
    const btn = $('bizBulkReconcile');
    btn.classList.toggle('hidden', !apis.orders.getSelectedRows().length);
    btn.textContent = n ? `Mark ${n} reconciled` : 'All selected are reconciled';
    btn.disabled = !n;
  }

  async function markReconciled(rows) {
    const todo = rows.filter((r) => !r.reconciled);
    for (const r of todo) apis.orders.getRowNode(r.id)?.setDataValue('reconciled', true); // saves through onCellValueChanged
    toast(`${todo.length} ${todo.length === 1 ? 'transaction' : 'transactions'} marked reconciled. Ctrl/⌘+Z undoes it.`);
  }
  $('bizBulkReconcile').addEventListener('click', () => markReconciled(apis.orders.getSelectedRows()));

  function getContextMenuItems(p) {
    const items = [];
    const selected = apis.orders.getSelectedRows();
    if (selected.length) {
      items.push({ name: `Mark ${selected.length} selected reconciled`, action: () => markReconciled(selected) });
      items.push({ name: `Export ${selected.length} selected to Excel`, action: () => exportExcel({ onlySelected: true }) });
    } else if (p.node?.data && !p.node.rowPinned) {
      items.push({ name: 'Mark reconciled', action: () => markReconciled([p.node.data]) });
    }
    if (p.node?.data?.paypalRef) items.push({ name: 'Copy PayPal transaction ID', action: () => navigator.clipboard?.writeText(p.node.data.paypalRef).then(() => toast('PayPal ID copied')) });
    if (p.node?.data?.customer && !p.node.rowPinned) items.push({ name: `Show only ${shortName(p.node.data.customer, 24)}`, action: () => setColumnFilterValues('customer', [p.node.data.customer]) });
    return [...items, 'separator', ...(p.defaultItems ?? ['copy', 'copyWithHeaders', 'separator', 'chartRange', 'export'])];
  }

  function setColumnFilterValues(colId, values) {
    const model = apis.orders.getFilterModel();
    model[colId] = { filterType: 'set', values };
    apis.orders.setFilterModel(model);
  }

  // ---------- Saved views (AG Grid state: columns, grouping, pivot, filters, sort) ----------
  const GRID_STATE_IGNORE = ['rowSelection', 'focusedCell', 'scroll', 'cellSelection', 'rowGroupExpansion', 'pagination'];
  const cols = (shown, extra = []) => [...shown.map((colId) => ({ colId, hide: false })), ...extra];
  const VIEWS = [
    { id: 'all', name: 'All transactions', apply: () => {} },
    {
      id: 'agent-items', name: 'AI-agent sales by item',
      apply: (api) => {
        setSourceFilter('agent');
        api.applyColumnState({ state: [{ colId: 'product', rowGroup: true, rowGroupIndex: 0 }, { colId: 'sales', hide: false, sort: 'desc' }], defaultState: { rowGroup: false, sort: null } });
      },
    },
    {
      id: 'month-end', name: 'Month-end: by month and source',
      apply: (api) => api.applyColumnState({ state: [{ colId: 'month', rowGroup: true, rowGroupIndex: 0 }, { colId: 'source', rowGroup: true, rowGroupIndex: 1 }, { colId: 'sales', hide: false }], defaultState: { rowGroup: false } }),
    },
    {
      id: 'pivot', name: 'Pivot: sales per day by source',
      apply: (api) => {
        api.setGridOption('pivotMode', true);
        api.applyColumnState({ state: [{ colId: 'day', rowGroup: true, rowGroupIndex: 0, sort: 'desc' }, { colId: 'source', pivot: true, pivotIndex: 0 }, { colId: 'sales', aggFunc: 'sum' }], defaultState: { rowGroup: false, pivot: false, aggFunc: null } });
        // Only sales, so money-out sources (Bank, refunds) do not become empty pivot columns.
        api.setFilterModel({ type: { filterType: 'set', values: ['Payment received', 'Payout received'] } });
      },
    },
    { id: 'money-out', name: 'Money out: refunds, disputes, withdrawals', apply: () => setSourceFilter('out') },
    {
      id: 'reconcile', name: 'Still to reconcile',
      apply: (api) => api.setFilterModel({ reconciled: { filterType: 'set', values: ['false'] } }),
    },
  ];
  const savedViews = () => { try { return JSON.parse(localStorage.getItem(`biz:${me?.username}:views`) ?? '[]'); } catch { return []; } };
  function fillViews(selected = 'all') {
    const mine = savedViews();
    $('bizView').innerHTML = VIEWS.map((v) => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('')
      + (mine.length ? `<optgroup label="Saved by you">${mine.map((v, i) => `<option value="mine:${i}">${escapeHtml(v.name)}</option>`).join('')}</optgroup>` : '');
    $('bizView').value = selected;
  }
  function clearView(api) {
    api.setGridOption('pivotMode', false);
    api.setFilterModel(null);
    api.setGridOption('quickFilterText', '');
    $('bizSearch').value = '';
    api.resetColumnState();
    api.applyColumnState({ state: [{ colId: 'at', sort: 'desc' }], defaultState: { sort: null } });
    if (sourceFilter !== 'all') setSourceFilter('all');
  }
  function applyView(id) {
    const api = apis.orders;
    closeChart();
    clearView(api);
    if (id.startsWith('mine:')) {
      const v = savedViews()[Number(id.slice(5))];
      if (v) { api.setState(v.state, GRID_STATE_IGNORE); if (v.source) setSourceFilter(v.source); }
    } else VIEWS.find((v) => v.id === id)?.apply(api);
    askNote.orders = '';
    showAskNote('');
  }
  $('bizView').addEventListener('change', (e) => applyView(e.target.value));
  $('bizSaveView').addEventListener('click', () => {
    const name = prompt('Name this view (it is saved in this browser):', 'My view');
    if (!name?.trim()) return;
    const mine = savedViews();
    mine.push({ name: name.trim().slice(0, 40), state: apis.orders.getState(), source: sourceFilter });
    try { localStorage.setItem(`biz:${me?.username}:views`, JSON.stringify(mine)); } catch { return toast('This browser does not allow saving views.'); }
    fillViews(`mine:${mine.length - 1}`);
    toast(`View "${name.trim()}" saved.`);
  });

  // ---------- Chart presets (Integrated Charts, made from the grid's rows, linked to them) ----------
  const CHART_PRESETS = [
    { id: 'source', label: 'Sales by source (donut)', chartType: 'donut', columns: ['source', 'sales'] },
    { id: 'day', label: 'Sales per day: AI agents vs other (stacked)', chartType: 'stackedColumn', columns: ['day', 'agentSales', 'otherSales'], sortDay: true },
    { id: 'item', label: 'Sales by item (bar)', chartType: 'groupedBar', columns: ['product', 'sales'] },
    { id: 'type', label: 'Net by transaction type (bar)', chartType: 'groupedBar', columns: ['type', 'net'] },
    { id: 'fees', label: 'Gross vs fees by source (column)', chartType: 'groupedColumn', columns: ['source', 'amount', 'fee'] },
    { id: 'pivot', label: 'Pivot chart: sales per day by source', pivot: true },
  ];
  function fillChartPresets() {
    $('bizChartPreset').innerHTML = '<option value="">Choose a chart…</option>' + CHART_PRESETS.map((p) => `<option value="${p.id}">${escapeHtml(p.label)}</option>`).join('');
  }
  function chartPreset(id) {
    const preset = CHART_PRESETS.find((p) => p.id === id);
    const api = apis.orders;
    if (!preset) return;
    api.forEachNode((n) => { if (n.expanded && n.master) n.setExpanded(false); }); // charts read rows, not item panels
    if (preset.pivot) {
      applyView('pivot');
      $('bizView').value = 'pivot';
      nextChart = { title: preset.label, from: 'main' };
      return requestAnimationFrame(() => api.createPivotChart({ chartType: 'stackedColumn', chartThemeName: 'paypal' }));
    }
    // A range chart over the plain rows: leave grouping / pivot, keep the filters.
    if (api.isPivotMode() || api.getRowGroupColumns().length) {
      api.setGridOption('pivotMode', false);
      api.applyColumnState({ defaultState: { rowGroup: false, pivot: false } });
      $('bizView').value = 'all';
    }
    if (preset.sortDay) api.applyColumnState({ state: [{ colId: 'at', sort: 'asc' }], defaultState: { sort: null } });
    chartFrom(api, 'main', preset.label, { cellRange: { columns: preset.columns }, chartType: preset.chartType, aggFunc: 'sum' });
  }
  $('bizChartPreset').addEventListener('change', (e) => { chartPreset(e.target.value); e.target.value = ''; });

  // ---------- Tabs, toolbar ----------
  /** Any tab: the transactions grid has the ask box and toolbar; the others have their own panel. */
  function selectTab(name) {
    closeChart();
    const list = name === 'orders';
    $('bizListPanel').classList.toggle('hidden', !list);
    $('bizTogetherPanel').classList.toggle('hidden', name !== 'together');
    $('bizStampedePanel').classList.toggle('hidden', name !== 'stampede');
    document.querySelectorAll('.biz-tab').forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    if (name === 'together') loadTogether();
    if (name === 'stampede') renderStampede();
  }
  function switchTab() {
    showAskNote(askNote.orders);
    fillChartPresets();
    fillViews();
  }
  document.querySelectorAll('.biz-tab').forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));
  $('bizSearch').addEventListener('input', (e) => apis.orders.setGridOption('quickFilterText', e.target.value));

  function resetView() {
    closeChart();
    clearView(apis.orders);
    $('bizView').value = 'all';
    askNote.orders = '';
    showAskNote('');
  }
  $('bizReset').addEventListener('click', resetView);

  const exportName = (ext) => `${me?.username ?? 'business'}-transactions-${dayKey(new Date())}.${ext}`;
  const EXPORT_COLS = ['at', 'type', 'product', 'source', 'customer', 'amount', 'fee', 'net', 'status', 'paypal', 'reconciled', 'tag', 'note', 'paypalRef'];
  const exportCell = (p) => (p.column.getColId() === 'at' && p.value instanceof Date ? p.value.toISOString() : p.value);
  function exportExcel({ onlySelected = false } = {}) {
    apis.orders.exportDataAsExcel({
      fileName: exportName('xlsx'), sheetName: 'Transactions', onlySelected,
      columnKeys: apis.orders.isPivotMode() ? undefined : EXPORT_COLS, processCellCallback: exportCell,
    });
  }
  $('bizExportXlsx').addEventListener('click', () => exportExcel());
  $('bizExport').addEventListener('click', () => {
    apis.orders.exportDataAsCsv({ fileName: exportName('csv'), columnKeys: apis.orders.isPivotMode() ? undefined : EXPORT_COLS, processCellCallback: exportCell, skipPinnedTop: true });
  });

  // ---------- Ask the grid in plain English ----------
  function showAskNote(text, isError = false) {
    const el = $('bizAskResult');
    el.textContent = text;
    el.classList.toggle('hidden', !text);
    el.classList.toggle('error', isError);
  }

  const DATE_OPS = { equals: 'equals', notEqual: 'notEqual', before: 'lessThan', lessThan: 'lessThan', lessThanOrEqual: 'lessThan', after: 'greaterThan', greaterThan: 'greaterThan' };
  const SET_COLUMNS = new Set(mainColumns.filter((c) => c.filter === 'agSetColumnFilter').map((c) => c.colId ?? c.field));

  /** The AI's answer -> an AG Grid filter model for one column (Set filters get the matching values). */
  function toFilter(column, f) {
    const def = mainColumns.find((c) => (c.colId ?? c.field) === column);
    if (column === 'at') {
      const day = (v) => `${String(v).slice(0, 10)} 00:00:00`;
      if (f.op === 'inRange' || f.op === 'greaterThanOrEqual' || f.op === 'after') {
        return { filterType: 'date', type: 'inRange', dateFrom: day(f.value), dateTo: day(f.op === 'inRange' && f.valueTo ? f.valueTo : '2100-01-01') };
      }
      return { filterType: 'date', type: DATE_OPS[f.op] ?? 'equals', dateFrom: day(f.value) };
    }
    if (def?.filter === 'agNumberColumnFilter') {
      const type = ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange'].includes(f.op) ? f.op : 'equals';
      return { filterType: 'number', type, filter: Number(f.value), ...(type === 'inRange' ? { filterTo: Number(f.valueTo) } : {}) };
    }
    if (SET_COLUMNS.has(column)) {
      const all = [...new Set(data.orders.map((r) => String(r[column] ?? '')))];
      const want = String(f.value).toLowerCase();
      const hit = (v) => (f.op === 'equals' ? v.toLowerCase() === want : v.toLowerCase().includes(want));
      return { filterType: 'set', values: f.op === 'notEqual' ? all.filter((v) => !hit(v)) : all.filter(hit) };
    }
    const type = ['contains', 'equals', 'notEqual'].includes(f.op) ? f.op : 'contains';
    return { filterType: 'text', type, filter: String(f.value) };
  }

  function applyAsk(result) {
    const api = apis.orders;
    closeChart();
    clearView(api);
    $('bizView').value = 'all';
    const model = {};
    const byColumn = new Map();
    for (const f of result.filters) byColumn.set(f.column, [...(byColumn.get(f.column) ?? []), toFilter(f.column, f)]);
    for (const [column, list] of byColumn) {
      model[column] = list.length === 1 || list[0].filterType === 'set' ? list[0] : { filterType: list[0].filterType, operator: 'AND', conditions: list.slice(0, 2) };
    }
    api.setFilterModel(model);
    api.setGridOption('quickFilterText', result.search ?? '');
    $('bizSearch').value = result.search ?? '';
    const state = result.sort.map((s, i) => ({ colId: s.column, sort: s.direction, sortIndex: i }));
    if (result.groupBy) state.push({ colId: result.groupBy, rowGroup: true, rowGroupIndex: 0 });
    if (state.length) api.applyColumnState({ state, defaultState: { sort: null, rowGroup: false } });
    askNote.orders = `✦ ${result.explanation}${/built-in/.test(result.model ?? '') ? ' (AI busy: answered by quick rules)' : ''}`;
    showAskNote(askNote.orders);
  }

  async function ask(text) {
    const input = $('bizAskInput');
    const button = $('bizAskBtn');
    input.value = text;
    button.disabled = true;
    button.textContent = 'Thinking…';
    showAskNote('Asking the AI to set up the grid…');
    try {
      applyAsk(await request('/biz/ask', { grid: 'orders', text }));
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

  // ---------- Cross-filter charts (AG Grid makes them from its own rows) ----------
  // Click a bar or slice: the grid, the KPIs and the other charts filter to it. Click again to clear.
  const crossCharts = {};
  function renderCharts() {
    const api = apis.orders;
    if (!api || crossCharts.ready) return;
    crossCharts.ready = true;
    const common = { chartThemeName: 'paypal', aggFunc: 'sum', suppressChartRanges: true };
    const overrides = (extra = {}) => ({ common: { padding: { top: 6, right: 8, bottom: 4, left: 4 }, legend: { enabled: false }, ...extra } });
    const shortDay = (v) => new Date(`${v}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const categoryLabels = (formatter) => ({ axes: { category: { label: { formatter: (p) => formatter(String(p.value)) } } } });
    try {
      crossCharts.day = api.createCrossFilterChart({
        ...common, chartType: 'column', cellRange: { columns: ['day', 'agentSales', 'otherSales'] }, sort: [{ colId: 'day', sort: 'asc' }],
        chartContainer: $('chartRevenue'), chartThemeOverrides: { ...overrides({ legend: { enabled: true, position: 'top' } }), bar: categoryLabels(shortDay) },
      });
      crossCharts.source = api.createCrossFilterChart({
        ...common, chartType: 'donut', cellRange: { columns: ['source', 'sales'] },
        chartContainer: $('chartSource'),
        chartThemeOverrides: {
          ...overrides({ legend: { enabled: true, position: 'bottom', spacing: 8, item: { label: { maxLength: 16, fontSize: 11 } } } }),
          donut: { series: { calloutLabel: { enabled: false }, sectorLabel: { enabled: false } } },
        },
      });
      crossCharts.items = api.createCrossFilterChart({
        ...common, chartType: 'column', cellRange: { columns: ['product', 'sales'] }, sort: [{ colId: 'sales', sort: 'desc' }],
        chartContainer: $('chartProducts'),
        chartThemeOverrides: { ...overrides(), bar: { axes: { category: { label: { rotation: -40, fontSize: 10, formatter: (p) => shortName(String(p.value), 14) } } } } },
      });
    } catch (err) {
      console.warn('Cross-filter charts failed:', err.message);
    }
  }
  function chartsSoon() { /* cross-filter charts follow the grid by themselves */ }

  // ---------- KPIs: follow the grid (filters, chips, search, chart clicks) ----------
  function renderKpis() {
    const api = apis.orders;
    const rows = api ? visibleRows('orders') : data.orders;
    const filtered = Boolean(api) && (api.isAnyFilterPresent() || sourceFilter !== 'all');
    const live = rows.filter((o) => o.status !== 'Failed' && o.status !== 'Reversed');
    const sales = rows.filter(isSale);
    const revenue = sales.reduce((s, o) => s + o.amount, 0);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = sales.filter((o) => new Date(o.at).getTime() >= weekAgo).reduce((s, o) => s + o.amount, 0);
    $('kpiRevenue').textContent = usd(revenue);
    $('kpiRevenueSub').textContent = `${usd(week)} in the last 7 days`;
    const fees = live.reduce((s, o) => s + (o.kind === 'fee' ? o.amount : 0) + (o.kind === 'sale' ? o.fee ?? 0 : 0), 0);
    const refunds = live.filter((o) => o.kind === 'refund').reduce((s, o) => s + o.amount, 0);
    $('kpiNet').textContent = usd(revenue + fees + refunds);
    $('kpiNetSub').textContent = `fees ${usd(Math.abs(fees))} · refunds ${usd(Math.abs(refunds))}`;
    const agent = sales.filter((o) => o.agent);
    const agentRevenue = agent.reduce((s, o) => s + o.amount, 0);
    $('kpiAgent').textContent = usd(agentRevenue);
    $('kpiAgentSub').textContent = `${revenue ? Math.round((agentRevenue / revenue) * 100) : 0}% of sales · ${agent.length} ${agent.length === 1 ? 'payment' : 'payments'}`;
    $('kpiOrders').textContent = String(rows.length);
    const payers = new Set(sales.map((o) => o.customer).filter(Boolean)).size;
    $('kpiOrdersSub').textContent = `${sales.length} sales from ${payers} ${payers === 1 ? 'payer' : 'payers'}`;
    const note = $('bizFilterNote');
    note.classList.toggle('hidden', !filtered);
    if (filtered) note.innerHTML = `Showing ${rows.length} of ${data.orders.length} transactions (filtered). <button type="button" class="btn-text-link" id="bizClearFilters">Clear filters</button>`;
  }
  $('bizFilterNote').addEventListener('click', (e) => { if (e.target.closest('#bizClearFilters')) resetView(); });

  // ---------- Shared bits for the payment views below ----------
  const DAY_MS = 86_400_000;
  const paidOrders = () => data.orders.filter(isSale);
  const sumAmount = (rows) => rows.reduce((s, r) => s + r.amount, 0);
  const median = (list) => {
    if (!list.length) return null;
    const s = [...list].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const ago = (iso) => {
    const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const h = Math.round(min / 60);
    return h < 48 ? `${h} h ago` : fmtDate(iso);
  };
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(`biz:${me?.username}:${key}`)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`biz:${me?.username}:${key}`, JSON.stringify(value)); } catch { /* private mode: keep it in memory only */ } },
  };

  // ---------- Morning briefing: a pinned row at the top of the Orders grid ----------
  function briefing() {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const dayBefore = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
    const on = (d) => paidOrders().filter((o) => dayKey(o.at) === dayKey(d));
    const y = on(yesterday);
    const prev = on(dayBefore);
    const now = on(today);
    const top = [...y.reduce((m, o) => m.set(o.product, (m.get(o.product) ?? 0) + o.amount), new Map())].sort((a, b) => b[1] - a[1])[0];
    const last = paidOrders()[0];
    return {
      id: '__briefing', __briefing: true,
      yKey: dayKey(yesterday), yCount: y.length, yRevenue: sumAmount(y), prevRevenue: sumAmount(prev), prevLabel: dayLabel(dayKey(dayBefore)).split(',')[0],
      failed: data.orders.filter((o) => o.status === 'Failed' && dayKey(o.at) === dayKey(yesterday)).length,
      top: top ? { product: top[0], revenue: top[1] } : null,
      todayCount: now.length, todayRevenue: sumAmount(now),
      last: last ? { at: last.at, amount: last.amount } : null,
    };
  }

  function briefingHtml(b) {
    const title = new Date().getHours() < 12 ? 'Morning briefing' : 'Daily briefing';
    const parts = [];
    if (b.yCount) {
      parts.push(`<strong>Yesterday (${escapeHtml(dayLabel(b.yKey))})</strong> ${b.yCount} ${b.yCount === 1 ? 'payment' : 'payments'} · <strong>${usd(b.yRevenue)}</strong>`);
      if (b.prevRevenue > 0) {
        const change = Math.round(((b.yRevenue - b.prevRevenue) / b.prevRevenue) * 100);
        parts.push(`<span class="${change >= 0 ? 'biz-up' : 'biz-down'}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs ${escapeHtml(b.prevLabel)}</span>`);
      }
      if (b.top) parts.push(`Top: ${escapeHtml(shortName(b.top.product, 34))} (${usd(b.top.revenue)})`);
      if (b.failed) parts.push(`<span class="biz-down">${b.failed} failed</span>`);
    } else {
      parts.push(`<strong>Yesterday</strong> no sales${b.last ? ` · last one ${escapeHtml(fmtDate(b.last.at))}, ${usd(b.last.amount)}` : ''}`);
    }
    const today = `Today so far: <strong>${b.todayCount}</strong> · <strong>${usd(b.todayRevenue)}</strong>`;
    return `<div class="biz-briefing"><span class="biz-briefing-tag">${title}</span><span class="biz-briefing-text">${parts.join(' · ')}</span><span class="biz-briefing-today">${today}</span>${b.yCount ? '<span class="biz-briefing-go">View ›</span>' : ''}</div>`;
  }

  function renderBriefing() {
    apis.orders?.setGridOption('pinnedTopRowData', [briefing()]);
  }

  function showBriefingDay(b) {
    if (!b.yCount) return;
    const api = apis.orders;
    const model = api.getFilterModel();
    model.at = { filterType: 'date', type: 'equals', dateFrom: `${b.yKey} 00:00:00` };
    api.setFilterModel(model);
    toast(`Showing yesterday's ${b.yCount} ${b.yCount === 1 ? 'payment' : 'payments'}. "Reset view" shows all again.`);
  }

  // ---------- Stampede watch: payment speed per product (alerts only) ----------
  // Agents buy at machine speed: a price typed wrong in the shop can sell out in minutes. This watches the
  // payments already received and alerts the owner. It never contacts, slows or blocks any agent.
  const LEVELS = { Stampede: 0, 'Price drop': 1, Busy: 2, Calm: 3 };
  const LEVEL_CLASS = { Stampede: 'bad', 'Price drop': 'bad', Busy: 'wait', Calm: 'info' };
  const stampede = { windowMin: 10, threshold: 5, dropPct: 60, acked: {}, alerted: new Set(), rows: [] };
  let stampedeApi = null;
  let started = false; // no alert toasts for what was already there when the page opened

  function stampedeRows() {
    const now = Date.now();
    const win = stampede.windowMin * 60_000;
    const byProduct = new Map();
    for (const o of paidOrders()) (byProduct.get(o.product) ?? byProduct.set(o.product, []).get(o.product)).push(o);
    return [...byProduct].map(([product, list]) => {
      const t = (o) => new Date(o.at).getTime();
      const inWin = list.filter((o) => t(o) >= now - win);
      const prevWin = list.filter((o) => t(o) >= now - 2 * win && t(o) < now - win);
      const before = list.filter((o) => t(o) < now - win).map((o) => o.amount);
      const usual = median(before);
      const lowest = inWin.length ? Math.min(...inWin.map((o) => o.amount)) : null;
      const buyers = new Set(inWin.map((o) => o.customer)).size;
      // Payments per hour over the last 24 hours, oldest first (sparkline).
      const spark = Array.from({ length: 24 }, () => 0);
      for (const o of list) {
        const h = Math.floor((now - t(o)) / 3_600_000);
        if (h >= 0 && h < 24) spark[23 - h]++;
      }
      const drop = lowest !== null && usual !== null && lowest < usual * (stampede.dropPct / 100);
      const level = inWin.length >= stampede.threshold && buyers >= Math.min(3, stampede.threshold) ? 'Stampede'
        : drop ? 'Price drop'
        : inWin.length >= Math.ceil(stampede.threshold / 2) ? 'Busy'
        : 'Calm';
      const lastAt = list.map((o) => o.at).sort().at(-1);
      return {
        id: product, product, category: list[0].category, level,
        inWindow: inWin.length, buyers, change: inWin.length - prevWin.length,
        revenue: Math.round(sumAmount(inWin) * 100) / 100, usual, lowest, drop, spark, lastAt,
        acked: (stampede.acked[product] ?? 0) >= new Date(lastAt).getTime(),
      };
    }).sort((a, b) => LEVELS[a.level] - LEVELS[b.level] || b.inWindow - a.inWindow || (a.lastAt < b.lastAt ? 1 : -1));
  }

  const stampedeColumns = [
    { field: 'level', headerName: 'Status', width: 125, cellRenderer: pill((v) => LEVEL_CLASS[v]), sort: null, comparator: (a, b) => LEVELS[a] - LEVELS[b] },
    { field: 'product', headerName: 'Product', flex: 2, minWidth: 200, tooltipField: 'product', chartDataType: 'category' },
    { field: 'inWindow', headerName: 'Payments in window', width: 150, type: 'rightAligned', enableCellChangeFlash: true, chartDataType: 'series' },
    {
      field: 'change', headerName: 'vs window before', width: 135, type: 'rightAligned', chartDataType: 'excluded',
      cellRenderer: (p) => p.value > 0 ? `<span class="biz-up">+${p.value}</span>` : p.value < 0 ? `<span class="biz-down">${p.value}</span>` : '<span class="biz-muted">0</span>',
    },
    { field: 'buyers', headerName: 'Different buyers', width: 135, type: 'rightAligned', enableCellChangeFlash: true, chartDataType: 'series' },
    moneyCol('revenue', 'Revenue in window', { width: 140, chartDataType: 'series' }),
    moneyCol('usual', 'Usual price', { width: 115, chartDataType: 'excluded', headerTooltip: 'Median price of this product in payments before the window' }),
    moneyCol('lowest', 'Lowest in window', {
      width: 135, chartDataType: 'excluded',
      cellRenderer: (p) => p.value == null ? '<span class="biz-muted">–</span>' : `<span class="${p.data.drop ? 'biz-under' : ''}">${usd(p.value)}</span>`,
    }),
    {
      field: 'spark', headerName: 'Last 24 h', width: 150, sortable: false, chartDataType: 'excluded',
      headerTooltip: 'Payments per hour over the last 24 hours',
      cellRenderer: 'agSparklineCellRenderer',
      cellRendererParams: { sparklineOptions: { type: 'bar', fill: '#0070BA', padding: { top: 6, bottom: 6 } } },
    },
    { field: 'lastAt', headerName: 'Last payment', width: 130, valueFormatter: (p) => (p.value ? ago(p.value) : ''), chartDataType: 'excluded' },
    {
      colId: 'ack', headerName: '', width: 130, sortable: false, chartDataType: 'excluded',
      cellRenderer: (p) => (p.data.level === 'Stampede' || p.data.level === 'Price drop')
        ? (p.data.acked ? '<span class="biz-muted">Checked ✓</span>' : `<button type="button" class="biz-ack" data-ack="${escapeHtml(p.data.product)}">Mark checked</button>`)
        : '',
    },
  ];

  function makeStampedeGrid() {
    stampedeApi = createGrid($('gridStampede'), {
      theme,
      columnDefs: stampedeColumns,
      defaultColDef: { sortable: true, resizable: true, suppressHeaderMenuButton: true, suppressHeaderFilterButton: true },
      rowData: [],
      getRowId: (p) => p.data.id,
      rowHeight: 46,
      tooltipShowDelay: 400,
      overlayNoRowsTemplate: '<span class="biz-empty">No payments yet. Products show here as soon as agents pay for them.</span>',
      rowClassRules: { 'biz-row-alert': (p) => (p.data?.level === 'Stampede' || p.data?.level === 'Price drop') && !p.data?.acked },
      ...chartGridOptions,
    });
    $('gridStampede').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ack]');
      if (btn) acknowledge(btn.dataset.ack);
    });
  }

  function acknowledge(product) {
    stampede.acked[product] = Date.now();
    store.set('acked', stampede.acked);
    renderStampede();
    toast(`Marked "${shortName(product, 40)}" as checked. A new payment for it will alert you again.`);
  }

  function renderStampede() {
    if (!stampedeApi) return;
    stampede.rows = stampedeRows();
    stampedeApi.setGridOption('rowData', stampede.rows);
    const alerts = stampede.rows.filter((r) => (r.level === 'Stampede' || r.level === 'Price drop') && !r.acked);
    const count = $('countStampede');
    count.textContent = String(alerts.length);
    count.classList.toggle('biz-count-bad', alerts.length > 0);

    const banner = $('bizStampedeBanner');
    const windowLabel = $('bizStampedeWindow').selectedOptions[0]?.textContent.toLowerCase() ?? '';
    const text = (r) => r.level === 'Stampede'
      ? `<strong>Stampede on ${escapeHtml(shortName(r.product, 48))}</strong>: ${r.inWindow} payments from ${r.buyers} different buyers in the ${escapeHtml(windowLabel)}${r.usual ? ` (usually ${usd(r.usual)}, lowest now ${usd(r.lowest)})` : ''}. Check its price and stock in your shop.`
      : `<strong>Price drop on ${escapeHtml(shortName(r.product, 48))}</strong>: paid ${usd(r.lowest)}, usually ${usd(r.usual)}. Check the price in your shop.`;
    if (alerts.length) {
      banner.innerHTML = `<span>${text(alerts[0])}${alerts.length > 1 ? ` <span class="biz-muted">+${alerts.length - 1} more</span>` : ''}</span>
        <button type="button" class="btn btn-outline biz-small" data-stampede-view>View</button>
        <button type="button" class="btn btn-outline biz-small" data-ack="${escapeHtml(alerts[0].product)}">Mark checked</button>`;
      banner.classList.remove('hidden');
    } else banner.classList.add('hidden');

    // Toast once when a product starts an alert.
    for (const r of alerts) {
      const key = `${r.product}:${r.level}`;
      if (!stampede.alerted.has(key)) {
        stampede.alerted.add(key);
        if (started) { toast(`${r.level} on ${shortName(r.product, 40)}`); pulseLive(); }
      }
    }
    renderTvAlert(alerts.length ? text(alerts[0]) : '');
  }

  $('bizStampedeBanner').addEventListener('click', (e) => {
    if (e.target.closest('[data-stampede-view]')) { showSection('ai-sales'); selectTab('stampede'); }
    const ack = e.target.closest('[data-ack]');
    if (ack) acknowledge(ack.dataset.ack);
  });

  function readStampedeSettings() {
    stampede.windowMin = Number($('bizStampedeWindow').value) || 10;
    stampede.threshold = Math.max(2, Number($('bizStampedeThreshold').value) || 5);
    stampede.dropPct = Math.min(95, Math.max(10, Number($('bizStampedeDrop').value) || 60));
    store.set('stampede', { windowMin: stampede.windowMin, threshold: stampede.threshold, dropPct: stampede.dropPct });
    renderStampede();
  }
  for (const id of ['bizStampedeWindow', 'bizStampedeThreshold', 'bizStampedeDrop']) $(id).addEventListener('change', readStampedeSettings);

  $('bizStampedeChart').addEventListener('click', () => {
    if (!stampede.rows.length) return toast('No payments to chart yet.');
    chartFrom(stampedeApi, 'stampede', `Payments per product (${$('bizStampedeWindow').selectedOptions[0].textContent.toLowerCase()})`, {
      cellRange: { columns: ['product', 'inWindow', 'buyers'] }, chartType: 'groupedBar',
    });
  });

  // ---------- Bought together: product pairs (server sends counts only) ----------
  let togetherApi = null;
  let togetherInfo = { minBuyers: 2, windowDays: 30, pairs: [] };

  const togetherColumns = [
    {
      colId: 'pair', headerName: 'Product pair', flex: 2, minWidth: 300, chartDataType: 'category',
      valueGetter: (p) => (p.data ? `${p.data.productA} + ${p.data.productB}` : ''),
      cellRenderer: (p) => `<div class="biz-pair"><span>${escapeHtml(p.data.productA)}</span><span class="biz-pair-plus">+ ${escapeHtml(p.data.productB)}</span></div>`,
      filter: 'agTextColumnFilter', autoHeight: true,
    },
    { field: 'buyers', headerName: 'Buyers of both', width: 135, type: 'rightAligned', chartDataType: 'series', headerTooltip: 'Different (anonymous) buyers who paid for both products' },
    {
      field: 'attachRate', headerName: 'Attach rate', width: 170, chartDataType: 'series',
      headerTooltip: 'Of the buyers of the first product, how many also bought the second',
      valueFormatter: (p) => `${Math.round(p.value * 100)}%`,
      cellRenderer: (p) => `<div class="biz-meter"><span style="width:${Math.round(p.value * 100)}%"></span></div><span class="biz-meter-n">${Math.round(p.value * 100)}% of ${p.data.leadBuyers}</span>`,
    },
    { field: 'gapDays', headerName: 'Typical gap', width: 120, type: 'rightAligned', chartDataType: 'excluded', valueFormatter: (p) => (p.value < 1 ? 'same day' : `${p.value} days`) },
    moneyCol('revenue', 'Revenue (both)', { width: 140, chartDataType: 'series', headerTooltip: 'What these buyers paid for the two products' }),
    { field: 'lastAt', headerName: 'Last seen', width: 140, valueFormatter: (p) => fmtDate(p.value), chartDataType: 'excluded' },
    {
      colId: 'cats', headerName: 'Categories', width: 170, chartDataType: 'excluded',
      valueGetter: (p) => [...new Set([p.data?.categoryA, p.data?.categoryB].filter(Boolean))].join(' + '),
    },
  ];

  function makeTogetherGrid() {
    togetherApi = createGrid($('gridTogether'), {
      theme,
      columnDefs: togetherColumns,
      defaultColDef: { sortable: true, resizable: true, suppressHeaderMenuButton: true, suppressHeaderFilterButton: true },
      rowData: [],
      getRowId: (p) => p.data.id,
      tooltipShowDelay: 400,
      overlayNoRowsTemplate: '<span class="biz-empty">No product pairs yet. A pair shows once enough different buyers have paid for both products.</span>',
      ...chartGridOptions,
    });
  }

  async function loadTogether() {
    try {
      togetherInfo = await request('/biz/together');
    } catch (err) {
      return console.warn('Bought together failed:', err.message);
    }
    togetherApi?.setGridOption('rowData', togetherInfo.pairs);
    $('countTogether').textContent = String(togetherInfo.pairs.length);
    $('bizTogetherNote').textContent = `Product pairs paid for by the same buyer within ${togetherInfo.windowDays} days. Counts only: a pair shows once at least ${togetherInfo.minBuyers} different buyers paid for both, and customers are never shown here.`;
  }

  $('bizTogetherChart').addEventListener('click', () => {
    if (!togetherInfo.pairs.length) return toast('No product pairs to chart yet.');
    chartFrom(togetherApi, 'together', 'Products bought together', { cellRange: { columns: ['pair', 'buyers'] }, chartType: 'groupedBar' });
  });

  // ---------- TV mode: full-screen live view of payments received ----------
  let tvApi = null;
  let tvOpen = false;
  let tvClock = null;
  let tvPopTimer = null;

  const tvTheme = themeQuartz.withParams({
    backgroundColor: '#0B1C2E',
    foregroundColor: '#F5F7FA',
    headerBackgroundColor: '#0F2740',
    headerTextColor: '#9FB3C8',
    headerFontSize: 14,
    headerFontWeight: 600,
    borderColor: '#1C3550',
    oddRowBackgroundColor: '#0D2134',
    rowHoverColor: '#12304D',
    accentColor: '#3AA0FF',
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 20,
    wrapperBorderRadius: 14,
  });

  function makeTvGrid() {
    tvApi = createGrid($('gridTv'), {
      theme: tvTheme,
      columnDefs: [
        { field: 'at', headerName: 'When', width: 170, sort: 'desc', valueFormatter: (p) => ago(p.value), comparator: (a, b) => (a < b ? -1 : a > b ? 1 : 0) },
        { field: 'product', headerName: 'Item', flex: 2, minWidth: 260 },
        { field: 'amount', headerName: 'Amount', width: 170, type: 'rightAligned', cellClass: 'biz-tv-amount', valueFormatter: (p) => usd(p.value), enableCellChangeFlash: true },
        { field: 'source', headerName: 'Source', width: 210, cellRenderer: sourceHtml },
        { field: 'status', headerName: 'Status', width: 140, cellRenderer: pill((v) => STATUS_CLASS[v] ?? 'info'), enableCellChangeFlash: true },
        { field: 'paypal', headerName: 'PayPal', width: 160, cellRenderer: pill((v) => PAYPAL_CLASS[v] ?? 'info') },
      ],
      defaultColDef: { sortable: false, resizable: false, suppressMovable: true, suppressHeaderMenuButton: true, suppressHeaderFilterButton: true },
      rowData: [],
      getRowId: (p) => p.data.id,
      rowHeight: 64,
      headerHeight: 44,
      suppressCellFocus: true,
      overlayNoRowsTemplate: '<span>Waiting for the first payment…</span>',
    });
  }

  function renderTv(added = []) {
    if (!tvOpen) return;
    const rows = data.orders.filter((o) => o.kind === 'sale').slice(0, 60); // money coming in
    tvApi.setGridOption('rowData', rows);
    const nodes = added.map((r) => tvApi.getRowNode(r.id)).filter(Boolean);
    if (nodes.length) tvApi.flashCells({ rowNodes: nodes, flashDuration: 2500, fadeDuration: 1500 });

    const now = new Date();
    const today = paidOrders().filter((o) => dayKey(o.at) === dayKey(now));
    const hour = paidOrders().filter((o) => now - new Date(o.at) <= 3_600_000);
    $('tvToday').textContent = usd(sumAmount(today));
    $('tvTodaySub').textContent = `${today.length} ${today.length === 1 ? 'payment' : 'payments'}`;
    $('tvHour').textContent = usd(sumAmount(hour));
    $('tvHourSub').textContent = `${hour.length} ${hour.length === 1 ? 'payment' : 'payments'}`;
    const top = [...today.reduce((m, o) => m.set(o.product, (m.get(o.product) ?? 0) + o.amount), new Map())].sort((a, b) => b[1] - a[1])[0];
    $('tvTop').textContent = top ? shortName(top[0], 30) : '–';
    $('tvTopSub').textContent = top ? usd(top[1]) : 'no payments yet today';
    const last = paidOrders()[0];
    $('tvLast').textContent = last ? usd(last.amount) : '–';
    $('tvLastSub').textContent = last ? `${ago(last.at)} · ${shortName(last.product, 28)}` : '';

    const fresh = added.find((o) => o.status !== 'Failed');
    if (fresh) {
      const pop = $('bizTvPop');
      pop.innerHTML = `<strong>+${usd(fresh.amount)}</strong><span>${escapeHtml(shortName(fresh.product, 60))}</span>`;
      pop.classList.remove('hidden', 'show');
      void pop.offsetWidth;
      pop.classList.add('show');
      clearTimeout(tvPopTimer);
      tvPopTimer = setTimeout(() => pop.classList.add('hidden'), 4500);
    }
  }

  function renderTvAlert(html) {
    const el = $('bizTvAlert');
    el.innerHTML = html ? `${html}` : '';
    el.classList.toggle('hidden', !html);
  }

  function tick() {
    $('bizTvClock').textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }

  async function openTv() {
    if (!tvApi) makeTvGrid();
    tvOpen = true;
    $('bizTv').classList.remove('hidden');
    document.body.classList.add('biz-tv-on');
    $('bizTvShop').textContent = me.name;
    tick();
    tvClock = setInterval(() => {
      tick();
      if (new Date().getSeconds() % 30 === 0) tvApi.refreshCells({ columns: ['at'], force: true });
    }, 1000);
    renderTv();
    renderStampede();
    try { await $('bizTv').requestFullscreen?.(); } catch { /* the overlay still covers the page */ }
  }

  function closeTv() {
    if (!tvOpen) return;
    tvOpen = false;
    clearInterval(tvClock);
    $('bizTv').classList.add('hidden');
    document.body.classList.remove('biz-tv-on');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  $('bizTvOpen').addEventListener('click', openTv);
  $('bizTvExit').addEventListener('click', closeTv);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tvOpen) closeTv(); });
  // Esc in full screen only leaves full screen: close TV mode with it.
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && tvOpen) closeTv(); });

  // ---------- Accountant report: finance-only export (Excel workbook or CSV) ----------
  let acctApi = null;
  let acctDaysApi = null;
  // Numbers stay numbers in Excel (formatted there by the 'money' style), not text.
  const acctMoney = { type: 'rightAligned', cellClass: 'money', useValueFormatterForExport: false, valueFormatter: (p) => (p.value == null ? '' : Number(p.value).toFixed(2)) };

  function makeAcctGrids() {
    const excelStyles = [
      { id: 'header', font: { bold: true }, interior: { color: '#E8F1F8', pattern: 'Solid' } },
      { id: 'money', numberFormat: { format: '#,##0.00' } },
      { id: 'title', font: { bold: true, size: 14, color: '#003087' } },
      { id: 'total', font: { bold: true } },
      { id: 'totalMoney', font: { bold: true }, numberFormat: { format: '#,##0.00' } },
    ];
    acctApi = createGrid($('gridAcct'), {
      columnDefs: [
        { field: 'date', headerName: 'Date' },
        { field: 'time', headerName: 'Time' },
        { field: 'transactionId', headerName: 'PayPal transaction ID' },
        { field: 'type', headerName: 'Type' },
        { field: 'source', headerName: 'Source' },
        { field: 'item', headerName: 'Item' },
        { field: 'payer', headerName: 'Payer' },
        { field: 'payerEmail', headerName: 'Payer email' },
        { field: 'gross', headerName: 'Gross', ...acctMoney },
        { field: 'fee', headerName: 'Fee', ...acctMoney },
        { field: 'net', headerName: 'Net', ...acctMoney },
        { field: 'currency', headerName: 'Currency' },
        { field: 'status', headerName: 'Status' },
        { field: 'invoiceId', headerName: 'Invoice' },
      ],
      rowData: [],
      excelStyles,
    });
    acctDaysApi = createGrid($('gridAcctDays'), {
      columnDefs: [
        { field: 'date', headerName: 'Date' },
        { field: 'transactions', headerName: 'Transactions' },
        { field: 'sales', headerName: 'Sales', ...acctMoney },
        { field: 'agentSales', headerName: 'of which AI agents', ...acctMoney },
        { field: 'refunds', headerName: 'Refunds', ...acctMoney },
        { field: 'fees', headerName: 'Fees', ...acctMoney },
        { field: 'net', headerName: 'Net', ...acctMoney },
        { field: 'currency', headerName: 'Currency' },
      ],
      rowData: [],
      excelStyles,
    });
  }

  const PERIOD_LABEL = { 'this-month': 'This month', 'last-month': 'Last month', 30: 'Last 30 days', all: 'All time', view: 'Current transactions view' };

  function acctRows(period) {
    const now = new Date();
    const from = period === 'this-month' ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === 'last-month' ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : period === '30' ? new Date(now.getTime() - 30 * DAY_MS)
      : null;
    const to = period === 'last-month' ? new Date(now.getFullYear(), now.getMonth(), 1) : null;
    const source = period === 'view' ? visibleRows('orders') : data.orders;
    return source
      .filter((o) => (!from || new Date(o.at) >= from) && (!to || new Date(o.at) < to))
      .sort((a, b) => (a.at < b.at ? -1 : 1))
      .map((o) => {
        const d = new Date(o.at);
        return {
          date: dayKey(o.at),
          time: d.toLocaleTimeString('en-GB', { hour12: false }),
          transactionId: o.paypalRef || o.id,
          type: o.type,
          source: o.agent ? `AI agent (${o.paidVia})` : o.source,
          item: o.product,
          payer: o.customer,
          payerEmail: o.payerEmail || '',
          gross: o.amount,
          fee: o.fee,
          net: o.net,
          currency: o.currency || 'USD',
          status: o.status,
          invoiceId: o.invoiceId || '',
          // for the totals (not exported: no column)
          kind: o.kind,
          agent: o.agent,
        };
      });
  }

  /** Totals of what actually moved: sales, refunds, fees and net (failed / reversed rows count for nothing). */
  function acctTotals(rows) {
    const live = rows.filter((r) => r.status !== 'Failed' && r.status !== 'Reversed');
    const round = (n) => Math.round(n * 100) / 100;
    const sales = live.filter((r) => r.kind === 'sale');
    return {
      sales: round(sales.reduce((s, r) => s + r.gross, 0)),
      agentSales: round(sales.filter((r) => r.agent).reduce((s, r) => s + r.gross, 0)),
      refunds: round(live.filter((r) => r.kind === 'refund').reduce((s, r) => s + r.gross, 0)),
      fees: round(live.reduce((s, r) => s + (r.kind === 'fee' ? r.gross : r.kind === 'sale' ? r.fee ?? 0 : 0), 0)),
      net: round(live.reduce((s, r) => s + (r.net ?? r.gross), 0)),
      pending: round(sales.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.gross, 0)),
    };
  }

  function acctPreview() {
    const rows = acctRows($('bizAcctPeriod').value);
    const t = acctTotals(rows);
    $('bizAcctPreview').textContent = rows.length
      ? `${rows.length} ${rows.length === 1 ? 'transaction' : 'transactions'} · sales ${usd(t.sales)} · fees ${usd(t.fees)} · refunds ${usd(t.refunds)} · net ${usd(t.net)}`
      : 'No transactions in this period.';
    $('bizAcctGo').disabled = !rows.length;
  }

  function downloadAcct() {
    if (!acctApi) makeAcctGrids();
    const period = $('bizAcctPeriod').value;
    const format = document.querySelector('input[name="bizAcctFormat"]:checked')?.value ?? 'xlsx';
    const rows = acctRows(period);
    if (!rows.length) return;
    const t = acctTotals(rows);
    const slug = `${me.username}-transactions-${String(period).replace(/[^a-z0-9]+/gi, '-')}-${dayKey(new Date())}`;
    acctApi.setGridOption('rowData', rows);
    if (format === 'csv') {
      acctApi.exportDataAsCsv({ fileName: `${slug}.csv` });
      return toast(`Accountant report downloaded: ${rows.length} transactions (CSV)`);
    }

    const byDay = new Map();
    for (const r of rows) {
      const list = byDay.get(r.date) ?? [];
      list.push(r);
      byDay.set(r.date, list);
    }
    acctDaysApi.setGridOption('rowData', [...byDay].map(([date, list]) => ({ date, transactions: list.length, ...acctTotals(list), currency: 'USD' })));

    const text = (value, styleId) => ({ data: { value: String(value), type: 'String' }, ...(styleId ? { styleId } : {}) });
    const num = (value, styleId = 'totalMoney') => ({ data: { value: String(Math.round(value * 100) / 100), type: 'Number' }, styleId });
    // Labels span the columns before "Gross" (8), so each total sits in the Gross column.
    const totalRow = (label, value) => ({ cells: [{ ...text(label, 'total'), mergeAcross: 7 }, num(value)] });
    const sheets = [
      acctApi.getSheetDataForExcel({
        sheetName: 'Transactions',
        prependContent: [
          { cells: [text(`${me.name}: PayPal transactions`, 'title')] },
          { cells: [text(`Period: ${PERIOD_LABEL[period]} · exported ${new Date().toLocaleString('en-US')} · amounts in USD`)] },
          { cells: [] },
        ],
        appendContent: [
          { cells: [] },
          totalRow('Sales', t.sales),
          totalRow('  of which AI agents', t.agentSales),
          totalRow('Refunds and reversals', t.refunds),
          totalRow('PayPal fees', t.fees),
          totalRow('Net (all transactions)', t.net),
          totalRow('Sales still pending', t.pending),
        ],
      }),
      acctDaysApi.getSheetDataForExcel({ sheetName: 'Daily totals' }),
    ];
    window.agGrid.exportMultipleSheetsAsExcel({ data: sheets, fileName: `${slug}.xlsx` });
    toast(`Accountant report downloaded: ${rows.length} transactions, ${byDay.size} days (Excel)`);
  }

  $('bizAcctOpen').addEventListener('click', () => {
    acctPreview();
    $('bizAcct').showModal();
  });
  $('bizAcctPeriod').addEventListener('change', acctPreview);
  $('bizAcctCancel').addEventListener('click', () => $('bizAcct').close());
  $('bizAcctForm').addEventListener('submit', (e) => {
    e.preventDefault();
    downloadAcct();
    $('bizAcct').close();
  });

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
    const rows = data.orders.filter((o) => o.kind !== 'none').slice(0, 6);
    if (!rows.length) {
      box.innerHTML = '<p class="biz-muted biz-recent-empty">No transactions yet. Payments to your PayPal account, from AI agents or anyone else, show up here.</p>';
      return;
    }
    const initials = (o) => o.agent ? o.customer.replace('Customer ', '') : (o.customer || o.type).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    box.innerHTML = rows.map((o) => {
      const failed = o.status === 'Failed' || o.status === 'Reversed';
      const incoming = o.direction === 'in';
      const title = o.kind === 'sale' ? `Payment from ${o.customer || 'PayPal'}` : o.customer && o.customer !== 'PayPal' ? `${o.type}: ${o.customer}` : o.type;
      return `
      <div class="tx-item" tabindex="0" data-order="${escapeHtml(o.id)}">
        <div class="tx-avatar biz-tx-avatar${o.agent ? ' agent' : ''}">${escapeHtml(initials(o))}</div>
        <div class="tx-info">
          <div class="tx-title-row">
            <span class="tx-merchant">${escapeHtml(title)}</span>
            <span class="tx-amount ${failed || !incoming ? 'negative' : 'positive'}">${incoming && !failed ? '+' : ''}${usd(o.amount)} ${escapeHtml(o.currency || 'USD')}</span>
          </div>
          <div class="tx-sub-row">
            <span class="tx-meta">${escapeHtml(fmtDate(o.at))} &bull; ${escapeHtml(String(o.product).slice(0, 48))} &bull; ${o.agent ? 'via AI agent' : escapeHtml(o.source)}</span>
            <span class="tx-status">${escapeHtml(o.status)}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  $('bizRecent').addEventListener('click', (e) => {
    const row = e.target.closest('[data-order]');
    if (!row) return;
    showSection('ai-sales');
    selectTab('orders');
    resetView();
    const node = apis.orders.getRowNode(row.dataset.order);
    if (node) {
      node.setExpanded(true);
      setTimeout(() => apis.orders.ensureNodeVisible(node, 'middle'), 400);
      apis.orders.flashCells({ rowNodes: [node] });
    }
  });

  function renderTeaser() {
    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = data.orders.filter((o) => o.agent && isSale(o) && new Date(o.at).getTime() >= weekAgo);
    $('teaserWeek').textContent = usd(week.reduce((s, o) => s + o.amount, 0));
    $('teaserCount').textContent = String(week.length);
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
  $('bizNotificationsBtn').addEventListener('click', () => {
    const alerts = stampede.rows.filter((r) => (r.level === 'Stampede' || r.level === 'Price drop') && !r.acked).length;
    toast(alerts ? `${alerts} payment ${alerts === 1 ? 'alert' : 'alerts'}: open AI agent sales → Stampede watch.` : 'No new notifications');
  });

  // ---------- Data loading + live updates ----------
  async function load(name, { flash = false } = {}) {
    const { rows, connection } = await request('/biz/transactions');
    renderConnection(connection);
    const api = apis[name];
    const before = new Map(data[name].map((r) => [r.id, r]));
    data[name] = rows;
    if (!flash) {
      api.setGridOption('rowData', rows);
      return [];
    }
    const added = rows.filter((r) => !before.has(r.id));
    const changed = rows.filter((r) => before.has(r.id) && JSON.stringify(before.get(r.id)) !== JSON.stringify(r));
    const gone = [...before.values()].filter((r) => !rows.some((n) => n.id === r.id));
    api.applyTransaction({ add: added, update: changed, remove: gone });
    const nodes = [...added, ...changed].map((r) => api.getRowNode(r.id)).filter(Boolean);
    if (nodes.length) api.flashCells({ rowNodes: nodes, flashDuration: 1800, fadeDuration: 1200 });
    // An agent payment PayPal has now reported comes back under PayPal's id: not a new payment.
    const replaced = new Set(gone.filter((r) => r.agent).map((r) => `${r.product}|${r.amount}`));
    return added.filter((r) => !(r.agent && replaced.has(`${r.product}|${r.amount}`)));
  }

  // Which PayPal account the transactions come from, how fresh they are, and any problem in plain words.
  let syncing = false;
  function renderConnection(c) {
    if (!c || c.mode === 'none') return void ($('bizConn').innerHTML = '');
    // Just the Sync button; how fresh the data is shows on hover.
    const synced = c.syncedTo ? `Synced with PayPal ${ago(c.syncedTo)}` : c.syncing ? 'Reading your PayPal history…' : 'Not synced yet';
    const busy = syncing || c.syncing;
    $('bizConn').innerHTML = `<button type="button" class="btn btn-outline biz-small" id="bizSyncNow" title="${escapeHtml(synced)}"${busy ? ' disabled' : ''}>${busy ? 'Syncing…' : 'Sync'}</button>`;
  }

  $('bizConn').addEventListener('click', async (e) => {
    if (!e.target.closest('#bizSyncNow') || syncing) return;
    syncing = true;
    e.target.closest('#bizSyncNow').disabled = true;
    e.target.closest('#bizSyncNow').textContent = 'Syncing…';
    try {
      const c = await request('/biz/sync', {});
      toast(c.error ? `PayPal sync failed: ${c.error.slice(0, 120)}` : `Synced with PayPal: ${c.count} transactions`);
    } catch (err) {
      toast(`PayPal sync failed: ${err.message}`);
    } finally {
      syncing = false;
      refreshSoon();
    }
  });

  let refreshTimer;
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        const newOrders = await load('orders', { flash: true });
        renderKpis();
        renderRecent();
        renderTeaser();
        renderBriefing();
        renderStampede();
        renderTv(newOrders);
        if (newOrders.length) loadTogether();
        const o = newOrders.find((r) => r.kind === 'sale') ?? newOrders[0];
        if (o) {
          toast(o.kind === 'sale'
            ? `New ${o.agent ? 'AI-agent payment' : `payment from ${o.customer || 'PayPal'}`}: ${String(o.product).slice(0, 50)} · ${usd(o.amount)}`
            : `New in PayPal: ${o.type} · ${usd(o.amount)}`);
          pulseLive();
          loadBalance(true);
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

  // Live updates without the platform's event stream (which carries every customer's vault events and
  // is closed to business logins): poll a fingerprint of this shop's own payments and refresh on change.
  let pulseVersion = null;
  async function connectLive() {
    const live = (on) => ['bizLive', 'bizTvLive'].forEach((id) => $(id).classList.toggle('off', !on));
    const check = async () => {
      try {
        const { version } = await request('/biz/pulse');
        live(true);
        if (pulseVersion !== null && version !== pulseVersion) refreshSoon();
        pulseVersion = version;
      } catch (err) {
        live(false);
        console.warn('Live updates paused:', err.message);
      }
    };
    await check();
    setInterval(() => { if (!document.hidden || tvOpen) check(); }, 4000);
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
      GRIDS.orders.examples = ['invoice payments this month', 'only AI agent payments', 'payments over $100', 'group by source'];
    }

    apis.orders = makeMainGrid();
    makeTogetherGrid();
    makeStampedeGrid();
    // The owner's own Stampede settings and "checked" marks (this browser only).
    const saved = store.get('stampede', null);
    if (saved) {
      $('bizStampedeWindow').value = String(saved.windowMin);
      $('bizStampedeThreshold').value = String(saved.threshold);
      $('bizStampedeDrop').value = String(saved.dropPct);
      Object.assign(stampede, { windowMin: saved.windowMin, threshold: saved.threshold, dropPct: saved.dropPct });
    }
    stampede.acked = store.get('acked', {});
    switchTab('orders');
    loadBalance();
    await load('orders');
    loadTogether();
    renderKpis();
    renderRecent();
    renderTeaser();
    renderBriefing();
    renderStampede();
    started = true;
    // Time moves the windows: re-check the stampede watch and the briefing every 30 seconds.
    setInterval(() => { renderStampede(); renderBriefing(); }, 30_000);
    // Charts measure their labels: wait for the Inter web font so names are not clipped.
    await document.fonts?.ready?.catch(() => {});
    renderCharts();
    connectLive();
  }

  start();
})();
