export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  inStock: boolean;
  isActive?: boolean;
  stockCount?: number;
  isPopular?: boolean;
  isLateNight?: boolean;
  isFlashDeal?: boolean;
  flashDealEndsIn?: number; // seconds
  claimedPercent?: number;
  unit: string;
  description: string;
  tags?: string[];
  minQuantity?: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  accentColor: string; // Hex color: e.g. #FF3B30, #FFD60A, #0A84FF, #30D158
  bgGradient: string;
  textColor: string;
  image: string;
  description: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CampusZone {
  id: string;
  name: string;
  block: string;
  estMinutes: string;
  isOnline: boolean;
  deliveryFee: number;
  coordinates?: { lat: number; lng: number };
  isOutsideDelivery?: boolean;
  isCustom?: boolean;
  customLocation?: string;
  isVerifiedInside?: boolean;
}

export interface CampusLocation {
  zoneId: string;
  zoneName: string;
  roomOrHostel: string;
  notes?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface DeliveryAddress {
  fullName?: string;
  phone?: string;
  area?: string;
  roomNo?: string;
  notes?: string;
}

export interface AdminOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone?: string;
  customer_id?: string;
  delivery_zone: string;
  room_details: string;
  delivery_address?: DeliveryAddress;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  total_amount: number;
  status: OrderStatus;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminProduct {
  id: string;
  sku?: string;
  name: string;
  title?: string;
  category: string;
  price: number;
  original_price?: number;
  stock_count: number;
  stock_quantity?: number;
  low_stock_threshold: number;
  image: string;
  image_url?: string;
  unit: string;
  description: string;
  in_stock: boolean;
  is_active?: boolean;
  is_popular?: boolean;
  is_late_night?: boolean;
  is_flash_deal?: boolean;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin' | 'staff' | 'delivery';
  hostel_block?: string;
  room_number?: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  product_name?: string;
  change_amount: number;
  previous_stock?: number;
  new_stock?: number;
  reason: 'Restock' | 'Sale' | 'Damaged' | 'Audit Adjustment' | 'Initial Stock';
  notes?: string;
  created_at: string;
}

