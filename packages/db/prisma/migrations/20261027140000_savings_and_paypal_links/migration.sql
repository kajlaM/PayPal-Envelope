-- CreateEnum
CREATE TYPE "SavingsInterval" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- AlterEnum
ALTER TYPE "VaultStatus" ADD VALUE 'SAVING';

-- AlterEnum
ALTER TYPE "VaultType" ADD VALUE 'SAVINGS';

-- AlterTable
ALTER TABLE "vaults" ADD COLUMN     "chargeFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextChargeAt" TIMESTAMP(3),
ADD COLUMN     "savingsEvery" "SavingsInterval",
ADD COLUMN     "savingsPausedAt" TIMESTAMP(3),
ADD COLUMN     "savingsPerPaymentCents" INTEGER;

-- CreateTable
CREATE TABLE "paypal_links" (
    "email" TEXT NOT NULL,
    "username" TEXT,
    "paymentTokenId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paypal_links_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "vaults_status_nextChargeAt_idx" ON "vaults"("status", "nextChargeAt");

