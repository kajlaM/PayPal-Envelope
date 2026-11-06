import { buildAuthSchemes, type AuthSchemes } from "./auth-schemes.js";
import type { ClientOptions } from "./client-options.js";
import { buildCoreClientOptions } from "./core/client-options.js";
import { RawClient } from "./core/raw-client.js";
import * as host from "./core/runtime-environment.js";
import * as s from "./core/validation/index.js";
import { ConnectionsApi } from "./resources/connections-api.js";
import { InvoiceConnectionDetailsApi } from "./resources/invoice-connection-details-api.js";
import { InvoicesApi } from "./resources/invoices-api.js";
import { PayoutsItem } from "./resources/payouts-item.js";
import { Payouts } from "./resources/payouts.js";
import { SearchInvoices } from "./resources/search-invoices.js";
import { SimulateEventApi } from "./resources/simulate-event-api.js";
import { TemplatesApi } from "./resources/templates-api.js";
import { VerifyWebhookSignatureApi } from "./resources/verify-webhook-signature-api.js";
import { WebhooksEventTypes } from "./resources/webhooks-event-types.js";
import { WebhooksEvents } from "./resources/webhooks-events.js";
import { WebhooksLookup } from "./resources/webhooks-lookup.js";
import { Webhooks } from "./resources/webhooks.js";
import { buildServers, type Servers } from "./servers.js";

/**
 * Use the Invoicing API to create, send, and manage invoices. You can also use the API or webhooks
 * to track invoice payments. When you send an invoice to a customer, the invoice moves from draft
 * to payable state. PayPal then emails the customer a link to the invoice on the PayPal website.
 * Customers with a PayPal account can log in and pay the invoice with PayPal. Alternatively,
 * customers can pay as a guest with a debit card or credit card. For more information, see the <a
 * href="/docs/invoicing/">Invoicing Overview</a> and the <a
 * href="/docs/invoicing/basic-integration/">Invoicing Integration Guide</a>.
 */
export class InvoicesClient {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;
  #invoicesApi?: InvoicesApi;
  #searchInvoices?: SearchInvoices;
  #templatesApi?: TemplatesApi;
  #connectionsApi?: ConnectionsApi;
  #invoiceConnectionDetailsApi?: InvoiceConnectionDetailsApi;
  #webhooks?: Webhooks;
  #webhooksLookup?: WebhooksLookup;
  #verifyWebhookSignatureApi?: VerifyWebhookSignatureApi;
  #webhooksEventTypes?: WebhooksEventTypes;
  #webhooksEvents?: WebhooksEvents;
  #simulateEventApi?: SimulateEventApi;
  #payouts?: Payouts;
  #payoutsItem?: PayoutsItem;

