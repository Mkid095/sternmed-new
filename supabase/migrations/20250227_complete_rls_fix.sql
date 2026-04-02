-- =====================================================
-- COMPLETE RLS FIX FOR FIREBASE AUTH INTEGRATION
-- =====================================================
-- This migration fixes ALL RLS policies to work with Firebase Auth
-- Project: sternmed-new (ckndtgbhzcfepxafrmrw)

-- =====================================================
-- 1. FIX site_settings RLS POLICIES
-- =====================================================

-- Drop old policy that uses JWT claims
DROP POLICY IF EXISTS "Admins full access on site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public read access on site_settings" ON site_settings;

-- Create new policies that check the users table
CREATE POLICY "Public read access on site_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site_settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 2. FIX email_aliases RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins full access on email_aliases" ON email_aliases;
DROP POLICY IF EXISTS "Admins can manage email_aliases" ON email_aliases;

CREATE POLICY "Admins can manage email_aliases" ON email_aliases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 3. FIX users TABLE RLS POLICIES
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Allow all users operations" ON users;

-- Create new policies for users table
CREATE POLICY "Public read disabled on users" ON users
  FOR SELECT USING (false);

CREATE POLICY "Admins full access on users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND u2.role = 'admin'
    )
  );

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (
    firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- =====================================================
-- 4. ENSURE ALL TABLES HAVE PROPER RLS
-- =====================================================

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- 5. GRANT SPECIFIC TABLE PERMISSIONS
-- =====================================================

-- Allow anon (public) to read specific tables
GRANT SELECT ON categories TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON banners TO anon;
GRANT SELECT ON settings TO anon;
GRANT SELECT ON site_settings TO anon;

-- Allow authenticated (logged in via Firebase) full access
GRANT ALL ON users TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON banners TO authenticated;
GRANT ALL ON emails TO authenticated;
GRANT ALL ON settings TO authenticated;
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Email tables
GRANT ALL ON email_aliases TO authenticated;
GRANT ALL ON email_inbound TO authenticated;
GRANT ALL ON email_inbound_unassigned TO authenticated;
GRANT ALL ON email_outbound TO authenticated;
GRANT ALL ON email_drafts TO authenticated;
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_logs TO authenticated;

-- =====================================================
-- 6. ENSURE RLS IS ENABLED ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. ENABLE RLS ON EMAIL TABLES
-- =====================================================

ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_inbound_unassigned ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
