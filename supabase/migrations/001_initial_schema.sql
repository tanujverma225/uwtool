-- UW Bidding Tool - Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enums
CREATE TYPE user_role AS ENUM ('bidder', 'manager', 'admin');
CREATE TYPE bid_status AS ENUM (
  'draft', 'ready', 'submitted', 'viewed', 'responded',
  'hired', 'lost', 'canceled', 'no_response'
);
CREATE TYPE job_response AS ENUM ('no_response', 'replied', 'hired', 'canceled');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'bidder',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sources (e.g. Colette)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  url TEXT NOT NULL,
  upwork_job_id TEXT NOT NULL,
  similar_bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  proposal TEXT,
  questions TEXT,
  summary TEXT,
  country TEXT,
  status bid_status NOT NULL DEFAULT 'draft',
  job_response job_response DEFAULT 'no_response',
  shortlisted BOOLEAN NOT NULL DEFAULT FALSE,
  client_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  client_responded BOOLEAN NOT NULL DEFAULT FALSE,
  is_private_listing BOOLEAN NOT NULL DEFAULT FALSE,
  connects_used INTEGER,
  proposal_count_range TEXT,
  meghna_remarks TEXT,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  date_est TIMESTAMPTZ,
  time_est TEXT,
  week_number TEXT,
  job_posted_at TIMESTAMPTZ,
  bid_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bids_upwork_job_id ON bids(upwork_job_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_date_est ON bids(date_est);
CREATE INDEX idx_bids_week_number ON bids(week_number);

-- Prevent duplicate submissions on same Upwork job (excluding drafts marked as similar)
CREATE UNIQUE INDEX idx_bids_unique_upwork_job
  ON bids(upwork_job_id)
  WHERE similar_bid_id IS NULL AND status NOT IN ('draft', 'canceled');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'bidder'::public.user_role)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default sources
INSERT INTO sources (name, color) VALUES
  ('Colette', '#22c55e'),
  ('Direct', '#3b82f6'),
  ('Referral', '#a855f7')
ON CONFLICT (name) DO NOTHING;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Sources policies (read-only for all, managers can manage)
CREATE POLICY "Authenticated users can view sources"
  ON sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage sources"
  ON sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Bids policies
CREATE POLICY "Authenticated users can view all bids for dedupe"
  ON bids FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bidders can insert own bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Bidders can update own bids"
  ON bids FOR UPDATE
  TO authenticated
  USING (bidder_id = auth.uid());

CREATE POLICY "Managers can update any bid"
  ON bids FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers can delete bids"
  ON bids FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
