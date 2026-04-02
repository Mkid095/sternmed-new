-- Sternmed Afrika Database Schema
-- Run this SQL in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (linked to Firebase Auth via firebase_uid)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  show_on_home BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners Table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  type TEXT CHECK (type IN ('inbox', 'sent')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table (single row configuration)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone_number TEXT,
  email TEXT,
  address TEXT,
  about_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (id, phone_number, email, address, about_text)
VALUES (1, '+254 700 000 000', 'info@sternmed.afrika', 'Nairobi, Kenya', 'Your trusted partner in medical consumables and equipment across Africa.')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

-- RLS Policies for authenticated users (admin/staff)
-- Note: These policies assume you're using anon key with proper authentication
-- For full security, consider using Supabase Auth instead of Firebase

-- For now, allow all authenticated operations (you can refine these later)
CREATE POLICY "Allow all users operations" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all categories operations" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products operations" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all banners operations" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all emails operations" ON emails FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all settings operations" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data (optional)

-- Sample Categories
INSERT INTO categories (name, show_on_home) VALUES
  ('Medical Consumables', true),
  ('Medical Equipment', true),
  ('Surgical Instruments', false);

-- Sample Products
INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured)
SELECT 'Surgical Masks (Box of 50)', 'High-quality 3-ply surgical masks.', 15.00, id, 'https://picsum.photos/seed/mask/400/300', 100, true
FROM categories WHERE name = 'Medical Consumables' LIMIT 1;

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured)
SELECT 'Nitrile Gloves (Box of 100)', 'Powder-free examination gloves.', 25.00, id, 'https://picsum.photos/seed/gloves/400/300', 200, true
FROM categories WHERE name = 'Medical Consumables' LIMIT 1;

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured)
SELECT 'Digital Blood Pressure Monitor', 'Accurate upper arm blood pressure monitor.', 120.00, id, 'https://picsum.photos/seed/bp/400/300', 50, true
FROM categories WHERE name = 'Medical Equipment' LIMIT 1;

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured)
SELECT 'Stethoscope', 'Professional dual-head stethoscope.', 85.00, id, 'https://picsum.photos/seed/steth/400/300', 30, true
FROM categories WHERE name = 'Medical Equipment' LIMIT 1;

-- Sample Banners
INSERT INTO banners (image_url, display_order) VALUES
  ('https://picsum.photos/seed/med1/1920/600', 1),
  ('https://picsum.photos/seed/med2/1920/600', 2);

-- Sample Emails
INSERT INTO emails (subject, body, sender, recipient, type, read) VALUES
  ('Inquiry about Ultrasound', 'Hello, what is the warranty on the portable ultrasound?', 'customer@example.com', 'admin@sternmed.afrika', 'inbox', false),
  ('Re: Inquiry about Ultrasound', 'The warranty is 2 years.', 'admin@sternmed.afrika', 'customer@example.com', 'sent', true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
