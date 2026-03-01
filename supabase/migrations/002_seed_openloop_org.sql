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
