-- CreateEnum
CREATE TYPE "CountryStatus" AS ENUM ('LOCKED', 'UNLOCKED');

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "iso_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "status" "CountryStatus" NOT NULL DEFAULT 'LOCKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "language" TEXT,
    "release_year" INTEGER,
    "spotify_track_id" TEXT NOT NULL,
    "curator_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "spotify_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guess_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "clip_seconds" INTEGER NOT NULL,
    "guessed_country_id" TEXT,
    "correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guess_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "attempts_taken" INTEGER NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_key" ON "countries"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "songs_spotify_track_id_key" ON "songs"("spotify_track_id");

-- CreateIndex
CREATE INDEX "songs_country_id_idx" ON "songs"("country_id");

-- CreateIndex
CREATE INDEX "songs_artist_id_idx" ON "songs"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_spotify_user_id_key" ON "users"("spotify_user_id");

-- CreateIndex
CREATE INDEX "guess_attempts_user_id_idx" ON "guess_attempts"("user_id");

-- CreateIndex
CREATE INDEX "guess_attempts_round_id_idx" ON "guess_attempts"("round_id");

-- CreateIndex
CREATE INDEX "user_collections_user_id_idx" ON "user_collections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_collections_user_id_country_id_key" ON "user_collections"("user_id", "country_id");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guess_attempts" ADD CONSTRAINT "guess_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guess_attempts" ADD CONSTRAINT "guess_attempts_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guess_attempts" ADD CONSTRAINT "guess_attempts_guessed_country_id_fkey" FOREIGN KEY ("guessed_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
