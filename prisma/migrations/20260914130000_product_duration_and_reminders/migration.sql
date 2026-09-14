-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('CAPSULE', 'TABLET', 'GRAM', 'ML', 'SCOOP');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'NO_CHANNEL', 'REPEATED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dailyDose" DOUBLE PRECISION,
ADD COLUMN     "unitType" "UnitType",
ADD COLUMN     "unitsPerPack" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "repeatOfId" TEXT,
ADD COLUMN     "repeatToken" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "expectedFinishAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "repeatOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_orderItemId_key" ON "Reminder"("orderItemId");

-- CreateIndex
CREATE INDEX "Reminder_status_dueAt_idx" ON "Reminder"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_repeatToken_key" ON "Order"("repeatToken");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

