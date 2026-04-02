-- Fix RLS policies for email tables to allow service role access
-- The worker uses SERVICE_ROLE_KEY which bypasses RLS, but we need
-- to ensure the policies are correctly set up

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Admins full access on email_inbound_unassigned" ON email_inbound_unassigned;
DROP POLICY IF EXISTS "Admins full access on email_inbound" ON email_inbound;
DROP POLICY IF EXISTS "Admins full access on email_outbound" ON email_outbound;
DROP POLICY IF EXISTS "Admins full access on email_templates" ON email_templates;
DROP POLICY IF EXISTS "Admins full access on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admins full access on email_audit" ON email_audit;

-- Email inbound unassigned - service role can insert, admins can do everything
CREATE POLICY "Service role can insert unassigned emails" ON email_inbound_unassigned
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access on email_inbound_unassigned" ON email_inbound_unassigned
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email inbound - service role can insert, email users can see own
CREATE POLICY "Service role can insert inbound emails" ON email_inbound
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Email users see own inbound" ON email_inbound
  FOR SELECT USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
    AND deleted_at IS NULL
  );

CREATE POLICY "Email users update own inbound" ON email_inbound
  FOR UPDATE USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );

CREATE POLICY "Admins full access on email_inbound" ON email_inbound
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email outbound - service role can insert/update, email users can see own
CREATE POLICY "Service role can insert outbound emails" ON email_outbound
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update outbound emails" ON email_outbound
  FOR UPDATE USING (true);

CREATE POLICY "Email users see own outbound" ON email_outbound
  FOR SELECT USING (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
    AND deleted_at IS NULL
  );

CREATE POLICY "Email users insert own outbound" ON email_outbound
  FOR INSERT WITH CHECK (
    alias_id = (current_setting('request.jwt.claims', true)::json->>'email_alias_id')::uuid
  );

CREATE POLICY "Admins full access on email_outbound" ON email_outbound
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email templates - service role can insert/update, admins can do everything
CREATE POLICY "Service role can manage templates" ON email_templates
  FOR ALL USING (true);

CREATE POLICY "Admins full access on email_templates" ON email_templates
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email logs - service role can insert, admins can read
CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read email logs" ON email_logs
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email audit - service role can insert, admins can read
CREATE POLICY "Service role can insert audit logs" ON email_audit
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read audit logs" ON email_audit
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );

-- Email aliases - admins can do everything
CREATE POLICY "Admins full access on email_aliases" ON email_aliases
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  );
