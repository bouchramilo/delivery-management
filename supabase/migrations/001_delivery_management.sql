-- Delivery Management schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Haversine distance in kilometers (mean Earth radius 6371 km)
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT 6371.0 * 2.0 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2.0), 2.0)
      + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lon2 - lon1) / 2.0), 2.0)
    )
  );
$$;

-- delivery_zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  center_lat double precision NOT NULL CHECK (center_lat >= -90 AND center_lat <= 90),
  center_lng double precision NOT NULL CHECK (center_lng >= -180 AND center_lng <= 180),
  radius_km double precision NOT NULL CHECK (radius_km > 0 AND radius_km <= 500),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_zones_user_id_idx ON public.delivery_zones (user_id);

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products (user_id);

-- product_zones (many-to-many)
CREATE TABLE IF NOT EXISTS public.product_zones (
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.delivery_zones (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, zone_id)
);

CREATE INDEX IF NOT EXISTS product_zones_zone_id_idx ON public.product_zones (zone_id);

-- orders
CREATE TYPE public.order_status AS ENUM ('accepted');

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  zone_id uuid NOT NULL REFERENCES public.delivery_zones (id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  total_price numeric(12, 2) NOT NULL CHECK (total_price >= 0),
  customer_lat double precision NOT NULL CHECK (customer_lat >= -90 AND customer_lat <= 90),
  customer_lng double precision NOT NULL CHECK (customer_lng >= -180 AND customer_lng <= 180),
  status public.order_status NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_zone_id_idx ON public.orders (zone_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivery_zones_updated_at ON public.delivery_zones;
CREATE TRIGGER delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforce product_zones same owner via trigger
CREATE OR REPLACE FUNCTION public.enforce_product_zone_same_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user uuid;
  z_user uuid;
BEGIN
  SELECT user_id INTO p_user FROM public.products WHERE id = NEW.product_id;
  SELECT user_id INTO z_user FROM public.delivery_zones WHERE id = NEW.zone_id;
  IF p_user IS NULL OR z_user IS NULL OR p_user <> z_user THEN
    RAISE EXCEPTION 'product and zone must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_zones_same_user ON public.product_zones;
CREATE TRIGGER product_zones_same_user
  BEFORE INSERT OR UPDATE ON public.product_zones
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_zone_same_user();

-- Atomic order creation
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_product_id uuid,
  p_quantity integer,
  p_customer_lat double precision,
  p_customer_lng double precision
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_product public.products%ROWTYPE;
  v_zone_id uuid;
  v_distance double precision;
  v_unit_price numeric(12, 2);
  v_total numeric(12, 2);
  v_order public.orders%ROWTYPE;
  v_best_distance double precision := NULL;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid quantity' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_product.quantity < p_quantity THEN
    RAISE EXCEPTION 'insufficient stock' USING ERRCODE = '22023';
  END IF;

  SELECT dz.id,
         public.haversine_km(p_customer_lat, p_customer_lng, dz.center_lat, dz.center_lng)
  INTO v_zone_id, v_best_distance
  FROM public.product_zones pz
  INNER JOIN public.delivery_zones dz ON dz.id = pz.zone_id
  WHERE pz.product_id = p_product_id
    AND dz.user_id = v_user
    AND dz.is_active = true
    AND public.haversine_km(p_customer_lat, p_customer_lng, dz.center_lat, dz.center_lng) <= dz.radius_km
  ORDER BY
    public.haversine_km(p_customer_lat, p_customer_lng, dz.center_lat, dz.center_lng) ASC,
    dz.id ASC
  LIMIT 1;

  IF v_zone_id IS NULL THEN
    RAISE EXCEPTION 'outside delivery zone' USING ERRCODE = '22023';
  END IF;

  v_unit_price := v_product.price;
  v_total := round(v_unit_price * p_quantity, 2);

  UPDATE public.products
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id;

  INSERT INTO public.orders (
    user_id, product_id, zone_id, quantity,
    unit_price, total_price, customer_lat, customer_lng, status
  )
  VALUES (
    v_user, p_product_id, v_zone_id, p_quantity,
    v_unit_price, v_total, p_customer_lat, p_customer_lng, 'accepted'
  )
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, integer, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, integer, double precision, double precision) TO authenticated;

-- RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- delivery_zones policies
CREATE POLICY "delivery_zones_select_own" ON public.delivery_zones
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delivery_zones_insert_own" ON public.delivery_zones
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "delivery_zones_update_own" ON public.delivery_zones
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delivery_zones_delete_own" ON public.delivery_zones
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- products policies
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- product_zones: user must own product and zone
CREATE POLICY "product_zones_select_own" ON public.product_zones
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid())
  );
CREATE POLICY "product_zones_insert_own" ON public.product_zones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.delivery_zones z WHERE z.id = zone_id AND z.user_id = auth.uid())
  );
CREATE POLICY "product_zones_delete_own" ON public.product_zones
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid())
  );

-- orders policies
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
