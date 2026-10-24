-- Add to existing membership-api/schema.sql migration after review.
-- Session tokens are random, hashed at rest; never store bearer credentials.
CREATE TABLE IF NOT EXISTS member_sessions (
 session_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_member_sessions_user ON member_sessions(user_id,revoked_at,expires_at);
-- Enforce cap even for concurrent requests at SQLite write boundary.
CREATE TRIGGER IF NOT EXISTS guard_session_limit BEFORE INSERT ON member_sessions
WHEN (SELECT COUNT(*) FROM member_sessions WHERE user_id=NEW.user_id AND revoked_at IS NULL AND expires_at>datetime('now')) >=
(CASE COALESCE((SELECT plan FROM subscriptions WHERE user_id=NEW.user_id AND status IN ('active','trialing') AND access_until>datetime('now') LIMIT 1),'open')
 WHEN 'intelligence_pro' THEN 3 WHEN 'enterprise' THEN 10 ELSE 1 END)
BEGIN SELECT RAISE(ABORT,'session_limit_reached'); END;
-- Billing event receipt and entitlement modification must be transactional.
CREATE TABLE IF NOT EXISTS billing_event_audit (
 provider TEXT NOT NULL,
 event_id TEXT NOT NULL,
 event_type TEXT NOT NULL,
 processed_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY(provider,event_id)
);
