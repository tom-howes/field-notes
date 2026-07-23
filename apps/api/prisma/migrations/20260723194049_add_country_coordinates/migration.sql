-- AlterTable
-- Added nullable first since `countries` already has 195 rows; a follow-up
-- migration backfills values via the seed script, then enforces NOT NULL.
ALTER TABLE "countries" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
