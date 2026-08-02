-- Spotify sign-in is no longer the only way to get an account, so it can no
-- longer be required/unique-not-null on its own.
ALTER TABLE "users" ALTER COLUMN "spotify_user_id" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
