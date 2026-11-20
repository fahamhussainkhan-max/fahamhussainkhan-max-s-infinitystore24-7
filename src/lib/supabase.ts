import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdminOrder,
  AdminProduct,
  UserProfile,
  OrderStatusHistory,
  InventoryTransaction,
  OrderStatus,
  DeliveryAddress,
  Product,
  Category,
} from '../types';
import {
  PRODUCTS,
  CATEGORIES,
  CATEGORY_BANNER_IMAGE,
  CATEGORY_SPRITES,
  CATEGORY_DEFAULT_IMAGES,
  sortCategoriesInStorefrontOrder,
} from '../data/mockData';

import { sanitizeTextInput, normalizeIndianPhone } from '../utils/security';

/**
 * Detects whether an API key is a secret or service_role key.
 * Secret keys MUST NEVER be passed to client-side/browser fetch functions.
 */
export function isSecretApiKey(key: string | null | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_secret_')) return true;
  if (/service[_-]?role/i.test(trimmed)) return true;

  // Check if it's a JWT with role "service_role"
  if (trimmed.startsWith('eyJ') && trimmed.includes('.')) {
    try {
      const parts = trimmed.split('.');
      if (parts[1]) {
        const payloadStr =
          typeof atob === 'function'
            ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            : Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        if (payload?.role === 'service_role') return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Validates that an API key is a safe public/publishable/anon key for browser usage.
 */
export function isPublicApiKey(key: string | null | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (isSecretApiKey(trimmed)) return false;
  if (trimmed.startsWith('sb_publishable_')) return true;

  if (trimmed.startsWith('eyJ') && trimmed.includes('.')) {
    try {
      const parts = trimmed.split('.');
      if (parts[1]) {
        const payloadStr =
          typeof atob === 'function'
            ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            : Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        if (payload?.role === 'anon') return true;
      }
    } catch {}
  }

  return !trimmed.toLowerCase().includes('secret');
}

function resolveSupabaseUrl(): string {
  try {
    const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string)?.trim();
    if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
      const parsed = new URL(envUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return envUrl.replace(/\/$/, '');
      }
    }
  } catch {}
  return '';
}

function resolveSupabaseKey(): string {
  const envAnon = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string)?.trim();

  if (envAnon && isPublicApiKey(envAnon)) {
    return envAnon;
  }

  if (isSecretApiKey(envAnon)) {
    console.warn(
      '[Supabase Security] Secret/service_role keys are strictly forbidden in client env vars.'
    );
  }

  return '';
}

// Centralized Supabase credentials (strictly safe public VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)
export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_ANON_KEY = resolveSupabaseKey();
export const SUPABASE_PUBLISHABLE_KEY = SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  (SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://')) &&
  SUPABASE_ANON_KEY &&
  !isSecretApiKey(SUPABASE_ANON_KEY)
);

function createResilientSupabaseClient(): SupabaseClient<any, 'public', any> {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Public Supabase client credentials not configured in environment.');
    }
    return createClient<any, 'public', any>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 20, // Low-latency throughput
          },
        },
      }
    );
  } catch {
    const noOpBuilder: any = {
      select: () => noOpBuilder,
      insert: () => noOpBuilder,
      update: () => noOpBuilder,
      delete: () => noOpBuilder,
      upsert: () => noOpBuilder,
      eq: () => noOpBuilder,
      neq: () => noOpBuilder,
      in: () => noOpBuilder,
      gt: () => noOpBuilder,
      gte: () => noOpBuilder,
      lt: () => noOpBuilder,
      lte: () => noOpBuilder,
      ilike: () => noOpBuilder,
      like: () => noOpBuilder,
      is: () => noOpBuilder,
      match: () => noOpBuilder,
      range: () => noOpBuilder,
      or: () => noOpBuilder,
      order: () => noOpBuilder,
      limit: () => noOpBuilder,
      single: async () => ({ data: null, error: new Error('Offline fallback') }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    };

    const createNoOpChannel = () => {
      const noOpChannel: any = {
        on: () => noOpChannel,
        subscribe: () => noOpChannel,
        unsubscribe: async () => 'ok',
        send: async () => 'ok',
        track: async () => 'ok',
        untrack: async () => 'ok',
      };
      return noOpChannel;
    };

    return {
      from: () => noOpBuilder,
      rpc: async () => ({ data: null, error: new Error('Offline fallback') }),
      channel: () => createNoOpChannel(),
      removeChannel: async () => 'ok',
      removeAllChannels: async () => [],
      storage: {
        from: () => ({
          upload: async () => ({ error: new Error('Offline') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error('Supabase Auth is not configured in this environment.'),
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any;
  }
}

export const supabase: SupabaseClient<any, 'public', any> = createResilientSupabaseClient();

export interface AdminSessionUser {
  id?: string;
  email: string;
  role: string;
  name: string;
  authMethod?: 'passphrase' | 'supabase_jwt';
}

export const ADMIN_AUTH_REQUIRED_EVENT = 'infinity-admin-auth-required';

const ADMIN_SESSION_STORAGE_KEYS = {
  TOKEN: 'infinity_admin_session_token',
  USER: 'infinity_admin_session_user',
  EXPIRES_AT: 'infinity_admin_session_exp',
};

export function getStoredAdminToken(): string {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return '';
    const token = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEYS.TOKEN) || '';
    const expRaw = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEYS.EXPIRES_AT);
    if (!token) return '';
    if (expRaw) {
      const exp = Number(expRaw);
      if (Number.isFinite(exp) && Date.now() >= exp) {
        clearStoredAdminSession();
        return '';
      }
    }
    return token;
  } catch {
    return '';
  }
}

export function getStoredAdminSession(): {
  token: string;
  user: AdminSessionUser;
  expiresAt?: number;
} | null {
  try {
    const token = getStoredAdminToken();
    if (!token) return null;
    const rawUser = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEYS.USER);
    if (!rawUser) return null;
    const user = JSON.parse(rawUser) as AdminSessionUser;
    const expRaw = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEYS.EXPIRES_AT);
    return {
      token,
      user,
      expiresAt: expRaw ? Number(expRaw) : undefined,
    };
  } catch {
    return null;
  }
}

export function setStoredAdminSession(
  token: string,
  user: AdminSessionUser,
  expiresAt?: number
): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEYS.TOKEN, token);
    window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEYS.USER, JSON.stringify(user));
    if (expiresAt && Number.isFinite(expiresAt)) {
      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEYS.EXPIRES_AT);
    }
  } catch {}
}

export function clearStoredAdminSession(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEYS.TOKEN);
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEYS.USER);
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEYS.EXPIRES_AT);
  } catch {}
}

function notifyAdminAuthRequired(message: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(ADMIN_AUTH_REQUIRED_EVENT, {
          detail: { message },
        })
      );
    }
  } catch {}
}

/**
 * Unlocks the Admin / Management console by verifying the entered passphrase
 * against server-side process.env.ADMIN_BOOTSTRAP_SECRET via /api/admin-action.
 * Stores the short-lived HMAC-signed session token strictly in sessionStorage.
 */