  constructor(options: ClientOptions = {}) {
    this.#rawClient = new RawClient({
      ...buildCoreClientOptions(options, "INVOICES_CLIENT_LOG"),
      defaultHeaders: [
        { name: "User-Agent", value: "InvoicesClient/2.6.0 TypeScript", schema: s.string() },
        { name: "X-APIMatic-Lang", value: "TypeScript", schema: s.string() },
        { name: "X-APIMatic-Package-Version", value: "2.6.0", schema: s.string() },
        { name: "X-APIMatic-Gen-Version", value: "4.0.0", schema: s.string() },
        { name: "X-APIMatic-OS", value: host.operatingSystem(), schema: s.optional(s.string()) },
        { name: "X-APIMatic-Runtime", value: host.runtimeDescription(), schema: s.optional(s.string()) },
      ],
      defaultQuery: [],
      defaultPathParams: [],
    });

    this.#servers = buildServers(options);

    this.#auth = buildAuthSchemes(options, this.#servers, this.#rawClient);
  }

  /**
   * Use the `/invoices` resource to create, update, and send invoices and invoice reminders. To
   * manage invoices, you can also list invoices, show details for invoices, delete draft invoices,
   * and cancel sent invoices. You can also record payments for invoices to mark them as fully or
   * partially paid, or record refunds for invoices to mark them as fully or partially refunded. You
   * can create QR codes for invoices that can be scanned, viewed, and paid by a mobile phone.
   */
  get invoicesApi(): InvoicesApi {
    return (this.#invoicesApi ??= new InvoicesApi(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/search-invoices` resource to search for and list invoices that match search criteria.
   */
  get searchInvoices(): SearchInvoices {
    return (this.#searchInvoices ??= new SearchInvoices(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/templates` resource to create, list, show details for, update, and delete invoice
   * templates. Use the `/templates` resource when you create a third-party invoicing application.
   * For instance, a business can create a template with predefined invoice data. Later, the
   * business can select the template to populate the invoice
   * data.<blockquote><strong>Note:</strong> To upload a logo to display on an invoice, you can use
   * the <strong>Template Settings</strong> dashboard to <a
   * href="https://www.paypal.com/invoice/settings/templates">create a template</a>. When you create
   * an invoice, you can use the URI for that logo.</blockquote>
   */
  get templatesApi(): TemplatesApi {
    return (this.#templatesApi ??= new TemplatesApi(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `accounting-sync/merchants/connections` resource to get active connections list.
   */
  get connectionsApi(): ConnectionsApi {
    return (this.#connectionsApi ??= new ConnectionsApi(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `accounting-sync/invoices/{id}/connections` resource to get active connections list.
   */
  get invoiceConnectionDetailsApi(): InvoiceConnectionDetailsApi {
    return (this.#invoiceConnectionDetailsApi ??= new InvoiceConnectionDetailsApi(
      this.#rawClient,
      this.#servers,
      this.#auth,
    ));
  }

  /**
   * Use the `/webhooks` resource to subscribe your webhook listener to events, list webhooks for an
   * app, show details for, update, delete, and list event subscriptions for webhooks.
   */
  get webhooks(): Webhooks {
    return (this.#webhooks ??= new Webhooks(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/webhooks-lookup` resource to create, list, show details for, and delete webhook
   * lookups.
   */
  get webhooksLookup(): WebhooksLookup {
    return (this.#webhooksLookup ??= new WebhooksLookup(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/verify-webhook-signature` resource to verify a webhook signature.
   */
  get verifyWebhookSignatureApi(): VerifyWebhookSignatureApi {
    return (this.#verifyWebhookSignatureApi ??= new VerifyWebhookSignatureApi(
      this.#rawClient,
      this.#servers,
      this.#auth,
    ));
  }

  /**
   * Use the `/webhooks-event-types` resource to list available events to which any webhook can
   * subscribe.
   */
  get webhooksEventTypes(): WebhooksEventTypes {
    return (this.#webhooksEventTypes ??= new WebhooksEventTypes(this.#rawClient, this.#servers));
  }

  /**
   * Use the `/webhooks-events` resource to list, show details for, and resend event notifications.
   */
  get webhooksEvents(): WebhooksEvents {
    return (this.#webhooksEvents ??= new WebhooksEvents(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/simulate-event` resource to use a sample payload to simulate a webhook event. The
   * events that this call generates only serve to validate the connection to the listener URL and
   * to show how webhook events look. <blockquote><strong>Note:</strong> You can also use the <a
   * href="/docs/api/notifications/webhooks/simulator/">Webhooks simulator</a> to simulate webhook
   * events.</blockquote>
   */
  get simulateEventApi(): SimulateEventApi {
    return (this.#simulateEventApi ??= new SimulateEventApi(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/payouts` resource to create a batch payout, update the status for a batch payout,
   * show the status of a batch payout with the transaction status and other data for individual
   * payout items, and request approval for a batch payout.
   */
  get payouts(): Payouts {
    return (this.#payouts ??= new Payouts(this.#rawClient, this.#servers, this.#auth));
  }

  /**
   * Use the `/payouts-item` resource to show payout item details and cancel an unclaimed payout
   * item.
   */
  get payoutsItem(): PayoutsItem {
    return (this.#payoutsItem ??= new PayoutsItem(this.#rawClient, this.#servers, this.#auth));
  }
}
