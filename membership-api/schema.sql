-- SLI private membership database (Cloudflare D1).
-- Apply only after a separate staging project and identity provider are configured.
-- Do not put private billing information, passwords, tokens or customer emails in public GitHub.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS subscriptions (
 user_id TEXT NOT NULL PRIMARY KEY,
 plan TEXT NOT NULL CHECK(plan IN ('open','pro','enterprise')),
 status TEXT NOT NULL CHECK(status IN ('trialing','active','past_due','canceled','incomplete','expired')),
 access_until TEXT NOT NULL,
 provider TEXT,
 provider_reference TEXT,
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_until ON subscriptions(status,access_until);
CREATE TABLE IF NOT EXISTS event_receipts (
 provider TEXT NOT NULL,
 event_id TEXT NOT NULL,
 received_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY(provider,event_id)
);
-- Event-receipt idempotency is a prerequisite for future payment webhook integration.
-- Only a verified server-to-server payment webhook (not public browser input)
-- may add/update entitlement records. No billing endpoint is exposed in Stage 1.
