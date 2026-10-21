# KubePay AI 🚀  
> **Declarative, Containerized Financial Enclaves & Policy Guardrails for Autonomous AI Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PayPal Developer API](https://img.shields.io/badge/PayPal-Sandbox%20v2-blue.svg)](https://developer.paypal.com/)
[![Built for Hackathon](https://img.shields.io/badge/Hackathon-PayPal%20%2B%20AI%202026-green.svg)]()

---

## 📌 Executive Summary

As AI agents transition from passive assistants to autonomous actors, **the single biggest barrier to AI commerce is financial risk**. Users are understandably hesitant to grant an LLM direct access to their primary credit card or PayPal account due to hallucination risks, vendor overcharging, or compromised agent workflows.

**KubePay AI** solves this trust problem by bringing **Kubernetes-style containerization, declarative policy guardrails, and isolated sub-vaults** to financial payments. 

Instead of giving an AI agent unrestricted account access, KubePay provisions micro-budgeted, domain-specific "Financial Vault Containers" (e.g., E-Commerce Vault, Utility Bill Vault, Vendor Payout Vault). Each vault operates within strict, machine-enforceable natural-language and programmatic policies. Once a vault's task completes or expires, unused funds automatically collapse back to the user's primary PayPal account.

---

## ✨ Key Features & USP

1. **Air-Gapped Financial Enclaves (Isolation):**  
   Every agent operates inside a restricted "Vault." An e-commerce shopping agent cannot access the balance allocated for utility bills or cloud hosting.
2. **Declarative Policy Engine (Guardrails):**  
   Set hard limits in plain English or structured JSON (e.g., *"Max $50 per transaction," "Only approved vendors," "Auto-expire in 48h"*). Transactions that violate policies are blocked before hitting the network.
3. **Dynamic Auto-Liquidation & Refund:**  
   If an agent fails to execute a task before its expiration deadline, funds locked in the vault are immediately returned to the main PayPal balance using the **PayPal Payouts API**.
4. **Control Plane Dashboard (AG Grid Powered):**  
   A centralized visual management dashboard rendering real-time cluster metrics, active vault statuses, budget allocations, and live policy enforcement logs.

---

## 🏗 System Architecture

```
                                  ┌───────────────────────────────────────────────────┐
                                  │           KubePay Control Plane Dashboard         │
                                  │               (Powered by AG Grid)                │
                                  └─────────────────────────┬─────────────────────────┘
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  │            Declarative Policy Engine              │
                                  │      (Evaluates Rules, Vendors, Limits, Expiry)   │
                                  └───────────────┬───────────────────┬───────────────┘
                                                  │                   │
                   ┌──────────────────────────────┴───┐           ┌───┴──────────────────────────────┐
                   │    Vault A: E-Commerce Agent     │           │     Vault B: Utility Sub Vault    │
                   │    (Channel3 + KERNEL Browser)   │           │     (Auto-Billing Controller)    │
                   ├──────────────────────────────────┤           ├──────────────────────────────────┤
                   │ Budget: $100.00                  │           │ Budget: $250.00                  │
                   │ Guardrail: Max $50/item          │           │ Guardrail: Matches bill invoice  │
                   │ Priority: Medium                 │           │ Priority: High                   │
                   └────────────────┬─────────────────┘           └────────────────┬─────────────────┘
                                    │                                              │
                                    ▼                                              ▼
                         [ PayPal Orders API ]                          [ PayPal Subscriptions API ]
                                    │                                              │
                                    └───────────────────────┬──────────────────────┘
                                                            │
                                                            ▼
                                                [ PayPal Payouts API ]
                                            (Auto-Refund Unused Balances)
```

---

## 🛠 Tech Stack & Sponsor Tool Integrations

| Technology / Tool | Category | Role in KubePay AI |
| :--- | :--- | :--- |
| **PayPal REST APIs** | Core Gateway | **Vault, Orders, Subscriptions, & Payouts APIs** for tokenized micro-transfers and auto-liquidation. |
| **AG Grid** | Sponsor Tool | Enterprise UI grid rendering real-time vault status, financial logs, and policy violation alerts. |
| **APIMatic** | Sponsor Tool | Contextual OpenAPI plugins generating typed SDKs for seamless LLM tool-calling. |
| **Channel3 API** | Sponsor Tool | Fetches structured product catalog data for shopping agent micro-vaults without web scraping. |
| **KERNEL** | Sponsor Tool | Cloud headless browser execution environment for automated merchant checkouts. |
| **Elasticsearch** | Sponsor Tool | Vector search over historical transaction logs, invoice receipts, and policy audit trails. |
| **Render** | Sponsor Tool | Cloud hosting platform for backend Node.js services and Webhook listener endpoints. |
| **Zapier** | Sponsor Tool | Automated cross-platform notifications (Slack/Email alerts on policy breaches). |

---

## 📜 Declarative Policy Schema Example

Policies are declared when a vault is provisioned. Below is an example policy JSON generated from natural language:

```json
{
  "vault_id": "shopping-vault-8801",
  "name": "Headphones Deal Finder",
  "allocated_budget": 50.00,
  "currency": "USD",
  "rules": {
    "max_single_transaction": 45.00,
    "allowed_categories": ["Electronics", "Audio"],
    "approved_merchants": ["PayPal Merchant Sandbox A", "Target", "BestBuy"],
    "expiry_timestamp": "2026-10-20T23:59:59Z",
    "on_policy_violation": "BLOCK_AND_ALERT"
  },
  "liquidation": {
    "auto_refund": true,
    "destination_account": "user-primary-sandbox@paypal.com"
  }
}
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
* **Node.js** v18+ or **Python** 3.10+
* **PayPal Developer Sandbox Account** ([developer.paypal.com](https://developer.paypal.com))
* **Channel3 API Key** & **KERNEL API Token** (Optional for web browsing agent)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/kubepay-ai.git
cd kubepay-ai
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_MODE=sandbox
CHANNEL3_API_KEY=your_channel3_key
KERNEL_API_TOKEN=your_kernel_token
ELASTIC_SEARCH_URL=your_elastic_instance
```

### 3. Install Dependencies
```bash
# Frontend & Backend Dependencies
npm install
```

### 4. Run the Application
```bash
# Start backend orchestrator and AG Grid dashboard
npm run dev
```
Open `http://localhost:3000` in your browser to access the **KubePay Control Plane**.

---

## 🎥 Demo Scenario Walkthrough (3-Minute Video Guide)

1. **Cluster Provisioning (0:00 - 0:45):**  
   Navigate to the dashboard. Click **Deploy Vault** and type:  
   *"Create a vault with $50 to buy noise-canceling headphones before Sunday, max spend $45."*  
   *Watch KubePay generate the declarative JSON policy and initialize a $50 PayPal Sandbox hold.*

2. **Policy Guardrail Breach Test (0:45 - 1:30):**  
   Simulate an agent attempting to purchase headphones priced at **$48.00**.  
   *The Policy Engine intercepts the payload, flags a `MAX_LIMIT_EXCEEDED` policy breach, blocks the payment, and triggers a Zapier alert.*

3. **Valid Autonomous Execution (1:30 - 2:15):**  
   **Channel3 API** identifies a deal for **$39.99**.  
   *The Policy Engine validates the transaction. The agent completes checkout autonomously via PayPal Orders API.*

4. **Auto-Liquidation & Teardown (2:15 - 3:00):**  
   The remaining **$10.01** balance is automatically refunded back to the user's primary PayPal sandbox balance via the **PayPal Payouts API**. **AG Grid** updates the live audit log.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🤝 Acknowledgments & Sponsors

Built for the **Build What's Next with PayPal and AI Global Hackathon 2026**. Special thanks to PayPal, AG Grid, APIMatic, Channel3, KERNEL, Elastic, and Render for developer tooling and sandbox infrastructure.