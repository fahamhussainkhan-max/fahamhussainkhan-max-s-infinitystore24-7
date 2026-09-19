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
  stockCount?: number;
  isPopular?: boolean;
  isLateNight?: boolean;
  isFlashDeal?: boolean;
  flashDealEndsIn?: number; // seconds
  claimedPercent?: number;
  unit: string;
  description: string;
  tags?: string[];
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
}

export interface CampusLocation {
  zoneId: string;
  zoneName: string;
  roomOrHostel: string;
  notes?: string;
}
