-- AlterTable
ALTER TABLE "public"."Shift" ADD COLUMN     "uploaded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT;
