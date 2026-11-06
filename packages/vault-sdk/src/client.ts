import { buildAuthSchemes, type AuthSchemes } from "./auth-schemes.js";
import type { ClientOptions } from "./client-options.js";
import { buildCoreClientOptions } from "./core/client-options.js";
import { RawClient } from "./core/raw-client.js";
import * as host from "./core/runtime-environment.js";
import * as s from "./core/validation/index.js";
import { Agent } from "./resources/agent.js";
import { Audit } from "./resources/audit.js";
import { Funding } from "./resources/funding.js";
import { PayPalVerification } from "./resources/pay-pal-verification.js";
import { Products } from "./resources/products.js";
import { Purchases } from "./resources/purchases.js";
import { SavingsApi } from "./resources/savings-api.js";
import { System } from "./resources/system.js";
import { Vaults } from "./resources/vaults.js";
import { buildServers, type Servers } from "./servers.js";

/**
 * PRIVATE API of PayPalVault: policy-limited PayPal vaults for one AI shopping agent.
 *
 * Safety rules, built into the API:
 * - Only the PayPalVault site and PayPalVault's own AI agent call it. No outside agents or tools;
 *   it is not public.
 * - The agent can only ASK to buy (requestPurchase). The Policy Engine decides; the owner approves
 *   with a password when the rules say so.
 * - Money only moves through PayPal (sandbox): funding via Orders, purchases via Checkout or
 *   Payouts, refunds via Payouts.
 * - Internal operations need the internal key (x-internal-key), which only PayPalVault itself
 *   holds.
 * - "Verified by PayPal" (verifyVault) only reads from PayPal.
 */
export class PayPalVaultApiClient {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;
  #vaults?: Vaults;
  #funding?: Funding;
  #purchases?: Purchases;
  #agent?: Agent;
  #savingsApi?: SavingsApi;
  #payPalVerification?: PayPalVerification;
  #products?: Products;
  #audit?: Audit;
  #system?: System;

  constructor(options: ClientOptions = {}) {
    this.#rawClient = new RawClient({
      ...buildCoreClientOptions(options, "PAY_PAL_VAULT_API_CLIENT_LOG"),
      defaultHeaders: [
        { name: "User-Agent", value: "PayPalVaultApiClient/0.1.0 TypeScript", schema: s.string() },
        { name: "X-APIMatic-Lang", value: "TypeScript", schema: s.string() },
        { name: "X-APIMatic-Package-Version", value: "0.1.0", schema: s.string() },
        { name: "X-APIMatic-Gen-Version", value: "4.0.0", schema: s.string() },
        { name: "X-APIMatic-OS", value: host.operatingSystem(), schema: s.optional(s.string()) },
        { name: "X-APIMatic-Runtime", value: host.runtimeDescription(), schema: s.optional(s.string()) },
      ],
      defaultQuery: [],
      defaultPathParams: [],
    });

    this.#servers = buildServers(options);

    this.#auth = buildAuthSchemes(options);
  }

  /**
   * Create, read, change and close vaults
   */
  get vaults(): Vaults {
    return (this.#vaults ??= new Vaults(this.#rawClient, this.#servers));
  }

  /**
   * Money into a vault, always from PayPal
   */
  get funding(): Funding {
    return (this.#funding ??= new Funding(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Every payment out goes through the Policy Engine
   */
  get purchases(): Purchases {
    return (this.#purchases ??= new Purchases(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * PayPalVault's own AI agent (no outside agents)
   */
  get agent(): Agent {
    return (this.#agent ??= new Agent(this.#rawClient, this.#servers));
  }

  /**
   * Vaults paid into over time
   */
  get savingsApi(): SavingsApi {
    return (this.#savingsApi ??= new SavingsApi(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Read-only check of every payment against PayPal's records
   */
  get payPalVerification(): PayPalVerification {
    return (this.#payPalVerification ??= new PayPalVerification(this.#rawClient, this.#servers));
  }

  /**
   * Channel3 product data
   */
  get products(): Products {
    return (this.#products ??= new Products(this.#rawClient, this.#servers));
  }

  /**
   * Elastic audit log and Audit Copilot
   */
  get audit(): Audit {
    return (this.#audit ??= new Audit(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Health, merchants, background jobs
   */
  get system(): System {
    return (this.#system ??= new System(this.#rawClient, this.#servers, this.#auth));
  }
}
