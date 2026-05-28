-- Run this in your Aiven PostgreSQL database ONCE before deploying
-- You can run it via psql or the Aiven web console query editor

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify it worked
SELECT 'app_state table ready ✅' AS status;
