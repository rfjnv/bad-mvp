-- AlterTable
ALTER TABLE "Product" ADD COLUMN "conformityCertExpiresAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "conformityCertFileUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "conformityCertIssuedAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "sesCertExpiresAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "sesCertFileUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "sesCertIssuedAt" DATETIME;
