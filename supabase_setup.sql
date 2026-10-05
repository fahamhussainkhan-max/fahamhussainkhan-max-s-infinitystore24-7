-- ==============================================================================
-- Infinity Store: Admin Orders RLS Policies & Realtime Publication Setup
-- Execute this script in your Supabase Project SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 0. Ensure tables exist with appropriate structure
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  phone text,
  email text,
  delivery_location text,
  delivery_address jsonb,
  delivery_zone text,
  room_details text,
  delivery_note text,
  delivery_fee numeric DEFAULT 15,
  handling_fee numeric DEFAULT 9,
  subtotal numeric DEFAULT 0,
  total numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'COD',
  payment_status text DEFAULT 'unpaid',
  status text DEFAULT 'pending',
  items jsonb DEFAULT '[]'::jsonb,
  items_summary jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  gps_verified boolean DEFAULT false,
  gps_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text,
  product_name text,
  name text,
  product_name_snapshot text,
  price numeric DEFAULT 0,
  price_snapshot numeric DEFAULT 0,
  quantity integer DEFAULT 1,
  image_url text,
  image text,
  unit text,
  category text,
  created_at timestamptz DEFAULT now()
);

-- 1. Helper function: check if authenticated user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND user_roles.role IN ('admin', 'super_admin')
  );
END;
$$;

-- 2. Ensure public access permissions for orders and items
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow read access to orders" ON orders;
CREATE POLICY "Allow read access to orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage all orders" ON orders;
CREATE POLICY "Admins manage all orders" ON orders FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to order_items" ON order_items;
CREATE POLICY "Allow public insert to order_items" ON order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow read access to order_items" ON order_items;
CREATE POLICY "Allow read access to order_items" ON order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage all order_items" ON order_items;
CREATE POLICY "Admins manage all order_items" ON order_items FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. Set replica identity to FULL for complete realtime payload data
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS products REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS categories REPLICA IDENTITY FULL;

-- 4. Safely add tables to realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') AND
     NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') AND
     NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'categories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;
END $$;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

