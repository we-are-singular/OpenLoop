-- ============================================================
-- OpenLoop Definitive Schema — Migration 005
-- Supersedes 001–004. Safe to run on a broken or fresh DB.
-- All statements use IF NOT EXISTS / IF EXISTS guards.
--
-- OPTION A — Fix a broken DB (default):
--   Paste this file as-is into the Supabase SQL editor and run.
--
-- OPTION B — Full nuke and rebuild (loses all data):
--   Uncomment the NUKE section below, then run the whole file.
-- ============================================================


-- ============================================================
-- [OPTIONAL NUKE — uncomment only if you want to wipe all data]
-- ============================================================
-- DROP TABLE IF EXISTS notification_log CASCADE;
-- DROP TABLE IF EXISTS user_organizations CASCADE;
-- DROP TABLE IF EXISTS post_comments CASCADE;
-- DROP TABLE IF EXISTS post_votes CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS widget_settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
-- ============================================================


-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  base_url   TEXT        DEFAULT '',
  settings   JSONB       DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (legacy — kept for backward compat)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL UNIQUE,
  role            TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER_ORGANIZATIONS (junction: auth.users ↔ organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_organizations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org  ON user_organizations(organization_id);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT        DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','idea','planned','in_progress','completed','closed')),
  category        TEXT        NOT NULL DEFAULT 'feature'
                              CHECK (category IN ('feature','improvement','bug','other')),
  votes           INTEGER     DEFAULT 0,
  sort_order      INTEGER     DEFAULT 0,
  author_id       TEXT,
  email           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_organization ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_status       ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_votes        ON posts(votes DESC);

-- ============================================================
-- POST VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS post_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  voter_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_post_votes_post  ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_voter ON post_votes(voter_id);

-- ============================================================
-- POST COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT        DEFAULT 'Anonymous',
  author_id   TEXT,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  content         TEXT        DEFAULT '',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_org       ON announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published_at DESC)
  WHERE published_at IS NOT NULL;

-- ============================================================
-- WIDGET SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS widget_settings (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  accent_color            TEXT        DEFAULT '#6366f1',
  position                TEXT        DEFAULT 'bottom_right'
                                      CHECK (position IN ('bottom_right','bottom_left')),
  enabled                 BOOLEAN     DEFAULT TRUE,
  notification_email      TEXT,
  notify_on_new_feedback  BOOLEAN     DEFAULT TRUE,
  notify_on_new_votes     BOOLEAN     DEFAULT FALSE,
  notify_on_status_change BOOLEAN     DEFAULT FALSE,
  notify_categories       TEXT[]      DEFAULT ARRAY['feature','improvement','bug','other'],
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Add any columns that may be missing from older installs
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS notification_email      TEXT;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS notify_on_new_feedback  BOOLEAN DEFAULT TRUE;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS notify_on_new_votes     BOOLEAN DEFAULT FALSE;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS notify_on_status_change BOOLEAN DEFAULT FALSE;
ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS notify_categories       TEXT[]  DEFAULT ARRAY['feature','improvement','bug','other'];

-- ============================================================
-- NOTIFICATION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  post_id         UUID        REFERENCES posts(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('new_feedback','new_vote','status_change')),
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  sent_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_log_org    ON notification_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log    ENABLE ROW LEVEL SECURITY;

-- Organizations: public read, any auth can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizations' AND policyname='organizations_select') THEN
    CREATE POLICY organizations_select ON organizations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizations' AND policyname='organizations_insert') THEN
    CREATE POLICY organizations_insert ON organizations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizations' AND policyname='organizations_update') THEN
    CREATE POLICY organizations_update ON organizations FOR UPDATE USING (true);
  END IF;
END $$;

-- Users (legacy): public read/write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_select') THEN
    CREATE POLICY users_select ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_insert') THEN
    CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_update') THEN
    CREATE POLICY users_update ON users FOR UPDATE USING (true);
  END IF;
END $$;

-- User organizations: users only see/write their own rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_organizations' AND policyname='user_orgs_select') THEN
    CREATE POLICY user_orgs_select ON user_organizations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_organizations' AND policyname='user_orgs_insert') THEN
    CREATE POLICY user_orgs_insert ON user_organizations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_organizations' AND policyname='user_orgs_update') THEN
    CREATE POLICY user_orgs_update ON user_organizations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Posts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='posts_select') THEN
    CREATE POLICY posts_select ON posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='posts_insert') THEN
    CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='posts_update') THEN
    CREATE POLICY posts_update ON posts FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='posts_delete') THEN
    CREATE POLICY posts_delete ON posts FOR DELETE USING (true);
  END IF;
