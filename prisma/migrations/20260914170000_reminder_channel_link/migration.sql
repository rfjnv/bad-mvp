ALTER TABLE "User" ADD COLUMN "reminderChannelConnectedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "pendingLinkToken" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingLinkTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_pendingLinkToken_key" ON "User"("pendingLinkToken");
