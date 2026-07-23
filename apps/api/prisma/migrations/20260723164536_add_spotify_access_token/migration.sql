-- AlterTable
ALTER TABLE "users" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3);
