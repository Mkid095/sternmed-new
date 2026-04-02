-- =====================================================
-- RLS POLICIES FOR FIREBASE AUTH COMPATIBILITY
-- =====================================================
-- When using Firebase Auth with Supabase, auth.role() returns 'anon'
-- These policies allow operations while security is enforced on frontend via Firebase Auth

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated email_aliases" ON email_aliases;
DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update users" ON users;
DROP POLICY IF EXISTS "Allow authenticated delete users" ON users;
DROP POLICY IF EXISTS "Allow authenticated email_inbound" ON email_inbound;
DROP POLICY IF EXISTS "Allow authenticated email_outbound" ON email_outbound;
DROP POLICY IF EXISTS "Allow authenticated email_inbound_unassigned" ON email_inbound_unassigned;
DROP POLICY IF EXISTS "Allow authenticated email_drafts" ON email_drafts;
DROP POLICY IF EXISTS "Allow authenticated email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow authenticated email_logs" ON email_logs;

-- Create permissive policies for Firebase Auth integration
-- Security is enforced on frontend via Firebase Auth guards
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_aliases" ON email_aliases
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_inbound" ON email_inbound
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_outbound" ON email_outbound
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_inbound_unassigned" ON email_inbound_unassigned
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_drafts" ON email_drafts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_templates" ON email_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_logs" ON email_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on site_settings" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Grant full permissions to anon and authenticated
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON email_aliases TO anon, authenticated;
GRANT ALL ON email_inbound TO anon, authenticated;
GRANT ALL ON email_outbound TO anon, authenticated;
GRANT ALL ON email_inbound_unassigned TO anon, authenticated;
GRANT ALL ON email_drafts TO anon, authenticated;
GRANT ALL ON email_templates TO anon, authenticated;
GRANT ALL ON email_logs TO anon, authenticated;
GRANT ALL ON site_settings TO anon, authenticated;
GRANT ALL ON categories TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON banners TO anon, authenticated;
GRANT ALL ON emails TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;
GRANT ALL ON orders TO anon, authenticated;
