-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "domain" TEXT;

-- AlterTable
ALTER TABLE "vaults" ADD COLUMN     "lastAgentOutcome" TEXT,
ADD COLUMN     "lastAgentRunAt" TIMESTAMP(3),
ADD COLUMN     "nextAgentRunAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "vaults_status_nextAgentRunAt_idx" ON "vaults"("status", "nextAgentRunAt");
