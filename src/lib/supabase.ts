import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdminOrder,
  AdminProduct,
  UserProfile,
  OrderStatusHistory,
  InventoryTransaction,
  OrderStatus,
  DeliveryAddress,
} from '../types';
import { PRODUCTS } from '../data/mockData';

// Centralized Supabase credentials and initialized client
export const SUPABASE_URL = 'https://egdbegaujzrzsbbstzsr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_NFG335bM--1HEo9Mx27mmA_Rcw4qF_Q';

export const supabase: SupabaseClient<any, 'public', any> = createClient<any, 'public', any>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 20, // Low-latency throughput
      },
    },
  }
);

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  (SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://')) &&
  SUPABASE_ANON_KEY
);

// Local fallback store keys
const LOCAL_STORAGE_KEYS = {
  ORDERS: 'infinity_admin_orders',
  PRODUCTS: 'infinity_admin_products',
  PROFILES: 'infinity_admin_profiles',
  ORDER_HISTORY: 'infinity_admin_order_history',
  INVENTORY_TX: 'infinity_admin_inventory_tx',
};

// Initial default products converted to AdminProduct format
const DEFAULT_ADMIN_PRODUCTS: AdminProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  original_price: p.originalPrice,
  stock_count: p.stockCount ?? (p.inStock ? 45 : 0),
  low_stock_threshold: 12,
  image: p.image,
  unit: p.unit,
  description: p.description,
  in_stock: p.inStock,
  is_popular: p.isPopular,
  is_late_night: p.isLateNight,
  is_flash_deal: p.isFlashDeal,
  created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
}));

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'usr-001',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    phone: '+91 98765 43210',
    role: 'student',
    hostel_block: 'Boys Hostel B - Room 304',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'usr-002',
    full_name: 'Priya Nair',
    email: 'priya.nair@campus.edu',
    phone: '+91 98765 43211',
    role: 'student',
    hostel_block: 'Girls Hostel A - Room 112',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'usr-003',
    full_name: 'Rohan Mehta',
    email: 'rohan.mehta@campus.edu',
    phone: '+91 98765 43212',
    role: 'student',
    hostel_block: 'Tech Quad - Block C',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'usr-004',
    full_name: 'Devika Sen',
    email: 'devika.sen@campus.edu',
    phone: '+91 98765 43213',
    role: 'admin',
    hostel_block: 'Campus Operations Hub',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const DEFAULT_ORDERS: AdminOrder[] = [
  {
    id: 'INF-ORD-9021',
    order_number: 'INF-9021',
    customer_name: 'Aarav Sharma',
    customer_phone: '+91 98765 43210',
    delivery_zone: 'Boys Hostel — Block B & C',
    room_details: 'Room 304, 3rd Floor, Block B',
    delivery_address: {
      fullName: 'Aarav Sharma',
      phone: '+91 98765 43210',
      area: 'Campus Hostels',
      roomNo: 'Room 304, Block B',
      notes: 'Call when outside the gate',
    },
    items: [
      { id: 'prod-maggi-masala', name: 'Maggi 2-Minute Masala Noodles', quantity: 3, price: 14 },
      { id: 'prod-redbull', name: 'Red Bull Energy Drink (250ml)', quantity: 2, price: 125 },
      { id: 'prod-snickers', name: 'Snickers Peanut Chocolate Bar', quantity: 1, price: 50 },
    ],
    total_amount: 342,
    status: 'Out for Delivery',
    payment_method: 'UPI / Online',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'INF-ORD-9020',
    order_number: 'INF-9020',
    customer_name: 'Priya Nair',
    customer_phone: '+91 98765 43211',
    delivery_zone: 'Girls Hostel — Block A & D',
    room_details: 'Room 112, 1st Floor, Wing A',
    delivery_address: {
      fullName: 'Priya Nair',
      phone: '+91 98765 43211',
      area: 'Campus Hostels',
      roomNo: 'Room 112, Wing A',
      notes: 'Leave at security desk if studying',
    },
    items: [
      { id: 'prod-lays-cream', name: "Lay's American Style Cream & Onion", quantity: 2, price: 20 },
      { id: 'prod-amul-kool', name: 'Amul Kool Cafe Chilled Latte', quantity: 2, price: 35 },
    ],
    total_amount: 110,
    status: 'Preparing',
    payment_method: 'Campus Wallet',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'INF-ORD-9019',
    order_number: 'INF-9019',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43212',
    delivery_zone: 'Central Library & Reading Hall',
    room_details: 'Ground Floor, Study Desk #42',
    delivery_address: {
      fullName: 'Rohan Mehta',
      phone: '+91 98765 43212',
      area: 'Central Library & Reading Hall',
      roomNo: 'Study Desk #42',
      notes: 'Keep phone on silent, please WhatsApp ping',
    },
    items: [
      { id: 'prod-notebook-spiral', name: 'Classmate Pulse Spiral Notebook (A4)', quantity: 2, price: 95 },
      { id: 'prod-pens-pack', name: 'Reynolds 045 Fine Ball Pens (Pack of 5)', quantity: 1, price: 50 },
      { id: 'prod-nescafe-cold', name: 'Nescafé Intense Chilled Cold Coffee', quantity: 1, price: 40 },
    ],
    total_amount: 280,
    status: 'Confirmed',
    payment_method: 'UPI / Online',
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 'INF-ORD-9018',
    order_number: 'INF-9018',
    customer_name: 'Sneha Patel',
    customer_phone: '+91 98765 43214',
    delivery_zone: 'Boys Hostel — Block B & C',
    room_details: 'Room 208, 2nd Floor, Block C',
    delivery_address: {
      fullName: 'Sneha Patel',
      phone: '+91 98765 43214',
      area: 'Campus Hostels',
      roomNo: 'Room 208, Block C',
      notes: 'Hand over to roommate if not in room',
    },
    items: [
      { id: 'prod-dettol-sanitizer', name: 'Dettol Instant Hand Sanitizer (50ml)', quantity: 1, price: 35 },
      { id: 'prod-himalaya-facewash', name: 'Himalaya Purifying Neem Face Wash', quantity: 1, price: 85 },
    ],
    total_amount: 120,
    status: 'Delivered',
    payment_method: 'Cash on Delivery',
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

const DEFAULT_STATUS_HISTORY: OrderStatusHistory[] = [
  {
    id: 'hist-1',
    order_id: 'INF-ORD-9021',
    status: 'Pending',
    notes: 'Order placed by student',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'hist-2',
    order_id: 'INF-ORD-9021',
    status: 'Confirmed',
    notes: 'Payment verified via UPI',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'hist-3',
    order_id: 'INF-ORD-9021',
    status: 'Preparing',
    notes: 'Packed at North Hub Dark Store',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'hist-4',
    order_id: 'INF-ORD-9021',
    status: 'Out for Delivery',
    notes: 'Handed to campus runner Vikram',
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];

const DEFAULT_INVENTORY_TX: InventoryTransaction[] = [
  {
    id: 'tx-1',
    product_id: 'prod-maggi-masala',
    product_name: 'Maggi 2-Minute Masala Noodles',
    change_amount: +120,
    previous_stock: 30,
    new_stock: 150,
    reason: 'Restock',
    notes: 'Weekly vendor delivery batch',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tx-2',
    product_id: 'prod-redbull',
    product_name: 'Red Bull Energy Drink (250ml)',
    change_amount: -2,
    previous_stock: 14,
    new_stock: 12,
    reason: 'Sale',
    notes: 'Order #INF-9021',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'tx-3',
    product_id: 'prod-chocos-fills',
    product_name: "Kellogg's Chocos Crunchy Bites",
    change_amount: +50,
    previous_stock: 5,
    new_stock: 55,
    reason: 'Restock',
    notes: 'Restocked low stock inventory',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Helper to get local data safely
function getLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to set local storage:', e);
  }
}

/* ============================================================
   1. DASHBOARD & AGGREGATED METRICS
   ============================================================ */
export async function fetchDashboardMetrics() {
  let ordersCount = 0;
  let totalRevenue = 0;
  let activeOrdersCount = 0;
  let productsCount = 0;
  let lowStockCount = 0;
  let profilesCount = 0;
  let recentOrders: AdminOrder[] = [];
  let isLiveSupabase = false;

  try {
    // 1. Fetch Orders from Supabase
    const { data: remoteOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!ordersError && remoteOrders) {
      isLiveSupabase = true;
      ordersCount = remoteOrders.length;
      totalRevenue = remoteOrders.reduce(
        (sum, o) => sum + Number(o.total_amount || o.total || 0),
        0
      );
      activeOrdersCount = remoteOrders.filter((o) =>
        ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(
          o.status
        )
      ).length;
      recentOrders = remoteOrders.slice(0, 8);
    } else {
      throw new Error(ordersError?.message || 'Orders table not ready');
    }

    // 2. Fetch Products from Supabase
    const { data: remoteProducts, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (!productsError && remoteProducts) {
      productsCount = remoteProducts.length;
      lowStockCount = remoteProducts.filter((p) => {
        const stock = Number(p.stock_count ?? p.stockCount ?? 0);
        const threshold = Number(p.low_stock_threshold ?? 10);
        return stock <= threshold;
      }).length;
    }

    // 3. Fetch Profiles from Supabase
    const { data: remoteProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (!profilesError && remoteProfiles) {
      profilesCount = remoteProfiles.length;
    }
  } catch (err) {
    // Fallback to local storage state
    const localOrders = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    const localProducts = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
    const localProfiles = getLocal<UserProfile[]>(LOCAL_STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);

    ordersCount = localOrders.length;
    totalRevenue = localOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    activeOrdersCount = localOrders.filter((o) =>
      ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)
    ).length;
    recentOrders = localOrders.slice(0, 8);
    productsCount = localProducts.length;
    lowStockCount = localProducts.filter(
      (p) => Number(p.stock_count || 0) <= Number(p.low_stock_threshold || 10)
    ).length;
    profilesCount = localProfiles.length;
  }

  return {
    ordersCount,
    totalRevenue,
    activeOrdersCount,
    productsCount,
    lowStockCount,
    profilesCount,
    recentOrders,
    isLiveSupabase,
  };
}

/* ============================================================
   2. PRODUCTS CRUD WITH SUPABASE & IMAGE BUCKET
   ============================================================ */
export async function fetchProducts(onlyActive = true): Promise<AdminProduct[]> {
  try {
    let query = supabase.from('products').select('*');
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    let { data, error } = await query.order('created_at', { ascending: false });

    // Fallback if 'is_active' column does not exist on table yet
    if (error && onlyActive) {
      console.warn('Querying with is_active = true had notice, falling back to all products:', error.message);
      const fallback = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (!error && data && data.length > 0) {
      // Map columns in case schema uses snake_case or camelCase
      const mapped: AdminProduct[] = data.map((item) => {
        const stock = Number(item.stock_quantity ?? item.stock_count ?? item.stockCount ?? 0);
        const name = item.title || item.name || 'Campus Product';
        const img = item.image_url || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
        return {
          id: String(item.id),
          name,
          title: name,
          category: item.category || 'snacks',
          price: Number(item.price || 0),
          original_price: item.original_price ? Number(item.original_price) : undefined,
          stock_count: stock,
          stock_quantity: stock,
          low_stock_threshold: Number(item.low_stock_threshold ?? 10),
          image: img,
          image_url: img,
          unit: item.unit || '1 pc',
          description: item.description || '',
          in_stock: Boolean(item.in_stock ?? (stock > 0)),
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
          is_popular: Boolean(item.is_popular),
          is_late_night: Boolean(item.is_late_night),
          is_flash_deal: Boolean(item.is_flash_deal),
          created_at: item.created_at || new Date().toISOString(),
        };
      });

      // Cache locally
      setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Supabase products fetch failed, using local:', err);
  }

  return getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
}

export async function createProduct(product: Omit<AdminProduct, 'id' | 'created_at'>): Promise<AdminProduct> {
  const newId = `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const fullProduct: AdminProduct = {
    ...product,
    id: newId,
    created_at: now,
    in_stock: Number(product.stock_count || 0) > 0,
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          id: newId,
          name: fullProduct.name,
          title: fullProduct.name,
          category: fullProduct.category,
          price: fullProduct.price,
          original_price: fullProduct.original_price,
          stock_count: fullProduct.stock_count,
          stock_quantity: fullProduct.stock_count,
          low_stock_threshold: fullProduct.low_stock_threshold,
          image: fullProduct.image,
          image_url: fullProduct.image,
          unit: fullProduct.unit,
          description: fullProduct.description,
          in_stock: fullProduct.in_stock,
          is_active: fullProduct.is_active !== undefined ? fullProduct.is_active : true,
          is_popular: fullProduct.is_popular,
          is_late_night: fullProduct.is_late_night,
          is_flash_deal: fullProduct.is_flash_deal,
          created_at: now,
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      // Record initial inventory transaction
      try {
        await supabase.from('inventory_transactions').insert([
          {
            id: `tx-${Date.now()}`,
            product_id: newId,
            change_amount: fullProduct.stock_count,
            previous_stock: 0,
            new_stock: fullProduct.stock_count,
            reason: 'Initial Stock',
            notes: 'Product created',
            created_at: now,
          },
        ]);
      } catch (txErr) {
        console.warn('Supabase initial tx insert ignored:', txErr);
      }
    }
  } catch (err) {
    console.warn('Supabase product insert failed, fallback local:', err);
  }

  // Update local fallback
  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
  const updated = [fullProduct, ...local];
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, updated);

  return fullProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<AdminProduct>
): Promise<AdminProduct> {
  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
  const existing = local.find((p) => p.id === id);
  const merged: AdminProduct = {
    ...(existing || ({} as AdminProduct)),
    ...updates,
    id,
    in_stock:
      updates.stock_count !== undefined
        ? updates.stock_count > 0
        : existing?.in_stock ?? true,
  };

  try {
    await supabase
      .from('products')
      .update({
        name: merged.name,
        title: merged.name,
        category: merged.category,
        price: merged.price,
        original_price: merged.original_price,
        stock_count: merged.stock_count,
        stock_quantity: merged.stock_count,
        low_stock_threshold: merged.low_stock_threshold,
        image: merged.image,
        image_url: merged.image,
        unit: merged.unit,
        description: merged.description,
        in_stock: merged.in_stock,
        is_popular: merged.is_popular,
        is_late_night: merged.is_late_night,
        is_flash_deal: merged.is_flash_deal,
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase product update failed:', err);
  }

  const updatedList = local.map((p) => (p.id === id ? merged : p));
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, updatedList);

  return merged;
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase product delete failed:', err);
  }

  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
  const updated = local.filter((p) => p.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, updated);

  return true;
}

/**
 * Image upload to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `catalog/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.warn('Fallback to browser DataURL due to bucket permission or network:', err);
  }

  // Fallback: Read file as DataURL for offline/preview resilience
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   3. ORDERS MANAGEMENT WITH REALTIME & STATUS PROGRESSION
   ============================================================ */
export async function fetchOrders(): Promise<AdminOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped: AdminOrder[] = data.map((o) => {
        const delLoc = o.delivery_location || '';
        const zoneMatch = delLoc.split(',')[0]?.trim() || o.delivery_zone || 'Academic Complex & Main Campus';
        const roomMatch = delLoc.split(',').slice(1).join(',').trim() || o.room_details || '';

        // Extract items from order_items relational query or items column
        let resolvedItems = Array.isArray(o.items) && o.items.length > 0 ? o.items : [];
        if ((!resolvedItems || resolvedItems.length === 0) && Array.isArray(o.order_items)) {
          resolvedItems = o.order_items.map((oi: any) => ({
            id: oi.id || oi.product_id || 'item',
            name: oi.product_name_snapshot || oi.product_name || oi.name || 'Campus Item',
            price: Number(oi.price_snapshot ?? oi.price ?? oi.unit_price ?? 0),
            quantity: Number(oi.quantity || 1),
          }));
        }

        return {
          id: o.id,
          order_number: o.order_number || o.id,
          customer_name: o.customer_name || (typeof o.delivery_address === 'object' && o.delivery_address?.fullName) || 'Campus Student',
          customer_phone: o.customer_phone || o.phone || (typeof o.delivery_address === 'object' && o.delivery_address?.phone) || '',
          customer_id: o.customer_id,
          delivery_zone: o.delivery_zone || zoneMatch,
          room_details: o.room_details || roomMatch || 'Hostel Room',
          delivery_address: typeof o.delivery_address === 'object' && o.delivery_address !== null
            ? o.delivery_address
            : {
                fullName: o.customer_name || 'Campus Student',
                phone: o.customer_phone || o.phone || '',
                area: o.delivery_zone || zoneMatch,
                roomNo: o.room_details || roomMatch,
                notes: o.notes || undefined,
              },
          items: resolvedItems,
          total_amount: Number(o.total_amount ?? o.total ?? 0),
          status: o.status as OrderStatus,
          payment_method: o.payment_method || 'COD',
          created_at: o.created_at || o.timestamp || new Date().toISOString(),
          updated_at: o.updated_at,
        };
      });

      setLocal(LOCAL_STORAGE_KEYS.ORDERS, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Supabase orders fetch failed:', err);
  }

  return getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<AdminOrder | null> {
  // 1. Update in Supabase orders table
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    alert(error.message);
    console.error('Supabase status update error:', error);
    return null;
  }

  const now = new Date().toISOString();

  // 2. Insert into order_status_history table
  const historyEntry: OrderStatusHistory = {
    id: `hist-${Date.now()}`,
    order_id: orderId,
    status: newStatus,
    notes: notes || `Status updated to ${newStatus}`,
    created_by: 'Admin / Staff',
    created_at: now,
  };

  try {
    await supabase.from('order_status_history').insert([
      {
        id: historyEntry.id,
        order_id: historyEntry.order_id,
        status: historyEntry.status,
        notes: historyEntry.notes,
        created_by: historyEntry.created_by,
        created_at: historyEntry.created_at,
      },
    ]);
  } catch (err) {
    console.warn('Supabase order_status_history insert failed:', err);
  }

  // Local updates
  const localHistory = getLocal<OrderStatusHistory[]>(
    LOCAL_STORAGE_KEYS.ORDER_HISTORY,
    DEFAULT_STATUS_HISTORY
  );
  setLocal(LOCAL_STORAGE_KEYS.ORDER_HISTORY, [historyEntry, ...localHistory]);

  const localOrders = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  let updatedOrder: AdminOrder | null = null;
  const updatedOrders = localOrders.map((o) => {
    if (o.id === orderId) {
      updatedOrder = { ...o, status: newStatus, updated_at: now };
      return updatedOrder;
    }
    return o;
  });
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, updatedOrders);

  return updatedOrder;
}

export async function fetchOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
  try {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as OrderStatusHistory[];
    }
  } catch (err) {
    console.warn('Supabase history fetch failed:', err);
  }

  const localHistory = getLocal<OrderStatusHistory[]>(
    LOCAL_STORAGE_KEYS.ORDER_HISTORY,
    DEFAULT_STATUS_HISTORY
  );
  return localHistory.filter((h) => h.order_id === orderId);
}

/**
 * Realtime subscription on the 'orders' table
 */
export function subscribeToOrders(
  onInsert: (order: AdminOrder) => void,
  onUpdate: (order: AdminOrder) => void
) {
  const channel = supabase
    .channel('infinity-orders-realtime-global')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        const o = payload.new as any;
        if (!o || !o.id) return;
        setTimeout(async () => {
          const { data: fullOrder } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', o.id)
            .single();

          const src = fullOrder || o;
          const delLoc = src.delivery_location || '';
          const zoneMatch = delLoc.split(',')[0]?.trim() || src.delivery_zone || 'Academic Complex & Main Campus';
          const roomMatch = delLoc.split(',').slice(1).join(',').trim() || src.room_details || '';

          let resolvedItems = Array.isArray(src.items) && src.items.length > 0 ? src.items : [];
          if ((!resolvedItems || resolvedItems.length === 0) && Array.isArray(src.order_items)) {
            resolvedItems = src.order_items.map((oi: any) => ({
              id: oi.id || oi.product_id || 'item',
              name: oi.product_name_snapshot || oi.product_name || oi.name || 'Campus Item',
              price: Number(oi.price_snapshot ?? oi.price ?? oi.unit_price ?? 0),
              quantity: Number(oi.quantity || 1),
            }));
          }

          const mapped: AdminOrder = {
            id: src.id,
            order_number: src.order_number || src.id,
            customer_name: src.customer_name || (typeof src.delivery_address === 'object' && src.delivery_address?.fullName) || 'Campus Student',
            customer_phone: src.customer_phone || src.phone || (typeof src.delivery_address === 'object' && src.delivery_address?.phone) || '',
            customer_id: src.customer_id,
            delivery_zone: src.delivery_zone || zoneMatch,
            room_details: src.room_details || roomMatch || 'Hostel Room',
            delivery_address: typeof src.delivery_address === 'object' && src.delivery_address !== null
              ? src.delivery_address
              : {
                  fullName: src.customer_name || 'Campus Student',
                  phone: src.customer_phone || src.phone || '',
                  area: src.delivery_zone || zoneMatch,
                  roomNo: src.room_details || roomMatch,
                  notes: src.delivery_note || src.notes || undefined,
                },
            items: resolvedItems,
            total_amount: Number(src.total ?? src.total_amount ?? 0),
            status: (src.status as OrderStatus) || 'Pending',
            payment_method: src.payment_method || 'Cash on Delivery',
            created_at: src.created_at || src.timestamp || new Date().toISOString(),
            updated_at: src.updated_at,
          };
          onInsert(mapped);
        }, 350);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        const o = payload.new as any;
        if (!o || !o.id) return;
        const mapped: AdminOrder = {
          id: o.id,
          order_number: o.order_number || o.id,
          customer_name: o.customer_name || o.delivery_address?.fullName || 'Campus Student',
          customer_phone: o.customer_phone || o.delivery_address?.phone || '',
          delivery_zone: o.delivery_zone || o.delivery_address?.area || 'Campus Zone',
          room_details: o.room_details || o.delivery_address?.roomNo || 'Room',
          items: Array.isArray(o.items) ? o.items : [],
          total_amount: Number(o.total_amount ?? o.total ?? 0),
          status: (o.status as OrderStatus) || 'Pending',
          payment_method: o.payment_method || 'Cash on Delivery',
          created_at: o.created_at || new Date().toISOString(),
          updated_at: o.updated_at || new Date().toISOString(),
        };
        onUpdate(mapped);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ============================================================
   4. INVENTORY & STOCK TRANSACTIONS
   ============================================================ */
export async function adjustInventoryStock(
  productId: string,
  changeAmount: number,
  reason: 'Restock' | 'Sale' | 'Damaged' | 'Audit Adjustment',
  notes?: string
) {
  const localProducts = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, DEFAULT_ADMIN_PRODUCTS);
  const target = localProducts.find((p) => p.id === productId);
  if (!target) return null;

  const previousStock = Number(target.stock_count || 0);
  const newStock = Math.max(0, previousStock + changeAmount);
  const now = new Date().toISOString();

  // 1. Update Product in Supabase
  try {
    await supabase
      .from('products')
      .update({
        stock_count: newStock,
        stock_quantity: newStock,
        in_stock: newStock > 0,
      })
      .eq('id', productId);
  } catch (err) {
    console.warn('Supabase stock update failed:', err);
  }

  // 2. Insert into inventory_transactions in Supabase
  const tx: InventoryTransaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    product_id: productId,
    product_name: target.name,
    change_amount: changeAmount,
    previous_stock: previousStock,
    new_stock: newStock,
    reason,
    notes: notes || `${reason} of ${Math.abs(changeAmount)} units`,
    created_at: now,
  };

  try {
    await supabase.from('inventory_transactions').insert([
      {
        id: tx.id,
        product_id: tx.product_id,
        change_amount: tx.change_amount,
        previous_stock: tx.previous_stock,
        new_stock: tx.new_stock,
        reason: tx.reason,
        notes: tx.notes,
        created_at: tx.created_at,
      },
    ]);
  } catch (err) {
    console.warn('Supabase inventory_transactions insert failed:', err);
  }

  // Local state updates
  const updatedProducts = localProducts.map((p) =>
    p.id === productId
      ? { ...p, stock_count: newStock, in_stock: newStock > 0 }
      : p
  );
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, updatedProducts);

  const localTx = getLocal<InventoryTransaction[]>(
    LOCAL_STORAGE_KEYS.INVENTORY_TX,
    DEFAULT_INVENTORY_TX
  );
  setLocal(LOCAL_STORAGE_KEYS.INVENTORY_TX, [tx, ...localTx]);

  return { product: target, transaction: tx, newStock };
}

