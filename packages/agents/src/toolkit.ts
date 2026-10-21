import { PayPalAgentToolkit } from '@paypal/agent-toolkit/ai-sdk';
import { tool, type ToolSet } from 'ai';

// PayPal Agent Toolkit, read-only. It runs as the city-utility app so the agent can read its bills.
// Only read actions are enabled; no toolkit tool can move money (that goes through request_purchase).
const READ_ONLY = { invoices: { list: true, get: true } };

/** Keeps only the invoice fields the agent needs, so long PayPal responses don't flood the prompt. */
function slimInvoice(raw: any) {
  return {
    id: raw.id,
    status: raw.status,
    invoice_number: raw.detail?.invoice_number,
    amount: raw.amount?.value ?? raw.due_amount?.value,
    currency: raw.amount?.currency_code ?? raw.detail?.currency_code,
    invoicer: raw.invoicer?.email_address,
    recipient: raw.primary_recipients?.[0]?.billing_info?.email_address,
    items: raw.items?.map((i: any) => i.name),
    note: raw.detail?.note,
  };
}

function slim(output: unknown) {
  let data: any = output;
  if (typeof output === 'string') {
    try {
      data = JSON.parse(output);
    } catch {
      return output;
    }
  }
  if (data?.id) return slimInvoice(data); // one invoice (its `items` are line items)
  if (Array.isArray(data?.items)) return { invoices: data.items.map(slimInvoice) };
  return data;
}

export function invoiceTools(): ToolSet {
  const clientId = process.env.UTILITY_CLIENT_ID;
  const clientSecret = process.env.UTILITY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing UTILITY_CLIENT_ID / UTILITY_CLIENT_SECRET in .env');

  const toolkit = new PayPalAgentToolkit({
    clientId,
    clientSecret,
    configuration: { actions: READ_ONLY, context: { sandbox: true } },
  });

  // The toolkit is built for AI SDK v4 (`parameters`); adapt each tool to v5 (`inputSchema`).
  const tools: ToolSet = {};
  for (const [name, t] of Object.entries(toolkit.getTools()) as [string, any][]) {
    tools[name] = tool({
      description: t.description,
      inputSchema: t.parameters,
      execute: async (args: unknown) => slim(await t.execute(args, {})),
    } as any);
  }
  return tools;
}