export async function unlockAdminWithPassphrase(passphrase: string): Promise<{
  ok: boolean;
  token?: string;
  expiresAt?: number;
  user?: AdminSessionUser;
  error?: string;
}> {
  const trimmed = passphrase.trim();
  if (!trimmed) {
    return { ok: false, error: 'Please enter the admin unlock passphrase.' };
  }

  try {
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action: 'unlock_admin',
        payload: { passphrase: trimmed },
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: `Admin API endpoint (/api/admin-action) returned non-JSON response (${res.status}). Check server routing.`,
      };
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json?.token || !json?.user) {
      return {
        ok: false,
        error: json?.error || `Failed to unlock admin session (${res.status}).`,
      };
    }

    const sessionUser: AdminSessionUser = {
      id: json.user.id,
      email: json.user.email || 'ops@infinity.store',
      role: json.user.role || 'super_admin',
      name: json.user.name || 'Operations Admin',
      authMethod: 'passphrase',
    };

    setStoredAdminSession(json.token, sessionUser, json.expiresAt);
    return {
      ok: true,
      token: json.token,
      expiresAt: json.expiresAt,
      user: sessionUser,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error while contacting /api/admin-action.',
    };
  }
}

export async function verifyAdminToken(explicitToken?: string): Promise<{
  ok: boolean;
  user?: AdminSessionUser;
  expiresAt?: number;
  error?: string;
}> {
  const res = await invokeAdminAction<{
    authorized?: boolean;
    user?: AdminSessionUser;
    expiresAt?: number;
    authMethod?: 'passphrase' | 'supabase_jwt';
  }>('verify_admin', {}, explicitToken, { suppressAuthEvent: true });

  if (res.ok && res.data?.authorized && res.data.user) {
    return {
      ok: true,
      user: {
        ...res.data.user,
        authMethod: res.data.authMethod || res.data.user.authMethod,
      },
      expiresAt: res.data.expiresAt,
    };
  }

  return {
    ok: false,
    error: res.error || 'Admin session could not be verified.',
  };
}

/**
 * Helper to invoke privileged server-side route /api/admin-action
 * using either the short-lived signed sessionStorage token OR active Supabase Auth JWT.
 */
export async function invokeAdminAction<T = any>(
  action: string,
  payload: Record<string, any> = {},
  explicitAccessToken?: string,
  options?: { suppressAuthEvent?: boolean }
): Promise<{ ok: boolean; status: number; data: T | null; error?: string; endpointMissing?: boolean }> {
  try {
    let token = explicitAccessToken || getStoredAdminToken();
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || '';
    }
    if (!token) {
      const msg = 'Admin session locked. Please unlock with your admin passphrase.';
      if (!options?.suppressAuthEvent) {
        notifyAdminAuthRequired(msg);
      }
      return { ok: false, status: 401, data: null, error: msg };
    }

    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || (!contentType.includes('application/json') && res.status >= 400)) {
      return {
        ok: false,
        status: res.status,
        data: null,
        endpointMissing: true,
        error: `Admin API route (/api/admin-action) is unreachable (${res.status}).`,
      };
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const errMessage = json?.error || `Admin action "${action}" failed (HTTP ${res.status}).`;
      if (res.status === 401) {
        clearStoredAdminSession();
        if (!options?.suppressAuthEvent) {
          notifyAdminAuthRequired(errMessage);
        }
      }
      return {
        ok: false,
        status: res.status,
        data: json,
        error: errMessage,
      };
    }

    return { ok: true, status: res.status, data: json };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network error while connecting to /api/admin-action.',
    };
  }
}

export async function getStoreStatusAdmin(): Promise<{ ok: boolean; isOpen: boolean; error?: string }> {
  const apiRes = await invokeAdminAction<{ ok?: boolean; isOpen?: boolean }>('get_store_status');
  if (apiRes.ok && typeof apiRes.data?.isOpen === 'boolean') {
    return { ok: true, isOpen: apiRes.data.isOpen };
  }
  return { ok: false, isOpen: true, error: apiRes.error || 'Failed to read store status.' };
}

export async function toggleStoreStatus(
  isOpen: boolean
): Promise<{ ok: boolean; isOpen: boolean; error?: string }> {
  const apiRes = await invokeAdminAction<{ ok?: boolean; isOpen?: boolean }>('toggle_store_status', {
    isOpen,
  });
  if (apiRes.ok) {
    return { ok: true, isOpen };
  }
  return {
    ok: false,
    isOpen: !isOpen,
    error: apiRes.error || 'Failed to update store open/closed status.',
  };
}

// Local fallback store keys
const LOCAL_STORAGE_KEYS = {
  ORDERS: 'infinity_admin_orders',
  PRODUCTS: 'infinity_admin_products',
  CATEGORIES: 'infinity_cached_categories',
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
  } catch (e: any) {
    console.warn(`[LocalStorage] Failed to set ${key} (Quota check):`, e?.name || e);
    // QuotaExceededError handling: prune orders to last 5 lightweight records and clear stale caches
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
      try {
        if (key === LOCAL_STORAGE_KEYS.ORDERS && Array.isArray(data)) {
          const trimmed = data.slice(0, 5).map((o: any) => ({
            id: o.id || o.order_number,
            order_number: o.order_number || o.id,
            status: o.status || 'Pending',
            total_amount: o.total_amount || o.total,
            created_at: o.created_at,
          }));
          localStorage.setItem(key, JSON.stringify(trimmed));
          return;
        }
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ORDER_HISTORY);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.INVENTORY_TX);
        localStorage.setItem(key, JSON.stringify(data));
      } catch (pruneErr) {
        console.warn(`[LocalStorage] Eviction recovery notice for ${key}`);
      }
    }
  }
}

/* ============================================================
   1. DASHBOARD & AGGREGATED METRICS
   ============================================================ */
function mapRawAdminProduct(item: any): AdminProduct {
  const stock = Number(item.stock_quantity ?? item.stock_count ?? item.stockCount ?? 0);
  const name = item.title || item.name || 'Campus Product';
  const img =
    item.image_url ||
    item.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
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
    in_stock: Boolean(item.in_stock ?? stock > 0),
    is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
    is_popular: Boolean(item.is_popular),
    is_late_night: Boolean(item.is_late_night),
    is_flash_deal: Boolean(item.is_flash_deal),
    created_at: item.created_at || new Date().toISOString(),
  };
}

export async function fetchDashboardMetrics() {
  const apiRes = await invokeAdminAction<{
    ordersCount: number;
    totalRevenue: number;
    activeOrdersCount: number;
    productsCount: number;
    lowStockCount: number;
    profilesCount: number;
    recentOrders: any[];
    isLiveSupabase: boolean;
  }>('get_dashboard_metrics');

  if (!apiRes.ok || !apiRes.data) {
    throw new Error(
      apiRes.error || 'Failed to load dashboard analytics from /api/admin-action.'
    );
  }

  return {
    ordersCount: Number(apiRes.data.ordersCount || 0),
    totalRevenue: Number(apiRes.data.totalRevenue || 0),
    activeOrdersCount: Number(apiRes.data.activeOrdersCount || 0),
    productsCount: Number(apiRes.data.productsCount || 0),
    lowStockCount: Number(apiRes.data.lowStockCount || 0),
    profilesCount: Number(apiRes.data.profilesCount || 0),
    recentOrders: Array.isArray(apiRes.data.recentOrders)
      ? apiRes.data.recentOrders.map(mapRawOrderRow)
      : [],
    isLiveSupabase: Boolean(apiRes.data.isLiveSupabase),
  };
}

