-- Private SLI Expert CRM · Cloudflare D1 staging schema.
-- NEVER expose this database through GitHub Pages or unauthenticated API.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS expert_candidates (
  openalex_id TEXT PRIMARY KEY CHECK(openalex_id GLOB 'https://openalex.org/A*'),
  display_name TEXT NOT NULL,
  institution TEXT,
  research_topics_json TEXT NOT NULL DEFAULT '[]',
  works_count INTEGER,
  cited_by_count INTEGER,
  discovery_source TEXT NOT NULL DEFAULT 'openalex',
  stage TEXT NOT NULL DEFAULT 'Discovered'
    CHECK(stage IN ('Discovered','Screening','Contacted','Confirmed')),
  identity_reviewed INTEGER NOT NULL DEFAULT 0 CHECK(identity_reviewed IN (0,1)),
  consent_verified INTEGER NOT NULL DEFAULT 0 CHECK(consent_verified IN (0,1)),
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK(stage <> 'Confirmed' OR (identity_reviewed=1 AND consent_verified=1))
);
CREATE TABLE IF NOT EXISTS expert_stage_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 openalex_id TEXT NOT NULL REFERENCES expert_candidates(openalex_id),
 actor_subject TEXT NOT NULL,
 from_stage TEXT,
 to_stage TEXT NOT NULL,
 reason TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expert_stage ON expert_candidates(stage,updated_at);
-- Private contact details and client brief records deliberately excluded from initial schema.
