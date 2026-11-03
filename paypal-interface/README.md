# PayPal Web Interface Replica (Demonstration & Preview)

A high-fidelity replica of the **PayPal Login** and **Wallet Dashboard** interface created in a dedicated standalone folder without touching or modifying any of the existing project codebase.

---

## 🚀 How to View & Open

The site now has real logins and reads vaults from the KubePay backend, so it runs through its own small server (`server.ts`). Opening `index.html` directly no longer works.

From the repo root, one command starts everything and prints the Cloudflare link:
```bash
npm run up              # API + this site + Cloudflare link (Ctrl+C stops all three)
npm run up -- --local   # same, without the tunnel
```

Or run the parts yourself, in three terminals:
```bash
npm run api:dev      # KubePay API on :4000 (the backend, stays private)
npm run site:dev     # this site on http://localhost:3000 (the front end)
npm run tunnel       # Cloudflare link -> this site (prints https://<name>.trycloudflare.com)
```

This site is the only thing the Cloudflare link exposes. Its server forwards two paths to the API, so
nothing else needs to be public:
- `/socket.io` (live vault updates, incl. WebSocket)
- `/webhooks` (PayPal webhooks: register `https://<tunnel>/webhooks/paypal` with `npm run setup:webhooks -w packages/paypal -- https://<tunnel>`)

`GET /health` reports whether the site and the API are both up. The API URL comes from `KUBEPAY_API_URL` (default `http://localhost:4000`), the site port from `INTERFACE_PORT` (default `3000`).

### Demo customers
| Username (or log in with the email) | Password | Linked PayPal sandbox account |
| :--- | :--- | :--- |
| `kajla` | `1234` | `kajla@personal.example.com` |
| `jugal` | `1234` | `jugal@personal.example.com` |

Accounts live in `accounts.ts`. On first login each customer gets a KubePay user (matched by sandbox email), and the Vaults section shows only that customer's vaults.

### How vaults work here
1. **Link PayPal (once per customer).** A PayPal sandbox window opens. Log in there with the sandbox account's own password from developer.paypal.com and approve. The site saves that PayPal account (PayPal Vault API, `paypal-link.ts`, stored in `data/links.json`), and only accepts the customer's own sandbox email.
2. **Create a vault.** Enter an amount and describe the job in plain English. The KubePay AI writes the rules, you review them and confirm with your password (`1234`). The amount is charged to the saved PayPal account at once, the vault becomes active, and its AI agent starts (Channel3 product search for shopping vaults).
   **Funding choice** (review step, or "Fund this vault" on a vault still awaiting funding). Only PayPal's own options, no cards or Venmo:
   - **Pay with PayPal**: taken from the saved PayPal account right away (password).
   - **PayPal Pay Later**: the PayPal JS SDK Pay Later button. The vault gets the full amount at once, and the customer pays PayPal back in 4 payments (Pay in 4, US accounts, $30 to $1,500). Same Orders API order and capture as a normal funding.
   - **Ask a friend on PayPal**: KubePay's platform account sends a PayPal money request (Invoicing API) to the friend's PayPal email. The friend pays it on PayPal and the money goes straight into the vault (`fund_requests` table, FUND entry with the invoice id). The friend sees it under **Money requests for you** when they log in here. The vault learns about the payment from the `INVOICING.INVOICE.PAID` webhook (platform app), the background tick, or "Check now". Requests still open when the vault expires are cancelled.
3. **Manage.** Click a vault for its rules, live agent steps, activity, purchases waiting for your approval (password needed), and "Close vault & refund".

**Balance:** read live from the sandbox account itself. PayPal has no API for a personal account's balance, so `sandbox-balance.ts` logs in to sandbox.paypal.com as the customer in a hidden Chrome and reads the balance PayPal shows (cached 30 s, re-read after every payment). It needs each account's sandbox login password in the repo-root `.env`:
```
KAJLA_SANDBOX_PASSWORD=...
JUGAL_SANDBOX_PASSWORD=...
```

---

## 🌟 Included Screens & Features

### 1. 🔒 Login Screen
- Authentic PayPal branding with double-P logo and wordmark.
- Floating label inputs with focus states.
- Password show / hide visibility toggle.
- "Forgot password?" interaction.
- Full-width PayPal blue primary button ("Log In") with realistic loading animation.
- "Sign Up" button and legal navigation links.
- **Instant Demo Switcher**: Clicking "Log In" smoothly transitions directly to the Dashboard.

### 2. 💳 Dashboard & Wallet Screen
- **Global Navigation Bar**:
  - PayPal logo, primary navigation links (*Home, Send & Request, Wallet, Activity, Help*).
  - Notification icon with unread badge count, Settings gear icon, User profile avatar (`Alex Walker`), and **Log Out** button (returns back to Login).
- **Sub-Navbar Quick Actions Ribbon**:
  - Greeting with verified identity badge.
  - Quick action pill buttons: **Send**, **Request**, **Add Money**, and **+ Add Debit Card**.
- **Hero Balance Card**:
  - Live PayPal balance (`$4,820.50 USD`).
  - **Transfer Funds** action button.
  - **Direct Deposit Info** details.
  - Multi-currency breakdown (`$4,650.00 USD` primary and `€155.00 EUR`).
- **Banks and Cards (Wallet Section)**:
  - Realistic visual card renders with EMV microchips, contactless wave SVGs, cardholder name, expiry, and network logos (Visa, Mastercard).
  - Linked accounts: *PayPal Debit Mastercard*, *Chase Sapphire Preferred (Visa)*, and *JPMorgan Chase Checking*.
  - **All Action Buttons**:
    - **Add Debit Card** (in header and carousel)
    - **Link a Card**
    - **Link a Bank**
    - **Get a PayPal Debit Card**
    - **Manage** buttons for individual payment methods
- **Recent Activity Feed**:
  - Real-time search filter for transactions and people.
  - Filter chips (*All, Completed, Received, Payments*).
  - Transaction rows with merchant avatars (Apple Services, Sarah Jenkins, Nike Store, Studio Apex, Uber).
- **Sidebar Modules**:
  - **Send Again**: Quick contact circle avatars with one-click payment modal launch.
  - **Pay in 4**: PayPal installment credit preview banner.
  - **In-Store Payments**: Personal QR code payment module.
  - **Security & Protection**: Real-time status checklist.

---

## 🛠️ Interactive Modals
- **Link a Debit or Credit Card Modal**:
  - Live preview card that dynamically updates as you type the card number, detects brand (Visa, Mastercard, Amex), updates cardholder name, and formats expiration dates.
  - Form fields: Card number, card type dropdown, cardholder name, expiration date (`MM/YY`), CVV/CSC security code, and billing address.
  - Clicking "Link Card" adds the new card directly to your wallet carousel and displays a confirmation toast.
- **Transfer Funds Modal**:
  - Choice between Instant transfer to debit card (1.75% fee) or free standard transfer (1–3 business days).
  - Amount input that updates your wallet balance in real-time.
- **Send Money Modal**:
  - Recipient, amount, notes, and payment classification (*Friends & Family* vs *Goods & Services*).

---

## 📁 File Structure
```text
paypal-interface/
├── index.html     # Semantic HTML5 layout with native dialogs and SVGs
├── styles.css     # Vanilla CSS design system with PayPal color tokens and responsive styles
├── app.js         # Client-side router, modal controller, and real-time card preview logic
└── README.md      # Documentation and quickstart instructions
```
