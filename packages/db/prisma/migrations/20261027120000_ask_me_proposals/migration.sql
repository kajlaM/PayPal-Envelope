-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('OPEN', 'CHOSEN', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemId" TEXT,
    "options" JSONB NOT NULL,
    "summary" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'OPEN',
    "chosenIndex" INTEGER,
    "decisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposals_vaultId_status_idx" ON "proposals"("vaultId", "status");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

