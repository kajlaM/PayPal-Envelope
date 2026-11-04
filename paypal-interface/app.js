/**
 * PayPal Web Interface Interactive Controller
 * Provides seamless view switching, live card preview, modals, and user feedback.
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. LOGIN SESSION (LOGIN <-> DASHBOARD)
  // Real login against server.ts. Each customer (kajla, jugal) is linked to a
  // PayPal sandbox account; their vaults come from the KubePay API.
  // =========================================================================
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginEmail = document.getElementById('loginEmail');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const signUpBtn = document.getElementById('signUpBtn');

  let currentUser = null;

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

  function setView(viewName) {
    loginView.classList.toggle('hidden', viewName !== 'login');
    dashboardView.classList.toggle('hidden', viewName === 'login');
  }

  function partOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  function showUser(user) {
    currentUser = user;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.slice(0, 2).toUpperCase();
    document.getElementById('userTier').textContent = 'Personal Account';
    document.getElementById('userTier').title = `Linked PayPal sandbox account: ${user.sandboxEmail}`;
    document.getElementById('greeting').textContent = `${partOfDay()}, ${user.name}`;
    document.querySelectorAll('.card-holder-name').forEach((el) => { el.textContent = user.name.toUpperCase(); });
    const cardName = document.getElementById('cardNameInput');
    if (cardName) cardName.value = user.name;
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.toggle('hidden', !message);
  }

  async function enterDashboard(user) {
    showUser(user);
    renderAccount(user);
    setView('dashboard');
    connectLive();
    await loadVaults();
    // Links in alert emails open one vault: /?vault=<id>
    const linked = new URLSearchParams(location.search).get('vault');
    if (linked) {
      history.replaceState(null, '', location.pathname);
      openVaultDetail(linked);
    }
  }

  // On page load: stay logged in if the session cookie is still valid.
  request('/auth/me')
    .then(enterDashboard)
    .catch(() => {
      setView('login');
      loginEmail.focus();
    });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoginError('');
    const username = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!username || !password) return showLoginError('Enter your email (or username) and password.');

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Logging In...</span>
    `;
    try {
      const user = await request('/auth/login', { username, password });
      loginPassword.value = '';
      await enterDashboard(user);
      showToast(`Welcome back, ${user.name}!`, 'success');
    } catch (err) {
      showLoginError(err.status === 401 ? 'Wrong email/username or password.' : `Could not log in: ${err.message}`);
      loginPassword.select();
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.innerHTML = `<span>Log In</span>`;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await request('/auth/logout', {}).catch(() => {});
    currentUser = null;
    balanceCents = null;
    setView('login');
    loginEmail.focus();
    showToast('You have securely logged out of PayPal.', 'info');
  });

  // =========================================================================
  // 1.5 VAULTS, LIVE BALANCE & PAYPAL LINK
  // Everything goes through server.ts to the KubePay API (same backend as the
  // KubePay dashboard). Live updates come from KubePay's Socket.IO events.
  // =========================================================================
  const STATUS_PILL = {
    PENDING_FUNDING: ['Awaiting funding', 'pending-pill'],
    SAVING: ['Saving', 'active-pill'],
    ACTIVE: ['Active', 'active-pill'],
    EXPIRED: ['Expired', 'expired-pill'],
    LIQUIDATED: ['Closed · refunded', 'closed-pill'],
  };

  const OUTCOME_TEXT = {
    BOUGHT: 'Bought an item',
    NEEDS_HUMAN: 'Waiting for your approval',
    NO_MATCH: 'Nothing matched your rules yet',
    PROPOSED: 'Options ready: pick one',
    ERROR: 'Last run failed',
  };

  // Policy Engine reason codes, in plain words.
  const REASON_TEXT = {
    VAULT_INACTIVE: 'vault is not active',
    VAULT_EXPIRED: 'vault has expired',
    MAX_LIMIT_EXCEEDED: 'above the per-payment limit',
    INSUFFICIENT_VAULT_BALANCE: 'not enough money in the vault',
    MERCHANT_NOT_APPROVED: 'shop not allowed by your rules',
    MERCHANT_NOT_REGISTERED: 'shop is not registered',
    CATEGORY_NOT_ALLOWED: 'category not allowed by your rules',
    DAILY_LIMIT_REACHED: 'daily purchase limit reached',
    PRICE_MISMATCH: 'live price differs from the listed price',
    PRICE_NOT_VERIFIED: 'live price could not be checked',
    POSSIBLE_DUPLICATE: 'looks like a repeat purchase',
    UNUSUAL_SPEND: 'unusual for this vault',
    ABOVE_HUMAN_APPROVAL_THRESHOLD: 'above your approval limit',
    INVOICE_REQUIRED: 'no bill was given',
    INVOICE_NOT_FOUND: 'bill not found',
    INVOICE_NOT_OPEN: 'bill is already paid or closed',
    INVOICE_MISMATCH: 'amount differs from the bill',
    INVOICE_MERCHANT_MISMATCH: 'bill is from another company',
    SYSTEM_ERROR: 'system error',
    POLICY_CHANGED: 'the vault rules changed while the agent was searching',
    OWNER_APPROVAL_REQUIRED: 'this vault is set to Ask me',
    ITEM_REQUIRED: 'no shopping-list item named',
    UNKNOWN_ITEM: 'not on your shopping list',
    ITEM_ALREADY_BOUGHT: 'that item is already bought',
    ITEM_LIMIT_EXCEEDED: "above that item's limit",
    STILL_SAVING: 'the vault is still saving up',
    SAVINGS_VAULT: 'a savings vault never spends',
  };

  const usd = (cents) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const usdDollars = (dollars) => usd(Math.round(Number(dollars) * 100));
  const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const when = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const reasons = (codes) => (codes ?? []).map((c) => REASON_TEXT[c] ?? c).join(', ');

  // ---------- Control setting: Ask me / Ask above $X / Autopilot ----------

  // Vaults made before the setting existed: "ask above" their threshold, or never ask.
  const controlOf = (rules) => {
    const mode = rules?.control_mode ?? 'ASK_ABOVE';
    return mode === 'ASK_ABOVE' && rules?.human_approval_above === undefined ? { mode: 'AUTOPILOT' } : { mode, above: rules?.human_approval_above };
  };

  function controlText(rules) {
    const { mode, above } = controlOf(rules);
    if (mode === 'ASK_ME') return 'Ask me (you pick from the top 3)';
    if (mode === 'AUTOPILOT') return 'Autopilot (buys within your rules)';
    return `Ask me above ${usdDollars(above)}`;
  }

  // The radio buttons named `name` (+ the amount box) as { mode, above }, or an error message.
  function readControl(root, name, aboveInput) {
    const mode = root.querySelector(`input[name="${name}"]:checked`)?.value ?? 'ASK_ME';
    if (mode !== 'ASK_ABOVE') return { mode };
    const above = Number(aboveInput.value);
    if (!(above > 0)) return { error: 'Enter the amount above which the AI must ask you.' };
    return { mode, above };
  }

  // ---------- Shopping lists ----------

  const listOf = (policy) => policy?.shopping?.list?.items ?? [];
  const listText = (policy) => listOf(policy).map((i) => `${escapeHtml(i.name)} ≤ ${usdDollars(i.max_price)}`).join(' · ');
  const leftoverText = (policy) => policy?.shopping?.list?.rebalance === 'NONE'
    ? 'Each item keeps its own limit.'
    : 'Money an item does not use can go to the items still to buy (every item keeps its own limit).';

  // ---------- Paying in over time (savings) ----------

  const EVERY = { DAY: 'day', WEEK: 'week', MONTH: 'month' };
  const planText = (policy) => {
    const plan = policy?.savings;
    if (!plan) return '';
    const count = Math.ceil(Math.round(policy.allocated_budget * 100) / Math.round(plan.amount_per_payment * 100));
    return `${usdDollars(plan.amount_per_payment)} every ${EVERY[plan.every]} · ${count} payments, the first one today`;
  };
  const kindText = (type) => ({ UTILITY: 'bill payments', SAVINGS: 'savings', SHOPPING: 'shopping' }[type] ?? type);

  // Buy: paid in now. Save: $X every day/week/month.
  function readPayment(root) {
    const mode = root.querySelector('input[name="vaultKind"]:checked')?.value === 'SAVE' ? 'OVER_TIME' : 'NOW';
    if (mode === 'NOW') return { mode };
    const amount = Number(document.getElementById('vaultPaymentAmount').value);
    if (!(amount > 0)) return { error: 'Enter how much to pay in each time.' };
    return { mode, amount, every: document.getElementById('vaultPaymentEvery').value };
  }

  function setControlInputs(root, name, aboveInput, rules) {
    const { mode, above } = rules ? controlOf(rules) : { mode: 'ASK_ME' };
    root.querySelectorAll(`input[name="${name}"]`).forEach((el) => { el.checked = el.value === mode; });
    aboveInput.value = above !== undefined ? String(above) : '';
  }

  function setError(el, message) {
    el.textContent = message ?? '';
    el.classList.toggle('hidden', !message);
  }

  function busy(button, label) {
    button.dataset.label ??= button.innerHTML;
    button.disabled = !!label;
    button.innerHTML = label
      ? `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; margin-right: 6px;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg><span>${label}</span>`
      : button.dataset.label;
  }

  // ---------- Funding a vault: Pay with PayPal / PayPal Pay Later / Ask a friend on PayPal ----------

  // PayPal Pay in 4: four equal payments, every 2 weeks, for purchases from $30 to $1,500 (US).
  const PAY_IN_4 = { minCents: 3000, maxCents: 150000 };
  function payLaterText(cents) {
    if (cents >= PAY_IN_4.minCents && cents <= PAY_IN_4.maxCents) {
      return `The vault gets the full ${usd(cents)} today. You pay PayPal back in 4 interest-free payments of ${usd(Math.ceil(cents / 4))}, every 2 weeks.`;
    }
    return cents < PAY_IN_4.minCents
      ? `Pay in 4 starts at ${usd(PAY_IN_4.minCents)}, so PayPal may not offer Pay Later for ${usd(cents)}.`
      : `The vault gets the full ${usd(cents)} today. PayPal may offer monthly payments (Pay Monthly) for this amount.`;
  }

  // PayPal JS SDK with only PayPal's own options: PayPal + Pay Later (no cards, no Venmo).
  let paypalSdkPromise = null;
  let payLaterOpen = false; // the PayPal window is open: hold live re-renders so the button stays put
  function paypalSdk() {
    paypalSdkPromise ??= (async () => {
      const { paypalClientId } = await request('/config');
      if (!paypalClientId) throw new Error('PayPal is not set up on this site (PAYPAL_CLIENT_ID missing in .env).');
      const params = new URLSearchParams({
        'client-id': paypalClientId,
        currency: 'USD',
        intent: 'capture',
        components: 'buttons,messages',
        'enable-funding': 'paylater',
        'disable-funding': 'card,venmo',
        'buyer-country': 'US', // sandbox only: show Pay Later as a US buyer would see it
      });
      await loadScript(`https://www.paypal.com/sdk/js?${params}`);
      return window.paypal;
    })();
    paypalSdkPromise.catch(() => { paypalSdkPromise = null; });
    return paypalSdkPromise;
  }

  /** Renders the PayPal Pay Later button for a vault waiting for its money into `el`. */
  async function mountPayLater(el, vault, { onPaid, onMessage }) {
    el.innerHTML = '<p class="muted small">Loading PayPal Pay Later…</p>';
    try {
      const paypal = await paypalSdk();
      const id = encodeURIComponent(vault.id);
      const buttons = paypal.Buttons({
        fundingSource: paypal.FUNDING.PAYLATER,
        style: { shape: 'pill', height: 44 },
        onClick: () => { payLaterOpen = true; onMessage(''); },
        createOrder: async () => (await request(`/me/vaults/${id}/fund/order`, {})).orderId,
        onApprove: async (data) => {
          try {
            onMessage('PayPal approved. Locking the money in your vault…');
            const v = await request(`/me/vaults/${id}/fund/capture`, { orderId: data.orderID });
            payLaterOpen = false;
            onPaid(v);
          } catch (err) {
            payLaterOpen = false;
            onMessage(err.message, true);
          }
        },
        onCancel: () => { payLaterOpen = false; onMessage('You closed the PayPal window. Nothing was charged.'); },
        onError: (err) => { payLaterOpen = false; onMessage(err?.message || 'PayPal could not start Pay Later.', true); },
      });
      if (!el.isConnected) return;
      el.innerHTML = '';
      if (!buttons.isEligible()) {
        el.innerHTML = `<p class="muted small">PayPal does not offer Pay Later for this vault (it needs a US PayPal account; Pay in 4 is for ${usd(PAY_IN_4.minCents)} to ${usd(PAY_IN_4.maxCents)}).</p>`;
        return;
      }
      const msg = document.createElement('div');
      msg.className = 'paylater-message';
      const holder = document.createElement('div');
      el.append(msg, holder);
      const cents = vault.budgetCents - (vault.balanceCents ?? 0);
      paypal.Messages?.({ amount: (cents / 100).toFixed(2), placement: 'payment', style: { layout: 'text', logo: { type: 'inline' } } }).render(msg).catch(() => msg.remove());
      await buttons.render(holder);
    } catch (err) {
      if (el.isConnected) el.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
    }
  }

  const openRequestOf = (v) => (v.fundRequests ?? []).find((r) => r.status === 'OPEN');

  // ---------- Balance + PayPal link status ----------

  let balanceCents = null; // live sandbox balance, null until read

  let linkPoll = null;

  // The PayPal link is made automatically right after login (server.ts); this shows its progress.
  function renderLinkStatus(user) {
    const wasLinking = currentUser?.paypalLinking;
    currentUser = user;
    const status = document.getElementById('paypalLinkStatus');
    if (user.paypalLinked) {
      status.innerHTML = `<span class="link-ok" title="Vaults are paid from this PayPal sandbox account">✓ PayPal connected</span>`;
    } else if (user.paypalLinking) {
      status.innerHTML = `<span class="link-pending">Connecting your PayPal…</span>`;
    } else {
      status.innerHTML = `<span class="link-error" title="${escapeHtml(user.paypalLinkError ?? '')}">PayPal not connected</span>
        <button type="button" class="btn-text-link link-retry-btn">Try again</button>`;
    }

    clearTimeout(linkPoll);
    if (user.paypalLinking) linkPoll = setTimeout(pollLink, 3000);
    if (wasLinking && !user.paypalLinking) {
      if (user.paypalLinked) showToast(`PayPal account ${user.paypalLinked.email} connected.`, 'success');
      else showToast(`Could not connect PayPal: ${user.paypalLinkError ?? 'unknown error'}`, 'info');
    }
    if (vaultDraft && !vaultSteps.review.classList.contains('hidden')) renderReview(vaultDraft);
  }

  async function pollLink() {
    try {
      renderLinkStatus(await request('/auth/me'));
    } catch (err) {
      if (err.status === 401) setView('login');
    }
  }

  function renderAccount(user) {
    renderLinkStatus(user);
    loadBalance();
  }

  // The real balance of the linked sandbox account, read from sandbox.paypal.com by server.ts.
  async function loadBalance({ fresh = false } = {}) {
    const amountEl = document.getElementById('displayedBalance');
    const primaryEl = document.getElementById('primaryCurrencyAmount');
    const subtext = document.getElementById('balanceSubtext');
    const email = currentUser?.sandboxEmail ?? '';
    if (balanceCents === null) {
      amountEl.textContent = '…';
      subtext.textContent = `Reading your balance from the PayPal sandbox (${email})…`;
    }
    try {
      const result = await request(`/me/balance${fresh ? '?fresh=1' : ''}`);
      if (result.status === 'OK') {
        balanceCents = result.cents;
        amountEl.textContent = usd(result.cents).replace('$', '');
        primaryEl.textContent = usd(result.cents);
        subtext.textContent = `Live PayPal sandbox balance (${email}) • checked ${new Date(result.readAt).toLocaleTimeString()}`;
      } else if (result.status === 'NO_PASSWORD') {
        balanceCents = null;
        amountEl.textContent = '–';
        primaryEl.textContent = '–';
        subtext.textContent = `Live balance not connected: add ${result.env} (the sandbox login password) to .env`;
      } else {
        balanceCents = null;
        amountEl.textContent = '–';
        subtext.textContent = `Could not read the PayPal sandbox balance: ${result.message}`;
      }
    } catch (err) {
      if (err.status === 401) setView('login');
    }
  }

  async function refreshAccount() {
    try {
      renderAccount(await request('/auth/me'));
    } catch (err) {
      if (err.status === 401) setView('login');
    }
  }

  // ---------- Vault cards ----------

  // Expired or closed with nothing left in it: shown under "Vault history", not in the main list.
  const isFinished = (v) => v.status === 'LIQUIDATED' || (v.status === 'EXPIRED' && v.balanceCents === 0);

  function statusPill(v) {
    if (v.status === 'EXPIRED' && v.balanceCents > 0) return ['Refunding…', 'expired-pill'];
    return STATUS_PILL[v.status] ?? [v.status, 'pending-pill'];
  }

  function vaultCard(v) {
    const [label, pillClass] = statusPill(v);
    const rules = v.policy?.rules ?? {};
    const merchants = (rules.approved_merchants ?? []).join(', ');
    const items = listOf(v.policy);
    const what = v.type === 'UTILITY' ? 'Bill payments'
      : v.type === 'SAVINGS' ? 'Savings goal'
      : items.length ? `${items.length} items: ${items.map((i) => i.name).join(', ')}`
      : v.policy?.shopping?.product_query ?? 'Shopping';
    const pct = v.budgetCents > 0 ? Math.min(100, Math.round((v.balanceCents / v.budgetCents) * 100)) : 0;
    const expires = new Date(v.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const watching = v.status !== 'ACTIVE' ? '' : v.openProposals ? ' &bull; 👉 pick an option' : v.nextAgentRunAt ? ' &bull; AI watching' : '';
    const icon = v.type === 'UTILITY'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0070BA" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003087" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>';

    const el = document.createElement('div');
    el.className = 'vault-card-item';
    el.tabIndex = 0;
    el.dataset.vaultId = v.id;
    el.innerHTML = `
      <div class="vault-card-header">
        <div class="vault-icon-circle">${icon}</div>
        <span class="vault-status-pill ${pillClass}">${label}</span>
      </div>
      <div class="vault-info">
        <h3 class="vault-title">${escapeHtml(v.name)}</h3>
        <p class="vault-desc">${escapeHtml(what)}${merchants ? ` &bull; ${escapeHtml(merchants)}` : ''}</p>
      </div>
      <div class="vault-financials">
        <div class="vault-amount-row">
          <span class="vault-balance-label">Balance</span>
          <span class="vault-balance-val">${usd(v.balanceCents)} <small>/ ${usd(v.budgetCents)}</small></span>
        </div>
        <div class="vault-progress-bar">
          <div class="vault-progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
      <div class="vault-footer-row">
        <span class="vault-policy-badge">${v.status === 'PENDING_FUNDING'
          ? (openRequestOf(v) ? `✉ Waiting for ${escapeHtml(openRequestOf(v).payerEmail)} to pay on PayPal` : 'Needs its money &bull; open to fund it')
          : v.status === 'SAVING'
          ? `Saving ${usd(v.savingsPerPaymentCents ?? 0)} / ${EVERY[v.savingsEvery] ?? 'payment'} &bull; ${v.savingsPausedAt ? 'paused' : v.nextChargeAt ? `next ${new Date(v.nextChargeAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'paying in'}`
          : v.type === 'SAVINGS' ? `Saved &bull; ends ${expires}`
          : `Max ${usdDollars(rules.max_single_transaction ?? 0)} per payment &bull; ends ${expires}${watching}`}</span>
        <button type="button" class="btn-ghost-sm vault-manage-btn">Manage</button>
      </div>
    `;
    return el;
  }

  // ---------- Money requests for you (a friend asked you to fund their vault) ----------

  const requestsBox = document.getElementById('moneyRequests');

  async function loadRequests() {
    let list = [];
    try {
      list = await request('/me/requests');
    } catch {
      return; // the vault list shows any backend problem
    }
    requestsBox.classList.toggle('hidden', list.length === 0);
    requestsBox.innerHTML = list.length ? `
      <h3 class="money-requests-title">Money requests for you</h3>
      ${list.map((r) => `
        <div class="money-request">
          <div class="money-request-text">
            <strong>${escapeHtml(r.requesterName ?? r.vault?.user?.name ?? 'A friend')}</strong> asked you to fund the vault
            <strong>“${escapeHtml(r.vault?.name ?? 'vault')}”</strong>
            <div class="muted small">${r.message ? `“${escapeHtml(r.message)}” · ` : ''}${when(r.createdAt)} · your payment goes straight into their vault</div>
          </div>
          <div class="money-request-amount">${usd(r.amountCents)}</div>
          <div class="money-request-actions">
            ${r.payUrl ? `<a class="btn btn-primary-sm" href="${escapeHtml(r.payUrl)}" target="_blank" rel="noopener">Pay with PayPal ↗</a>` : '<span class="muted small">Open it in your PayPal account</span>'}
            <button type="button" class="btn-ghost-sm" data-request-check="${r.id}">I've paid</button>
          </div>
        </div>`).join('')}` : '';
  }

  requestsBox.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-request-check]');
    if (!button) return;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Checking…';
    try {
      const result = await request(`/me/requests/${encodeURIComponent(button.dataset.requestCheck)}/check`, {});
      showToast(result?.status === 'PAID' ? 'Thanks! Your payment is in their vault.' : 'PayPal does not show it as paid yet. Pay it on PayPal first.', result?.status === 'PAID' ? 'success' : 'info');
      await Promise.all([loadRequests(), refreshAccount()]);
    } catch (err) {
      showToast(err.message, 'info');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  });

  async function loadVaults() {
    loadRequests();
    const container = document.getElementById('vaultsContainer');
    const status = document.createElement('p');
    status.className = 'vaults-empty';
    try {
      const vaults = await request('/me/vaults');
      const live = vaults.filter((v) => !isFinished(v));
      container.replaceChildren(...live.map(vaultCard));
      if (live.length === 0) {
        status.textContent = vaults.length
          ? 'No active vaults. Your past vaults are in the history below.'
          : 'No vaults yet. Create one to give an AI agent a safe, limited budget.';
        container.append(status);
      }
      renderVaultHistory(vaults.filter(isFinished));
    } catch (err) {
      if (err.status === 401) return setView('login');
      status.textContent = `Could not load your vaults (${err.message}). Is the KubePay API running?`;
      container.replaceChildren(status);
    }
  }

  document.getElementById('vaultsContainer').addEventListener('click', (e) => {
    const card = e.target.closest('.vault-card-item');
    if (card) openVaultDetail(card.dataset.vaultId);
  });
  document.getElementById('vaultsContainer').addEventListener('keydown', (e) => {
    const card = e.target.closest('.vault-card-item');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openVaultDetail(card.dataset.vaultId);
    }
  });

  // ---------- Vault history (expired / closed vaults, kept for reference) ----------

  function renderVaultHistory(finished) {
    const box = document.getElementById('vaultHistory');
    box.classList.toggle('hidden', finished.length === 0);
    document.getElementById('vaultHistoryCount').textContent = `(${finished.length})`;
    document.getElementById('vaultHistoryList').innerHTML = finished.map((v) => {
      const [label] = statusPill(v);
      const t = v.totals ?? {};
      const what = v.type === 'UTILITY' ? 'Bill payments' : v.type === 'SAVINGS' ? 'Savings goal' : v.policy?.shopping?.product_query ?? 'Shopping';
      const rules = v.policyVersion > 1 ? ` • rules changed ${v.policyVersion - 1}×` : '';
      return `<li tabindex="0" data-vault-id="${v.id}">
        <div class="vh-main">
          <strong>${escapeHtml(v.name)}</strong>
          <span class="muted small">${escapeHtml(what)} • ${label} • ${when(v.createdAt)} → ${when(v.updatedAt)}${rules}</span>
        </div>
        <div class="vh-money small">
          <div>${usd(t.paidInCents ?? 0)} in</div>
          <div class="muted">${usd(t.spentCents ?? 0)} spent • ${usd(t.refundedCents ?? 0)} back</div>
        </div>
      </li>`;
    }).join('');
  }

  const historyList = document.getElementById('vaultHistoryList');
  historyList.addEventListener('click', (e) => {
    const row = e.target.closest('li[data-vault-id]');
    if (row) openVaultDetail(row.dataset.vaultId);
  });
  historyList.addEventListener('keydown', (e) => {
    const row = e.target.closest('li[data-vault-id]');
    if (row && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openVaultDetail(row.dataset.vaultId);
    }
  });

  // ---------- Link PayPal (once): approve on sandbox.paypal.com in a popup ----------

  async function linkPayPal() {
    // Open the window right away (inside the click), or the browser blocks the popup.
    const popup = window.open('about:blank', 'paypal-link', 'width=480,height=720');
    try {
      const { approveUrl } = await request('/paypal/link/start', {});
      if (popup) popup.location.href = approveUrl;
      else window.location.href = approveUrl;
    } catch (err) {
      popup?.close();
      showToast(`Could not start PayPal linking: ${err.message}`, 'info');
    }
  }

  async function retryLink() {
    try {
      renderLinkStatus(await request('/paypal/link/auto', {}));
    } catch (err) {
      showToast(`Could not connect PayPal: ${err.message}`, 'info');
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.link-paypal-btn')) linkPayPal();
    if (e.target.closest('.link-retry-btn')) retryLink();
  });

  window.addEventListener('message', async (e) => {
    if (e.origin !== location.origin || e.data?.type !== 'paypal-link') return;
    if (!e.data.ok) return showToast(e.data.error || 'PayPal linking was cancelled.', 'info');
    showToast(`PayPal account ${e.data.email} linked. Vaults are now paid with your password.`, 'success');
    await refreshAccount();
    if (vaultDraft) renderReview(vaultDraft);
  });

  // ---------- Create vault: describe -> review + password -> progress ----------

  const vaultDialog = document.getElementById('createVaultModal');
  const vaultSteps = {
    describe: document.getElementById('vaultStepDescribe'),
    review: document.getElementById('vaultStepReview'),
    progress: document.getElementById('vaultStepProgress'),
  };
  const vaultSubtitles = {
    describe: '',
    review: '',
    progress: 'Setting up your vault…',
  };
  const changeSubtitles = {
    describe: 'Tell the AI what the vault is for now. Change the amount to add or take back money.',
    review: 'Check the new rules. They replace the old ones right away.',
    progress: 'Updating your vault…',
  };
  const amountInput = document.getElementById('vaultAmountInput');
  const descInput = document.getElementById('vaultDescInput');
  const vaultPassword = document.getElementById('vaultPasswordInput');
  const continueBtn = document.getElementById('vaultContinueBtn');
  const payBtn = document.getElementById('vaultPayBtn');
  const describeError = document.getElementById('vaultDescribeError');
  const reviewError = document.getElementById('vaultReviewError');
  const doneBtn = document.getElementById('vaultDoneBtn');
  const vaultModalTitle = document.getElementById('createVaultModalTitle');
  const amountHint = document.getElementById('vaultAmountHint');
  const askToggle = document.getElementById('vaultAskToggle');
  const friendEmailInput = document.getElementById('vaultFriendEmail');
  const createTexts = { placeholder: descInput.placeholder };
  const savePlaceholder = 'e.g. Emergency fund, or save for a laptop and buy it under $600';
  let editControl = null; // the vault's control setting when changing it, kept unless the switch is flipped

  const vaultKind = () => (editVault ? null : vaultSteps.describe.querySelector('input[name="vaultKind"]:checked')?.value ?? 'BUY');

  // Shows the Pay row for Buy, the savings plan for Save, and the friend fields for "Ask a friend".
  function updateDescribeUI() {
    const kind = vaultKind();
    document.getElementById('vaultKindGroup').classList.toggle('hidden', !kind);
    document.getElementById('vaultPayGroup').classList.toggle('hidden', kind !== 'BUY');
    document.getElementById('vaultSaveGroup').classList.toggle('hidden', kind !== 'SAVE');
    const method = vaultSteps.describe.querySelector('input[name="vaultFunding"]:checked')?.value;
    document.getElementById('vaultFriendFields').classList.toggle('hidden', kind !== 'BUY' || method !== 'FRIEND');
    if (kind) descInput.placeholder = kind === 'SAVE' ? savePlaceholder : createTexts.placeholder;
  }

  vaultSteps.describe.addEventListener('change', (e) => {
    if (e.target === askToggle) editControl = null;
    if (e.target.name !== 'vaultKind' && e.target.name !== 'vaultFunding') return;
    setError(describeError, '');
    updateDescribeUI();
    if (e.target.value === 'FRIEND') friendEmailInput.focus();
  });
  let vaultDraft = null;
  let createdVaultId = null;
  let editVault = null; // set while changing an existing vault's rules (same dialog as "Create")

  function showVaultStep(name) {
    for (const [key, el] of Object.entries(vaultSteps)) el.classList.toggle('hidden', key !== name);
    document.getElementById('vaultStepSubtitle').textContent = (editVault ? changeSubtitles : vaultSubtitles)[name];
  }

  function openVaultDialog(vault) {
    editVault = vault;
    vaultDraft = null;
    createdVaultId = null;
    vaultSteps.describe.reset();
    setError(describeError, '');
    doneBtn.classList.add('hidden');
    vaultModalTitle.textContent = vault ? `Change “${vault.name}”` : 'Create a Vault';
    descInput.placeholder = vault ? 'e.g. Buy a mechanical keyboard instead, max $90' : createTexts.placeholder;
    amountHint.textContent = vault
      ? `Now ${usd(vault.budgetCents)}. Lower it and the difference comes back to your PayPal; raise it and the extra is taken from your PayPal.`
      : '';
    amountHint.classList.toggle('hidden', !vault);
    if (vault) amountInput.value = (vault.budgetCents / 100).toFixed(2);
    editControl = vault ? controlOf(vault.policy?.rules) : null;
    askToggle.checked = !editControl || editControl.mode !== 'AUTOPILOT';
    updateDescribeUI(); // the type and payment are fixed once a vault is made
    document.getElementById('friendSuggestions').innerHTML = (currentUser?.friends ?? [])
      .map((f) => `<option value="${escapeHtml(f.email)}">${escapeHtml(f.name)}</option>`).join('');
    const payLaterBox = document.getElementById('vaultPayLaterBox');
    payLaterBox.classList.add('hidden');
    payLaterBox.innerHTML = '';
    showVaultStep('describe');
    openModal(vaultDialog);
    (vault ? descInput : amountInput).focus();
  }

  document.getElementById('createVaultBtn').addEventListener('click', () => openVaultDialog(null));

  vaultSteps.describe.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError(describeError, '');
    const amount = Number(amountInput.value);
    const description = descInput.value.trim();
    if (!(amount >= 1)) return setError(describeError, 'Enter an amount of at least $1.');
    const payment = editVault ? undefined : readPayment(vaultSteps.describe);
    if (payment?.error) return setError(describeError, payment.error);
    if (payment?.mode === 'OVER_TIME' && payment.amount >= amount) return setError(describeError, 'Each payment must be smaller than the amount (or choose Buy and pay it all now).');
    const funding = payment?.mode === 'NOW' ? vaultSteps.describe.querySelector('input[name="vaultFunding"]:checked')?.value ?? 'PAYPAL' : 'PAYPAL';
    if (funding === 'FRIEND' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(friendEmailInput.value.trim())) {
      friendEmailInput.focus();
      return setError(describeError, "Enter your friend's PayPal email.");
    }
    // Only this comes from your PayPal balance now (Save: just the first payment; Pay later / a friend: nothing).
    const newMoneyCents = funding !== 'PAYPAL' ? 0
      : payment?.mode === 'OVER_TIME' ? Math.round(payment.amount * 100) : Math.round(amount * 100) - (editVault?.budgetCents ?? 0);
    if (balanceCents !== null && newMoneyCents > balanceCents) return setError(describeError, `That needs ${usd(newMoneyCents)} more than your PayPal balance (${usd(balanceCents)}).`);
    if (description.length < 5) return setError(describeError, 'Add a description of what the vault is for.');
    const control = editControl ?? { mode: askToggle.checked ? 'ASK_ME' : 'AUTOPILOT' };

    busy(continueBtn, 'Continue');
    try {
      vaultDraft = editVault
        ? await request(`/me/vaults/${encodeURIComponent(editVault.id)}/policy/preview`, { amount, description, control })
        : await request('/me/vaults/preview', { amount, description, control, payment });
      // One key per review screen: sending it twice can never create two vaults (server.ts).
      if (!editVault) vaultDraft.createKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      renderReview(vaultDraft);
      showVaultStep('review');
    } catch (err) {
      setError(describeError, err.message);
    } finally {
      busy(continueBtn, null);
    }
  });

  // The AI's notes that are real problems with what you asked (texts from packages/policy/src/compiler.ts).
  // Notes about defaults it filled in (7-day end date, no per-payment limit, monthly interval...) are not shown.
  const PROBLEM_NOTES = [
    /^Not registered, so removed:/,
    /^Vaults last at most 90 days/,
    /^A shopping list holds at most 10 items/,
    /limit lowered to the vault amount/,
    /^The item limits add up to/,
    /covers the whole .*paid in one go/,
    /^Bill vaults top up with a monthly PayPal subscription/,
  ];
  const realProblems = (notes) => (notes ?? []).filter((n) => PROBLEM_NOTES.some((re) => re.test(n)));

  // The policy as [label, text] rows (text is already HTML-escaped).
  function policyRows(p) {
    const r = p.rules;
    const rows = [
      ['Vault', `${escapeHtml(p.vault_name)} <span class="muted">(${kindText(p.vault_type)})</span>`],
      [p.savings ? 'Goal' : 'Amount', usdDollars(p.allocated_budget)],
      ...(p.savings ? [['Payments', escapeHtml(planText(p))]] : []),
      ...(p.vault_type === 'SAVINGS' ? [] : [
        ['Max per payment', usdDollars(r.max_single_transaction)],
        ['Allowed shops', escapeHtml(r.approved_merchants.join(', '))],
        ['Categories', escapeHtml(r.allowed_categories.join(', '))],
      ]),
      ['Ends', when(r.expiry_timestamp)],
    ];
    if (p.vault_type === 'SAVINGS') return rows;
    if (listOf(p).length) rows.splice(1, 0, ['Shopping list', listText(p)], ['Leftover money', leftoverText(p)]);
    else if (p.shopping) rows.splice(1, 0, ['AI looks for', escapeHtml(p.shopping.product_query)]);
    rows.push(['Control', escapeHtml(controlText(r))]);
    if (r.max_transactions_per_day !== undefined) rows.push(['Max per day', `${r.max_transactions_per_day} payments`]);
    return rows;
  }

  // What the change does to the money: + taken from PayPal, - refunded to PayPal.
  function moneyChangeText(changeCents) {
    if (changeCents > 0) return `<span class="money-up">+${usd(changeCents)}</span> will be taken from your PayPal`;
    if (changeCents < 0) return `<span class="money-down">${usd(-changeCents)}</span> will be refunded to your PayPal`;
    return 'No money moves';
  }

  function renderReview(draft) {
    const p = draft.policy;
    let rows = policyRows(p);
    if (editVault) {
      // Show old -> new where something changed.
      const old = Object.fromEntries(policyRows(editVault.policy));
      rows = rows.map(([k, v]) => [k, old[k] !== undefined && old[k] !== v ? `<span class="old-val">${old[k]}</span> → <strong>${v}</strong>` : v]);
      for (const [k, v] of Object.entries(old)) if (!rows.some(([key]) => key === k)) rows.push([k, `<span class="old-val">${v}</span> → removed`]);
      rows.push(['Money', moneyChangeText(draft.changeCents)]);
    } else {
      rows = rows.map(([k, v]) => [k, k === 'Amount' ? `<strong>${v}</strong>`
        : k === 'Payments' ? `${v}, from ${escapeHtml(currentUser?.sandboxEmail ?? 'your PayPal')}`
        : k === 'Ends' ? `${v} <span class="muted">(leftover money comes back to you)</span>` : v]);
    }
    document.getElementById('vaultReview').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

    const warnings = document.getElementById('vaultWarnings');
    const problems = realProblems(draft.warnings);
    warnings.innerHTML = problems.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
    warnings.classList.toggle('hidden', !problems.length);

    updateFundingUI();
    setError(reviewError, '');
    vaultPassword.value = '';
    if (!vaultPassword.closest('.hidden')) setTimeout(() => vaultPassword.focus(), 0);
  }

  // Chosen on the first screen (Buy only; Save is always paid in from your own PayPal).
  const fundingChoice = () => (vaultDraft && !editVault && !vaultDraft.policy.savings
    ? vaultSteps.describe.querySelector('input[name="vaultFunding"]:checked')?.value ?? 'PAYPAL'
    : 'PAYPAL');


  // Shows what the chosen funding method needs: the PayPal link (only to take money from your
  // PayPal), the friend's email, and the right button text.
  function updateFundingUI() {
    const draft = vaultDraft;
    if (!draft) return;
    const p = draft.policy;
    const method = fundingChoice();
    const takesFromPayPal = method === 'PAYPAL' && (!editVault || draft.changeCents > 0);
    const linked = !takesFromPayPal || !!currentUser?.paypalLinked;
    const linkBox = document.getElementById('vaultLinkBox');
    linkBox.classList.toggle('hidden', linked);
    linkBox.innerHTML = currentUser?.paypalLinking
      ? `<p><strong>Connecting your PayPal account…</strong> This happens once and takes a few seconds.</p>`
      : `<p><strong>Your PayPal account is not connected.</strong> ${escapeHtml(currentUser?.paypalLinkError ?? '')}</p>
         <button type="button" class="btn btn-primary-sm link-retry-btn">Try again</button>
         <button type="button" class="btn-text-link link-paypal-btn">Link manually</button>`;
    // Pay later: the PayPal window is the only sign-in, so no password here.
    document.getElementById('vaultPasswordGroup').classList.toggle('hidden', !linked || method === 'PAYLATER');
    payBtn.disabled = !linked;
    payBtn.dataset.label = !editVault && p.savings ? `Pay first ${usdDollars(Math.min(p.savings.amount_per_payment, p.allocated_budget))} &amp; create vault`
      : !editVault && method === 'PAYLATER' ? 'Continue to PayPal Pay Later'
      : !editVault && method === 'FRIEND' ? 'Create vault &amp; send request'
      : !editVault ? `Pay ${usdDollars(p.allocated_budget)} &amp; create vault`
      : draft.changeCents > 0 ? `Pay ${usd(draft.changeCents)} &amp; update vault`
      : draft.changeCents < 0 ? `Update vault &amp; refund ${usd(-draft.changeCents)}`
      : 'Update vault';
    payBtn.innerHTML = payBtn.dataset.label;
  }

  document.getElementById('vaultBackBtn').addEventListener('click', () => showVaultStep('describe'));

  function renderProgress(steps) {
    document.getElementById('vaultProgress').innerHTML = steps
      .map(([state, text]) => `<li class="step-${state}"><span class="step-dot"></span><span>${text}</span></li>`)
      .join('');
  }

  vaultSteps.review.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!vaultDraft || payBtn.disabled) return;
    setError(reviewError, '');
    const funding = fundingChoice();
    if (funding !== 'PAYLATER' && !vaultPassword.value) return setError(reviewError, 'Enter your password to confirm.');

    if (editVault) return submitPolicyChange();
    const plan = vaultDraft.policy.savings;
    const amount = usdDollars(plan ? Math.min(plan.amount_per_payment, vaultDraft.policy.allocated_budget) : vaultDraft.policy.allocated_budget);
    const friendEmail = friendEmailInput.value.trim();
    busy(payBtn, funding === 'PAYPAL' ? 'Paying…' : funding === 'FRIEND' ? 'Sending request…' : 'Creating vault…');
    try {
      const vault = await request('/me/vaults', {
        policy: vaultDraft.policy,
        sourceText: vaultDraft.sourceText,
        password: funding === 'PAYLATER' ? undefined : vaultPassword.value,
        createKey: vaultDraft.createKey,
        funding,
        friendEmail: funding === 'FRIEND' ? friendEmail : undefined,
        friendMessage: funding === 'FRIEND' ? document.getElementById('vaultFriendMessage').value.trim() : undefined,
      });
      createdVaultId = vault.id;
      showVaultStep('progress');
      if (funding === 'PAYLATER') {
        startPayLaterProgress(vault, amount);
      } else if (funding === 'FRIEND') {
        renderProgress([
          ['done', 'Vault created with your rules'],
          ['done', `PayPal money request for ${amount} sent to ${escapeHtml(vault.request?.payerEmail ?? friendEmail)}`],
          ['active', 'Waiting for them to pay on PayPal. The vault goes live the moment they do, and their money goes straight into it.'],
        ]);
      } else renderProgress(vault.status === 'SAVING' ? [
        ['done', 'Vault created with your rules'],
        ['done', `First payment of ${amount} taken from your PayPal (${escapeHtml(currentUser.sandboxEmail)})`],
        ['done', `Saved ${usd(vault.balanceCents)} of ${usd(vault.budgetCents)}${vault.nextChargeAt ? `. Next payment ${when(vault.nextChargeAt)}` : ''}`],
        ['active', vault.type === 'SHOPPING' ? 'The AI agent starts shopping when the goal is reached' : 'Payments continue until the goal is reached'],
      ] : [
        ['done', 'Vault created with your rules'],
        ['done', `${amount} taken from your PayPal (${escapeHtml(currentUser.sandboxEmail)})`],
        ['done', `Vault is active: ${usd(vault.balanceCents)} locked in`],
        ['active', vault.type === 'SHOPPING' ? 'AI agent is searching shops now…' : vault.type === 'SAVINGS' ? 'Your savings goal is reached' : 'AI bill-pay agent is checking your bills now…'],
      ]);
      doneBtn.classList.remove('hidden');
      vaultDraft = null;
      refreshAccount();
      loadVaults();
    } catch (err) {
      if (err.status === 401 && err.body?.error === 'WRONG_PASSWORD') {
        setError(reviewError, 'Wrong password.');
        vaultPassword.select();
      } else if (err.body?.error === 'DUPLICATE_VAULT') {
        // The same vault was just made (e.g. sent twice): show that one instead of making another.
        createdVaultId = err.body.vaultId;
        showVaultStep('progress');
        renderProgress([['done', escapeHtml(err.message)]]);
        doneBtn.classList.remove('hidden');
        vaultDraft = null;
        loadVaults();
      } else if (err.body?.vaultId && funding === 'FRIEND') {
        // The vault exists but the request did not go out: fund it from the vault's page instead.
        setError(reviewError, `The vault was created, but the request did not go out: ${err.message}. Open the vault to try again or fund it another way.`);
        createdVaultId = err.body.vaultId;
        loadVaults();
      } else if (err.body?.vaultId) {
        // The vault exists but PayPal did not take the money: it stays "awaiting funding".
        setError(reviewError, `PayPal did not take the payment: ${err.message}. Nothing was charged.`);
        loadVaults();
      } else {
        setError(reviewError, err.message);
      }
    } finally {
      busy(payBtn, null);
    }
  });

  // Vault created for Pay Later: the PayPal Pay Later button finishes the funding.
  function startPayLaterProgress(vault, amount) {
    const base = [['done', 'Vault created with your rules']];
    renderProgress([...base, ['active', `Finish on PayPal: choose Pay Later to put ${amount} in the vault now and pay it back over time`]]);
    const box = document.getElementById('vaultPayLaterBox');
    box.classList.remove('hidden');
    const note = document.createElement('p');
    note.className = 'small paylater-note';
    const slot = document.createElement('div');
    box.replaceChildren(slot, note);
    mountPayLater(slot, vault, {
      onMessage: (text, isError) => { note.textContent = text; note.classList.toggle('form-error', !!isError); },
      onPaid: (v) => {
        box.classList.add('hidden');
        box.innerHTML = '';
        renderProgress([
          ...base,
          ['done', `${amount} put in the vault with PayPal Pay Later. PayPal collects your payments over time.`],
          ['done', `Vault is active: ${usd(v.balanceCents)} locked in`],
          ['active', v.type === 'SHOPPING' ? 'AI agent is searching shops now…' : 'AI bill-pay agent is checking your bills now…'],
        ]);
        refreshAccount();
        loadVaults();
      },
    });
  }

  async function submitPolicyChange() {
    const vault = editVault;
    const change = vaultDraft.changeCents;
    busy(payBtn, change > 0 ? 'Paying…' : 'Updating…');
    try {
      const result = await request(`/me/vaults/${encodeURIComponent(vault.id)}/policy`, {
        policy: vaultDraft.policy,
        sourceText: vaultDraft.sourceText,
        password: vaultPassword.value,
      });
      createdVaultId = vault.id;
      showVaultStep('progress');
      const steps = [['done', `New rules saved (version ${result.version}). The old ones are kept in the vault's history.`]];
      if (change > 0) steps.push(['done', `${usd(change)} taken from your PayPal (${escapeHtml(currentUser.sandboxEmail)})`]);
      if (change < 0) {
        steps.push(result.refundError
          ? ['error', `The ${usd(-change)} refund failed (${escapeHtml(result.refundError)}). The money stays in the vault.`]
          : ['done', `${usd(-change)} is on its way back to your PayPal`]);
      }
      if (result.cancelledApprovals) steps.push(['done', `${result.cancelledApprovals} purchase(s) waiting for approval were cancelled (old rules)`]);
      steps.push(['done', `Vault now holds ${usd(result.vault.balanceCents)} of ${usd(result.vault.budgetCents)}`]);
      steps.push(['active', result.vault.type === 'SHOPPING' ? 'AI agent is searching with the new rules…' : 'AI bill-pay agent is checking your bills with the new rules…']);
      renderProgress(steps);
      doneBtn.classList.remove('hidden');
      vaultDraft = null;
      refreshAccount();
      loadVaults();
    } catch (err) {
      if (err.status === 401 && err.body?.error === 'WRONG_PASSWORD') {
        setError(reviewError, 'Wrong password.');
        vaultPassword.select();
      } else {
        setError(reviewError, err.message);
      }
    } finally {
      busy(payBtn, null);
    }
  }

  doneBtn.addEventListener('click', () => {
    closeModal(vaultDialog);
    doneBtn.classList.add('hidden');
    if (createdVaultId) openVaultDetail(createdVaultId);
  });

  // ---------- Vault detail ("Manage") ----------

  const detailDialog = document.getElementById('vaultDetailModal');
  const detailBody = document.getElementById('vdBody');
  const agentSteps = {}; // vaultId -> live agent tool calls (Socket.IO agent:step)
  let detailId = null;
  let detailVault = null; // the vault shown, as last loaded

  async function openVaultDetail(id) {
    detailId = id;
    detailBody.innerHTML = '<p class="muted">Loading…</p>';
    openModal(detailDialog);
    await renderVaultDetail();
  }

  function closeVaultDetail() {
    detailId = null;
    closeModal(detailDialog);
  }

  document.getElementById('closeVaultDetailBtn').addEventListener('click', closeVaultDetail);
  detailDialog.addEventListener('close', () => { detailId = null; });

  function stepText(step) {
    const out = step.output ?? {};
    if (step.tool === 'find_candidates') {
      const dropped = Object.entries(out.dropped ?? {}).map(([k, n]) => `${n} ${k.toLowerCase().replace(/_/g, ' ')}`).join(', ');
      return `Searched shops: ${out.candidates?.length ?? 0} matching products${dropped ? ` (dropped: ${dropped})` : ''}`;
    }
    if (step.tool === 'skip_candidates') return `Skipped ${out.skipped ?? 0} wrong items`;
    if (step.tool === 'buy_next') {
      if (out.done) return 'No products left to try';
      const d = out.decision;
      const item = out.product ? `${escapeHtml(out.product.title)} at ${escapeHtml(out.product.merchant)} for ${usdDollars(out.product.price)}` : 'next product';
      const live = out.live_price != null ? ` (live price ${usdDollars(out.live_price)})` : ' (live price not readable)';
      if (!d) return `Tried ${item}`;
      if (d.result === 'APPROVE') return `✅ Bought ${item}${live}`;
      if (d.result === 'NEEDS_HUMAN') return `✋ Wants to buy ${item}${live}: needs your approval (${reasons(d.reasons)})`;
      return `⛔ Blocked ${item}: ${reasons(d.reasons)}`;
    }
    if (step.tool === 'prepare_options') {
      if (out.done) return 'No products left to suggest';
      return `Checked live prices of ${out.options?.length ?? 0} options`;
    }
    if (step.tool === 'propose_options') return out.error ? `Options: ${escapeHtml(out.error)}` : `👉 ${out.options?.length ?? 0} options ready for you to pick`;
    if (step.tool === 'pay_invoice') return `Paying bill ${escapeHtml(step.input?.invoice_id ?? '')}: ${escapeHtml(out.decision?.result ?? out.error ?? 'sent')}`;
    return `Used ${escapeHtml(step.tool.replace(/_/g, ' '))}`;
  }

  // One Agent logs row: time, a coloured dot (done / waiting for you / blocked / info) and the text.
  function logRow(step, at) {
    const out = step.output ?? {};
    const d = out.decision;
    const kind = step.tool === 'buy_next' && d
      ? { APPROVE: 'ok', NEEDS_HUMAN: 'wait' }[d.result] ?? 'block'
      : step.tool === 'propose_options' ? (out.error ? 'block' : 'wait') : 'info';
    const text = stepText(step).replace(/^(✅|✋|⛔|👉)\s*/u, '');
    const time = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<li class="log-${kind}"><time>${time}</time><span class="log-dot" aria-hidden="true"></span><span class="log-text">${text}</span></li>`;
  }

  // Activity: every major event, oldest first, then what comes next (a tracker like an order's status).
  // kind: done | wait (needs you / pending) | block (blocked, rejected, cancelled, failed) | future
  function timelineEvents(v) {
    const ev = [];
    const saving = v.savingsPerPaymentCents !== null && v.savingsPerPaymentCents !== undefined;
    ev.push({ at: v.createdAt, title: 'Vault created', sub: `${usd(v.budgetCents)} ${saving ? 'savings goal' : 'budget'}`, kind: 'done' });
    for (const h of v.policyHistory ?? []) {
      if (h.version > 1) ev.push({ at: h.createdAt, title: `Rules changed (version ${h.version})`, sub: '', kind: 'done' });
    }
    for (const r of v.fundRequests ?? []) {
      ev.push({ at: r.createdAt, title: `Asked ${escapeHtml(r.payerEmail)} for ${usd(r.amountCents)}`, sub: r.message ? `“${escapeHtml(r.message)}”` : 'PayPal money request', kind: 'done' });
      if (r.status === 'CANCELLED') ev.push({ at: r.resolvedAt ?? r.createdAt, title: `Request to ${escapeHtml(r.payerEmail)} cancelled`, sub: '', kind: 'block' });
    }
    for (const e of v.ledger ?? []) {
      const amount = usd(e.amountCents);
      const friend = e.type === 'FUND' && /^Paid by (\S+) \(PayPal money request\)/.exec(e.note ?? '')?.[1];
      const title = friend ? `${amount} received from ${escapeHtml(friend)}`
        : e.type === 'FUND' ? `${amount} added from your PayPal`
        : e.type === 'SPEND' ? `Paid ${amount} to ${escapeHtml(e.merchant?.name ?? 'merchant')}${e.paidVia === 'CHECKOUT' ? ' <span class="checkout-badge" title="Paid with PayPal Checkout: a real PayPal purchase with buyer protection">🛡 PayPal Checkout</span>' : ''}`
        : `${amount} refunded to your PayPal`;
      const kind = e.status === 'COMPLETED' ? 'done' : e.status === 'PENDING' ? 'wait' : 'block';
      ev.push({ at: e.createdAt, title, sub: e.status === 'COMPLETED' ? '' : e.status.toLowerCase(), kind });
    }
    for (const d of v.decisions ?? []) {
      const req = d.requestJson ?? {};
      const what = `${usdDollars(req.amount ?? 0)} at ${escapeHtml(req.merchant ?? '?')}`;
      const [title, kind] = d.result === 'APPROVE' && d.resolvedBy === 'CHOSEN_BY_OWNER' ? [`You picked ${what}`, 'done']
        : d.result === 'APPROVE' ? [`Approved ${what}`, 'done']
        : d.result === 'BLOCK' ? [`Blocked ${what}`, 'block']
        : d.resolvedBy === 'APPROVED_BY_HUMAN' ? [`You approved ${what}`, 'done']
        : d.resolvedBy === 'REJECTED_BY_HUMAN' ? [`You rejected ${what}`, 'block']
        : d.resolvedBy === 'CANCELLED_POLICY_CHANGED' ? [`Cancelled ${what}: rules changed`, 'block']
        : [`Needs your approval: ${what}`, 'wait'];
      const why = d.result === 'BLOCK' || (!d.resolvedBy && d.result === 'NEEDS_HUMAN') ? reasons(d.reasons) : '';
      ev.push({ at: d.createdAt, title, sub: escapeHtml(why || req.reason || ''), kind });
    }
    if ((v.status === 'LIQUIDATED' || v.status === 'EXPIRED') && v.updatedAt) {
      ev.push({ at: v.updatedAt, title: v.status === 'LIQUIDATED' ? 'Vault closed' : 'Vault expired', sub: '', kind: 'done' });
    }
    ev.sort((x, y) => new Date(x.at) - new Date(y.at));

    // What comes next (hollow dots).
    const next = v.status === 'PENDING_FUNDING' ? ['Waiting for the money']
      : v.status === 'SAVING' ? [v.nextChargeAt && !v.savings?.pausedAt ? `Next payment ${when(v.nextChargeAt)}` : 'Saving up', 'Goal reached']
      : v.status === 'ACTIVE' ? [`Vault ends ${when(v.policy?.rules?.expiry_timestamp ?? v.expiresAt)}`]
      : [];
    for (const title of next) ev.push({ at: null, title, sub: '', kind: 'future' });
    return ev;
  }

  let activityExpanded = false;
  const TRACK_SHOW = 7; // past events shown before "Show all"

  function timelineHtml(ev) {
    const past = ev.filter((e) => e.kind !== 'future');
    const hidden = activityExpanded ? 0 : Math.max(0, past.length - TRACK_SHOW);
    const shown = [...(hidden ? [past[0]] : []), ...ev.slice(hidden ? hidden + 1 : 0)];
    const lastPast = shown.filter((e) => e.kind !== 'future').at(-1);
    const rows = shown.map((e, i) => {
      const nextDone = shown[i + 1] && shown[i + 1].kind !== 'future';
      const cls = [`track-${e.kind}`, e === lastPast ? 'track-current' : '', nextDone ? 'line-done' : ''].filter(Boolean).join(' ');
      const more = hidden && i === 0 ? `<li class="track-more line-done"><span class="track-dot" aria-hidden="true"></span><button type="button" class="btn-text-link" data-action="activity-all">Show ${hidden} more event${hidden > 1 ? 's' : ''}</button></li>` : '';
      return `<li class="${cls}"><span class="track-dot" aria-hidden="true"></span>
        <span class="track-title">${e.title}</span>${e.at ? `<span class="track-time">${when(e.at)}</span>` : '<span></span>'}
        ${e.sub ? `<span class="track-sub">${e.sub}</span>` : ''}</li>${more}`;
    }).join('');
    return `<ol class="vd-track">${rows}</ol>`;
  }

  // "Fund this vault" for a vault still waiting for its money (HTML; the Pay Later button is mounted after).
  function fundSection(v) {
    if (v.status !== 'PENDING_FUNDING' || (v.savingsPerPaymentCents !== null && v.savingsPerPaymentCents !== undefined)) return '';
    const cents = v.budgetCents - v.balanceCents;
    const open = openRequestOf(v);
    if (open) {
      return `
      <section class="vd-section vd-fund">
        <h3>✉ Waiting for your friend</h3>
        <p>A PayPal money request for <strong>${usd(open.amountCents)}</strong> went to <strong>${escapeHtml(open.payerEmail)}</strong> ${when(open.createdAt)}.
          When they pay it on PayPal, the money goes straight into this vault and the vault goes live.</p>
        ${open.message ? `<p class="muted small">Your message: “${escapeHtml(open.message)}”</p>` : ''}
        <div class="vd-approval-actions">
          ${open.payUrl ? `<a class="btn btn-primary-sm" href="${escapeHtml(open.payUrl)}" target="_blank" rel="noopener">Open the PayPal request ↗</a>
          <button type="button" class="btn-ghost-sm" data-action="fund-copy" data-url="${escapeHtml(open.payUrl)}">Copy link</button>` : ''}
          <button type="button" class="btn-ghost-sm" data-action="fund-check">Check now</button>
          <button type="button" class="btn-ghost-sm" data-action="fund-cancel" data-request="${open.id}">Cancel request</button>
        </div>
        <p class="form-error hidden" id="vdFundError" role="alert"></p>
      </section>`;
    }
    return `
      <section class="vd-section vd-fund">
        <h3>Fund this vault <span class="muted small">(${usd(cents)})</span></h3>
        <p class="muted small">The AI starts as soon as the money is in. Pick one:</p>
        <div class="fund-options">
          <div class="fund-option">
            <div class="fund-option-head"><span class="funding-icon" aria-hidden="true">P</span><div><strong>Pay with PayPal</strong>
              <small>${usd(cents)} from your PayPal (${escapeHtml(currentUser?.sandboxEmail ?? 'linked account')}) right now.</small></div></div>
            <div class="vd-approval-actions">
              <input type="password" class="form-input fund-password" placeholder="Password" aria-label="Password to pay with PayPal">
              <button type="button" class="btn btn-primary-sm" data-action="fund-paypal">Pay ${usd(cents)}</button>
            </div>
          </div>
          <div class="fund-option">
            <div class="fund-option-head"><span class="funding-icon later" aria-hidden="true">4</span><div><strong>PayPal Pay Later</strong>
              <small>${escapeHtml(payLaterText(cents))}</small></div></div>
            <div class="vd-paylater" id="vdPayLater"></div>
            <p class="small paylater-note" id="vdPayLaterNote"></p>
          </div>
          <div class="fund-option">
            <div class="fund-option-head"><span class="funding-icon friend" aria-hidden="true">✉</span><div><strong>Ask a friend on PayPal</strong>
              <small>They get a PayPal money request. Their payment goes straight into this vault, not your account.</small></div></div>
            <div class="vd-approval-actions fund-friend-row">
              <input type="email" class="form-input fund-friend-email" list="friendSuggestions" placeholder="Friend's PayPal email" aria-label="Friend's PayPal email" autocomplete="off">
              <input type="text" class="form-input fund-friend-message" maxlength="200" placeholder="Message (optional)" aria-label="Message for your friend">
              <button type="button" class="btn btn-primary-sm" data-action="fund-friend">Send request</button>
            </div>
          </div>
        </div>
        <p class="form-error hidden" id="vdFundError" role="alert"></p>
      </section>`;
  }

  async function renderVaultDetail() {
    if (!detailId || payLaterOpen) return; // never pull the Pay Later button away while PayPal is open
    const id = detailId;
    let v;
    try {
      v = await request(`/me/vaults/${encodeURIComponent(id)}`);
    } catch (err) {
      if (id === detailId) detailBody.innerHTML = `<p class="form-error">Could not load this vault: ${escapeHtml(err.message)}</p>`;
      return;
    }
    if (id !== detailId) return;

    // Keep anything typed into an approval password box across live refreshes.
    const typed = {};
    detailBody.querySelectorAll('.approve-password').forEach((el) => { typed[el.dataset.decision] = el.value; });
    detailBody.querySelectorAll('.choose-password').forEach((el) => { typed[`p:${el.dataset.proposal}`] = el.value; });
    typed.savings = detailBody.querySelector('.savings-password')?.value ?? '';
    typed.fundPassword = detailBody.querySelector('.fund-password')?.value ?? '';
    typed.friendEmail = detailBody.querySelector('.fund-friend-email')?.value ?? '';
    typed.friendMessage = detailBody.querySelector('.fund-friend-message')?.value ?? '';
    const askConfirm = detailBody.querySelector('.vd-ask-confirm');
    const controlState = askConfirm && !askConfirm.classList.contains('hidden') && id === detailVault?.id ? {
      ask: detailBody.querySelector('.vd-ask-toggle').checked,
      password: askConfirm.querySelector('.control-password').value,
    } : null;
    if (id !== detailVault?.id) activityExpanded = false;

    const [label, pillClass] = statusPill(v);
    const r = v.policy.rules;
    const pct = v.budgetCents > 0 ? Math.min(100, Math.round((v.balanceCents / v.budgetCents) * 100)) : 0;
    const pending = v.status === 'ACTIVE' ? (v.decisions ?? []).filter((d) => d.result === 'NEEDS_HUMAN' && !d.resolvedBy) : [];
    const steps = (agentSteps[v.id] ?? []).slice(-20);
    const agentLine = v.status === 'SAVING' ? 'The agent starts when the vault holds its full amount.'
      : v.status !== 'ACTIVE' ? 'The agent only works while the vault is active.'
      : `${v.lastAgentOutcome ? `Last run: ${OUTCOME_TEXT[v.lastAgentOutcome] ?? v.lastAgentOutcome} (${when(v.lastAgentRunAt)}).` : 'Starting its first run…'}`
        + (v.nextAgentRunAt ? ` Next check ${when(v.nextAgentRunAt)}.` : '');
    const canRefund = v.status === 'ACTIVE' || v.status === 'SAVING' || (v.status === 'EXPIRED' && v.balanceCents > 0);
    const sv = v.savings;
    const openProposals = v.status === 'ACTIVE' ? (v.proposals ?? []).filter((p) => p.status === 'OPEN') : [];
    const activity = timelineEvents(v);
    const asks = controlOf(r).mode !== 'AUTOPILOT';
    const history = v.policyHistory ?? [];
    detailVault = v;

    document.getElementById('vdTitle').textContent = v.name;
    document.getElementById('vdSubtitle').textContent = `${{ UTILITY: 'Bill payments', SAVINGS: 'Savings', SHOPPING: 'Shopping' }[v.type] ?? v.type} vault • created ${when(v.createdAt)}`;

    detailBody.innerHTML = `
      <section class="vd-summary">
        <div class="vd-balance">
          <span class="vault-status-pill ${pillClass}">${label}</span>
          <div class="vd-amount">${usd(v.balanceCents)} <small>${v.status === 'SAVING' ? 'saved' : 'left'} of ${usd(v.budgetCents)}</small></div>
          <div class="vault-progress-bar"><div class="vault-progress-fill" style="width: ${pct}%;"></div></div>
        </div>
        <dl class="vault-review compact">
          ${v.policy.shopping && !listOf(v.policy).length ? `<dt>AI looks for</dt><dd>${escapeHtml(v.policy.shopping.product_query)}</dd>` : ''}
          ${v.type === 'SAVINGS' ? '' : `
          <dt>Max per payment</dt><dd>${usdDollars(r.max_single_transaction)}</dd>
          <dt>Allowed shops</dt><dd>${escapeHtml(r.approved_merchants.join(', '))}</dd>`}
          <dt>Ends</dt><dd>${when(r.expiry_timestamp)}</dd>
          ${v.type === 'SAVINGS' ? '' : `<dt>Control</dt><dd>${escapeHtml(controlText(r))}</dd>`}
        </dl>
      </section>

      ${fundSection(v)}

      ${sv ? `
      <section class="vd-section vd-savings">
        <h3>${v.status === 'SAVING' ? '🐷 Saving up' : '🎉 Goal reached'} <span class="muted small">(${usd(sv.perPaymentCents)} every ${EVERY[sv.every]})</span></h3>
        <p>${usd(v.status === 'SAVING' ? v.balanceCents : sv.savedCents)} of ${usd(v.budgetCents)} saved • payment ${sv.paymentsMade} of ${sv.paymentsTotal}${
          v.status !== 'SAVING' ? '' : sv.pausedAt ? ' • <strong>paused</strong>' : sv.nextChargeAt ? ` • next payment ${when(sv.nextChargeAt)}` : ''}</p>
        ${v.status === 'SAVING' && sv.failures ? `<p class="form-error">The last ${sv.failures > 1 ? `${sv.failures} payments` : 'payment'} failed.${sv.pausedAt ? ' The plan is paused: resume it, or pay now.' : ' It is tried again tomorrow.'}</p>` : ''}
        ${v.status === 'SAVING' && v.type === 'SHOPPING' ? '<p class="muted small">The AI agent starts shopping when the goal is reached.</p>' : ''}
        ${v.status === 'SAVING' ? `
        <div class="vd-approval-actions">
          <input type="password" class="form-input savings-password" placeholder="Password" aria-label="Password to pay now">
          <button type="button" class="btn btn-primary-sm" data-action="savings-pay-now">Pay next ${usd(Math.min(sv.perPaymentCents, v.budgetCents - v.balanceCents))} now</button>
          <button type="button" class="btn-ghost-sm" data-action="${sv.pausedAt ? 'savings-resume' : 'savings-pause'}">${sv.pausedAt ? 'Resume plan' : 'Pause plan'}</button>
        </div>
        <p class="form-error hidden" id="vdSavingsError" role="alert"></p>` : ''}
      </section>` : ''}

      ${(v.items ?? []).length ? `
      <section class="vd-section">
        <h3>Shopping list <span class="muted small">(${v.items.filter((i) => i.bought).length} of ${v.items.length} bought)</span></h3>
        <ul class="vd-list">${v.items.map((i) => {
          const icon = i.bought ? '✅' : i.waiting === 'OPTIONS' ? '👉' : i.waiting === 'APPROVAL' ? '✋' : '🔎';
          const state = i.bought ? `bought for ${usd(i.spentCents)}`
            : `${i.waiting === 'OPTIONS' ? 'pick an option below • ' : i.waiting === 'APPROVAL' ? 'needs your approval • ' : ''}up to ${usd(i.limitCents)}`
              + (i.limitCents > i.maxPriceCents ? ` <span class="money-leftover">(+${usd(i.limitCents - i.maxPriceCents)} leftover)</span>` : '');
          return `<li class="${i.bought ? 'vd-list-done' : ''}"><span>${icon} <strong>${escapeHtml(i.name)}</strong> <span class="muted small">limit ${usd(i.maxPriceCents)}</span></span><span class="small">${state}</span></li>`;
        }).join('')}</ul>
        <p class="muted small">${leftoverText(v.policy)}</p>
      </section>` : ''}

      ${openProposals.map((p) => `
      <section class="vd-section vd-options">
        <h3>👉 Pick one${p.itemName ? ` for “${escapeHtml(p.itemName)}”` : ''}</h3>
        ${p.summary ? `<p>${escapeHtml(p.summary)}</p>` : ''}
        <div class="option-grid">${p.options.map((o, i) => `
          <div class="option-card">
            <a class="option-title" href="${escapeHtml(o.url)}" target="_blank" rel="noopener">${escapeHtml(o.title)}</a>
            <div class="option-price">${usdDollars(o.verified_price ?? o.price)} <span class="muted small">at ${escapeHtml(o.merchant)}</span></div>
            <ul class="option-pros">${o.pros.map((t) => `<li>+ ${escapeHtml(t)}</li>`).join('')}</ul>
            <ul class="option-cons">${o.cons.map((t) => `<li>− ${escapeHtml(t)}</li>`).join('')}</ul>
            <button type="button" class="btn btn-primary-sm" data-action="choose" data-proposal="${p.id}" data-index="${i}">Pick this</button>
          </div>`).join('')}
        </div>
        <div class="vd-approval-actions">
          <input type="password" class="form-input choose-password" data-proposal="${p.id}" placeholder="Password" aria-label="Password to pick an option">
          <button type="button" class="btn-ghost-sm" data-action="reject-options" data-proposal="${p.id}">None of these</button>
        </div>
        <p class="form-error hidden vd-options-error" data-proposal="${p.id}" role="alert"></p>
      </section>`).join('')}

      ${pending.length ? `
      <section class="vd-section vd-approvals">
        <h3>Needs your approval</h3>
        ${pending.map((d) => {
          const req = d.requestJson ?? {};
          return `<div class="vd-approval">
            <div><strong>${usdDollars(req.amount)} at ${escapeHtml(req.merchant)}</strong>
              <div class="muted">${escapeHtml(req.reason ?? '')}${req.product_url ? ` • <a href="${escapeHtml(req.product_url)}" target="_blank" rel="noopener">view product</a>` : ''}</div>
              <div class="muted small">Why: ${reasons(d.reasons)}</div></div>
            <div class="vd-approval-actions">
              <input type="password" class="form-input approve-password" data-decision="${d.id}" placeholder="Password" aria-label="Password to approve">
              <button type="button" class="btn btn-primary-sm" data-action="approve" data-decision="${d.id}">Approve</button>
              <button type="button" class="btn-ghost-sm" data-action="reject" data-decision="${d.id}">Reject</button>
            </div>
          </div>`;
        }).join('')}
        <p class="form-error hidden" id="vdApprovalError" role="alert"></p>
      </section>` : ''}

      ${v.type === 'SAVINGS' || v.status !== 'ACTIVE' ? '' : `
      <div class="vd-ask">
        <div class="ask-toggle-row">
          <label for="vdAskToggle" class="form-label">Ask me</label>
          <input type="checkbox" role="switch" id="vdAskToggle" class="ios-switch vd-ask-toggle" data-saved="${asks}"${asks ? ' checked' : ''}>
        </div>
        <div class="vd-approval-actions vd-ask-confirm hidden">
          <input type="password" class="form-input control-password" placeholder="Password" aria-label="Password to change Ask me">
          <button type="button" class="btn btn-primary-sm" data-action="save-control">Save</button>
          <button type="button" class="btn-ghost-sm" data-action="cancel-control">Cancel</button>
        </div>
      </div>`}

      ${v.type === 'SAVINGS' ? '' : `<section class="vd-section vd-agent">
        <div class="vd-section-head">
          <h3>Agent logs</h3>
          <div class="vd-actions">
            ${v.status === 'ACTIVE' ? '<button type="button" class="btn btn-primary-sm" data-action="run-agent">Run now</button>' : ''}
            ${v.status === 'ACTIVE' && v.nextAgentRunAt ? '<button type="button" class="btn-ghost-sm" data-action="stop-agent">Stop watching</button>' : ''}
          </div>
        </div>
        <p class="vd-agent-status"><span class="live-dot${v.status === 'ACTIVE' ? ' on' : ''}" aria-hidden="true"></span>${agentLine}</p>
        <ol class="agent-log" id="vdSteps" data-empty="${v.status === 'ACTIVE' ? 'Logs appear here while the agent works. Tap Run now to start a run.' : 'No logs yet.'}">${steps.map((s) => logRow(s, s.at)).join('')}</ol>
      </section>`}

      ${history.length > 1 ? `
      <section class="vd-section">
        <h3>Rules history</h3>
        <ol class="vd-policy-history">${history.map((h, i) => {
          const p = h.policyJson ?? {};
          const what = p.shopping?.product_query ?? p.vault_name ?? '';
          return `<li><strong>Version ${h.version}</strong>${i === 0 ? ' <span class="muted">(current)</span>' : ''}
            <span class="muted small">• ${when(h.createdAt)} • ${usdDollars(p.allocated_budget ?? 0)}</span>
            <div>${escapeHtml(what)}</div>
            ${h.sourceText ? `<div class="muted small">You wrote: “${escapeHtml(h.sourceText.replace(/\s*Vault budget: \$[\d.]+\.$/, ''))}”</div>` : ''}</li>`;
        }).join('')}</ol>
      </section>` : ''}

      <section class="vd-section">
        <h3>Activity</h3>
        ${timelineHtml(activity)}
      </section>

      ${canRefund ? `
      <section class="vd-footer">
        ${v.status === 'ACTIVE' ? '<button type="button" class="btn btn-primary" data-action="change-policy">Change rules or amount</button>' : ''}
        <button type="button" class="btn btn-secondary" data-action="liquidate">${v.status === 'SAVING' ? 'Stop saving &amp; refund' : 'Close vault &amp; refund'} ${usd(v.balanceCents)}</button>
      </section>` : ''}
    `;
    detailBody.querySelectorAll('.approve-password').forEach((el) => { el.value = typed[el.dataset.decision] ?? ''; });
    detailBody.querySelectorAll('.choose-password').forEach((el) => { el.value = typed[`p:${el.dataset.proposal}`] ?? ''; });
    const savingsPassword = detailBody.querySelector('.savings-password');
    if (savingsPassword && id === detailVault?.id) savingsPassword.value = typed.savings;
    const fundBox = detailBody.querySelector('.vd-fund');
    if (fundBox) {
      document.getElementById('friendSuggestions').innerHTML = (currentUser?.friends ?? [])
        .map((f) => `<option value="${escapeHtml(f.email)}">${escapeHtml(f.name)}</option>`).join('');
      const keep = (sel, value) => { const el = fundBox.querySelector(sel); if (el) el.value = value ?? ''; };
      keep('.fund-password', typed.fundPassword);
      keep('.fund-friend-email', typed.friendEmail);
      keep('.fund-friend-message', typed.friendMessage);
      const slot = document.getElementById('vdPayLater');
      const note = document.getElementById('vdPayLaterNote');
      if (slot) {
        mountPayLater(slot, v, {
          onMessage: (text, isError) => { note.textContent = text; note.classList.toggle('form-error', !!isError); },
          onPaid: () => {
            showToast('Funded with PayPal Pay Later. The vault is live and the AI is starting.', 'success');
            Promise.all([renderVaultDetail(), loadVaults(), refreshAccount()]);
          },
        });
      }
    }
    const askToggleEl = detailBody.querySelector('.vd-ask-toggle');
    if (askToggleEl && controlState && controlState.ask !== asks) {
      askToggleEl.checked = controlState.ask;
      const confirmBox = detailBody.querySelector('.vd-ask-confirm');
      confirmBox.classList.remove('hidden');
      confirmBox.querySelector('.control-password').value = controlState.password;
    }
  }

  // Ask me switch: flipping it asks for the password to save (flip back to cancel).
  detailBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('vd-ask-toggle')) return;
    const changed = String(e.target.checked) !== e.target.dataset.saved;
    const confirmBox = detailBody.querySelector('.vd-ask-confirm');
    confirmBox.classList.toggle('hidden', !changed);
    if (changed) confirmBox.querySelector('.control-password').focus();
  });

  detailBody.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button || !detailId) return;
    const id = encodeURIComponent(detailId);
    const action = button.dataset.action;
    const decision = button.dataset.decision;
    const original = button.textContent;
    if (action === 'activity-all') {
      activityExpanded = true;
      return renderVaultDetail();
    }
    if (action === 'cancel-control') {
      const toggle = detailBody.querySelector('.vd-ask-toggle');
      toggle.checked = toggle.dataset.saved === 'true';
      button.closest('.vd-ask-confirm').classList.add('hidden');
      return;
    }
    if (action === 'change-policy') {
      const vault = detailVault;
      closeVaultDetail();
      return openVaultDialog(vault);
    }
    button.disabled = true;
    try {
      if (action === 'run-agent') {
        await request(`/me/vaults/${id}/agent`, {});
        showToast('AI agent started. Watch its steps here.', 'success');
      } else if (action === 'stop-agent') {
        await request(`/me/vaults/${id}/agent/stop`, {});
        showToast('The agent stopped watching this vault.', 'info');
      } else if (action === 'liquidate') {
        if (!confirm('Close this vault and send the money left in it back to your PayPal?')) return;
        button.textContent = 'Refunding…';
        await request(`/me/vaults/${id}/liquidate`, {});
        showToast('Vault closed. The refund is on its way to your PayPal.', 'success');
      } else if (action === 'approve') {
        const password = detailBody.querySelector(`.approve-password[data-decision="${decision}"]`)?.value;
        if (!password) throw new Error('Enter your password to approve.');
        button.textContent = 'Paying…';
        await request(`/me/vaults/${id}/decisions/${decision}/approve`, { password });
        showToast('Approved. KubePay is paying the shop.', 'success');
      } else if (action === 'reject') {
        await request(`/me/vaults/${id}/decisions/${decision}/reject`, {});
        showToast('Rejected. The agent will look for something else.', 'info');
      } else if (action === 'choose') {
        const proposal = button.dataset.proposal;
        const password = detailBody.querySelector(`.choose-password[data-proposal="${proposal}"]`)?.value;
        if (!password) throw new Error('Enter your password to pick an option.');
        button.textContent = 'Paying…';
        const result = await request(`/me/vaults/${id}/proposals/${proposal}/choose`, { index: Number(button.dataset.index), password });
        if (result.decision?.result === 'NEEDS_HUMAN') {
          showToast(`One more check: ${reasons(result.decision.reasons)}. Approve it below.`, 'info');
        } else {
          showToast('Done. KubePay is paying the shop.', 'success');
        }
      } else if (action === 'reject-options') {
        await request(`/me/vaults/${id}/proposals/${button.dataset.proposal}/reject`, {});
        showToast('Got it. The agent is looking for other options.', 'info');
      } else if (action === 'savings-pay-now') {
        const password = detailBody.querySelector('.savings-password')?.value;
        if (!password) throw new Error('Enter your password to pay now.');
        button.textContent = 'Paying…';
        const result = await request(`/me/vaults/${id}/savings/pay-now`, { password });
        showToast(result.paid ? (result.status === 'ACTIVE' ? 'Paid. Goal reached! 🎉' : 'Paid. Your savings grew.') : result.action, result.paid ? 'success' : 'info');
      } else if (action === 'savings-pause' || action === 'savings-resume') {
        await request(`/me/vaults/${id}/savings/${action === 'savings-pause' ? 'pause' : 'resume'}`, {});
        showToast(action === 'savings-pause' ? 'Plan paused. No payments until you resume it.' : 'Plan resumed.', 'info');
      } else if (action === 'fund-paypal') {
        const password = detailBody.querySelector('.fund-password')?.value;
        if (!password) throw new Error('Enter your password to pay.');
        button.textContent = 'Paying…';
        await request(`/me/vaults/${id}/fund/paypal`, { password });
        showToast('Paid with PayPal. The vault is live and the AI is starting.', 'success');
      } else if (action === 'fund-friend') {
        const friendEmail = detailBody.querySelector('.fund-friend-email')?.value.trim();
        if (!friendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(friendEmail)) throw new Error("Enter your friend's PayPal email.");
        button.textContent = 'Sending…';
        const result = await request(`/me/vaults/${id}/fund/friend`, { friendEmail, message: detailBody.querySelector('.fund-friend-message')?.value.trim() });
        showToast(`PayPal money request sent to ${result.request?.payerEmail ?? friendEmail}.`, 'success');
      } else if (action === 'fund-check') {
        button.textContent = 'Checking…';
        const v = await request(`/me/vaults/${id}/fund/requests/sync`, {});
        showToast(v.status === 'PENDING_FUNDING' ? 'Not paid yet. We will update this the moment they pay.' : 'Your friend paid! The vault is live.', v.status === 'PENDING_FUNDING' ? 'info' : 'success');
      } else if (action === 'fund-cancel') {
        if (!confirm('Cancel this money request? Your friend will no longer be able to pay it.')) return;
        button.textContent = 'Cancelling…';
        const v = await request(`/me/vaults/${id}/fund/requests/${encodeURIComponent(button.dataset.request)}/cancel`, {});
        showToast(v.status === 'PENDING_FUNDING' ? 'Request cancelled. Fund the vault another way.' : 'They had already paid, so the vault is live.', 'info');
      } else if (action === 'fund-copy') {
        await navigator.clipboard.writeText(button.dataset.url);
        showToast('PayPal link copied. Send it to your friend.', 'success');
        return;
      } else if (action === 'save-control') {
        const ask = detailBody.querySelector('.vd-ask-toggle').checked;
        const confirmBox = button.closest('.vd-ask-confirm');
        const password = confirmBox.querySelector('.control-password').value;
        if (!password) throw new Error('Enter your password to save.');
        button.textContent = 'Saving…';
        await request(`/me/vaults/${id}/control`, { control: { mode: ask ? 'ASK_ME' : 'AUTOPILOT' }, password });
        confirmBox.classList.add('hidden');
        showToast(ask ? 'Saved. The agent asks you before buying.' : 'Saved. The agent is on autopilot.', 'success');
      }
      await Promise.all([renderVaultDetail(), loadVaults(), refreshAccount()]);
    } catch (err) {
      const box = action === 'choose' || action === 'reject-options'
        ? detailBody.querySelector(`.vd-options-error[data-proposal="${button.dataset.proposal}"]`)
        : action.startsWith('savings-') ? document.getElementById('vdSavingsError')
        : action.startsWith('fund-') ? document.getElementById('vdFundError')
        : document.getElementById('vdApprovalError');
      const message = err.body?.reasons ? `${err.message}: ${reasons(err.body.reasons)}` : err.message;
      if (box && (action.startsWith('fund-') || ['approve', 'reject', 'choose', 'reject-options', 'savings-pay-now', 'savings-pause', 'savings-resume'].includes(action))) setError(box, message);
      else showToast(message, 'info');
    } finally {
      button.disabled = false;
      if (button.isConnected) button.textContent = original;
    }
  });

  // ---------- Live updates from KubePay (Socket.IO) ----------

  let liveStarted = false;
  let refreshTimer;

  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!currentUser) return;
      loadVaults();
      refreshAccount();
      renderVaultDetail();
    }, 300);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.append(s);
    });
  }

  async function connectLive() {
    if (liveStarted) return;
    liveStarted = true;
    try {
      // Same origin: server.ts passes /socket.io through to the KubePay API (works behind the tunnel).
      if (!window.io) await loadScript('/socket.io/socket.io.js');
      const socket = window.io();
      socket.on('connect', refreshSoon);
      socket.on('vault:updated', refreshSoon);
      socket.on('decision:created', refreshSoon);
      socket.on('ledger:updated', refreshSoon);
      socket.on('proposal:created', refreshSoon);
      socket.on('agent:step', (step) => {
        (agentSteps[step.vaultId] ??= []).push({ ...step, at: Date.now() });
        if (step.vaultId === detailId) {
          const list = document.getElementById('vdSteps');
          if (list) list.insertAdjacentHTML('beforeend', logRow(step, Date.now()));
        }
      });
    } catch (err) {
      liveStarted = false;
      console.warn('Live updates off:', err.message);
    }
  }

  // =========================================================================
  // 2. MODAL CONTROLS (NATIVE <dialog> WITH BACKDROP)
  // =========================================================================
  const addCardModal = document.getElementById('addCardModal');
  const transferModal = document.getElementById('transferModal');
  const sendModal = document.getElementById('sendModal');
  const createVaultModal = document.getElementById('createVaultModal');

  // Helper to open dialog
  function openModal(dialogEl) {
    if (!dialogEl) return;
    if (typeof dialogEl.showModal === 'function') {
      dialogEl.showModal();
    } else {
      dialogEl.setAttribute('open', '');
    }
  }

  // Helper to close dialog
  function closeModal(dialogEl) {
    if (!dialogEl) return;
    if (typeof dialogEl.close === 'function') {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute('open');
    }
  }

  // Light dismiss: click outside modal content closes the dialog
  [addCardModal, transferModal, sendModal, createVaultModal, document.getElementById('vaultDetailModal')].forEach((dialog) => {
    if (!dialog) return;
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeModal(dialog);
      }
    });
  });

  // Close buttons inside modals
  document.getElementById('closeCardModalBtn')?.addEventListener('click', () => closeModal(addCardModal));
  document.getElementById('cancelCardModalBtn')?.addEventListener('click', () => closeModal(addCardModal));
  
  document.getElementById('closeTransferModalBtn')?.addEventListener('click', () => closeModal(transferModal));
  document.getElementById('cancelTransferBtn')?.addEventListener('click', () => closeModal(transferModal));

  document.getElementById('closeSendModalBtn')?.addEventListener('click', () => closeModal(sendModal));
  document.getElementById('cancelSendBtn')?.addEventListener('click', () => closeModal(sendModal));

  document.getElementById('closeVaultModalBtn')?.addEventListener('click', () => closeModal(createVaultModal));
  document.getElementById('cancelVaultModalBtn')?.addEventListener('click', () => closeModal(createVaultModal));

  // =========================================================================
  // 3. "ADD DEBIT CARD" TRIGGERS & LIVE PREVIEW
  // =========================================================================
  const addDebitCardTriggers = [
    document.getElementById('quickAddCardRibbonBtn'),
    document.getElementById('addDebitCardBtn'),
    document.getElementById('linkCardModalTrigger'),
    document.getElementById('tileAddCardBtn')
  ];

  addDebitCardTriggers.forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => {
        openModal(addCardModal);
        document.getElementById('cardNumberInput').focus();
      });
    }
  });

  // Live Card Preview inputs
  const cardNumberInput = document.getElementById('cardNumberInput');
  const cardNameInput = document.getElementById('cardNameInput');
  const cardExpInput = document.getElementById('cardExpInput');
  const cardTypeSelect = document.getElementById('cardTypeSelect');

  const previewCardNumber = document.getElementById('previewCardNumber');
  const previewCardName = document.getElementById('previewCardName');
  const previewCardExp = document.getElementById('previewCardExp');
  const previewCardTypeBadge = document.getElementById('previewCardTypeBadge');
  const previewCardBrandLogo = document.getElementById('previewCardBrandLogo');

  // Format card number with spaces (#### #### #### ####)
  cardNumberInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    e.target.value = formatted.substring(0, 19);

    if (val.length === 0) {
      previewCardNumber.textContent = '•••• •••• •••• ••••';
    } else {
      previewCardNumber.textContent = formatted.padEnd(19, '•');
    }

    // Dynamic brand detection
    if (val.startsWith('4')) {
      previewCardBrandLogo.innerHTML = '<span class="visa-text">VISA</span>';
    } else if (val.startsWith('5')) {
      previewCardBrandLogo.innerHTML = `
        <div class="mc-circle mc-red"></div>
        <div class="mc-circle mc-yellow"></div>
      `;
    } else if (val.startsWith('3')) {
      previewCardBrandLogo.innerHTML = '<span style="font-weight:900; font-size:12px; letter-spacing:1px;">AMEX</span>';
    }
  });

  // Live update cardholder name
  cardNameInput.addEventListener('input', (e) => {
    previewCardName.textContent = e.target.value.trim().toUpperCase() || 'ALEX WALKER';
  });

  // Format expiration date (MM/YY)
  cardExpInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
    } else {
      e.target.value = val;
    }
    previewCardExp.textContent = e.target.value || 'MM/YY';
  });

  // Card type select
  cardTypeSelect.addEventListener('change', (e) => {
    previewCardTypeBadge.textContent = e.target.value.toUpperCase();
  });

  // Save Card handler
  const saveCardBtn = document.getElementById('saveCardBtn');
  const cardsContainer = document.getElementById('cardsContainer');

  saveCardBtn.addEventListener('click', () => {
    const num = cardNumberInput.value.replace(/\s+/g, '');
    const last4 = num.length >= 4 ? num.slice(-4) : '6032';
    const cardType = cardTypeSelect.value;
    const cardHolder = cardNameInput.value.trim().toUpperCase() || 'ALEX WALKER';
    const cardExp = cardExpInput.value.trim() || '05/29';

    // Insert new card visually into the cards carousel before the "Add" tile
    const newCard = document.createElement('div');
    newCard.className = 'payment-card-item card-theme-sapphire';
    newCard.setAttribute('tabindex', '0');
    newCard.innerHTML = `
      <div class="card-inner-top">
        <div class="chip-container">
          <div class="emv-chip"></div>
          <svg class="contactless-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M8.5 16.5a5 5 0 0 1 0-7"/><path d="M12 19a9 9 0 0 0 0-14"/><path d="M15.5 21.5a13 13 0 0 0 0-19"/></svg>
        </div>
        <span class="card-badge-pill">${cardType.toUpperCase()}</span>
      </div>
      <div class="card-number-preview">
        <span class="dots">&bull;&bull;&bull;&bull;</span>
        <span class="dots">&bull;&bull;&bull;&bull;</span>
        <span class="dots">&bull;&bull;&bull;&bull;</span>
        <span class="last-digits">${last4}</span>
      </div>
      <div class="card-inner-bottom">
        <div>
          <span class="card-holder-label">CARDHOLDER</span>
          <span class="card-holder-name">${cardHolder}</span>
        </div>
        <div>
          <span class="card-exp-label">EXPIRES</span>
          <span class="card-exp-val">${cardExp}</span>
        </div>
        <div class="network-logo">
          <span class="visa-text">VISA</span>
        </div>
      </div>
    `;

    const tileAddCardBtn = document.getElementById('tileAddCardBtn');
    cardsContainer.insertBefore(newCard, tileAddCardBtn);

    closeModal(addCardModal);
    showToast(`Success! ${cardType} ending in •••• ${last4} linked to your PayPal wallet.`, 'success');

    // Reset fields
    cardNumberInput.value = '';
    cardExpInput.value = '';
    previewCardNumber.textContent = '•••• •••• •••• ••••';
  });

  // =========================================================================
  // 4. TRANSFER FUNDS MODAL
  // =========================================================================
  const transferFundsBtn = document.getElementById('transferFundsBtn');
  const confirmTransferBtn = document.getElementById('confirmTransferBtn');
  const transferAmountInput = document.getElementById('transferAmountInput');
  const displayedBalance = document.getElementById('displayedBalance');

  transferFundsBtn.addEventListener('click', () => openModal(transferModal));

  confirmTransferBtn.addEventListener('click', () => {
    const amt = parseFloat(transferAmountInput.value) || 250.00;
    let currentBal = parseFloat(displayedBalance.textContent.replace(',', '')) || 4820.50;
    
    if (amt > currentBal) {
      showToast('Transfer amount exceeds available balance', 'info');
      return;
    }

    currentBal = (currentBal - amt).toFixed(2);
    displayedBalance.textContent = Number(currentBal).toLocaleString('en-US', { minimumFractionDigits: 2 });

    closeModal(transferModal);
    showToast(`✓ Transfer of $${amt.toFixed(2)} USD initiated successfully!`, 'success');
  });

  // =========================================================================
  // 5. SEND MONEY & QUICK RECIPIENTS
  // =========================================================================
  const quickSendBtn = document.getElementById('quickSendBtn');
  const sendRecipientInput = document.getElementById('sendRecipientInput');
  const confirmSendBtn = document.getElementById('confirmSendBtn');

  quickSendBtn.addEventListener('click', () => {
    sendRecipientInput.value = 'sarah@example.com';
    openModal(sendModal);
  });

  document.querySelectorAll('.contact-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const name = pill.getAttribute('data-name');
      sendRecipientInput.value = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      openModal(sendModal);
    });
  });

  confirmSendBtn.addEventListener('click', () => {
    const to = sendRecipientInput.value;
    const amt = document.getElementById('sendAmountInput').value;
    closeModal(sendModal);
    showToast(`Payment of $${amt} sent to ${to}! (Demo)`, 'success');
  });

  // =========================================================================
  // 6. ACTIVITY FEED SEARCH & FILTERS
  // =========================================================================
  const searchTxInput = document.getElementById('searchTxInput');
  const txItems = document.querySelectorAll('.tx-item');
  const chipButtons = document.querySelectorAll('.chip-btn');

  // Search input filter
  searchTxInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    txItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'flex' : 'none';
    });
  });

  // Filter chips (All, Completed, Received, Payments)
  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      chipButtons.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      txItems.forEach((item) => {
        const itemType = item.getAttribute('data-type');
        if (filter === 'all' || filter === 'completed') {
          item.style.display = 'flex';
        } else if (filter === 'received' && itemType === 'received') {
          item.style.display = 'flex';
        } else if (filter === 'payments' && itemType === 'payment') {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // =========================================================================
  // 7. TOAST NOTIFICATIONS HELPER
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-info'}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // =========================================================================
  // 8. OTHER BUTTONS / DEMO INTERACTIONS
  // =========================================================================
  const interactiveButtons = [
    { id: 'quickRequestBtn', msg: 'Request money interface activated' },
    { id: 'quickAddMoneyBtn', msg: 'Add funds options: Direct Deposit or Debit transfer' },
    { id: 'directDepositBtn', msg: 'Routing: 121000358 | Account: •••• 9821' },
    { id: 'linkBankModalTrigger', msg: 'Select your financial institution (Chase, BofA, Wells Fargo)' },
    { id: 'orderPayPalCardBtn', msg: 'Order a physical PayPal Cashback Mastercard with 1% cash back' },
    { id: 'manageAllCardsLink', msg: 'Opening Wallet payment method preferences' },
    { id: 'manageBankBtn', msg: 'Checking account preferences opened' },
    { id: 'manageDebitBtn', msg: 'Debit card security, pin, and lock controls' },
    { id: 'payIn4ExploreBtn', msg: 'Pay in 4: 0% APR installment plan preview' },
    { id: 'showQrCodeBtn', msg: 'Personal PayPal QR Code generated for in-store checkout' },
    { id: 'viewAllActivityBtn', msg: 'Full statement & transaction history export' },
    { id: 'viewContactsLink', msg: 'Address book & recent transaction contacts list' },
    { id: 'addNewContactBtn', msg: 'Add new contact dialog opened' },
    { id: 'notificationsBtn', msg: '2 new notifications: "Security checkup passed", "Cashback credited"' },
    { id: 'settingsBtn', msg: 'Account settings, 2FA security & privacy controls' },
    { id: 'forgotPasswordLink', msg: 'Password reset link sent to demo user' }
  ];

  interactiveButtons.forEach(({ id, msg }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        showToast(msg, 'info');
      });
    }
  });

  // Top nav tab switching
  document.querySelectorAll('.nav-item').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      if (tabName === 'wallet') {
        document.getElementById('cardsSection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (tabName === 'vaults') {
        document.getElementById('vaultsSection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (tabName === 'activity') {
        document.getElementById('activitySection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (tabName === 'send-request') {
        openModal(sendModal);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

});
