// npm run setup:checkout -w apps/api
// Saves the KubePay platform account's PayPal (once), so vaults pay shops with PayPal Checkout
// (a real, buyer-protected PayPal purchase) instead of Payouts. Until this has run, or if PayPal
// refuses a Checkout payment, vaults pay with Payouts exactly as before.
//
// 1. Open the printed link and log in as the PLATFORM sandbox business account (PLATFORM_SANDBOX_EMAIL).
// 2. Approve. PayPal then sends the browser to example.com: that page not loading is fine.
// 3. This script notices the approval and saves the account in the paypal_links table.
import { prisma } from '@kubepay/db';
import { finishPlatformCheckoutLink, getSetupTokenStatus, startPlatformCheckoutLink } from '@kubepay/paypal';

const platformEmail = process.env.PLATFORM_SANDBOX_EMAIL?.trim().toLowerCase();
if (!platformEmail) {
  console.error('Set PLATFORM_SANDBOX_EMAIL in .env (the KubePay platform sandbox business account).');
  process.exit(1);
}

const { setupTokenId, approveUrl } = await startPlatformCheckoutLink({
  returnUrl: 'https://example.com/kubepay-checkout-approved',
  cancelUrl: 'https://example.com/kubepay-checkout-cancelled',
});
console.log(`\nOpen this link and log in as ${platformEmail}, then approve:\n\n  ${approveUrl}\n`);
console.log('Waiting for the approval (up to 10 minutes)…');

const deadline = Date.now() + 10 * 60_000;
let status = 'PAYER_ACTION_REQUIRED';
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 3000));
  status = await getSetupTokenStatus(setupTokenId);
  if (status === 'APPROVED') break;
}
if (status !== 'APPROVED') {
  console.error(`Not approved (status ${status}). Nothing was saved; run the script again.`);
  process.exit(1);
}

const saved = await finishPlatformCheckoutLink(setupTokenId);
if (saved.email.toLowerCase() !== platformEmail) {
  console.error(`Approved with ${saved.email || 'another account'}, not ${platformEmail}. Nothing was saved; run it again and log in as the platform account.`);
  process.exit(1);
}
const data = { username: 'kubepay-platform', paymentTokenId: saved.paymentTokenId, customerId: saved.customerId, linkedAt: new Date() };
await prisma.paypalLink.upsert({ where: { email: platformEmail }, create: { email: platformEmail, ...data }, update: data });
console.log(`\nSaved. Vault purchases now pay shops with PayPal Checkout from ${platformEmail}.`);
await prisma.$disconnect();