/**
 * Privileged product catalog fetch for Admin & Management Panels.
 * Routes strictly through /api/admin-action using SUPABASE_SERVICE_ROLE_KEY.
 */
export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const apiRes = await invokeAdminAction<{ products?: any[] }>('list_products');
  if (!apiRes.ok || !Array.isArray(apiRes.data?.products)) {
    throw new Error(
      apiRes.error || 'Failed to load products catalog from /api/admin-action.'
    );
  }
  const mapped = apiRes.data.products.map(mapRawAdminProduct);
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, mapped);
  return mapped;
}

/* ============================================================
   2. PRODUCTS CRUD WITH SUPABASE & IMAGE BUCKET
   ============================================================ */
export async function fetchProducts(onlyActive = true): Promise<AdminProduct[]> {
  // 1. Try secure backend endpoint /api/products if accessible
  try {
    const apiRes = await fetch('/api/products', { headers: { Accept: 'application/json' } });
    if (apiRes.ok) {
      const json = await apiRes.json();
      const rawProducts = json.products || json.data || (Array.isArray(json) ? json : null);
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        let filtered = rawProducts;
        if (onlyActive) {
          filtered = rawProducts.filter((p: any) => p.is_active !== false);
        }
        const mapped: AdminProduct[] = (filtered.length > 0 ? filtered : rawProducts).map((item) => {
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
        setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, mapped);
        return mapped;
      }
    }
  } catch {}

  // 2. Direct client fetch using verified public/anon key (SUPABASE_ANON_KEY)
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

/**
 * Maps raw Supabase category records into typed Category with resilient defaults
 */
export function mapStorefrontCategory(item: any, fallbackIndex: number = 0): Category {
  const rawId = item.id || item.slug || `cat-${fallbackIndex}`;
  const safeId = String(rawId).toLowerCase().trim();

  // Find matching default mock category for rich fallback visual styling
  const mockMatch = CATEGORIES.find((c) => {
    if (c.id.toLowerCase() === safeId || (c.slug && c.slug.toLowerCase() === safeId)) return true;
    const cNorm = c.id.toLowerCase().replace(/['\s_-]/g, '');
    const itemNorm = (item.name || item.title || safeId).toLowerCase().replace(/['\s_-]/g, '');
    return cNorm === itemNorm || itemNorm.includes(cNorm) || cNorm.includes(itemNorm);
  });

  const name = item.name || item.title || mockMatch?.name || 'Campus Category';
  const emoji = item.emoji || mockMatch?.emoji || '📦';
  const accentColor = item.accent_color || item.accentColor || mockMatch?.accentColor || '#0A84FF';
  const bgGradient =
    item.bg_gradient ||
    item.bgGradient ||
    mockMatch?.bgGradient ||
    'from-blue-500/10 via-cyan-500/10 to-sky-500/10 border-blue-200/80';
  const textColor = item.text_color || item.textColor || mockMatch?.textColor || 'text-blue-800';
  const defaultImg =
    CATEGORY_DEFAULT_IMAGES[safeId] ||
    mockMatch?.image ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  let image = item.image_url || item.image || defaultImg;
  if (!image || image === CATEGORY_BANNER_IMAGE || image.includes('categories-banner.png')) {
    image = defaultImg;
  }
  const description = item.description || mockMatch?.description || '';
  const itemCount = Number(item.item_count ?? item.itemCount ?? (mockMatch?.itemCount ?? 10));

  const spritePos =
    item.sprite_position ||
    item.spritePosition ||
    mockMatch?.spritePosition ||
    CATEGORY_SPRITES[safeId]?.backgroundPosition;
  const spriteSize =
    item.sprite_size ||
    item.spriteSize ||
    mockMatch?.spriteSize ||
    CATEGORY_SPRITES[safeId]?.backgroundSize;

  return {
    ...item,
    id: safeId,
    name,
    emoji,
    accentColor,
    bgGradient,
    textColor,
    image,
    description,
    itemCount,
    slug: item.slug || safeId,
    spritePosition: spritePos,
    spriteSize: spriteSize,
  };
}

/**
 * Fetches categories from Supabase with graceful fallback to cached or mockData CATEGORIES
 */
export async function fetchStorefrontCategories(): Promise<Category[]> {
  // 1. Try secure backend endpoint /api/categories if accessible
  try {
    const apiRes = await fetch('/api/categories', { headers: { Accept: 'application/json' } });
    if (apiRes.ok) {
      const json = await apiRes.json();
      const rawCategories = json.categories || json.data || (Array.isArray(json) ? json : null);
      if (Array.isArray(rawCategories) && rawCategories.length > 0) {
        const mapped = sortCategoriesInStorefrontOrder(
          rawCategories.map((item, idx) => mapStorefrontCategory(item, idx))
        );
        setLocal(LOCAL_STORAGE_KEYS.CATEGORIES, mapped);
        return mapped;
      }
    }
  } catch {}

  // 2. Direct client fetch using verified public/anon key (SUPABASE_ANON_KEY)
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.warn('[Supabase] Categories query notice:', error.message);
    } else if (Array.isArray(data) && data.length > 0) {
      const mapped = sortCategoriesInStorefrontOrder(
        data.map((item, idx) => mapStorefrontCategory(item, idx))
      );
      setLocal(LOCAL_STORAGE_KEYS.CATEGORIES, mapped);
      return mapped;
    }
  } catch (err: any) {
    console.warn('[Supabase] Categories fetch error, using fallback:', err?.message || err);
  }

  // Graceful fallback to cached categories or mockData CATEGORIES
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortCategoriesInStorefrontOrder(
          parsed.map((item, idx) => mapStorefrontCategory(item, idx))
        );
      }
    }
  } catch {}

  return sortCategoriesInStorefrontOrder(CATEGORIES);
}

export const fetchCategories = fetchStorefrontCategories;

/**
 * Maps raw Supabase product rows into customer-ready Product objects
 */
