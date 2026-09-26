-- Safe-Alleys D1 schema (DRAFT for Phase 2 — not deployed yet; Cloudflare D1, free tier)
-- Design notes: reports are anonymous; device identity is a rotating token, never linked to PII.
-- Every report is keyed by 10-char DIGIPIN with 6-decimal lat/lon alongside for accuracy.

CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  digipin       TEXT NOT NULL,                -- 10-char official DIGIPIN
  lat           REAL NOT NULL,                -- 6 decimals
  lon           REAL NOT NULL,                -- 6 decimals
  category      TEXT NOT NULL,                -- unlit|harassment|theft|animals|structure|flood|other
  time_bucket   TEXT NOT NULL,                -- morning|afternoon|evening|night
  note          TEXT,                         -- optional, <=200 chars, filtered
  occurred_at   INTEGER NOT NULL,             -- epoch seconds of the event (user may backdate)
  submitted_at  INTEGER NOT NULL,             -- epoch seconds
  device_token  TEXT NOT NULL,                -- rotating anonymous token (7-day rotation)
  age_band      TEXT,                         -- aggregation only, never displayed
  gender        TEXT                          -- aggregation only, never displayed
);

CREATE INDEX IF NOT EXISTS idx_reports_digipin ON reports(digipin);
CREATE INDEX IF NOT EXISTS idx_reports_submitted ON reports(submitted_at);

CREATE TABLE IF NOT EXISTS verifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id     INTEGER NOT NULL REFERENCES reports(id),
  vote          INTEGER NOT NULL,             -- 1 = still like this today, 0 = no longer
  device_token  TEXT NOT NULL,
  voted_at      INTEGER NOT NULL,
  UNIQUE(report_id, device_token)            -- one vote per device per report
);

CREATE INDEX IF NOT EXISTS idx_verif_report ON verifications(report_id);

-- Nightly aggregate, published as static JSON tiles (/data/<prefix>.json)
CREATE TABLE IF NOT EXISTS cell_stats (
  digipin_prefix TEXT PRIMARY KEY,            -- e.g. 4-6 char zone prefix
  report_count   INTEGER NOT NULL,
  confidence     INTEGER NOT NULL,             -- 0-100
  trend          TEXT,                        -- improving|stable|declining
  updated_at     INTEGER NOT NULL
);
