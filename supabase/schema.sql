-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT FALSE,
  total_try_count BIGINT DEFAULT 0,
  total_earnings_cents BIGINT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apps
CREATE TABLE apps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL CHECK (char_length(tagline) BETWEEN 10 AND 120),
  description TEXT CHECK (char_length(description) <= 2000),
  app_url TEXT NOT NULL,
  thumbnail_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  built_with TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'free'
    CHECK (pricing_type IN ('free', 'paid', 'subscription', 'invite_only', 'coming_soon')),
  price_cents INTEGER,
  subscription_price_cents INTEGER,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'archived', 'hidden')),
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_nsfw BOOLEAN DEFAULT FALSE,
  health_status TEXT DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'broken', 'unknown')),
  last_health_check TIMESTAMPTZ,
  try_count BIGINT DEFAULT 0,
  favorite_count BIGINT DEFAULT 0,
  score FLOAT DEFAULT 0,
  search_vector tsvector,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_apps_feed ON apps(score DESC, published_at DESC) WHERE status = 'active';
CREATE INDEX idx_apps_category ON apps(category, score DESC) WHERE status = 'active';
CREATE INDEX idx_apps_new ON apps(published_at DESC) WHERE status = 'active';
CREATE INDEX idx_apps_creator ON apps(creator_id);
CREATE INDEX idx_apps_search ON apps USING GIN(search_vector);
CREATE INDEX idx_apps_name_trgm ON apps USING GIN(name gin_trgm_ops);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION apps_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.tags, '{}'), ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apps_search_trigger
  BEFORE INSERT OR UPDATE ON apps
  FOR EACH ROW EXECUTE FUNCTION apps_search_update();

-- Try events
CREATE TABLE app_tries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_seconds INTEGER,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tries_app ON app_tries(app_id, created_at DESC);
CREATE INDEX idx_tries_recent ON app_tries(created_at DESC);

-- Favorites
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id)
);

-- Reports
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'broken', 'misleading', 'spam', 'inappropriate', 'scam', 'copyright', 'other'
  )),
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) NOT NULL,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_payout_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  app_id UUID REFERENCES apps(id) NOT NULL,
  subscriber_id UUID REFERENCES profiles(id) NOT NULL,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score recalculation function
CREATE OR REPLACE FUNCTION recalculate_app_scores() RETURNS void AS $$
BEGIN
  UPDATE apps SET
    score = (
      COALESCE((
        SELECT COUNT(*) FROM app_tries
        WHERE app_tries.app_id = apps.id
        AND created_at > NOW() - INTERVAL '7 days'
      ), 0) * 1.0
      +
      COALESCE((
        SELECT COUNT(*) FROM favorites
        WHERE favorites.app_id = apps.id
        AND created_at > NOW() - INTERVAL '7 days'
      ), 0) * 2.5
      +
      CASE WHEN is_featured THEN 50 ELSE 0 END
      +
      (50 * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400))
    ),
    updated_at = NOW()
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Active apps viewable by all" ON apps FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid());
CREATE POLICY "Creators can insert own apps" ON apps FOR INSERT
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can update own apps" ON apps FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users see own favorites" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view reports" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
