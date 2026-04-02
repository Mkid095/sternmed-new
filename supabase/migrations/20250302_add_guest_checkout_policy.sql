-- =====================================================
-- ADD GUEST CHECKOUT SUPPORT FOR ANONYMOUS USERS
-- =====================================================
-- This allows anon (guest) users to create orders without authentication
-- Fixes: 401 errors + guest checkout support
--
-- Migration: 20250302_add_guest_checkout_policy.sql
-- Project: sternmed-new (ckndtgbhzcfepxafrmrw)

-- =====================================================
-- 1. ORDERS TABLE POLICIES
-- =====================================================

-- Allow anon (guest) users to insert orders with user_id = NULL
CREATE POLICY "Allow anon to insert guest orders" ON orders
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Allow authenticated users to insert their own orders
CREATE POLICY "Allow authenticated users to insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. ORDER_ITEMS TABLE POLICIES
-- =====================================================

-- Allow anon (guest) users to insert order items
-- Note: order_items has a foreign key to orders; anon can insert items for any order
CREATE POLICY "Allow anon to insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to insert order items for orders they own
CREATE POLICY "Allow authenticated users to insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Grant INSERT permission to anon role on orders and order_items
GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;
