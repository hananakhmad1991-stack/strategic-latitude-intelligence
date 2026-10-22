-- Owner-private SLI Research & Expert Desk. Never run against public GitHub Pages.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS research_requests(
 id TEXT PRIMARY KEY,
 service TEXT NOT NULL CHECK(service IN ('expert_sourcing','consultation','custom_research','advisory')),
 sector TEXT NOT NULL CHECK(sector IN ('energy','digital','investment','food','policy','geopolitics','other')),
 objective TEXT NOT NULL,
 expert_criteria TEXT NOT NULL,
 organization TEXT,
 contact_email TEXT,
 deliverable TEXT NOT NULL CHECK(deliverable IN ('call','shortlist','brief','report','discuss')),
 timeline TEXT NOT NULL CHECK(timeline IN ('flexible','1-2-weeks','3-5-days','longer')),
 budget TEXT NOT NULL CHECK(budget IN ('not_provided','under500','500-2000','2000-5000','above5000','discuss')),
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','scoping','sourcing','shortlisted','proposal_sent','approved','in_progress','delivered','declined','cancelled')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 source TEXT NOT NULL DEFAULT 'owner_manual' CHECK(source='owner_manual'),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_research_requests_status_time ON research_requests(status,created_at DESC);
CREATE TABLE IF NOT EXISTS research_request_history(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL,
 from_status TEXT,
 to_status TEXT NOT NULL,
 owner_hash TEXT NOT NULL,
 note TEXT,
 changed_at TEXT NOT NULL,
 FOREIGN KEY(request_id) REFERENCES research_requests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_research_history_request ON research_request_history(request_id,id DESC);
