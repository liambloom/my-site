CREATE TABLE IF NOT EXISTS errors (
  message TEXT NOT NULL,
  page TEXT,
  user_agent TEXT,
  type TEXT NOT NULL,
  t TIMESTAMP NOT NULL,
  stack TEXT
);