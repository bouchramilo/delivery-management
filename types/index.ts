export type DeliveryZone = {
  id: string;
  user_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  user_id: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type ProductWithZones = Product & {
  zones: Pick<DeliveryZone, "id" | "name" | "is_active">[];
};

export type OrderStatus = "accepted";

export type Order = {
  id: string;
  user_id: string;
  product_id: string;
  zone_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_lat: number;
  customer_lng: number;
  status: OrderStatus;
  created_at: string;
};

export type OrderWithRelations = Order & {
  product: Pick<Product, "id" | "name"> | null;
  zone: Pick<DeliveryZone, "id" | "name"> | null;
};

export type DashboardStats = {
  activeZones: number;
  totalProducts: number;
  totalStock: number;
  acceptedOrders: number;
  totalOrderValue: number;
  productsByZone: {
    zoneId: string;
    zoneName: string;
    productCount: number;
    products: { id: string; name: string; quantity: number }[];
  }[];
  ordersByZone: {
    zoneId: string;
    zoneName: string;
    orderCount: number;
    totalItems: number;
    totalValue: number;
  }[];
};
