-- Allow a player to collect more than one song from the same country.
-- Uniqueness moves from (user_id, country_id) to (user_id, song_id).
DROP INDEX "user_collections_user_id_country_id_key";

CREATE UNIQUE INDEX "user_collections_user_id_song_id_key" ON "user_collections"("user_id", "song_id");

CREATE INDEX "user_collections_user_id_country_id_idx" ON "user_collections"("user_id", "country_id");
