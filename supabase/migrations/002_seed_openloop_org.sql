-- ============================================================
-- Migration 002: Seed the 'openloop' demo organization
-- Used by the homepage widget at openloop.wearesingular.com.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

-- Insert the openloop organization if it doesn't already exist
INSERT INTO organizations (name, slug, base_url)
VALUES ('OpenLoop', 'openloop', '')
ON CONFLICT (slug) DO NOTHING;

-- Create default widget settings for openloop if missing
INSERT INTO widget_settings (organization_id, accent_color, position, enabled)
SELECT id, '#6366f1', 'bottom_right', true
FROM organizations
WHERE slug = 'openloop'
ON CONFLICT (organization_id) DO NOTHING;

-- Seed the first announcement for the openloop org
INSERT INTO announcements (organization_id, title, content, published_at)
SELECT
  id,
  'Welcome to OpenLoop!',
  'We''re live! OpenLoop lets you collect feedback, track ideas, and keep your users in the loop — all with a lightweight embeddable widget.

Here''s what you can do right now:
• Submit a feature request or bug report using the Submit tab
• Vote on ideas you''d like to see shipped
• Check back here for product updates

We''re building OpenLoop in the open and your feedback directly shapes what we work on next. Thanks for being here early!',
  NOW()
FROM organizations
WHERE slug = 'openloop'
  AND NOT EXISTS (
    SELECT 1 FROM announcements a WHERE a.organization_id = organizations.id
  );
