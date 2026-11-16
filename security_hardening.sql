-- ==============================================================================
-- InfinityStore: Production Security Hardening Migration
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE & SERVER-VERIFIED ADMIN CHECK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin', 'super_admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('student', 'staff', 'admin', 'super_admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- 1. Allow trusted server-side service_role calls
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  -- Must be an authenticated Supabase user
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Check signed JWT app_metadata claim (never user_metadata, which can be user-editable)
  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';
  IF jwt_role IN ('admin', 'super_admin', 'staff') THEN
    RETURN true;
  END IF;

  -- 3. Check authoritative admin_users table
  IF EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role IN ('staff', 'admin', 'super_admin')
  ) THEN
    RETURN true;
  END IF;

  -- 4. Backward compatibility check on user_roles table
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('staff', 'admin', 'super_admin')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = $1 AND au.is_active = true AND au.role IN ('staff', 'admin', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = $1 AND ur.role IN ('staff', 'admin', 'super_admin')
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. SERVER-SIDE HTML / XSS INPUT SANITIZATION HELPERS & TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sanitize_plain_text(raw_text text, max_len integer DEFAULT 300)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
BEGIN
  IF raw_text IS NULL THEN
    RETURN NULL;
  END IF;

  -- Strip <script> blocks and any HTML tags
  cleaned := regexp_replace(raw_text, '<script[^>]*>.*?</script>', '', 'gi');
  cleaned := regexp_replace(cleaned, '<[^>]+>', '', 'g');
  -- Strip javascript:/data: protocols and inline event handlers
  cleaned := regexp_replace(cleaned, '(javascript|data|vbscript)\s*:', '', 'gi');
  cleaned := regexp_replace(cleaned, '\bon\w+\s*=', '', 'gi');
  cleaned := btrim(regexp_replace(cleaned, '\s+', ' ', 'g'));

  IF max_len > 0 AND char_length(cleaned) > max_len THEN
    cleaned := left(cleaned, max_len);
  END IF;

  RETURN cleaned;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_and_sanitize_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_phone text;
BEGIN
  -- Sanitize free-text fields
  NEW.customer_name := public.sanitize_plain_text(NEW.customer_name, 120);
  NEW.delivery_zone := public.sanitize_plain_text(NEW.delivery_zone, 160);
  NEW.room_details := public.sanitize_plain_text(NEW.room_details, 160);
  NEW.delivery_note := public.sanitize_plain_text(NEW.delivery_note, 300);

  -- Extract 10-digit Indian mobile number
  clean_phone := right(regexp_replace(COALESCE(NEW.customer_phone, NEW.phone, ''), '\D', '', 'g'), 10);

  IF NEW.customer_name IS NULL OR char_length(NEW.customer_name) < 2 THEN
    RAISE EXCEPTION 'Invalid customer_name: minimum 2 characters required.';
  END IF;

  IF clean_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid Indian mobile number format.';
  END IF;

  NEW.customer_phone := clean_phone;
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := clean_phone;
  END IF;

  IF COALESCE(NEW.subtotal, 0) <= 0 OR COALESCE(NEW.total_amount, NEW.total, 0) <= 0 THEN
    RAISE EXCEPTION 'Order subtotal and total_amount must be positive.';
  END IF;

  -- Force safe initial defaults on public inserts (admins can transition status afterwards)
  IF NOT public.is_verified_admin() THEN
    NEW.status := 'pending';
    NEW.payment_status := 'unpaid';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_and_sanitize_order ON public.orders;
CREATE TRIGGER trg_validate_and_sanitize_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_sanitize_order();

-- ------------------------------------------------------------------------------
-- 3. STRICT ROW LEVEL SECURITY (RLS) ACROSS ALL TABLES
-- ------------------------------------------------------------------------------

-- A. PRODUCTS TABLE
-- Public SELECT allowed; INSERT/UPDATE/DELETE strictly restricted to verified admins
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow anon read products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
DROP POLICY IF EXISTS "Admins delete products" ON public.products;

CREATE POLICY "Public read active products"
  ON public.products
  FOR SELECT
  USING (COALESCE(is_active, true) = true OR public.is_verified_admin());

CREATE POLICY "Admins insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (public.is_verified_admin());

CREATE POLICY "Admins update products"
  ON public.products
  FOR UPDATE
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

CREATE POLICY "Admins delete products"
  ON public.products
  FOR DELETE
  USING (public.is_verified_admin());

-- B. ORDERS TABLE
-- Public INSERT allowed ONLY with strict column validation;
-- Public SELECT of all orders BLOCKED to prevent leaking student addresses/phones.
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Validated public order insert" ON public.orders;
DROP POLICY IF EXISTS "Admins select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;

CREATE POLICY "Validated public order insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    customer_name IS NOT NULL
    AND char_length(btrim(customer_name)) >= 2
    AND customer_name !~ '<[^>]+>'
    AND right(regexp_replace(COALESCE(customer_phone, phone, ''), '\D', '', 'g'), 10) ~ '^[6-9][0-9]{9}$'
    AND COALESCE(subtotal, 0) > 0
    AND COALESCE(total_amount, total, 0) > 0
    AND COALESCE(delivery_fee, 0) >= 0
    AND COALESCE(handling_fee, 0) >= 0
    AND lower(COALESCE(status, 'pending')) = 'pending'
  );

