-- =====================================================
-- Fix RLS Policies for Firebase Auth Integration
-- =====================================================
-- This migration fixes RLS policies to work with Firebase Auth
-- instead of relying on JWT custom claims that aren't set

-- =====================================================
-- 1. ADD email_alias_id COLUMN TO users TABLE
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_alias_id UUID REFERENCES email_aliases(id);

CREATE INDEX IF NOT EXISTS idx_users_email_alias ON users(email_alias_id);

-- Update role constraint to include email_user
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'staff', 'email_user'));

-- =====================================================
-- 2. CREATE HELPER FUNCTION FOR ADMIN CHECK
-- =====================================================
-- This function checks if the current Firebase user is an admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role from users table using Firebase UID
  SELECT role INTO current_user_role
  FROM users
  WHERE firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub');

  RETURN current_user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FIX email_aliases RLS POLICIES
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins full access on email_aliases" ON email_aliases;

-- Create new policy that checks users table
CREATE POLICY "Admins can manage email_aliases" ON email_aliases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 4. CREATE PROPER RLS POLICIES FOR ALL EMAIL TABLES
-- =====================================================

-- Enable RLS on email_drafts if not already enabled
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

-- Drop old policies that rely on JWT claims
DROP POLICY IF EXISTS "Email users can see own drafts" ON email_drafts;
DROP POLICY IF EXISTS "Email users insert own drafts" ON email_drafts;
DROP POLICY IF EXISTS "Email users update own drafts" ON email_drafts;
DROP POLICY IF EXISTS "Email users delete own drafts" ON email_drafts;
DROP POLICY IF EXISTS "Admins full access on email_drafts" ON email_drafts;

-- Create new policies for email_drafts
CREATE POLICY "Email users can see own drafts" ON email_drafts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_drafts.alias_id
    )
  );

CREATE POLICY "Email users insert own drafts" ON email_drafts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_drafts.alias_id
    )
  );

CREATE POLICY "Email users update own drafts" ON email_drafts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_drafts.alias_id
    )
  );

CREATE POLICY "Email users delete own drafts" ON email_drafts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_drafts.alias_id
    )
  );

CREATE POLICY "Admins full access on email_drafts" ON email_drafts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 5. FIX email_inbound AND email_outbound RLS POLICIES
-- =====================================================

-- Drop old policies for email_inbound
DROP POLICY IF EXISTS "Email users see own inbound" ON email_inbound;
DROP POLICY IF EXISTS "Email users update own inbound" ON email_inbound;
DROP POLICY IF EXISTS "Admins full access on email_inbound" ON email_inbound;

-- Create new policies for email_inbound
CREATE POLICY "Email users see own inbound" ON email_inbound
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_inbound.alias_id
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Email users update own inbound" ON email_inbound
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_inbound.alias_id
    )
  );

CREATE POLICY "Admins full access on email_inbound" ON email_inbound
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- Drop old policies for email_outbound
DROP POLICY IF EXISTS "Email users see own outbound" ON email_outbound;
DROP POLICY IF EXISTS "Email users insert own outbound" ON email_outbound;
DROP POLICY IF EXISTS "Admins full access on email_outbound" ON email_outbound;

-- Create new policies for email_outbound
CREATE POLICY "Email users see own outbound" ON email_outbound
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_outbound.alias_id
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Email users insert own outbound" ON email_outbound
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.email_alias_id = email_outbound.alias_id
    )
  );

CREATE POLICY "Admins full access on email_outbound" ON email_outbound
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 6. CREATE POLICIES FOR email_inbound_unassigned
-- =====================================================

ALTER TABLE email_inbound_unassigned ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

-- Drop old policies
DROP POLICY IF EXISTS "Admins full access on email_inbound_unassigned" ON email_inbound_unassigned;

-- Create new policy
CREATE POLICY "Admins full access on email_inbound_unassigned" ON email_inbound_unassigned
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 7. CREATE POLICIES FOR email_templates
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

-- Drop old policies
DROP POLICY IF EXISTS "Admins full access on email_templates" ON email_templates;

-- Create new policy
CREATE POLICY "Admins full access on email_templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 8. CREATE POLICIES FOR email_logs
-- =====================================================

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

-- Drop old policies
DROP POLICY IF EXISTS "Admins only email_logs" ON email_logs;

-- Create new policy
CREATE POLICY "Admins only email_logs" ON email_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 9. ENSURE RLS IS ENABLED ON ALL TABLES
-- =====================================================
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_inbound_unassigned ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. GRANT ACCESS
-- =====================================================
-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to email tables specifically
GRANT ALL ON email_aliases TO authenticated;
GRANT ALL ON email_inbound TO authenticated;
GRANT ALL ON email_inbound_unassigned TO authenticated;
GRANT ALL ON email_outbound TO authenticated;
GRANT ALL ON email_drafts TO authenticated;
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_logs TO authenticated;
GRANT ALL ON users TO authenticated;
