-- The site sign-up who made a vault: its alert emails go to them (they all share one demo customer).
ALTER TABLE "vaults" ADD COLUMN "alertEmail" TEXT;
