CREATE TYPE "DeliveryPromptStatus" AS ENUM ('PENDING', 'SENT', 'SNOOZED', 'ANSWERED_SELF', 'ANSWERED_GIFT', 'NO_CHANNEL');

CREATE TABLE "DeliveryPrompt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "DeliveryPromptStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "snoozedAt" TIMESTAMP(3),
    "followUpSentAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryPrompt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryPrompt_orderId_key" ON "DeliveryPrompt"("orderId");
CREATE INDEX "DeliveryPrompt_status_snoozedAt_idx" ON "DeliveryPrompt"("status", "snoozedAt");

ALTER TABLE "DeliveryPrompt" ADD CONSTRAINT "DeliveryPrompt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ownerId" TEXT,
    "recipientUserId" TEXT,
    "comment" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_token_key" ON "Plan"("token");
CREATE INDEX "Plan_ownerId_idx" ON "Plan"("ownerId");
CREATE INDEX "Plan_recipientUserId_idx" ON "Plan"("recipientUserId");

ALTER TABLE "Plan" ADD CONSTRAINT "Plan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
