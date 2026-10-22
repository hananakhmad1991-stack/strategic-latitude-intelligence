-- Expert records only with documented opt-in for private SLI internal matching.
-- No public directory or automated scraping.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS consented_experts(
 id TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 sector TEXT NOT NULL CHECK(sector IN ('energy','digital','investment','food','policy','geopolitics','other')),
 specialty TEXT NOT NULL,
 experience_summary TEXT NOT NULL,
 contact_email TEXT,
 public_profile_url TEXT,
 consent_scope TEXT NOT NULL CHECK(consent_scope='internal_matching'),
 consent_verified_at TEXT NOT NULL,
 consent_reference TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expert_sector ON consented_experts(sector);
CREATE TABLE IF NOT EXISTS request_expert_shortlist(
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL,
 expert_id TEXT NOT NULL,
 fit_reason TEXT NOT NULL,
 reviewed_by_hash TEXT NOT NULL,
 reviewed_at TEXT NOT NULL,
 UNIQUE(request_id,expert_id),
 FOREIGN KEY(request_id) REFERENCES research_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(expert_id) REFERENCES consented_experts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shortlist_request ON request_expert_shortlist(request_id,reviewed_at DESC);
