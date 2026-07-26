-- Idempotent RLS policies for UW Bidding Tool
-- Safe to run on every dev start / deploy

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bids ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Managers can update any profile" ON profiles;
CREATE POLICY "Managers can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Sources
DROP POLICY IF EXISTS "Authenticated users can view sources" ON sources;
CREATE POLICY "Authenticated users can view sources"
  ON sources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Managers can manage sources" ON sources;
CREATE POLICY "Managers can manage sources"
  ON sources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Bids
DROP POLICY IF EXISTS "Authenticated users can view all bids for dedupe" ON bids;
CREATE POLICY "Authenticated users can view all bids for dedupe"
  ON bids FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Bidders can insert own bids" ON bids;
CREATE POLICY "Bidders can insert own bids"
  ON bids FOR INSERT TO authenticated
  WITH CHECK (bidder_id = auth.uid());

DROP POLICY IF EXISTS "Bidders can update own bids" ON bids;
CREATE POLICY "Bidders can update own bids"
  ON bids FOR UPDATE TO authenticated USING (bidder_id = auth.uid());

DROP POLICY IF EXISTS "Managers can update any bid" ON bids;
CREATE POLICY "Managers can update any bid"
  ON bids FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "Managers can delete bids" ON bids;
CREATE POLICY "Managers can delete bids"
  ON bids FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