export function mapStorefrontProduct(item: any, fallbackIndex: number = 0): Product {
  const rawCat = (item.category || '').toLowerCase().trim();
  let category = item.category || rawCat;
  if (rawCat === 'beverages' || rawCat === 'drink' || rawCat === 'drinks') category = 'drinks';
  else if (rawCat === 'food' || rawCat === 'munchies' || rawCat === 'snacks') category = 'snacks';
  else if (rawCat === 'study' || rawCat === 'pens' || rawCat === 'stationery') category = 'stationery';
  else if (rawCat === 'tech' || rawCat === 'gadgets' || rawCat === 'electronics') category = 'electronics';
  else if (
    rawCat === 'womens-care' ||
    rawCat === "women's care" ||
    rawCat === 'womenscare' ||
    rawCat === 'women' ||
    rawCat.includes('women') ||
    rawCat === 'sanitary'
  ) {
    category = 'womens-care';
  }
  if (!category) category = 'snacks';

  const stock = Number(item.stock ?? item.stock_quantity ?? item.stock_count ?? 10);
  const price = Number(item.price || 0);
  const originalPrice = item.original_price
    ? Number(item.original_price)
    : item.originalPrice
    ? Number(item.originalPrice)
    : undefined;
  const discount =
    originalPrice && originalPrice > price
      ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
      : undefined;
  const image =
    item.image_url ||
    item.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

  const safeId = item?.id ? String(item.id) : (item?.slug ? String(item.slug) : `product-${fallbackIndex}`);

  return {
    ...item,
    id: safeId,
    name: item.name || item.title || 'Campus Item',
    category,
    price,
    originalPrice,
    discount,
    rating: item.rating || 4.8,
    reviewsCount: item.reviewsCount || 118,
    image,
    image_url: image,
    inStock: item.in_stock !== undefined ? Boolean(item.in_stock && stock > 0) : stock > 0,
    isActive: item.is_active !== undefined ? item.is_active : true,
    stockCount: stock,
    stock: stock,
    isPopular: item.is_popular !== undefined ? item.is_popular : true,
    isLateNight: Boolean(item.is_late_night),
    isFlashDeal: Boolean(discount) || Boolean(item.is_flash_deal),
    unit: item.unit || '1 pc',
    description: item.description || '',
    tags: item.tags || [category],
  };
}

/**
 * Fetches active storefront products with live Supabase priority and cached fallback
 */
export async function fetchStorefrontProducts(): Promise<Product[]> {
  // 1. Try secure backend endpoint /api/products if accessible
  try {
    const apiRes = await fetch('/api/products', { headers: { Accept: 'application/json' } });
    if (apiRes.ok) {
      const json = await apiRes.json();
      const rawProducts = json.products || json.data || (Array.isArray(json) ? json : null);
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
        const mapped = rawProducts.map((item, idx) => mapStorefrontProduct(item, idx));
        setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, mapped);
        return mapped;
      }
    }
  } catch {}

  // 2. Direct client fetch using verified public/anon key (SUPABASE_ANON_KEY)
  try {
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Products query with is_active notice, trying all products:', error.message);
      const fallback = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
        data = fallback.data;
        error = null;
      }
    }

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((item, idx) => mapStorefrontProduct(item, idx));
      setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, mapped);
      return mapped;
    }
  } catch (err: any) {
    console.warn('[Supabase] Storefront products fetch error, using fallback:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => mapStorefrontProduct(item, idx));
      }
    }
  } catch {}

  return PRODUCTS;
}

/**
 * Realtime subscription for 'categories' table
 */
export function subscribeToCategoriesRealtime(
  onInsert?: (cat: Category) => void,
  onUpdate?: (cat: Category) => void,
  onDelete?: (id: string) => void,
  onChange?: () => void
) {
  const channel = supabase
    .channel('public:categories:realtime-global')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'categories' },
      (payload) => {
        if (payload.new && onInsert) {
          onInsert(mapStorefrontCategory(payload.new));
        }
        onChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'categories' },
      (payload) => {
        if (payload.new && onUpdate) {
          onUpdate(mapStorefrontCategory(payload.new));
        }
        onChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'categories' },
      (payload) => {
        if (payload.old?.id && onDelete) {
          onDelete(String(payload.old.id));
        }
        onChange?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Realtime subscription for 'products' table
 */
export function subscribeToProductsRealtime(
  onInsert?: (product: Product) => void,
  onUpdate?: (product: Product) => void,
  onDelete?: (id: string) => void,
  onChange?: () => void
) {
  const channel = supabase
    .channel('public:products:realtime-global')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.new && onInsert) {
          onInsert(mapStorefrontProduct(payload.new));
        }
        onChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.new && onUpdate) {
          onUpdate(mapStorefrontProduct(payload.new));
        }
        onChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.old?.id && onDelete) {
          onDelete(String(payload.old.id));
        }
        onChange?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createProduct(product: Omit<AdminProduct, 'id' | 'created_at'>): Promise<AdminProduct> {
  const sanitizedName = sanitizeTextInput(product.name || '', 120);
  const sanitizedCategory = sanitizeTextInput(product.category || 'snacks', 60);
  const sanitizedUnit = sanitizeTextInput(product.unit || '1 pc', 40);
  const sanitizedDesc = sanitizeTextInput(product.description || '', 500);

  const apiRes = await invokeAdminAction<{ ok?: boolean; product?: any }>('create_product', {
    ...product,
    name: sanitizedName || 'Campus Item',
    category: sanitizedCategory || 'snacks',
    unit: sanitizedUnit || '1 pc',
    description: sanitizedDesc,
    in_stock: Number(product.stock_count || 0) > 0,
  });

  if (!apiRes.ok || !apiRes.data?.product) {
    throw new Error(apiRes.error || 'Failed to create product via /api/admin-action.');
  }

  const created = mapRawAdminProduct(apiRes.data.product);
  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, [created, ...local.filter((p) => p.id !== created.id)]);
  return created;
}

export async function updateProduct(
  id: string,
  updates: Partial<AdminProduct>
): Promise<AdminProduct> {
  const payload: Record<string, any> = { id };
  if (updates.name !== undefined) payload.name = sanitizeTextInput(updates.name, 120);
  if (updates.category !== undefined) payload.category = sanitizeTextInput(updates.category, 60);
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.original_price !== undefined) payload.original_price = Number(updates.original_price);
  if (updates.stock_count !== undefined) payload.stock_count = Number(updates.stock_count);
  if (updates.low_stock_threshold !== undefined) {
    payload.low_stock_threshold = Number(updates.low_stock_threshold);
  }
  if (updates.image !== undefined) payload.image = updates.image;
  if (updates.unit !== undefined) payload.unit = sanitizeTextInput(updates.unit, 40);
  if (updates.description !== undefined) {
    payload.description = sanitizeTextInput(updates.description, 500);
  }
  if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
  if (updates.is_popular !== undefined) payload.is_popular = Boolean(updates.is_popular);
  if (updates.is_late_night !== undefined) payload.is_late_night = Boolean(updates.is_late_night);
  if (updates.is_flash_deal !== undefined) payload.is_flash_deal = Boolean(updates.is_flash_deal);

  const apiRes = await invokeAdminAction<{ ok?: boolean; product?: any }>('update_product', payload);
  if (!apiRes.ok || !apiRes.data?.product) {
    throw new Error(apiRes.error || 'Failed to update product via /api/admin-action.');
  }

  const updated = mapRawAdminProduct(apiRes.data.product);
  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  setLocal(
    LOCAL_STORAGE_KEYS.PRODUCTS,
    local.some((p) => p.id === id)
      ? local.map((p) => (p.id === id ? updated : p))
      : [updated, ...local]
  );
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const apiRes = await invokeAdminAction<{ ok?: boolean }>('delete_product', { id });
  if (!apiRes.ok) {
    throw new Error(apiRes.error || 'Failed to delete product via /api/admin-action.');
  }

  const local = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  setLocal(
    LOCAL_STORAGE_KEYS.PRODUCTS,
    local.filter((p) => p.id !== id)
  );
  return true;
}

