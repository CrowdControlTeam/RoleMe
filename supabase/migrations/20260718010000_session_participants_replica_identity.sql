-- Realtime UPDATE payloads only include the previous values of a row when
-- the table's replica identity is FULL — otherwise "old" only has the
-- primary key. The client needs the previous values to tell a heartbeat-only
-- last_seen_at bump apart from an actual change (ready toggled, sheet
-- picked) and skip refreshing the lobby for nothing.
alter table session_participants replica identity full;