CREATE POLICY "Admins select orders"
  ON public.orders
  FOR SELECT
  USING (public.is_verified_admin());

CREATE POLICY "Admins update orders"
  ON public.orders
  FOR UPDATE
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

CREATE POLICY "Admins delete orders"
  ON public.orders
  FOR DELETE
  USING (public.is_verified_admin());

-- C. ORDER_ITEMS TABLE
-- Public INSERT allowed only for a freshly created pending parent order;
-- Public SELECT blocked (served via secure single-order RPC or admin JWT).
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow read access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins manage all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Validated public order_items insert" ON public.order_items;
DROP POLICY IF EXISTS "Admins select order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins modify order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins delete order_items" ON public.order_items;

CREATE POLICY "Validated public order_items insert"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    quantity > 0
    AND COALESCE(price_snapshot, price, 0) >= 0
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND lower(COALESCE(o.status, 'pending')) = 'pending'
        AND o.created_at > now() - interval '15 minutes'
    )
  );

CREATE POLICY "Admins select order_items"
  ON public.order_items
  FOR SELECT
  USING (public.is_verified_admin());

CREATE POLICY "Admins modify order_items"
  ON public.order_items
  FOR UPDATE
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

CREATE POLICY "Admins delete order_items"
  ON public.order_items
  FOR DELETE
  USING (public.is_verified_admin());

-- D. ADMIN_USERS & USER_ROLES TABLES
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins manage admin_users" ON public.admin_users;

CREATE POLICY "Admins read own or verified admin_users"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_verified_admin());

CREATE POLICY "Service role or super_admin manage admin_users"
  ON public.admin_users
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role manage user_roles" ON public.user_roles;

CREATE POLICY "Users read own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_verified_admin());

CREATE POLICY "Service role manage user_roles"
  ON public.user_roles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- E. INVENTORY TRANSACTIONS & ORDER STATUS HISTORY (Admin Only)
ALTER TABLE IF EXISTS public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Admins manage inventory_transactions"
  ON public.inventory_transactions
  FOR ALL
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

ALTER TABLE IF EXISTS public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage order_status_history" ON public.order_status_history;
CREATE POLICY "Admins manage order_status_history"
  ON public.order_status_history
  FOR ALL
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

-- F. STORE SETTINGS (Public Read, Admin Write)
ALTER TABLE IF EXISTS public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins update store_settings" ON public.store_settings;

CREATE POLICY "Public read store_settings"
  ON public.store_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins update store_settings"
  ON public.store_settings
  FOR ALL
  USING (public.is_verified_admin())
  WITH CHECK (public.is_verified_admin());

-- ------------------------------------------------------------------------------
-- 4. SECURE SINGLE-ORDER LOOKUP RPC (REQUIRES EXACT ORDER_ID + PHONE MATCH)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customer_order_secure(
  p_order_id text,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_order_id text;
  clean_phone text;
  found_order record;
  found_items jsonb;
BEGIN
  clean_order_id := btrim(COALESCE(p_order_id, ''));
  clean_phone := right(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 10);

  IF char_length(clean_order_id) < 3 THEN
    RAISE EXCEPTION 'Order ID is required.';
  END IF;

  IF clean_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'A valid 10-digit Indian phone number is required.';
  END IF;

  SELECT o.*
  INTO found_order
  FROM public.orders o
  WHERE (
      lower(COALESCE(o.order_number, '')) = lower(clean_order_id)
      OR o.id::text = clean_order_id
    )
    AND right(regexp_replace(COALESCE(o.customer_phone, o.phone, ''), '\D', '', 'g'), 10) = clean_phone
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*)), '[]'::jsonb)
  INTO found_items
  FROM public.order_items oi
  WHERE oi.order_id = found_order.id;

  RETURN jsonb_build_object(
    'id', found_order.id,
    'order_number', COALESCE(found_order.order_number, found_order.id::text),
    'customer_name', found_order.customer_name,
    'customer_phone', found_order.customer_phone,
    'delivery_zone', found_order.delivery_zone,
    'room_details', found_order.room_details,
    'delivery_address', found_order.delivery_address,
    'status', found_order.status,
    'payment_method', found_order.payment_method,
    'subtotal', found_order.subtotal,
    'delivery_fee', found_order.delivery_fee,
    'handling_fee', found_order.handling_fee,
    'total_amount', COALESCE(found_order.total_amount, found_order.total),
    'items', CASE
      WHEN jsonb_array_length(COALESCE(found_order.items, '[]'::jsonb)) > 0
        THEN found_order.items
      ELSE found_items
    END,
    'created_at', found_order.created_at,
    'updated_at', found_order.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_customer_order_secure(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