/**
 * Image upload routed through /api/admin-action (server-side service role) so
 * passphrase-authenticated admins can upload to 'product-images' bucket cleanly.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });

  const apiRes = await invokeAdminAction<{ ok?: boolean; publicUrl?: string }>(
    'upload_product_image',
    {
      dataUrl,
      fileName: file.name,
      contentType: file.type,
    }
  );

  if (apiRes.ok && apiRes.data?.publicUrl) {
    return apiRes.data.publicUrl;
  }

  // Fallback to inline DataURL only if storage bucket isn't configured yet
  return dataUrl;
}

/* ============================================================
   3. ORDERS MANAGEMENT WITH REALTIME & STATUS PROGRESSION
   ============================================================ */
function mapRawOrderRow(o: any): AdminOrder {
  const delLoc = o.delivery_location || '';
  const zoneMatch = delLoc.split(',')[0]?.trim() || o.delivery_zone || 'Academic Complex & Main Campus';
  const roomMatch = delLoc.split(',').slice(1).join(',').trim() || o.room_details || '';

  let resolvedItems = Array.isArray(o.items) && o.items.length > 0 ? o.items : [];
  if ((!resolvedItems || resolvedItems.length === 0) && Array.isArray(o.order_items)) {
    resolvedItems = o.order_items.map((oi: any) => ({
      id: oi.id || oi.product_id || 'item',
      name: oi.product_name_snapshot || oi.product_name || oi.name || 'Campus Item',
      price: Number(oi.price_snapshot ?? oi.price ?? oi.unit_price ?? 0),
      quantity: Number(oi.quantity || 1),
      image_url: oi.image_url || '',
    }));
  }

  return {
    id: o.id,
    order_number: o.order_number || o.id,
    customer_name:
      o.customer_name || (typeof o.delivery_address === 'object' && o.delivery_address?.fullName) || 'Campus Student',
    customer_phone:
      o.customer_phone || o.phone || (typeof o.delivery_address === 'object' && o.delivery_address?.phone) || '',
    customer_id: o.customer_id,
    delivery_zone: o.delivery_zone || zoneMatch,
    room_details: o.room_details || roomMatch || 'Hostel Room',
    delivery_address:
      typeof o.delivery_address === 'object' && o.delivery_address !== null
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
}

/**
 * Secure single-order lookup requiring exact Order ID + 10-digit Phone match via RPC.
 * Prevents enumeration/dumping of other students' personal delivery details.
 */
export async function lookupCustomerOrderSecure(
  orderId: string,
  phone: string
): Promise<AdminOrder | null> {
  const cleanId = sanitizeTextInput(orderId, 80).replace(/^#/, '');
  const cleanPhone = normalizeIndianPhone(phone);

  if (!cleanId || cleanPhone.length !== 10) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_customer_order_secure', {
      p_order_id: cleanId,
      p_phone: cleanPhone,
    });

    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row && typeof row === 'object' && row.id) {
      return {
        id: String(row.id || cleanId),
        order_number: String(row.order_number || row.id || cleanId),
        customer_name: String(row.customer_name || 'Campus Student'),
        customer_phone: cleanPhone,
        delivery_zone: String(row.delivery_zone || 'Campus Zone'),
        room_details: String(row.room_details || 'Campus Drop'),
        items: Array.isArray(row.items) ? row.items : [],
        total_amount: Number(row.total_amount ?? 0),
        status: (row.status as OrderStatus) || 'Pending',
        payment_method: String(row.payment_method || 'COD'),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at,
      };
    }
  } catch {}

  // Fallback check against this browser's own locally cached orders matching both ID & Phone
  const local = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const match = local.find((o) => {
    const oPhone = normalizeIndianPhone(o.customer_phone || o.delivery_address?.phone || '');
    const idMatches =
      o.id.toLowerCase() === cleanId.toLowerCase() ||
      (o.order_number || '').toLowerCase() === cleanId.toLowerCase();
    return idMatches && oPhone === cleanPhone;
  });

  return match || null;
}

/**
 * Fetches orders belonging ONLY to the current browser session (from local history)
 * or via authenticated admin route when in the Admin Console.
 */
export async function fetchMyRecentOrders(): Promise<AdminOrder[]> {
  try {
    const localOrders = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    const verifiedPhone = normalizeIndianPhone(localStorage.getItem('infinity_user_phone') || '');
    const savedIdsRaw = localStorage.getItem('infinity_orders');
    const savedSummaries = savedIdsRaw ? JSON.parse(savedIdsRaw) : [];
    const ownIds = new Set<string>(
      Array.isArray(savedSummaries)
        ? savedSummaries.map((s: any) => String(s?.id || s?.order_id || '').toLowerCase()).filter(Boolean)
        : []
    );

    return localOrders.filter((o) => {
      const idMatch =
        ownIds.has(String(o.id || '').toLowerCase()) ||
        ownIds.has(String(o.order_number || '').toLowerCase());
      const phoneMatch =
        verifiedPhone.length === 10 &&
        normalizeIndianPhone(o.customer_phone || o.delivery_address?.phone || '') === verifiedPhone;
      return idMatch || phoneMatch;
    });
  } catch {
    return [];
  }
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  const apiRes = await invokeAdminAction<{ orders?: any[] }>('list_orders', { limit: 250 });
  if (!apiRes.ok || !Array.isArray(apiRes.data?.orders)) {
    throw new Error(apiRes.error || 'Failed to load orders from /api/admin-action.');
  }

  const mapped = apiRes.data.orders.map(mapRawOrderRow);
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, mapped);
  return mapped;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<AdminOrder> {
  const cleanNotes = sanitizeTextInput(notes || `Status updated to ${newStatus}`, 240);
  const apiRes = await invokeAdminAction<{ ok?: boolean; order?: any }>('update_order_status', {
    orderId,
    newStatus,
    notes: cleanNotes,
  });

  if (!apiRes.ok) {
    throw new Error(apiRes.error || 'Failed to update order status via /api/admin-action.');
  }

  const now = new Date().toISOString();
  const mappedOrder: AdminOrder = apiRes.data?.order
    ? mapRawOrderRow(apiRes.data.order)
    : ({
        id: orderId,
        order_number: orderId,
        customer_name: 'Campus Student',
        customer_phone: '',
        delivery_zone: '',
        room_details: '',
        items: [],
        total_amount: 0,
        status: newStatus,
        payment_method: 'COD',
        created_at: now,
        updated_at: now,
      } as AdminOrder);

  const localOrders = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  setLocal(
    LOCAL_STORAGE_KEYS.ORDERS,
    localOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: now } : o))
  );

  return mappedOrder;
}