export async function fetchInventoryTransactions(productId?: string): Promise<InventoryTransaction[]> {
  try {
    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as InventoryTransaction[];
    }
  } catch (err) {
    console.warn('Supabase transactions fetch failed:', err);
  }

  const localTx = getLocal<InventoryTransaction[]>(
    LOCAL_STORAGE_KEYS.INVENTORY_TX,
    DEFAULT_INVENTORY_TX
  );
  return productId ? localTx.filter((t) => t.product_id === productId) : localTx;
}

export async function fetchProfiles(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as UserProfile[];
    }
  } catch (err) {
    console.warn('Supabase profiles fetch failed:', err);
  }

  return getLocal<UserProfile[]>(LOCAL_STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
}

/* ============================================================
   5. SEED INITIAL SUPABASE DATA (1-CLICK HELPER)
   ============================================================ */
export async function seedSupabaseDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Products
    const productsToInsert = DEFAULT_ADMIN_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      original_price: p.original_price,
      stock_count: p.stock_count,
      low_stock_threshold: p.low_stock_threshold,
      image: p.image,
      unit: p.unit,
      description: p.description,
      in_stock: p.in_stock,
      is_popular: p.is_popular,
      is_late_night: p.is_late_night,
      is_flash_deal: p.is_flash_deal,
      created_at: p.created_at,
    }));

    await supabase.from('products').upsert(productsToInsert, { onConflict: 'id' });

    // 2. Seed Profiles
    await supabase.from('profiles').upsert(DEFAULT_PROFILES, { onConflict: 'id' });

    // 3. Seed Orders
    const ordersToInsert = DEFAULT_ORDERS.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      delivery_zone: o.delivery_zone,
      room_details: o.room_details,
      items: o.items,
      total_amount: o.total_amount,
      status: o.status,
      payment_method: o.payment_method,
      created_at: o.created_at,
    }));

    await supabase.from('orders').upsert(ordersToInsert, { onConflict: 'id' });

    // 4. Seed Status History
    await supabase.from('order_status_history').upsert(DEFAULT_STATUS_HISTORY, { onConflict: 'id' });

    // 5. Seed Inventory Transactions
    await supabase.from('inventory_transactions').upsert(DEFAULT_INVENTORY_TX, { onConflict: 'id' });

    return { success: true, message: 'Successfully seeded campus data to Supabase!' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to seed data. Check table schemas or RLS rules.',
    };
  }
}

