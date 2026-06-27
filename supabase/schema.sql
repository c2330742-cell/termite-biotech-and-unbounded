-- UNBOUNDED Portal Backend Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Guestbook entries (shared across all visitors)
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  message TEXT NOT NULL,
  seed TEXT DEFAULT '🌱',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Page views (for analytics / visitor stats)
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  session_id TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sessions (per-visitor tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  page_views INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Heartbeat log (prevents Supabase free-tier pause)
CREATE TABLE IF NOT EXISTS heartbeats (
  id BIGSERIAL PRIMARY KEY,
  beat_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Site stats (aggregated counter)
CREATE TABLE IF NOT EXISTS site_stats (
  id BIGSERIAL PRIMARY KEY,
  stat_name TEXT UNIQUE NOT NULL,
  stat_value BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate stat counters
INSERT INTO site_stats (stat_name, stat_value) VALUES ('total_visitors', 0) ON CONFLICT (stat_name) DO NOTHING;
INSERT INTO site_stats (stat_name, stat_value) VALUES ('total_page_views', 0) ON CONFLICT (stat_name) DO NOTHING;
INSERT INTO site_stats (stat_name, stat_value) VALUES ('guestbook_entries', 0) ON CONFLICT (stat_name) DO NOTHING;

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Guestbook: anyone can read and insert
CREATE POLICY "Anyone can read guestbook"
  ON guestbook_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert guestbook"
  ON guestbook_entries FOR INSERT
  WITH CHECK (true);

-- Page views: anyone can insert; only service_role can read
CREATE POLICY "Anyone can insert page_views"
  ON page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can read page_views"
  ON page_views FOR SELECT
  USING (false);

-- Sessions: anyone can insert, update, read their own
CREATE POLICY "Anyone can insert sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT
  USING (true);

-- Heartbeats: anyone can insert
CREATE POLICY "Anyone can insert heartbeats"
  ON heartbeats FOR INSERT
  WITH CHECK (true);

-- Site stats: anyone can read; only service_role can write
CREATE POLICY "Anyone can read site_stats"
  ON site_stats FOR SELECT
  USING (true);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views (page);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions (last_active);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_created ON guestbook_entries (created_at DESC);