export async function fetchOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
  const apiRes = await invokeAdminAction<{ history?: OrderStatusHistory[] }>('list_order_history', {
    orderId,
  });
  if (!apiRes.ok) {
    throw new Error(apiRes.error || 'Failed to load order status history via /api/admin-action.');
  }
  return Array.isArray(apiRes.data?.history) ? apiRes.data.history : [];
}

/**
 * Live order monitor for Admin panels:
 * Uses secure polling via /api/admin-action (never unauthenticated client-side orders SELECT)
 * so new orders & status changes sync cleanly even under strict RLS.
 */
export function subscribeToOrders(
  onInsert: (order: AdminOrder) => void,
  onUpdate: (order: AdminOrder) => void,
  pollIntervalMs: number = 15000
) {
  let active = true;
  let initialized = false;
  const knownStatuses = new Map<string, string>();

  const syncOnce = async () => {
    if (!active) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (!getStoredAdminToken()) {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.access_token) return;
    }

    try {
      const latest = await fetchOrders();
      if (!active) return;

      if (!initialized) {
        for (const o of latest) {
          knownStatuses.set(o.id, String(o.status || ''));
        }
        initialized = true;
        return;
      }

      for (const o of latest) {
        const prevStatus = knownStatuses.get(o.id);
        const currentStatus = String(o.status || '');
        if (prevStatus === undefined) {
          knownStatuses.set(o.id, currentStatus);
          onInsert(o);
        } else if (prevStatus !== currentStatus) {
          knownStatuses.set(o.id, currentStatus);
          onUpdate(o);
        }
      }
    } catch {
      // Errors are surfaced by explicit component loads; background poll stays silent
    }
  };

  syncOnce();
  const timer = setInterval(syncOnce, pollIntervalMs);

  return () => {
    active = false;
    clearInterval(timer);
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
  const cleanNotes = sanitizeTextInput(notes || `${reason} of ${Math.abs(changeAmount)} units`, 240);

  const apiRes = await invokeAdminAction<{
    ok?: boolean;
    previousStock?: number;
    newStock?: number;
    product?: any;
    transaction?: InventoryTransaction;
  }>('adjust_inventory', { productId, changeAmount, reason, notes: cleanNotes });

  if (!apiRes.ok || typeof apiRes.data?.newStock !== 'number') {
    throw new Error(apiRes.error || 'Failed to adjust inventory stock via /api/admin-action.');
  }

  const newStock = Number(apiRes.data.newStock);
  const updatedProduct = apiRes.data.product ? mapRawAdminProduct(apiRes.data.product) : null;

  const localProducts = getLocal<AdminProduct[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  if (updatedProduct) {
    setLocal(
      LOCAL_STORAGE_KEYS.PRODUCTS,
      localProducts.some((p) => p.id === productId)
        ? localProducts.map((p) => (p.id === productId ? updatedProduct : p))
        : [updatedProduct, ...localProducts]
    );
  }

  return {
    product: updatedProduct,
    transaction: apiRes.data.transaction || null,
    newStock,
  };
}

export async function fetchInventoryTransactions(productId?: string): Promise<InventoryTransaction[]> {
  const apiRes = await invokeAdminAction<{ transactions?: InventoryTransaction[] }>(
    'list_inventory_transactions',
    productId ? { productId } : {}
  );
  if (!apiRes.ok) {
    throw new Error(
      apiRes.error || 'Failed to load inventory transactions via /api/admin-action.'
    );
  }
  return Array.isArray(apiRes.data?.transactions) ? apiRes.data.transactions : [];
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

/**
 * Automatically saves verified WhatsApp user information to Supabase database.
 * Captures Full Name, WhatsApp phone, and generated campus identifier.
 */
export async function syncUserProfileToSupabase(
  userId: string,
  fullName: string,
  email: string,
  avatarUrl: string,
  phone?: string
): Promise<boolean> {
  try {
    const profilePayload = {
      id: userId,
      full_name: fullName,
      email: email,
      avatar_url: avatarUrl,
      phone: phone || '',
      role: 'student',
      updated_at: new Date().toISOString(),
    };

    // 1. Persist to Supabase profiles table
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert([profilePayload], { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase] Profile sync warning (profiles):', error.message);
      } else {
        console.log('[Supabase] Successfully synchronized user profile to profiles table');
      }
    } catch (e: any) {
      console.warn('[Supabase] Profiles table upsert exception:', e?.message || e);
    }

    // 2. Also attempt users table if defined in schema
    try {
      await supabase.from('users').upsert(
        [
          {
            id: userId,
            full_name: fullName,
            email: email,
            avatar_url: avatarUrl,
            phone: phone || '',
            role: 'student',
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      );
    } catch {}

    // 3. Keep local storage cache in sync for instant offline and fast-render resilience
    try {
      const existing = getLocal<UserProfile[]>(LOCAL_STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
      const idx = existing.findIndex((p) => p.id === userId);
      const userProfileObj: UserProfile = {
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone || '',
        role: 'student',
        created_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...userProfileObj };
      } else {
        existing.unshift(userProfileObj);
      }
      setLocal(LOCAL_STORAGE_KEYS.PROFILES, existing);
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Supabase] Profile sync exception:', err);
    return false;
  }
}

/* ============================================================
   5. SEED INITIAL SUPABASE DATA (1-CLICK HELPER)
   ============================================================ */
export async function seedSupabaseDemoData(): Promise<{ success: boolean; message: string }> {
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

  const ordersToInsert = DEFAULT_ORDERS.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    delivery_address: {
      fullName: o.customer_name,
      phone: o.customer_phone,
      area: o.delivery_zone,
      roomNo: o.room_details,
    },
    items: o.items,
    total_amount: o.total_amount,
    status: o.status,
    payment_method: o.payment_method,
    created_at: o.created_at,
  }));

  const apiRes = await invokeAdminAction<{ ok?: boolean; message?: string }>('seed_demo_data', {
    products: productsToInsert,
    orders: ordersToInsert,
  });

  if (!apiRes.ok) {
    return {
      success: false,
      message: apiRes.error || 'Failed to seed campus data via /api/admin-action.',
    };
  }

  return {
    success: true,
    message: apiRes.data?.message || 'Successfully seeded campus data to Supabase!',
  };
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
  handlingFee?: number;
  deliveryFee?: number;
  promoCode?: string;
}) {
  const orderId = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();

  const sanitizedName = sanitizeTextInput(orderData.customerName || orderData.deliveryAddress?.fullName || 'Campus Student', 100) || 'Campus Student';
  const sanitizedPhone = normalizeIndianPhone(orderData.studentPhone || orderData.deliveryAddress?.phone || '');
  const sanitizedZone = sanitizeTextInput(orderData.deliveryZone || orderData.deliveryAddress?.area || 'Campus', 120) || 'Campus';
  const sanitizedRoom = sanitizeTextInput(orderData.roomDetails || orderData.deliveryAddress?.roomNo || '', 120);
  const sanitizedNotes = sanitizeTextInput(orderData.deliveryAddress?.notes || '', 240);

  const deliveryAddress: DeliveryAddress = {
    fullName: sanitizedName,
    phone: sanitizedPhone,
    area: sanitizedZone,
    roomNo: sanitizedRoom,
    notes: sanitizedNotes || undefined,
  };

  const fullOrder: AdminOrder = {
    id: orderId,
    order_number: orderId,
    customer_name: sanitizedName,
    customer_phone: sanitizedPhone,
    delivery_zone: sanitizedZone,
    room_details: sanitizedRoom,
    delivery_address: deliveryAddress,
    items: orderData.items.map((it) => ({
      ...it,
      name: sanitizeTextInput(it.name || 'Campus Item', 120),
    })),
    total_amount: orderData.total,
    status: 'Pending',
    payment_method: sanitizeTextInput(orderData.paymentMethod || 'Cash on Delivery', 40) || 'Cash on Delivery',
    created_at: timestamp,
  };

  // 1. Try Supabase insert
  try {
    const subtotal = orderData.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
    const baseDelivery = 15; // 50% Launch Offer discount (standard was 30)
    const baseHandling = 9;

    let defaultDelivery = baseDelivery;
    let defaultHandling = baseHandling;
    if (subtotal >= 500) {
      defaultDelivery = 0;
      defaultHandling = 0;
    } else if (subtotal >= 200) {
      defaultHandling = 0;
      defaultDelivery = baseDelivery;
    }

    const handlingFee = orderData.handlingFee !== undefined ? Number(orderData.handlingFee) : defaultHandling;
    const deliveryFee = orderData.deliveryFee !== undefined ? Number(orderData.deliveryFee) : defaultDelivery;
    const total = Number(fullOrder.total_amount || (subtotal + deliveryFee + handlingFee)) || 0;
    const subtotalVal = Number(subtotal) || 0;
    const totalVal = Number(total) || 0;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          total: totalVal || 0,
          subtotal: subtotalVal || 0,
          total_amount: totalVal || 0,
          delivery_fee: deliveryFee,
          handling_fee: handlingFee,
          items: orderData.items || [],
          customer_name: fullOrder.customer_name,
          customer_phone: fullOrder.customer_phone,
          delivery_address: fullOrder.delivery_address || {
            fullName: fullOrder.customer_name,
            phone: fullOrder.customer_phone,
            area: fullOrder.delivery_zone,
            roomNo: fullOrder.room_details,
          },
          status: 'pending',
          payment_method: fullOrder.payment_method || 'COD',
          delivery_zone: fullOrder.delivery_zone || 'Campus',
          campus_location: fullOrder.room_details ? `${fullOrder.delivery_zone} - Room: ${fullOrder.room_details}` : (fullOrder.delivery_zone || 'Campus'),
          delivery_note: typeof fullOrder.delivery_address === 'object' ? (fullOrder.delivery_address?.notes || '') : '',
          is_whatsapp_verified: true,
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

  // Wrap localStorage.setItem('infinity_orders', ...) in a try-catch block and limit stored history to the 5 most recent orders
  try {
    let existingOrders: any[] = [];
    try {
      const rawStored = localStorage.getItem('infinity_orders');
      if (rawStored) existingOrders = JSON.parse(rawStored);
    } catch {
      existingOrders = [];
    }

    const sanitizedExisting = (Array.isArray(existingOrders) ? existingOrders : [])
      .filter((o: any) => o && (o.id || o.order_id) && o.id !== orderId && o.order_id !== orderId)
      .slice(0, 4)
      .map((o: any) => ({
        id: String(o.id || o.order_id || 'INF-ORD'),
        order_id: String(o.order_id || o.id || 'INF-ORD'),
        timestamp: String(o.timestamp || o.created_at || new Date().toISOString()),
        total: Number(o.total || o.total_amount || 0),
      }));

    const currentOrderSummary = {
      id: orderId,
      order_id: orderId,
      timestamp,
      total: Number(fullOrder.total_amount || 0),
    };

    const trimmedOrders = [currentOrderSummary, ...sanitizedExisting].slice(0, 5);
    try {
      localStorage.setItem('infinity_orders', JSON.stringify(trimmedOrders));
    } catch (quotaErr) {
      try {
        localStorage.removeItem('infinity_orders');
        localStorage.setItem('infinity_orders', JSON.stringify([currentOrderSummary]));
      } catch {}
    }
  } catch {}

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
  const selectedZone = sanitizeTextInput(customerData.zone || customerData.area || 'Academic Complex & Main Campus', 120) || 'Academic Complex & Main Campus';
  const room = sanitizeTextInput(customerData.room || customerData.roomNo || '', 120);
  const cleanName = sanitizeTextInput(customerData.name || 'Campus Student', 100) || 'Campus Student';
  const cleanPhone = normalizeIndianPhone(customerData.phone || '');
  const cleanNotes = sanitizeTextInput(customerData.notes || '', 240);
  const deliveryLocation = room ? `${selectedZone} (Room ${room})` : selectedZone;
  const orderId = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  // 1. Explicit Payload Calculation & Validation
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const baseDelivery = 15; // 50% Launch Offer discount (standard was 30)
  const baseHandling = 9;

  let deliveryFee = baseDelivery;
  let handlingFee = baseHandling;

  if (subtotal >= 500) {
    deliveryFee = 0;
    handlingFee = 0;
  } else if (subtotal >= 200) {
    handlingFee = 0;
    deliveryFee = baseDelivery;
  }

  const total = Number(totalAmount || (subtotal + deliveryFee + handlingFee)) || 0;
  const subtotalVal = Number(subtotal) || 0;
  const totalVal = Number(total) || 0;

  const itemsJSON = cartItems.map((it) => ({
    id: it.id || 'item',
    product_id: it.id || 'item',
    name: sanitizeTextInput(it.title || it.name || 'Campus Item', 120),
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    subtotal: Number(it.price || 0) * Number(it.quantity || 1),
  }));

  const deliveryAddress = {
    fullName: cleanName,
    phone: cleanPhone,
    area: selectedZone,
    roomNo: room,
    notes: cleanNotes,
  };

  // Pass both numeric values in the Supabase payload:
  const orderPayload: any = {
    total: totalVal || 0,
    subtotal: subtotalVal || 0,
    total_amount: totalVal || 0,
    delivery_fee: deliveryFee,
    handling_fee: handlingFee,
    items: itemsJSON || [],
    customer_name: cleanName,
    customer_phone: cleanPhone,
    delivery_address: deliveryAddress,
    status: 'pending',
    payment_method: 'COD',
    delivery_zone: selectedZone,
    campus_location: deliveryLocation,
    delivery_note: cleanNotes,
    is_whatsapp_verified: true,
  };

  let newOrder: any = null;
  const { data, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select()
    .single();

  if (orderError) {
    console.warn('Orders insert notice, retrying with core schema fallback:', orderError.message);
    // Fallback retry function: make sure total, subtotal, and items are never null or omitted, always provide default numbers (0)
    const minimalPayload = {
      total: totalVal || 0,
      subtotal: subtotalVal || 0,
      total_amount: totalVal || 0,
      delivery_fee: deliveryFee,
      handling_fee: handlingFee,
      items: itemsJSON || [],
      customer_name: customerData.name || 'Campus Student',
      customer_phone: customerData.phone || '',
      delivery_address: deliveryAddress,
      status: 'pending',
      payment_method: 'COD',
      is_whatsapp_verified: true,
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

  const generatedId = newOrder?.order_number || newOrder?.id || orderId;

  // 2. Non-blocking asynchronous sync to 'order_items' (never blocks response)
  if (cartItems && cartItems.length > 0 && typeof newOrder?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newOrder.id)) {
    const items = cartItems.map((item) => ({
      order_id: newOrder.id,
      product_name_snapshot: item.title || item.name || 'Campus Item',
      product_name: item.title || item.name || 'Campus Item',
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));
    supabase.from('order_items').insert(items).then(() => {}, () => {});
  }

  // 3. Non-blocking status history log
  if (typeof newOrder?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newOrder.id)) {
    supabase.from('order_status_history').insert([
      {
        id: `hist-${Date.now()}`,
        order_id: newOrder.id,
        status: 'preparing',
        notes: `Order placed. Delivery destination: ${deliveryLocation}`,
        created_by: 'Campus Student',
        created_at: now,
      },
    ]).then(() => {}, () => {});
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

  // 1. Explicit Payload Calculation & Validation
  const subtotal = cartItems.reduce((sum, item: any) => {
    const price = item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0);
    const quantity = Number(item.quantity || 1);
    return sum + (price * quantity);
  }, 0);
  const baseDelivery = 15; // 50% Launch Offer discount (standard was 30)
  const baseHandling = 9;

  let deliveryFee = baseDelivery;
  let handlingFee = baseHandling;

  if (subtotal >= 500) {
    deliveryFee = 0;
    handlingFee = 0;
  } else if (subtotal >= 200) {
    handlingFee = 0;
    deliveryFee = baseDelivery;
  }

  const total = Number(totalAmount || (subtotal + deliveryFee + handlingFee)) || 0;
  const subtotalVal = Number(subtotal) || 0;
  const totalVal = Number(total) || 0;

  const cleanFullName = sanitizeTextInput(formData.fullName || 'Campus Student', 100) || 'Campus Student';
  const cleanPhone = normalizeIndianPhone(formData.phone || '');
  const cleanArea = sanitizeTextInput(formData.area || 'Campus', 120) || 'Campus';
  const cleanRoomNo = sanitizeTextInput(formData.roomNo || '', 120);
  const cleanNotes = sanitizeTextInput(formData.notes || '', 240);

  const itemsJSON = cartItems.map((item: any) => ({
    id: item.id || item.product?.id || 'item',
    product_id: item.id || item.product?.id || 'item',
    name: sanitizeTextInput(item.title || item.name || item.product?.name || 'Campus Item', 120),
    price: item.price !== undefined ? Number(item.price) : Number(item.product?.price ?? 0),
    quantity: Number(item.quantity || 1),
    subtotal: (item.price !== undefined ? Number(item.price) : Number(item.product?.price ?? 0)) * Number(item.quantity || 1),
  }));

  const deliveryAddress = {
    fullName: cleanFullName,
    phone: cleanPhone,
    area: cleanArea,
    roomNo: cleanRoomNo,
    notes: cleanNotes,
  };

  // Pass exact delivery_fee, handling_fee, subtotal, and total in the Supabase payload:
  const orderPayload = {
    total: totalVal || 0,
    subtotal: subtotalVal || 0,
    total_amount: totalVal || 0,
    delivery_fee: deliveryFee,
    handling_fee: handlingFee,
    items: itemsJSON || [],
    customer_name: cleanFullName,
    customer_phone: cleanPhone,
    delivery_address: deliveryAddress,
    status: 'pending',
    payment_method: 'COD',
    delivery_zone: cleanArea,
    campus_location: cleanRoomNo ? `${cleanArea} - Room: ${cleanRoomNo}` : cleanArea,
    delivery_note: cleanNotes,
    is_whatsapp_verified: true,
  };

  // 2. Direct single-roundtrip insert
  let { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select('id, order_number')
    .single();

  if (orderError) {
    console.warn('Orders insert notice, retrying with core schema fallback:', orderError.message);
    // Fallback retry function: make sure total, subtotal, and items are never null or omitted, always provide default numbers (0)
    const minimalPayload = {
      total: totalVal || 0,
      subtotal: subtotalVal || 0,
      total_amount: totalVal || 0,
      delivery_fee: deliveryFee,
      handling_fee: handlingFee,
      items: itemsJSON || [],
      customer_name: formData.fullName,
      customer_phone: formData.phone,
      delivery_address: deliveryAddress,
      status: 'pending',
      payment_method: 'COD',
      is_whatsapp_verified: true,
    };
    const retry = await supabase
      .from('orders')
      .insert([minimalPayload])
      .select('id, order_number')
      .single();
    if (!retry.error && retry.data) {
      order = retry.data;
      orderError = null;
    }
  }

  const generatedId = order?.order_number || order?.id || `INF-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  // 3. Items ko parallel/bulk insert karein
  if (order?.id) {
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

    supabase
      .from('order_items')
      .insert(itemsPayload)
      .then(() => {}, () => {});
  }

  // Maintain local state for instant LiveOrdersManager synchronization
  try {
    const localOrder: AdminOrder = {
      id: generatedId,
      order_number: generatedId,
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
      created_at: now,
    };
    const local = getLocal<AdminOrder[]>(LOCAL_STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    setLocal(LOCAL_STORAGE_KEYS.ORDERS, [localOrder, ...local]);

    // Wrap localStorage.setItem('infinity_orders', ...) in a try-catch block and limit stored history to the 5 most recent orders
    try {
      let existingOrders: any[] = [];
      try {
        const rawStored = localStorage.getItem('infinity_orders');
        if (rawStored) existingOrders = JSON.parse(rawStored);
      } catch {
        existingOrders = [];
      }

      const sanitizedExisting = (Array.isArray(existingOrders) ? existingOrders : [])
        .filter((o: any) => o && (o.id || o.order_id) && o.id !== generatedId && o.order_id !== generatedId)
        .slice(0, 4)
        .map((o: any) => ({
          id: String(o.id || o.order_id || 'INF-ORD'),
          order_id: String(o.order_id || o.id || 'INF-ORD'),
          timestamp: String(o.timestamp || o.created_at || new Date().toISOString()),
          total: Number(o.total || o.total_amount || 0),
        }));

      const currentOrderSummary = {
        id: generatedId,
        order_id: generatedId,
        timestamp: now,
        total: totalVal,
      };

      const trimmedOrders = [currentOrderSummary, ...sanitizedExisting].slice(0, 5);
      try {
        localStorage.setItem('infinity_orders', JSON.stringify(trimmedOrders));
      } catch (quotaErr) {
        try {
          localStorage.removeItem('infinity_orders');
          localStorage.setItem('infinity_orders', JSON.stringify([currentOrderSummary]));
        } catch {}
      }
    } catch {}
  } catch (syncErr) {
    console.warn('Local state sync notice:', syncErr);
  }

  return order || { id: generatedId, order_number: generatedId };
};
