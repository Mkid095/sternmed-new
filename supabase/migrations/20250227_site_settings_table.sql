-- Site settings table for website configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on site_settings" ON site_settings
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Everyone can read settings
CREATE POLICY "Public read access on site_settings" ON site_settings
  FOR SELECT USING (true);

-- Insert default settings
INSERT INTO site_settings (key, value, description) VALUES
  ('development_mode', 'true', 'Show under development page instead of main site')
ON CONFLICT (key) DO NOTHING;