/* ============================================================
   6. RECORD CAMPUS ORDER (STOREFRONT CHECKOUT INTEGRATION)
   ============================================================ */
export async function recordCampusOrder(orderData: {
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  total: number;
  deliveryZone: string;
  roomDetails: string;
  studentPhone?: string;
  customerName?: string;
  paymentMethod?: string;
  deliveryAddress?: DeliveryAddress;
}) {
  const orderId = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();

  const deliveryAddress = orderData.deliveryAddress || {
    fullName: orderData.customerName || 'Campus Student',
    phone: orderData.studentPhone || '',
    area: orderData.deliveryZone,
    roomNo: orderData.roomDetails,
  };

  const fullOrder: AdminOrder = {
    id: orderId,
    order_number: orderId,
    customer_name: deliveryAddress.fullName || orderData.customerName || 'Campus Student',
    customer_phone: deliveryAddress.phone || orderData.studentPhone || '',
    delivery_zone: deliveryAddress.area || orderData.deliveryZone,
    room_details: deliveryAddress.roomNo || orderData.roomDetails,
    delivery_address: deliveryAddress,
    items: orderData.items,
    total_amount: orderData.total,
    status: 'Pending',
    payment_method: orderData.paymentMethod || 'Cash on Delivery',
    created_at: timestamp,
  };

  // 1. Try Supabase insert
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          payment_method: fullOrder.payment_method || 'COD',
          payment_status: 'unpaid',
          subtotal: Number(fullOrder.total_amount || 0),
          total: Number(fullOrder.total_amount || 0),
          delivery_fee: 0,
          discount: 0,
          status: 'preparing',
          delivery_address: {
            fullName: fullOrder.customer_name,
            phone: fullOrder.customer_phone,
            area: fullOrder.delivery_zone,
            roomNo: fullOrder.room_details,
            notes: typeof fullOrder.delivery_address === 'object' ? fullOrder.delivery_address?.notes : undefined,
            formatted: `${fullOrder.delivery_zone} - Room: ${fullOrder.room_details}`,
          },
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      const createdId = data[0].id || orderId;
      // Insert line items snapshot into order_items
      const lineItems = orderData.items.map((item) => ({
        order_id: createdId,
        product_id: item.id || null,
        product_name_snapshot: item.name,
        price_snapshot: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(lineItems);

      // Also log initial status in order_status_history
      await supabase.from('order_status_history').insert([
        {
          id: `hist-${Date.now()}`,
          order_id: orderId,
          status: 'Pending',
          notes: 'Customer placed order via Storefront',
          created_by: 'Student',
          created_at: timestamp,
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase order insert fallback to local:', err);
  }

  // 2. Always maintain local cache
  const local = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, [fullOrder, ...local]);

  return { success: true, order: fullOrder };
}

/* ============================================================
   FAST OPTIMIZED CHECKOUT FUNCTION
   ============================================================ */
export async function placeFastOrder(
  customerData: { name: string; phone: string; zone?: string; area?: string; room?: string; roomNo?: string; notes?: string },
  cartItems: Array<{ id?: string; title?: string; name?: string; price: number; quantity: number }>,
  totalAmount: number
) {
  const selectedZone = customerData.zone || customerData.area || 'Academic Complex & Main Campus';
  const room = customerData.room || customerData.roomNo || '';
  const deliveryLocation = room ? `${selectedZone} (Room ${room})` : selectedZone;
  const orderId = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  // 1. Insert directly into 'orders' with the exact schema requested:
  //    total_amount, status: 'preparing', delivery_location, payment_method: 'COD', customer_name, customer_phone
  //    Plus compatibility aliases (total, subtotal, delivery_address, items) for resilient multi-schema support
  const orderPayload: any = {
    id: orderId,
    order_number: orderId,
    total_amount: totalAmount,
    total: totalAmount,
    subtotal: totalAmount,
    status: 'preparing',
    delivery_location: deliveryLocation,
    delivery_zone: selectedZone,
    room_details: room,
    payment_method: 'COD',
    payment_status: 'pending',
    customer_name: customerData.name || 'Campus Student',
    customer_phone: customerData.phone || '',
    delivery_address: {
      fullName: customerData.name || 'Campus Student',
      phone: customerData.phone || '',
      area: selectedZone,
      roomNo: room,
      notes: customerData.notes || '',
    },
    items: cartItems.map((it) => ({
      id: it.id || 'item',
      name: it.title || it.name || 'Campus Item',
      price: it.price,
      quantity: it.quantity,
    })),
    created_at: now,
  };

  let newOrder: any = null;
  const { data, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select()
    .single();

  if (orderError) {
    console.warn('Primary orders insert error, attempting minimal schema insert:', orderError.message);
    // Minimal fallback insert with just the core columns
    const minimalPayload = {
      total_amount: totalAmount,
      status: 'preparing',
      delivery_location: deliveryLocation,
      payment_method: 'COD',
      customer_name: customerData.name || 'Campus Student',
      customer_phone: customerData.phone || '',
    };
    const retry = await supabase
      .from('orders')
      .insert([minimalPayload])
      .select()
      .single();

    if (retry.error) {
      console.warn('Minimal schema insert also had notice, falling back to local sync:', retry.error.message);
      newOrder = { id: orderId, ...orderPayload };
    } else {
      newOrder = retry.data;
    }
  } else {
    newOrder = data;
  }

  const generatedId = newOrder?.id || orderId;

  // 2. Immediately insert product details into 'order_items'
  if (cartItems && cartItems.length > 0) {
    const items = cartItems.map((item) => ({
      order_id: generatedId,
      product_name_snapshot: item.title || item.name || 'Campus Item',
      product_name: item.title || item.name || 'Campus Item',
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    try {
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) {
        console.warn('order_items insert warning:', itemsError.message);
        // Try fallback with only standard columns
        const basicItems = cartItems.map((item) => ({
          order_id: generatedId,
          product_name: item.title || item.name || 'Campus Item',
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }));
        await supabase.from('order_items').insert(basicItems);
      }
    } catch (itemErr) {
      console.warn('order_items exception handled:', itemErr);
    }
  }

  // 3. Immediately log status in order_status_history
  try {
    await supabase.from('order_status_history').insert([
      {
        id: `hist-${Date.now()}`,
        order_id: generatedId,
        status: 'preparing',
        notes: `Order placed. Delivery destination: ${deliveryLocation}`,
        created_by: 'Campus Student',
        created_at: now,
      },
    ]);
  } catch (histErr) {
    // Non-blocking
  }

  // 4. Maintain local cache so UI, LiveOrdersManager and Customer Orders list reflect it immediately
  const localOrder: AdminOrder = {
    id: generatedId,
    order_number: generatedId,
    customer_name: customerData.name,
    customer_phone: customerData.phone,
    delivery_zone: selectedZone,
    room_details: room,
    delivery_address: {
      fullName: customerData.name,
      phone: customerData.phone,
      area: selectedZone,
      roomNo: room,
      notes: customerData.notes || '',
    },
    items: cartItems.map((it) => ({
      id: it.id || 'item',
      name: it.title || it.name || 'Campus Item',
      quantity: it.quantity,
      price: it.price,
    })),
    total_amount: totalAmount,
    status: 'Preparing',
    payment_method: 'COD',
    created_at: now,
  };

  const local = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, [localOrder, ...local]);

  return { ...newOrder, id: generatedId, order_number: generatedId };
}

// Optimized Fast Checkout Function
export const handleQuickOrder = async ({
  cartItems,
  formData,
  totalAmount,
}: {
  cartItems: any[];
  formData: {
    fullName: string;
    phone: string;
    area: string;
    roomNo: string;
    notes?: string;
  };
  totalAmount: number;
}) => {
  const startTime = Date.now();

  // 1. Minimum payload banayein
  const orderPayload = {
    subtotal: totalAmount,
    delivery_fee: 0,
    discount: 0,
    total: totalAmount,
    status: 'pending',
    payment_method: 'COD',
    payment_status: 'pending',
    delivery_address: {
      fullName: formData.fullName,
      phone: formData.phone,
      area: formData.area,
      roomNo: formData.roomNo,
      notes: formData.notes || '',
    },
    created_at: new Date().toISOString(),
  };

  // 2. Direct single-roundtrip insert
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select('id, order_number')
    .single();

  if (orderError) throw orderError;

  // 3. Items ko parallel/bulk insert karein
  const itemsPayload = cartItems.map((item: any) => {
    const price = item.price !== undefined ? item.price : (item.product?.price ?? 0);
    const title = item.title || item.name || item.product?.name || 'Campus Item';
    const quantity = item.quantity || 1;
    return {
      order_id: order.id,
      product_name_snapshot: title,
      quantity,
      unit_price: price,
      subtotal: price * quantity,
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsPayload);

  if (itemsError) console.warn('Items sync delayed:', itemsError);

  // Maintain local state for instant LiveOrdersManager synchronization
  try {
    const localOrder: AdminOrder = {
      id: order.id,
      order_number: order.order_number || order.id,
      customer_name: formData.fullName,
      customer_phone: formData.phone,
      delivery_zone: formData.area,
      room_details: formData.roomNo,
      delivery_address: {
        fullName: formData.fullName,
        phone: formData.phone,
        area: formData.area,
        roomNo: formData.roomNo,
        notes: formData.notes || '',
      },
      items: cartItems.map((item: any) => ({
        id: item.id || item.product?.id || 'item',
        name: item.title || item.name || item.product?.name || 'Campus Item',
        quantity: item.quantity || 1,
        price: item.price !== undefined ? item.price : (item.product?.price ?? 0),
      })),
      total_amount: totalAmount,
      status: 'Pending',
      payment_method: 'Cash on Delivery',
      created_at: orderPayload.created_at,
    };
    const local = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    setLocal(LOCAL_STORAGE_KEYS.ORDERS, [localOrder, ...local]);
  } catch (syncErr) {
    console.warn('Local state sync notice:', syncErr);
  }

  console.log(`Order placed in ${Date.now() - startTime}ms`);
  return order;
};
