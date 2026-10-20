-- Private D1 schema. Never commit real user preferences or email addresses to GitHub.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS user_profiles(
 user_id TEXT PRIMARY KEY,
 preferences_json TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notification_inbox(
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 event_id TEXT NOT NULL,
 title TEXT NOT NULL,
 event_kind TEXT NOT NULL,
 relevance TEXT NOT NULL CHECK(relevance IN ('direct','sector')),
 source_url TEXT NOT NULL,
 detected_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 read_at TEXT,
 UNIQUE(user_id,event_id),
 FOREIGN KEY(user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inbox_user_time ON notification_inbox(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_user_unread ON notification_inbox(user_id,read_at);
CREATE TABLE IF NOT EXISTS processed_events(
 event_id TEXT PRIMARY KEY,
 processed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_processed_time ON processed_events(processed_at);
CREATE TABLE IF NOT EXISTS service_state(
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL
);
