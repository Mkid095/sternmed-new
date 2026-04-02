-- Email aliases table for the email platform
CREATE TABLE IF NOT EXISTS email_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_aliases_email
ON email_aliases(alias_email);

CREATE INDEX IF NOT EXISTS idx_email_aliases_active
ON email_aliases(is_active) WHERE is_active = true;

-- RLS Policy
CREATE POLICY "Admins full access on email_aliases" ON email_aliases
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );
