-- "Verified by PayPal": each ledger entry's last read-only check against PayPal's own records.
CREATE TYPE "PayPalCheck" AS ENUM ('VERIFIED', 'WAITING', 'MISMATCH', 'UNCHECKED');

ALTER TABLE "ledger_entries"
  ADD COLUMN "paypalCheck" "PayPalCheck",
  ADD COLUMN "paypalCheckedAt" TIMESTAMP(3),
  ADD COLUMN "paypalTxnId" TEXT,
  ADD COLUMN "paypalCheckNote" TEXT;
