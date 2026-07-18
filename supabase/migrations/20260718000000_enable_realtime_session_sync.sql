-- Without this, session_participants/sessions/dice_rolls changes only ever
-- reach the client that triggered them (via revalidatePath) — everyone
-- else's lobby view stays stale until they manually reload. Adding these
-- tables to the supabase_realtime publication lets clients subscribe to
-- postgres_changes on them; Realtime enforces the existing RLS SELECT
-- policies per-subscriber, so e.g. a master's private dice roll still only
-- reaches the master and the roller, same as a direct query would.
alter publication supabase_realtime add table session_participants;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table dice_rolls;
