ALTER TYPE "OrderStatus" ADD VALUE 'PACKED';
ALTER TYPE "OrderStatus" ADD VALUE 'WITH_COURIER';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

CREATE TYPE "BotMessageCategory" AS ENUM ('ORDER_STATUS', 'DELIVERY_PROMPT', 'BANK_REMINDER', 'INTAKE_REMINDER');

ALTER TABLE "User" ADD COLUMN "intakeRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "orderStatusNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Order" ADD COLUMN "courierPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "lastNotifiedStatus" "OrderStatus";
ALTER TABLE "Order" ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "pendingNotifyStatus" "OrderStatus";

-- SlotReminderSent.slot: RoutineSlot enum -> TEXT, чтобы поддержать
-- синтетическое значение 'DEFAULT' для позиций без слота
ALTER TABLE "SlotReminderSent" ALTER COLUMN "slot" TYPE TEXT USING "slot"::TEXT;

CREATE TABLE "BotMessageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "BotMessageCategory" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotMessageLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BotMessageLog_userId_sentAt_idx" ON "BotMessageLog"("userId", "sentAt");
ALTER TABLE "BotMessageLog" ADD CONSTRAINT "BotMessageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
