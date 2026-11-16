CREATE TABLE IF NOT EXISTS calculation_usage (
  session_digest TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_digest,window_start)
);
CREATE INDEX IF NOT EXISTS idx_calculation_usage_window ON calculation_usage(window_start);