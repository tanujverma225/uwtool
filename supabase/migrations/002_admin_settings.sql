-- Admin settings table for configurable field options
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  (
    'field_options',
    '{
      "countries": ["USA", "USA, Worldwide", "UK", "Canada", "Australia"],
      "proposal_count_ranges": ["0 to 5", "5 to 10", "10 to 20", "20 to 50", "50+"]
    }'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read app settings" ON app_settings;
CREATE POLICY "Authenticated users can read app settings"
  ON app_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Managers can manage app settings" ON app_settings;
CREATE POLICY "Managers can manage app settings"
  ON app_settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
