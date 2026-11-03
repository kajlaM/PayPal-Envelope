-- AlterTable: how a vault purchase was paid (PayPal Checkout or Payouts)
ALTER TABLE "ledger_entries" ADD COLUMN     "paidVia" TEXT;
