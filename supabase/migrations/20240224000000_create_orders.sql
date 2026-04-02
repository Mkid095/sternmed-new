-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shipping_address TEXT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'whatsapp',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

-- RLS Policies for order_items
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'staff'))
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample orders
INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, subtotal, shipping_cost, total, status, payment_status, notes)
VALUES
  (NULL, 'John Doe', 'john@example.com', '+254700000001', 'Nairobi, Kenya', 150.00, 20.00, 170.00, 'pending', 'pending', 'Please deliver before 5pm'),
  (NULL, 'Jane Smith', 'jane@example.com', '+254700000002', 'Mombasa, Kenya', 280.50, 30.00, 310.50, 'processing', 'paid', 'Urgent order')
ON CONFLICT DO NOTHING;

-- Get the order IDs for sample items
DO $$
DECLARE
  order1_id UUID;
  order2_id UUID;
BEGIN
  SELECT id INTO order1_id FROM orders WHERE customer_email = 'john@example.com' LIMIT 1;
  SELECT id INTO order2_id FROM orders WHERE customer_email = 'jane@example.com' LIMIT 1;

  IF order1_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES
      (order1_id, (SELECT id FROM products LIMIT 1), 'Sample Product 1', 2, 75.00, 150.00)
    ON CONFLICT DO NOTHING;
  END IF;

  IF order2_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES
      (order2_id, (SELECT id FROM products OFFSET 1 LIMIT 1), 'Sample Product 2', 3, 93.50, 280.50)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
