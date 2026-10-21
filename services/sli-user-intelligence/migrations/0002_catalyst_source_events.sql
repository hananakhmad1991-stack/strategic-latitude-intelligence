-- Public Catalyst source mirror for a network-independent notification cron.
-- No personal user profiles or watchlists are stored in this table.
CREATE TABLE IF NOT EXISTS source_events(
 event_id TEXT PRIMARY KEY,
 detected_at_utc TEXT NOT NULL,
 event_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_source_events_detected_at ON source_events(detected_at_utc DESC);
