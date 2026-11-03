import { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { api, errorText } from '../api.ts';
import type { Vault } from '../types.ts';
import { ErrorNote } from './common.tsx';

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

// PayPal JS SDK (sandbox). One-time funding with PayPal or PayPal Pay Later: our API creates the order
// and captures it after approval (with Pay Later the vault still gets the full amount at once).
// Utility vaults can instead subscribe; that money arrives with each PAYMENT.SALE.COMPLETED webhook.
export function FundButton({ vault, onFunded }: { vault: Vault; onFunded: () => void }) {
  const [mode, setMode] = useState<'once' | 'monthly'>('once');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (!clientId) return <p className="error">Set VITE_PAYPAL_CLIENT_ID (or PAYPAL_CLIENT_ID) in .env to show the PayPal button.</p>;

  return (
    <div className="stack">
      {vault.type === 'UTILITY' && (
        <div className="row tight" role="group" aria-label="Funding type">
          <button className={mode === 'once' ? 'chip on' : 'chip'} onClick={() => setMode('once')}>
            One-time
          </button>
          <button className={mode === 'monthly' ? 'chip on' : 'chip'} onClick={() => setMode('monthly')}>
            Monthly subscription
          </button>
        </div>
      )}
      {mode === 'once' ? (
        // PayPal's own options only: PayPal and PayPal Pay Later (no cards, no Venmo).
        <PayPalScriptProvider
          key="once"
          options={{ clientId, currency: 'USD', intent: 'capture', enableFunding: 'paylater', disableFunding: 'card,venmo', buyerCountry: 'US' }}
        >
          <PayPalButtons
            style={{ layout: 'vertical', height: 40 }}
            createOrder={async () => (await api.fundOrder(vault.id)).orderId}
            onApprove={async (data) => {
              setError(null);
              try {
                await api.fundCapture(vault.id, data.orderID);
                onFunded();
              } catch (err) {
                setError(errorText(err));
              }
            }}
            onError={(err) => setError(errorText(err))}
          />
        </PayPalScriptProvider>
      ) : (
        <PayPalScriptProvider key="monthly" options={{ clientId, vault: true, intent: 'subscription' }}>
          <PayPalButtons
            style={{ layout: 'horizontal', tagline: false, height: 40, label: 'subscribe' }}
            createSubscription={async (_data, actions) => {
              const { planId, customId } = await api.subscribe(vault.id);
              return actions.subscription.create({ plan_id: planId, custom_id: customId });
            }}
            onApprove={async (data) => {
              setError(null);
              try {
                await api.subscribeConfirm(vault.id, data.subscriptionID!);
                setNote('Subscribed. The vault becomes active when PayPal sends the first payment (webhook).');
                onFunded();
              } catch (err) {
                setError(errorText(err));
              }
            }}
            onError={(err) => setError(errorText(err))}
          />
        </PayPalScriptProvider>
      )}
      {note && <p className="muted small">{note}</p>}
      <ErrorNote message={error} />
    </div>
  );
}
