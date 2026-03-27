-- Creator profile hardening
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- App metadata hardening
ALTER TABLE apps ADD COLUMN IF NOT EXISTS external_payment_url TEXT;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS demo_video_url TEXT;

-- Social graph
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, creator_id),
  CHECK (follower_id <> creator_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_id, created_at DESC);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1500),
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_app ON comments(app_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id, created_at ASC);

CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Ratings
CREATE TABLE IF NOT EXISTS app_ratings (
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (app_id, user_id)
);

-- Internal review / scoring
CREATE TABLE IF NOT EXISTS app_reviews (
  app_id UUID PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  visual_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (visual_quality_score BETWEEN 0 AND 100),
  description_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (description_quality_score BETWEEN 0 AND 100),
  trust_score INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  launch_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (launch_quality_score BETWEEN 0 AND 100),
  thumbnail_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (thumbnail_quality_score BETWEEN 0 AND 100),
  category_fit_score INTEGER NOT NULL DEFAULT 0 CHECK (category_fit_score BETWEEN 0 AND 100),
  spam_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_risk_score BETWEEN 0 AND 100),
  recommendation TEXT NOT NULL DEFAULT 'review' CHECK (recommendation IN ('approve', 'review', 'reject')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  flags TEXT[] NOT NULL DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row level security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public follows are viewable" ON follows;
CREATE POLICY "Public follows are viewable" ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own follows" ON follows;
CREATE POLICY "Users manage own follows" ON follows FOR ALL
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Comments are public on active apps" ON comments;
CREATE POLICY "Comments are public on active apps" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON comments;
CREATE POLICY "Authenticated users can post comments" ON comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own comments" ON comments;
CREATE POLICY "Users delete own comments" ON comments FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own comments" ON comments;
CREATE POLICY "Users update own comments" ON comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Comment votes are public" ON comment_votes;
CREATE POLICY "Comment votes are public" ON comment_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own comment votes" ON comment_votes;
CREATE POLICY "Users manage own comment votes" ON comment_votes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Ratings are public" ON app_ratings;
CREATE POLICY "Ratings are public" ON app_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own ratings" ON app_ratings;
CREATE POLICY "Users manage own ratings" ON app_ratings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Creators view own subscriptions" ON subscriptions;
CREATE POLICY "Creators view own subscriptions" ON subscriptions FOR SELECT
  USING (subscriber_id = auth.uid() OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users view own tries" ON app_tries;
CREATE POLICY "Users view own tries" ON app_tries FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins view app reviews" ON app_reviews;
CREATE POLICY "Admins view app reviews" ON app_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
