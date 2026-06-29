-- Supplementary SQL — run after Prisma migrations
-- Creates database objects that Prisma cannot manage natively.

-- v_message_stats: per-user message statistics view
CREATE OR REPLACE VIEW v_message_stats AS
SELECT
  user_id,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
  COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
  COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
  COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
FROM scheduled_messages
GROUP BY user_id;

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
