-- Full content refresh: the curated song list was replaced wholesale, and every
-- player's collection/rounds/guesses reference the old songs, so they have to
-- go too. Countries reset to LOCKED; the seed step that runs right after this
-- migration re-unlocks whichever ones the new song list covers.
DELETE FROM guess_attempts;
DELETE FROM rounds;
DELETE FROM user_collections;
DELETE FROM songs;
DELETE FROM artists;
UPDATE countries SET status = 'LOCKED';
