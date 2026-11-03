-- CreateEnum
CREATE TYPE "FundRequestStatus" AS ENUM ('OPEN', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "fund_requests" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "requesterName" TEXT,
    "message" TEXT,
    "amountCents" INTEGER NOT NULL,
    "payUrl" TEXT,
    "status" "FundRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "fund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fund_requests_invoiceId_key" ON "fund_requests"("invoiceId");

-- CreateIndex
CREATE INDEX "fund_requests_vaultId_status_idx" ON "fund_requests"("vaultId", "status");

-- CreateIndex
CREATE INDEX "fund_requests_payerEmail_status_idx" ON "fund_requests"("payerEmail", "status");

-- AddForeignKey
ALTER TABLE "fund_requests" ADD CONSTRAINT "fund_requests_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
