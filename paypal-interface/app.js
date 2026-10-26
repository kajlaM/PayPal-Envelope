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
    ACTIVE: ['Active', 'active-pill'],
    EXPIRED: ['Expired', 'expired-pill'],
    LIQUIDATED: ['Closed · refunded', 'closed-pill'],
  };

  const OUTCOME_TEXT = {
    BOUGHT: 'Bought an item',
    NEEDS_HUMAN: 'Waiting for your approval',
    NO_MATCH: 'Nothing matched your rules yet',
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
  };

  const usd = (cents) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const usdDollars = (dollars) => usd(Math.round(Number(dollars) * 100));
  const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const when = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const reasons = (codes) => (codes ?? []).map((c) => REASON_TEXT[c] ?? c).join(', ');

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
    const what = v.type === 'UTILITY' ? 'Bill payments' : v.policy?.shopping?.product_query ?? 'Shopping';
    const pct = v.budgetCents > 0 ? Math.min(100, Math.round((v.balanceCents / v.budgetCents) * 100)) : 0;
    const expires = new Date(v.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const watching = v.status === 'ACTIVE' && v.nextAgentRunAt ? ' &bull; AI watching' : '';
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
        <span class="vault-policy-badge">Max ${usdDollars(rules.max_single_transaction ?? 0)} per payment &bull; ends ${expires}${watching}</span>
        <button type="button" class="btn-ghost-sm vault-manage-btn">Manage</button>
      </div>
    `;
    return el;
  }

  async function loadVaults() {
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
      const what = v.type === 'UTILITY' ? 'Bill payments' : v.policy?.shopping?.product_query ?? 'Shopping';
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
    describe: 'Put money aside and tell the AI what it is for.',
    review: 'Check the rules the AI wrote. They are enforced on every payment.',
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
  const createTexts = { hint: amountHint.textContent, placeholder: descInput.placeholder };
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
      : createTexts.hint;
    if (vault) amountInput.value = (vault.budgetCents / 100).toFixed(2);
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
    const newMoneyCents = Math.round(amount * 100) - (editVault?.budgetCents ?? 0); // only this comes from PayPal
    if (balanceCents !== null && newMoneyCents > balanceCents) return setError(describeError, `That needs ${usd(newMoneyCents)} more than your PayPal balance (${usd(balanceCents)}).`);
    if (description.length < 5) return setError(describeError, 'Tell the AI what the vault is for.');

    busy(continueBtn, 'AI is writing the rules…');
    try {
      vaultDraft = editVault
        ? await request(`/me/vaults/${encodeURIComponent(editVault.id)}/policy/preview`, { amount, description })
        : await request('/me/vaults/preview', { amount, description });
      renderReview(vaultDraft);
      showVaultStep('review');
    } catch (err) {
      setError(describeError, err.message);
    } finally {
      busy(continueBtn, null);
    }
  });

  // The policy as [label, text] rows (text is already HTML-escaped).
  function policyRows(p) {
    const r = p.rules;
    const rows = [
      ['Vault', `${escapeHtml(p.vault_name)} <span class="muted">(${p.vault_type === 'UTILITY' ? 'bill payments' : 'shopping'})</span>`],
      ['Amount', usdDollars(p.allocated_budget)],
      ['Max per payment', usdDollars(r.max_single_transaction)],
      ['Allowed shops', escapeHtml(r.approved_merchants.join(', '))],
      ['Categories', escapeHtml(r.allowed_categories.join(', '))],
      ['Ends', when(r.expiry_timestamp)],
    ];
    if (p.shopping) rows.splice(1, 0, ['AI looks for', escapeHtml(p.shopping.product_query)]);
    if (r.human_approval_above !== undefined) rows.push(['Ask me above', usdDollars(r.human_approval_above)]);
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
      rows = rows.map(([k, v]) => [k, k === 'Amount' ? `<strong>${v}</strong> from ${escapeHtml(currentUser?.sandboxEmail ?? 'your PayPal')}`
        : k === 'Ends' ? `${v} <span class="muted">(leftover money comes back to you)</span>` : v]);
    }
    document.getElementById('vaultReview').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')
      + `<dt>Rules written by</dt><dd class="muted">${escapeHtml(draft.model ?? 'AI')}</dd>`;

    const warnings = document.getElementById('vaultWarnings');
    warnings.innerHTML = (draft.warnings ?? []).map((w) => `<li>${escapeHtml(w)}</li>`).join('');
    warnings.classList.toggle('hidden', !draft.warnings?.length);

    // PayPal is only needed when money is taken from it.
    const linked = !!currentUser?.paypalLinked || (editVault && draft.changeCents <= 0);
    const linkBox = document.getElementById('vaultLinkBox');
    linkBox.classList.toggle('hidden', linked);
    linkBox.innerHTML = currentUser?.paypalLinking
      ? `<p><strong>Connecting your PayPal account…</strong> This happens once and takes a few seconds.</p>`
      : `<p><strong>Your PayPal account is not connected.</strong> ${escapeHtml(currentUser?.paypalLinkError ?? '')}</p>
         <button type="button" class="btn btn-primary-sm link-retry-btn">Try again</button>
         <button type="button" class="btn-text-link link-paypal-btn">Link manually</button>`;
    document.getElementById('vaultPasswordGroup').classList.toggle('hidden', !linked);
    payBtn.disabled = !linked;
    payBtn.dataset.label = !editVault ? `Pay ${usdDollars(p.allocated_budget)} &amp; create vault`
      : draft.changeCents > 0 ? `Pay ${usd(draft.changeCents)} &amp; update vault`
      : draft.changeCents < 0 ? `Update vault &amp; refund ${usd(-draft.changeCents)}`
      : 'Update vault';
    payBtn.innerHTML = payBtn.dataset.label;
    setError(reviewError, '');
    vaultPassword.value = '';
    if (linked) setTimeout(() => vaultPassword.focus(), 0);
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
    if (!vaultPassword.value) return setError(reviewError, 'Enter your password to confirm.');

    if (editVault) return submitPolicyChange();
    const amount = usdDollars(vaultDraft.policy.allocated_budget);
    busy(payBtn, 'Paying…');
    try {
      const vault = await request('/me/vaults', { policy: vaultDraft.policy, sourceText: vaultDraft.sourceText, password: vaultPassword.value });
      createdVaultId = vault.id;
      showVaultStep('progress');
      renderProgress([
        ['done', 'Vault created with your rules'],
        ['done', `${amount} taken from your PayPal (${escapeHtml(currentUser.sandboxEmail)})`],
        ['done', `Vault is active: ${usd(vault.balanceCents)} locked in`],
        ['active', vault.type === 'SHOPPING' ? 'AI agent is searching shops now…' : 'AI bill-pay agent is checking your bills now…'],
      ]);
      doneBtn.classList.remove('hidden');
      vaultDraft = null;
      refreshAccount();
      loadVaults();
    } catch (err) {
      if (err.status === 401 && err.body?.error === 'WRONG_PASSWORD') {
        setError(reviewError, 'Wrong password.');
        vaultPassword.select();
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
    if (step.tool === 'pay_invoice') return `Paying bill ${escapeHtml(step.input?.invoice_id ?? '')}: ${escapeHtml(out.decision?.result ?? out.error ?? 'sent')}`;
    return `Used ${escapeHtml(step.tool.replace(/_/g, ' '))}`;
  }

  function activityRows(v) {
    const rows = [];
    for (const d of v.decisions ?? []) {
      const req = d.requestJson ?? {};
      const what = `${usdDollars(req.amount ?? 0)} at ${escapeHtml(req.merchant ?? '?')}`;
      let text;
      if (d.result === 'APPROVE') text = `✅ Approved ${what}`;
      else if (d.result === 'BLOCK') text = `⛔ Blocked ${what}: ${reasons(d.reasons)}`;
      else if (d.resolvedBy === 'APPROVED_BY_HUMAN') text = `👍 You approved ${what}`;
      else if (d.resolvedBy === 'REJECTED_BY_HUMAN') text = `👎 You rejected ${what}`;
      else if (d.resolvedBy === 'CANCELLED_POLICY_CHANGED') text = `🚫 Cancelled ${what}: you changed the vault's rules`;
      else text = `✋ Needs approval: ${what} (${reasons(d.reasons)})`;
      rows.push({ at: d.createdAt, text, sub: escapeHtml(req.reason ?? '') });
    }
    for (const e of v.ledger ?? []) {
      const amount = usd(e.amountCents);
      const state = e.status === 'COMPLETED' ? '' : ` <span class="muted">(${e.status.toLowerCase()})</span>`;
      const text = e.type === 'FUND' ? `💰 ${amount} added from your PayPal${state}`
        : e.type === 'SPEND' ? `💸 Paid ${amount} to ${escapeHtml(e.merchant?.name ?? 'merchant')}${state}`
        : `↩️ ${amount} refunded to your PayPal${state}`;
      rows.push({ at: e.createdAt, text, sub: '' });
    }
    return rows.sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  async function renderVaultDetail() {
    if (!detailId) return;
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

    const [label, pillClass] = statusPill(v);
    const r = v.policy.rules;
    const pct = v.budgetCents > 0 ? Math.min(100, Math.round((v.balanceCents / v.budgetCents) * 100)) : 0;
    const pending = v.status === 'ACTIVE' ? (v.decisions ?? []).filter((d) => d.result === 'NEEDS_HUMAN' && !d.resolvedBy) : [];
    const steps = (agentSteps[v.id] ?? []).slice(-12);
    const agentLine = v.status !== 'ACTIVE' ? 'The agent only works while the vault is active.'
      : `${v.lastAgentOutcome ? `Last run: ${OUTCOME_TEXT[v.lastAgentOutcome] ?? v.lastAgentOutcome} (${when(v.lastAgentRunAt)}).` : 'Starting its first run…'}`
        + (v.nextAgentRunAt ? ` Next check ${when(v.nextAgentRunAt)}.` : '');
    const canRefund = v.status === 'ACTIVE' || (v.status === 'EXPIRED' && v.balanceCents > 0);
    const activity = activityRows(v);
    const history = v.policyHistory ?? [];
    detailVault = v;

    document.getElementById('vdTitle').textContent = v.name;
    document.getElementById('vdSubtitle').textContent = `${v.type === 'UTILITY' ? 'Bill payments' : 'Shopping'} vault • created ${when(v.createdAt)}`;

    detailBody.innerHTML = `
      <section class="vd-summary">
        <div class="vd-balance">
          <span class="vault-status-pill ${pillClass}">${label}</span>
          <div class="vd-amount">${usd(v.balanceCents)} <small>left of ${usd(v.budgetCents)}</small></div>
          <div class="vault-progress-bar"><div class="vault-progress-fill" style="width: ${pct}%;"></div></div>
        </div>
        <dl class="vault-review compact">
          ${v.policy.shopping ? `<dt>AI looks for</dt><dd>${escapeHtml(v.policy.shopping.product_query)}</dd>` : ''}
          <dt>Max per payment</dt><dd>${usdDollars(r.max_single_transaction)}</dd>
          <dt>Allowed shops</dt><dd>${escapeHtml(r.approved_merchants.join(', '))}</dd>
          <dt>Ends</dt><dd>${when(r.expiry_timestamp)}</dd>
        </dl>
      </section>

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

      <section class="vd-section">
        <div class="vd-section-head">
          <h3>AI agent</h3>
          <div class="vd-actions">
            ${v.status === 'ACTIVE' ? '<button type="button" class="btn btn-primary-sm" data-action="run-agent">Run now</button>' : ''}
            ${v.status === 'ACTIVE' && v.nextAgentRunAt ? '<button type="button" class="btn-ghost-sm" data-action="stop-agent">Stop watching</button>' : ''}
          </div>
        </div>
        <p class="muted">${agentLine}</p>
        <ol class="vd-steps" id="vdSteps">${steps.map((s) => `<li><span class="muted small">${new Date(s.at).toLocaleTimeString()}</span> ${stepText(s)}</li>`).join('')}</ol>
      </section>

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
        ${activity.length ? `<ul class="vd-activity">${activity.map((a) => `<li><div>${a.text}${a.sub ? `<div class="muted small">${a.sub}</div>` : ''}</div><span class="muted small">${when(a.at)}</span></li>`).join('')}</ul>` : '<p class="muted">Nothing yet.</p>'}
      </section>

      ${canRefund ? `
      <section class="vd-footer">
        ${v.status === 'ACTIVE' ? '<button type="button" class="btn btn-primary" data-action="change-policy">Change rules or amount</button>' : ''}
        <button type="button" class="btn btn-secondary" data-action="liquidate">Close vault &amp; refund ${usd(v.balanceCents)}</button>
      </section>` : ''}
    `;
    detailBody.querySelectorAll('.approve-password').forEach((el) => { el.value = typed[el.dataset.decision] ?? ''; });
  }

  detailBody.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button || !detailId) return;
    const id = encodeURIComponent(detailId);
    const action = button.dataset.action;
    const decision = button.dataset.decision;
    const original = button.textContent;
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
      }
      await Promise.all([renderVaultDetail(), loadVaults(), refreshAccount()]);
    } catch (err) {
      const box = document.getElementById('vdApprovalError');
      const message = err.body?.reasons ? `${err.message}: ${reasons(err.body.reasons)}` : err.message;
      if (box && (action === 'approve' || action === 'reject')) setError(box, message);
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
      socket.on('agent:step', (step) => {
        (agentSteps[step.vaultId] ??= []).push({ ...step, at: Date.now() });
        if (step.vaultId === detailId) {
          const list = document.getElementById('vdSteps');
          if (list) list.insertAdjacentHTML('beforeend', `<li><span class="muted small">${new Date().toLocaleTimeString()}</span> ${stepText(step)}</li>`);
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