END $$;

-- Post votes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_votes' AND policyname='post_votes_select') THEN
    CREATE POLICY post_votes_select ON post_votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_votes' AND policyname='post_votes_insert') THEN
    CREATE POLICY post_votes_insert ON post_votes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_votes' AND policyname='post_votes_delete') THEN
    CREATE POLICY post_votes_delete ON post_votes FOR DELETE USING (true);
  END IF;
END $$;

-- Post comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_comments' AND policyname='post_comments_select') THEN
    CREATE POLICY post_comments_select ON post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_comments' AND policyname='post_comments_insert') THEN
    CREATE POLICY post_comments_insert ON post_comments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_comments' AND policyname='post_comments_delete') THEN
    CREATE POLICY post_comments_delete ON post_comments FOR DELETE USING (true);
  END IF;
END $$;

-- Announcements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_select') THEN
    CREATE POLICY announcements_select ON announcements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_insert') THEN
    CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_update') THEN
    CREATE POLICY announcements_update ON announcements FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_delete') THEN
    CREATE POLICY announcements_delete ON announcements FOR DELETE USING (true);
  END IF;
END $$;

-- Widget settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='widget_settings' AND policyname='widget_settings_select') THEN
    CREATE POLICY widget_settings_select ON widget_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='widget_settings' AND policyname='widget_settings_insert') THEN
    CREATE POLICY widget_settings_insert ON widget_settings FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='widget_settings' AND policyname='widget_settings_update') THEN
    CREATE POLICY widget_settings_update ON widget_settings FOR UPDATE USING (true);
  END IF;
END $$;

-- Notification log
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notification_log' AND policyname='notification_log_select') THEN
    CREATE POLICY notification_log_select ON notification_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notification_log' AND policyname='notification_log_insert') THEN
    CREATE POLICY notification_log_insert ON notification_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Vote count: increment/decrement posts.votes on post_votes insert/delete
CREATE OR REPLACE FUNCTION update_post_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET votes = votes + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET votes = votes - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_votes ON post_votes;
CREATE TRIGGER trigger_update_votes
AFTER INSERT OR DELETE ON post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_votes_count();

-- Notification: new post submitted
CREATE OR REPLACE FUNCTION handle_new_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_log (organization_id, post_id, type, status)
  VALUES (NEW.organization_id, NEW.id, 'new_feedback', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_post_notification ON posts;
CREATE TRIGGER trigger_new_post_notification
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION handle_new_post_notification();

-- Notification: new vote
CREATE OR REPLACE FUNCTION handle_new_vote_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notification_log (organization_id, post_id, type, status)
    VALUES (
      (SELECT organization_id FROM posts WHERE id = NEW.post_id),
      NEW.post_id,
      'new_vote',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_vote_notification ON post_votes;
CREATE TRIGGER trigger_new_vote_notification
AFTER INSERT ON post_votes
FOR EACH ROW EXECUTE FUNCTION handle_new_vote_notification();

-- Notification: status change
CREATE OR REPLACE FUNCTION handle_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO notification_log (organization_id, post_id, type, status)
    VALUES (NEW.organization_id, NEW.id, 'status_change', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_status_change_notification ON posts;
CREATE TRIGGER trigger_status_change_notification
AFTER UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION handle_status_change_notification();


-- ============================================================
-- SCHEMA CACHE REFRESH
-- PostgREST caches FK relationships. After running this script,
-- the cache refreshes automatically. If it doesn't, run:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================
NOTIFY pgrst, 'reload schema';
