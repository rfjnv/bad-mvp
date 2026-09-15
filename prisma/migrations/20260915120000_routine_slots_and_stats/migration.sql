CREATE TYPE "RoutineSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
CREATE TYPE "IntakeStatus" AS ENUM ('TAKEN', 'SKIPPED');

ALTER TABLE "User" ADD COLUMN "remindHourMorning" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN "remindHourAfternoon" INTEGER NOT NULL DEFAULT 13;
ALTER TABLE "User" ADD COLUMN "remindHourEvening" INTEGER NOT NULL DEFAULT 19;

ALTER TABLE "RoutineItem" ADD COLUMN "timeSlot" "RoutineSlot";
ALTER TABLE "RoutineItem" ADD COLUMN "pausedAt" TIMESTAMP(3);

ALTER TABLE "IntakeLog" ADD COLUMN "status" "IntakeStatus" NOT NULL DEFAULT 'TAKEN';

CREATE TABLE "SlotReminderSent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" "RoutineSlot" NOT NULL,
    "date" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotReminderSent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SlotReminderSent_userId_slot_date_key" ON "SlotReminderSent"("userId", "slot", "date");
ALTER TABLE "SlotReminderSent" ADD CONSTRAINT "SlotReminderSent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CompatibilityDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompatibilityDismissal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompatibilityDismissal_userId_key_key" ON "CompatibilityDismissal"("userId", "key");
ALTER TABLE "CompatibilityDismissal" ADD CONSTRAINT "CompatibilityDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
