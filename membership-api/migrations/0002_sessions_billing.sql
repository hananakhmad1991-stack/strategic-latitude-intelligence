-- Run once against the STAGING database after schema.sql, with a D1 backup.
-- Existing schema.sql has a three-plan CHECK; rebuild without assuming ALTER CHECK support.
CREATE TABLE subscriptions_next (
 user_id TEXT NOT NULL PRIMARY KEY,
 plan TEXT NOT NULL CHECK(plan IN ('open','pro','intelligence_pro','enterprise')),
 status TEXT NOT NULL CHECK(status IN ('trialing','active','past_due','canceled','incomplete','expired')),
 access_until TEXT NOT NULL,
 provider TEXT,
 provider_reference TEXT,
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 last_event_at TEXT
);
INSERT INTO subscriptions_next(user_id,plan,status,access_until,provider,provider_reference,updated_at)
 SELECT user_id,plan,status,access_until,provider,provider_reference,updated_at FROM subscriptions;
DROP TABLE subscriptions;
ALTER TABLE subscriptions_next RENAME TO subscriptions;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_until ON subscriptions(status,access_until);
CREATE TABLE IF NOT EXISTS member_sessions (
 session_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_member_sessions_user ON member_sessions(user_id,revoked_at,expires_at);
CREATE TRIGGER IF NOT EXISTS guard_session_limit BEFORE INSERT ON member_sessions
WHEN (SELECT COUNT(*) FROM member_sessions WHERE user_id=NEW.user_id AND revoked_at IS NULL
 AND strftime('%s',expires_at)>strftime('%s','now')) >=
(CASE COALESCE((SELECT plan FROM subscriptions WHERE user_id=NEW.user_id AND status IN ('active','trialing')
 AND strftime('%s',access_until)>strftime('%s','now') LIMIT 1),'open')
 WHEN 'intelligence_pro' THEN 3 ELSE 1 END)
BEGIN SELECT RAISE(ABORT,'session_limit_reached'); END;
CREATE TABLE IF NOT EXISTS billing_event_audit (
 provider TEXT NOT NULL,
 event_id TEXT NOT NULL,
 event_type TEXT NOT NULL,
 event_at TEXT NOT NULL,
 processed_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY(provider,event_id)
);
