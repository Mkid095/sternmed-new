-- Email drafts table for autosave functionality
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_id UUID NOT NULL REFERENCES email_aliases(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  cc TEXT[] DEFAULT '{}',
  bcc TEXT[] DEFAULT '{}',
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  attachments JSONB DEFAULT '[]',
  last_auto_saved_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for fetching drafts by alias
CREATE INDEX IF NOT EXISTS idx_email_drafts_alias_updated
ON email_drafts(alias_id, updated_at DESC);

-- RLS policies for drafts
DROP POLICY IF EXISTS "Service role can manage drafts" ON email_drafts;
DROP POLICY IF EXISTS "Email users can see own drafts" ON email_drafts;

CREATE POLICY "Service role can manage drafts" ON email_drafts
  FOR ALL USING (true);

CREATE POLICY "Email users can see own drafts" ON email_drafts
  FOR SELECT USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );

CREATE POLICY "Email users insert own drafts" ON email_drafts
  FOR INSERT WITH CHECK (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );

CREATE POLICY "Email users update own drafts" ON email_drafts
  FOR UPDATE USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );

CREATE POLICY "Email users delete own drafts" ON email_drafts
  FOR DELETE USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );
