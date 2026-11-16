/// <reference types="node" />
import crypto from 'node:crypto';

/**
 * Vercel Serverless API Route: /api/admin-action
 * Handles all privileged InfinityStore operations strictly server-side using
 * private environment variables (never exposed to browser bundles).
 *
 * Required Server Environment Variables (configure in Vercel Dashboard, NO VITE_ prefix):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - WHATSAPP_WEBHOOK_SECRET (for incoming WhatsApp verification webhooks)
 * - ADMIN_BOOTSTRAP_EMAILS (optional comma-separated allowlist for initial super_admin)
 */

interface ServerlessRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: any) => void;
}

type AdminAction =
  | 'verify_admin'
  | 'list_orders'
  | 'update_order_status'
  | 'adjust_inventory'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'toggle_store_status'
  | 'whatsapp_webhook';

const ALLOWED_ORDER_STATUSES = new Set([
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out for delivery',
  'delivered',
  'cancelled',
]);

function sanitizeServerText(input: unknown, maxLen: number = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/(?:javascript|data|vbscript)\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const val = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(val)) return val[0] || '';
  return typeof val === 'string' ? val : '';
}

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getServerSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const publicKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error('Server SUPABASE_URL is not configured.');
  }
  if (!serviceRoleKey) {
    throw new Error('Server SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  return { supabaseUrl, serviceRoleKey, publicKey };
}

async function supabaseServiceFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function authenticateAdminRequest(req: ServerlessRequest): Promise<{
  userId: string;
  email: string;
  role: string;
  name: string;
}> {
  const authHeader = getHeaderValue(req.headers, 'authorization');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    throw Object.assign(new Error('Missing Authorization Bearer token.'), { statusCode: 401 });
  }

  const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();

  // 1. Validate caller JWT directly with Supabase Auth
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    throw Object.assign(new Error('Invalid or expired session token.'), { statusCode: 401 });
  }

  const user = await userRes.json();
  const userId = String(user?.id || '');
  const email = String(user?.email || '').toLowerCase().trim();

  if (!userId || !email) {
    throw Object.assign(new Error('Authenticated user identity missing.'), { statusCode: 401 });
  }

  // 2. Verify admin privileges in public.admin_users or public.user_roles (NEVER trust email substrings)
  const adminUsersRes = await supabaseServiceFetch(
    `/rest/v1/admin_users?select=role,is_active,full_name&user_id=eq.${encodeURIComponent(userId)}&limit=1`
  );

  if (adminUsersRes.ok && Array.isArray(adminUsersRes.data) && adminUsersRes.data[0]) {
    const row = adminUsersRes.data[0];
    if (row.is_active !== false && ['admin', 'super_admin', 'staff'].includes(String(row.role))) {
      return {
        userId,
        email,
        role: String(row.role),
        name: sanitizeServerText(row.full_name || user?.user_metadata?.full_name || email.split('@')[0], 80),
      };
    }
  }

  const rolesRes = await supabaseServiceFetch(
    `/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(userId)}&limit=1`
  );

  if (rolesRes.ok && Array.isArray(rolesRes.data) && rolesRes.data[0]) {
    const role = String(rolesRes.data[0].role || '');
    if (['admin', 'super_admin', 'staff'].includes(role)) {
      return {
        userId,
        email,
        role,
        name: sanitizeServerText(user?.user_metadata?.full_name || email.split('@')[0], 80),
      };
    }
  }

  // Optional server-side allowlist from private env var (never hardcoded in source)
  const allowlist = (process.env.ADMIN_BOOTSTRAP_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.includes(email)) {
    return {
      userId,
      email,
      role: 'super_admin',
      name: sanitizeServerText(user?.user_metadata?.full_name || email.split('@')[0], 80),
    };
  }

  throw Object.assign(new Error('Forbidden: Admin privileges required.'), { statusCode: 403 });
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const action = body.action as AdminAction;
    const payload = body.payload || {};

    if (!action) {
      return res.status(400).json({ error: 'Missing required action parameter.' });
    }

    // 1. WhatsApp verification webhook (verified via private HMAC/secret header)
    if (action === 'whatsapp_webhook') {
      const webhookSecret = (process.env.WHATSAPP_WEBHOOK_SECRET || '').trim();
      const providedSecret = getHeaderValue(req.headers, 'x-webhook-secret');

      if (!webhookSecret || !providedSecret || !timingSafeEquals(providedSecret, webhookSecret)) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }

      const rawPhone = String(payload.phone || '').replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(rawPhone)) {
        return res.status(400).json({ error: 'Invalid 10-digit Indian phone number.' });
      }

      const orderId = sanitizeServerText(payload.orderId || '', 64);
      if (orderId) {
        await supabaseServiceFetch(
          `/rest/v1/orders?or=(id.eq.${encodeURIComponent(orderId)},order_number.eq.${encodeURIComponent(orderId)})`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              is_whatsapp_verified: true,
              updated_at: new Date().toISOString(),
            }),
          }
        );
      }

      return res.status(200).json({ ok: true, verifiedPhone: rawPhone });
    }

    // All remaining actions require a verified admin session JWT
    const admin = await authenticateAdminRequest(req);

    switch (action) {
      case 'verify_admin': {
        return res.status(200).json({
          authorized: true,
          user: {
            id: admin.userId,
            email: admin.email,
            role: admin.role,
            name: admin.name,
          },
        });
      }

      case 'list_orders': {
        const limit = Math.min(Math.max(Number(payload.limit || 100), 1), 500);
        const ordersRes = await supabaseServiceFetch(
          `/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}`
        );
        if (!ordersRes.ok) {
          return res.status(ordersRes.status).json({ error: 'Failed to load orders.' });
        }
        return res.status(200).json({ orders: Array.isArray(ordersRes.data) ? ordersRes.data : [] });
      }

      case 'update_order_status': {
        const orderId = sanitizeServerText(payload.orderId, 80);
        const newStatus = sanitizeServerText(payload.newStatus, 40);
        const notes = sanitizeServerText(payload.notes || `Status updated to ${newStatus}`, 240);

        if (!orderId || !ALLOWED_ORDER_STATUSES.has(newStatus)) {
          return res.status(400).json({ error: 'Invalid orderId or status value.' });
        }

        const now = new Date().toISOString();
        const updateRes = await supabaseServiceFetch(
          `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ status: newStatus, updated_at: now }),
          }
        );

        if (!updateRes.ok) {
          return res.status(updateRes.status).json({ error: 'Failed to update order status.' });
        }

        // Record immutable audit trail
        await supabaseServiceFetch('/rest/v1/order_status_history', {
          method: 'POST',
          body: JSON.stringify([
            {
              id: `hist-${Date.now()}`,
              order_id: orderId,
              status: newStatus,
              notes,
              created_by: admin.email,
              created_at: now,
            },
          ]),
        });

        return res.status(200).json({
          ok: true,
          order: Array.isArray(updateRes.data) ? updateRes.data[0] : updateRes.data,
        });
      }

      case 'adjust_inventory': {
        const productId = sanitizeServerText(payload.productId, 80);
        const changeAmount = Number(payload.changeAmount);
        const reason = sanitizeServerText(payload.reason || 'Audit Adjustment', 40);
        const notes = sanitizeServerText(payload.notes || '', 240);

        if (!productId || !Number.isFinite(changeAmount) || Math.abs(changeAmount) > 10000) {
          return res.status(400).json({ error: 'Invalid inventory adjustment parameters.' });
        }

        const prodRes = await supabaseServiceFetch(
          `/rest/v1/products?select=id,name,stock_count,stock_quantity&id=eq.${encodeURIComponent(productId)}&limit=1`
        );

        if (!prodRes.ok || !Array.isArray(prodRes.data) || !prodRes.data[0]) {
          return res.status(404).json({ error: 'Product not found.' });
        }

        const existing = prodRes.data[0];
        const previousStock = Number(existing.stock_count ?? existing.stock_quantity ?? 0);
        const newStock = Math.max(0, previousStock + changeAmount);
        const now = new Date().toISOString();

        const patchRes = await supabaseServiceFetch(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              stock_count: newStock,
              stock_quantity: newStock,
              in_stock: newStock > 0,
            }),
          }
        );

        if (!patchRes.ok) {
          return res.status(patchRes.status).json({ error: 'Failed to update product stock.' });
        }

        await supabaseServiceFetch('/rest/v1/inventory_transactions', {
          method: 'POST',
          body: JSON.stringify([
            {
              id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              product_id: productId,
              change_amount: changeAmount,
              previous_stock: previousStock,
              new_stock: newStock,
              reason,
              notes: notes || `${reason} by ${admin.email}`,
              created_at: now,
            },
          ]),
        });

        return res.status(200).json({ ok: true, previousStock, newStock });
      }

      case 'create_product': {
        const name = sanitizeServerText(payload.name || payload.title, 120);
        const category = sanitizeServerText(payload.category || 'snacks', 60);
        const price = Number(payload.price);
        const stockCount = Math.max(0, Number(payload.stock_count ?? payload.stock_quantity ?? 0));

        if (!name || !Number.isFinite(price) || price < 0) {
          return res.status(400).json({ error: 'Invalid product payload.' });
        }

        const insertRes = await supabaseServiceFetch('/rest/v1/products', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify([
            {
              name,
              title: name,
              category,
              price,
              original_price: payload.original_price ? Number(payload.original_price) : null,
              stock_count: stockCount,
              stock_quantity: stockCount,
              low_stock_threshold: Number(payload.low_stock_threshold ?? 10),
              image: sanitizeServerText(payload.image || payload.image_url, 500),
              image_url: sanitizeServerText(payload.image_url || payload.image, 500),
              unit: sanitizeServerText(payload.unit || '1 pc', 40),
              description: sanitizeServerText(payload.description || '', 500),
              in_stock: stockCount > 0,
              is_active: payload.is_active !== false,
              is_popular: Boolean(payload.is_popular),
              is_late_night: Boolean(payload.is_late_night),
              is_flash_deal: Boolean(payload.is_flash_deal),
              created_at: new Date().toISOString(),
            },
          ]),
        });

        if (!insertRes.ok) {
          return res.status(insertRes.status).json({ error: 'Failed to create product.' });
        }

        return res.status(200).json({
          ok: true,
          product: Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data,
        });
      }

      case 'update_product': {
        const productId = sanitizeServerText(payload.id, 80);
        if (!productId) {
          return res.status(400).json({ error: 'Missing product id.' });
        }

        const updates: Record<string, any> = {};
        if (payload.name !== undefined) {
          const cleanName = sanitizeServerText(payload.name, 120);
          updates.name = cleanName;
          updates.title = cleanName;
        }
        if (payload.category !== undefined) updates.category = sanitizeServerText(payload.category, 60);
        if (payload.price !== undefined) updates.price = Math.max(0, Number(payload.price));
        if (payload.original_price !== undefined) {
          updates.original_price = payload.original_price ? Number(payload.original_price) : null;
        }
        if (payload.stock_count !== undefined) {
          const stock = Math.max(0, Number(payload.stock_count));
          updates.stock_count = stock;
          updates.stock_quantity = stock;
          updates.in_stock = stock > 0;
        }
        if (payload.low_stock_threshold !== undefined) {
          updates.low_stock_threshold = Math.max(0, Number(payload.low_stock_threshold));
        }
        if (payload.image !== undefined) {
          const cleanImg = sanitizeServerText(payload.image, 500);
          updates.image = cleanImg;
          updates.image_url = cleanImg;
        }
        if (payload.unit !== undefined) updates.unit = sanitizeServerText(payload.unit, 40);
        if (payload.description !== undefined) {
          updates.description = sanitizeServerText(payload.description, 500);
        }
        if (payload.is_popular !== undefined) updates.is_popular = Boolean(payload.is_popular);
        if (payload.is_late_night !== undefined) updates.is_late_night = Boolean(payload.is_late_night);
        if (payload.is_flash_deal !== undefined) updates.is_flash_deal = Boolean(payload.is_flash_deal);

        const updateRes = await supabaseServiceFetch(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}`,
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify(updates),
          }
        );

        if (!updateRes.ok) {
          return res.status(updateRes.status).json({ error: 'Failed to update product.' });
        }

        return res.status(200).json({
          ok: true,
          product: Array.isArray(updateRes.data) ? updateRes.data[0] : updateRes.data,
        });
      }

      case 'delete_product': {
        const productId = sanitizeServerText(payload.id, 80);
        if (!productId) {
          return res.status(400).json({ error: 'Missing product id.' });
        }

        const deleteRes = await supabaseServiceFetch(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}`,
          { method: 'DELETE' }
        );

        if (!deleteRes.ok) {
          return res.status(deleteRes.status).json({ error: 'Failed to delete product.' });
        }

        return res.status(200).json({ ok: true });
      }

      case 'toggle_store_status': {
        const isOpen = Boolean(payload.isOpen);
        const now = new Date().toISOString();
        const toggleRes = await supabaseServiceFetch('/rest/v1/store_settings?id=eq.primary', {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ is_open: isOpen, updated_at: now }),
        });

        if (!toggleRes.ok) {
          return res.status(toggleRes.status).json({ error: 'Failed to update store status.' });
        }

        return res.status(200).json({ ok: true, isOpen });
      }

      default:
        return res.status(400).json({ error: 'Unsupported action.' });
    }
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || 500);
    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal server error' : err?.message || 'Request failed',
    });
  }
}
