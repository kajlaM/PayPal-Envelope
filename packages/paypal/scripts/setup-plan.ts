// One-time setup: creates the product + monthly plan used to top up utility vaults.
// Run: npm run setup:plan -w @paypalvault/paypal   then copy the plan id into .env as PAYPAL_UTILITY_PLAN_ID.
import { createMonthlyPlan, createProduct } from '../src/index.ts';

const { productId } = await createProduct('PayPalVault Utility Vault', 'Monthly auto top-up for a PayPalVault utility bill vault');
const { planId } = await createMonthlyPlan({ productId, name: 'Utility vault top-up ($250 / month)', amountCents: 25000 });

console.log(`Product: ${productId}`);
console.log(`Plan:    ${planId}`);
console.log(`\nAdd to .env:\nPAYPAL_UTILITY_PLAN_ID=${planId}`);
