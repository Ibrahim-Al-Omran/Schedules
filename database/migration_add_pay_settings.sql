-- Migration: Add pay settings columns to User table
-- Run this SQL in your Supabase SQL Editor
-- This migration adds hourlyRate and payCycle columns to support the pay calculation feature

-- Add hourlyRate column (decimal/numeric type for precise currency calculations)
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(10, 2) DEFAULT 0;

-- Add payCycle column (text/enum type for weekly, biweekly, monthly)
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "payCycle" TEXT DEFAULT 'weekly';

-- Add lastPaymentDate column (date type for tracking when last payment was received)
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "lastPaymentDate" DATE;

-- Add a check constraint to ensure payCycle is one of the valid values
ALTER TABLE "public"."User"
DROP CONSTRAINT IF EXISTS "User_payCycle_check";

ALTER TABLE "public"."User"
ADD CONSTRAINT "User_payCycle_check" 
CHECK ("payCycle" IN ('weekly', 'biweekly', 'monthly'));

-- Optional: Add an index if you'll be querying by payCycle frequently
CREATE INDEX IF NOT EXISTS "User_payCycle_idx" ON "public"."User"("payCycle");

-- Note: The existing RLS policies will automatically apply to these new columns 
-- Users can view and update their own pay settings through the existing policies:
-- - "Users can view own data" (SELECT)
-- - "Users can update own data" (UPDATE)

