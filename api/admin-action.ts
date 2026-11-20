/// <reference types="node" />
import crypto from 'node:crypto';

/**
 * Vercel Serverless & Vite Dev API Route: /api/admin-action
 * Handles all privileged InfinityStore Admin & Management Panel operations strictly
 * server-side using SUPABASE_SERVICE_ROLE_KEY and ADMIN_BOOTSTRAP_SECRET
 * (never exposed to browser bundles).
 *
 * Required Server Environment Variables (NO VITE_ prefix):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_BOOTSTRAP_SECRET (passphrase used to unlock Admin & Management panels)
 * - WHATSAPP_WEBHOOK_SECRET (optional: incoming WhatsApp verification webhooks)
 * - ADMIN_BOOTSTRAP_EMAILS (optional: comma-separated allowlist for Supabase Auth admins)
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
  | 'unlock_admin'
  | 'verify_admin'
  | 'get_dashboard_metrics'
  | 'list_orders'
  | 'list_order_history'
  | 'update_order_status'
  | 'list_products'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'adjust_inventory'
  | 'list_inventory_transactions'
  | 'upload_product_image'
  | 'get_store_status'
  | 'toggle_store_status'
  | 'seed_demo_data'
  | 'whatsapp_webhook';

interface AdminSessionIdentity {
  userId: string;
  email: string;
  role: string;
  name: string;
  authMethod: 'passphrase' | 'supabase_jwt';
  expiresAt?: number;
}

const TOKEN_PREFIX = 'inf_adm_v1.';
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours short-lived signed session token

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
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

function getAdminBootstrapSecret(): string {
  return (process.env.ADMIN_BOOTSTRAP_SECRET || '').trim();
}

function getTokenSigningKey(): string {
  const bootstrapSecret = getAdminBootstrapSecret();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const material = `${bootstrapSecret}|${serviceRoleKey}|infinity_store_admin_session_v1`;
  if (!bootstrapSecret && !serviceRoleKey) {
    throw Object.assign(
      new Error('Server signing secret is not configured (set ADMIN_BOOTSTRAP_SECRET).'),
      { statusCode: 503 }
    );
  }
  return crypto.createHash('sha256').update(material).digest('hex');
}

function signAdminSessionToken(identity: {
  userId: string;
  email: string;
  role: string;
  name: string;
}): { token: string; expiresAt: number } {
  const iat = Date.now();
  const exp = iat + SESSION_TTL_MS;
  const payload = {
    sub: identity.userId,
    email: identity.email,
    role: identity.role,
    name: identity.name,
    iat,
    exp,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getTokenSigningKey())
    .update(payloadB64)
    .digest('base64url');

  return {
    token: `${TOKEN_PREFIX}${payloadB64}.${sig}`,
    expiresAt: exp,
  };
}

function verifySignedAdminSessionToken(token: string): AdminSessionIdentity | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const raw = token.slice(TOKEN_PREFIX.length);
  const dotIdx = raw.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = raw.slice(0, dotIdx);
  const providedSig = raw.slice(dotIdx + 1);
  if (!payloadB64 || !providedSig) return null;

  let expectedSig = '';
  try {
    expectedSig = crypto
      .createHmac('sha256', getTokenSigningKey())
      .update(payloadB64)
      .digest('base64url');
  } catch {
    return null;
  }

  if (!timingSafeEquals(providedSig, expectedSig)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number' || Date.now() >= decoded.exp) {
      return null;
    }
    return {
      userId: String(decoded.sub || 'admin-passphrase'),
      email: String(decoded.email || 'ops@infinity.store'),
      role: String(decoded.role || 'super_admin'),
      name: String(decoded.name || 'Operations Admin'),
      authMethod: 'passphrase',
      expiresAt: decoded.exp,
    };
  } catch {
    return null;
  }
}

function getServerSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw Object.assign(
      new Error('Backend configuration error: SUPABASE_URL is missing on the server.'),
      { statusCode: 503 }
    );
  }
  if (!serviceRoleKey) {
    throw Object.assign(
      new Error(
        'Backend configuration error: SUPABASE_SERVICE_ROLE_KEY is missing on the server.'
      ),
      { statusCode: 503 }
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

function formatSupabaseError(resData: any, fallback: string): string {
  if (!resData) return fallback;
  if (typeof resData === 'string') return resData.slice(0, 220) || fallback;
  const msg = resData.message || resData.error_description || resData.error || resData.details;
  if (typeof msg === 'string' && msg.trim()) {
    return `${fallback}: ${msg.trim().slice(0, 220)}`;
  }
  return fallback;
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

async function fetchOrdersWithItems(limit: number): Promise<any[]> {
  // Primary query: embedded PostgREST relation
  const embeddedRes = await supabaseServiceFetch(
    `/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}`
  );

  if (embeddedRes.ok && Array.isArray(embeddedRes.data)) {
    return embeddedRes.data;
  }

  // Fallback if foreign key relationship is absent or named differently in PostgREST schema cache
  const ordersOnlyRes = await supabaseServiceFetch(
    `/rest/v1/orders?select=*&order=created_at.desc&limit=${limit}`
  );

  if (!ordersOnlyRes.ok) {
    throw Object.assign(
      new Error(formatSupabaseError(ordersOnlyRes.data, 'Failed to load orders from database')),
      { statusCode: ordersOnlyRes.status >= 400 ? ordersOnlyRes.status : 500 }
    );
  }

  const orders = Array.isArray(ordersOnlyRes.data) ? ordersOnlyRes.data : [];
  if (orders.length === 0) return [];

  const itemsRes = await supabaseServiceFetch(
    `/rest/v1/order_items?select=*&limit=${Math.min(limit * 10, 2000)}`
  );

  if (itemsRes.ok && Array.isArray(itemsRes.data) && itemsRes.data.length > 0) {
    const byOrderId = new Map<string, any[]>();
    for (const item of itemsRes.data) {
      const key = String(item.order_id || '');
      if (!key) continue;
      const list = byOrderId.get(key) || [];
      list.push(item);
      byOrderId.set(key, list);
    }
    return orders.map((ord) => ({
      ...ord,
      order_items: byOrderId.get(String(ord.id)) || ord.order_items || [],
    }));
  }

  return orders;
}

async function authenticateAdminRequest(req: ServerlessRequest): Promise<AdminSessionIdentity> {
  const authHeader = getHeaderValue(req.headers, 'authorization');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    throw Object.assign(
      new Error('Admin session locked. Please unlock with your admin passphrase or staff account.'),
      { statusCode: 401 }
    );
  }

  // 1. Check short-lived HMAC-signed admin passphrase session token first
  if (token.startsWith(TOKEN_PREFIX)) {
    const verified = verifySignedAdminSessionToken(token);
    if (!verified) {
      throw Object.assign(
        new Error('Your admin unlock session has expired or is invalid. Please unlock again.'),
        { statusCode: 401 }
      );
    }
    return verified;
  }

  // 2. Otherwise validate caller JWT directly with Supabase Auth
  const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    throw Object.assign(new Error('Invalid or expired session token. Please sign in again.'), {
      statusCode: 401,
    });
  }

  const user = await userRes.json();
  const userId = String(user?.id || '');
  const email = String(user?.email || '').toLowerCase().trim();

  if (!userId || !email) {
    throw Object.assign(new Error('Authenticated user identity missing.'), { statusCode: 401 });
  }

  // Verify admin privileges in public.admin_users or public.user_roles
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
        name: sanitizeServerText(
          row.full_name || user?.user_metadata?.full_name || email.split('@')[0],
          80
        ),
        authMethod: 'supabase_jwt',
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
        authMethod: 'supabase_jwt',
      };
    }
  }

  // Optional server-side allowlist from private env var
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
      authMethod: 'supabase_jwt',
    };
  }

  throw Object.assign(new Error('Forbidden: Admin privileges required.'), { statusCode: 403 });
}

/**
 * Helper to write to public.products with graceful fallback if optional mirrored
 * columns (e.g. title vs name, stock_quantity vs stock_count, image_url vs image)
 * are absent in the active Supabase table schema.
 */
async function mutateProductResilient(
  path: string,
  method: 'POST' | 'PATCH',
  fullRow: Record<string, any>
): Promise<{ ok: boolean; status: number; data: any }> {
  const primaryRes = await supabaseServiceFetch(path, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(method === 'POST' ? [fullRow] : fullRow),
  });

  if (primaryRes.ok) return primaryRes;

  // Retry without duplicate alias columns if PostgREST reports an unknown column (PGRST204 / 42703)
  const errCode = String(primaryRes.data?.code || '');
  const errMsg = String(primaryRes.data?.message || '').toLowerCase();
  if (
    errCode === 'PGRST204' ||
    errCode === '42703' ||
    errMsg.includes('column') ||
    errMsg.includes('schema cache')
  ) {
    const minimalRow: Record<string, any> = {};
    const skipIfMissing = ['title', 'stock_quantity', 'image_url'];
    for (const [k, v] of Object.entries(fullRow)) {
      if (v !== undefined && !skipIfMissing.includes(k)) {
        minimalRow[k] = v;
      }
    }
    return supabaseServiceFetch(path, {
      method,
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(method === 'POST' ? [minimalRow] : minimalRow),
    });
  }

  return primaryRes;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

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

    // 1. Admin Passphrase Unlock -> verifies against process.env.ADMIN_BOOTSTRAP_SECRET
    //    and returns a short-lived HMAC-signed session token for sessionStorage
    if (action === 'unlock_admin') {
      const configuredSecret = getAdminBootstrapSecret();
      if (!configuredSecret) {
        return res.status(503).json({
          error:
            'Admin passphrase unlock is not configured on the server. Set ADMIN_BOOTSTRAP_SECRET in your server environment variables.',
        });
      }

      const providedPassphrase =
        typeof payload.passphrase === 'string' ? payload.passphrase.trim() : '';

      if (!providedPassphrase) {
        return res.status(400).json({ error: 'Please enter the admin passphrase.' });
      }

      if (!timingSafeEquals(providedPassphrase, configuredSecret)) {
        return res.status(401).json({ error: 'Incorrect admin passphrase. Access denied.' });
      }

      const identity = {
        userId: 'admin-bootstrap',
        email: 'ops@infinity.store',
        role: 'super_admin',
        name: 'Operations Admin',
      };

      const { token, expiresAt } = signAdminSessionToken(identity);
      return res.status(200).json({
        ok: true,
        authorized: true,
        token,
        expiresAt,
        user: {
          id: identity.userId,
          email: identity.email,
          role: identity.role,
          name: identity.name,
        },
      });
    }

    // 2. WhatsApp verification webhook (verified via private HMAC/secret header)
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

    // All remaining actions require a verified admin session token (signed passphrase token or Supabase JWT)
    const admin = await authenticateAdminRequest(req);

    switch (action) {
      case 'verify_admin': {
        return res.status(200).json({
          authorized: true,
          expiresAt: admin.expiresAt,
          authMethod: admin.authMethod,
          user: {
            id: admin.userId,
            email: admin.email,
            role: admin.role,
            name: admin.name,
          },
        });
      }

      case 'get_dashboard_metrics': {
        const [orders, productsRes, profilesRes] = await Promise.all([
          fetchOrdersWithItems(250),
          supabaseServiceFetch('/rest/v1/products?select=*'),
          supabaseServiceFetch('/rest/v1/profiles?select=id'),
        ]);

        const products = productsRes.ok && Array.isArray(productsRes.data) ? productsRes.data : [];
        const profiles = profilesRes.ok && Array.isArray(profilesRes.data) ? profilesRes.data : [];

        const totalRevenue = orders.reduce(
          (sum: number, o: any) => sum + Number(o.total_amount ?? o.total ?? 0),
          0
        );
        const activeOrdersCount = orders.filter((o: any) =>
          ['pending', 'confirmed', 'preparing', 'ready', 'out for delivery'].includes(
            String(o.status || '').toLowerCase()
          )
        ).length;
        const lowStockCount = products.filter((p: any) => {
          const stock = Number(p.stock_count ?? p.stock_quantity ?? p.stockCount ?? 0);
          const threshold = Number(p.low_stock_threshold ?? 10);
          return stock <= threshold;
        }).length;

        return res.status(200).json({
          ok: true,
          ordersCount: orders.length,
          totalRevenue,
          activeOrdersCount,
          productsCount: products.length,
          lowStockCount,
          profilesCount: profiles.length,
          recentOrders: orders.slice(0, 12),
          isLiveSupabase: true,
        });
      }

      case 'list_orders': {
        const limit = Math.min(Math.max(Number(payload.limit || 200), 1), 500);
        const orders = await fetchOrdersWithItems(limit);
        return res.status(200).json({ ok: true, orders });
      }

      case 'list_order_history': {
        const orderId = sanitizeServerText(payload.orderId, 80);
        if (!orderId) {
          return res.status(400).json({ error: 'Missing orderId parameter.' });
        }
        const historyRes = await supabaseServiceFetch(
          `/rest/v1/order_status_history?select=*&order_id=eq.${encodeURIComponent(orderId)}&order=created_at.desc`
        );
        if (!historyRes.ok) {
          return res.status(historyRes.status).json({
            error: formatSupabaseError(historyRes.data, 'Failed to load order status history'),
          });
        }
        return res.status(200).json({
          ok: true,
          history: Array.isArray(historyRes.data) ? historyRes.data : [],
        });
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
          return res.status(updateRes.status).json({
            error: formatSupabaseError(updateRes.data, 'Failed to update order status'),
          });
        }

        const updatedRows = Array.isArray(updateRes.data) ? updateRes.data : [];
        if (updatedRows.length === 0) {
          return res.status(404).json({ error: `Order ${orderId} was not found in database.` });
        }

        // Record audit trail (best-effort if table exists)
        await supabaseServiceFetch('/rest/v1/order_status_history', {
          method: 'POST',
          body: JSON.stringify([
            {
              id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              order_id: orderId,
              status: newStatus,
              notes,
              created_by: admin.email,
              created_at: now,
            },
          ]),
        }).catch(() => {});

        return res.status(200).json({
          ok: true,
          order: updatedRows[0],
        });
      }

      case 'list_products': {
        const prodRes = await supabaseServiceFetch(
          '/rest/v1/products?select=*&order=created_at.desc'
        );
        if (!prodRes.ok) {
          return res.status(prodRes.status).json({
            error: formatSupabaseError(prodRes.data, 'Failed to load products catalog'),
          });
        }
        return res.status(200).json({
          ok: true,
          products: Array.isArray(prodRes.data) ? prodRes.data : [],
        });
      }

      case 'list_inventory_transactions': {
        const productId = payload.productId ? sanitizeServerText(payload.productId, 80) : '';
        const filter = productId ? `&product_id=eq.${encodeURIComponent(productId)}` : '';
        const txRes = await supabaseServiceFetch(
          `/rest/v1/inventory_transactions?select=*${filter}&order=created_at.desc&limit=200`
        );
        if (!txRes.ok) {
          return res.status(txRes.status).json({
            error: formatSupabaseError(txRes.data, 'Failed to load inventory transactions'),
          });
        }
        return res.status(200).json({
          ok: true,
          transactions: Array.isArray(txRes.data) ? txRes.data : [],
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
          `/rest/v1/products?select=*&id=eq.${encodeURIComponent(productId)}&limit=1`
        );

        if (!prodRes.ok) {
          return res.status(prodRes.status).json({
            error: formatSupabaseError(prodRes.data, 'Failed to query product stock'),
          });
        }

        if (!Array.isArray(prodRes.data) || !prodRes.data[0]) {
          return res.status(404).json({ error: `Product ${productId} not found in database.` });
        }

        const existing = prodRes.data[0];
        const previousStock = Number(existing.stock_count ?? existing.stock_quantity ?? 0);
        const newStock = Math.max(0, previousStock + changeAmount);
        const now = new Date().toISOString();

        const patchRes = await mutateProductResilient(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}`,
          'PATCH',
          {
            stock_count: newStock,
            stock_quantity: newStock,
            in_stock: newStock > 0,
          }
        );

        if (!patchRes.ok) {
          return res.status(patchRes.status).json({
            error: formatSupabaseError(patchRes.data, 'Failed to update product stock'),
          });
        }

        const txRecord = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          product_id: productId,
          change_amount: changeAmount,
          previous_stock: previousStock,
          new_stock: newStock,
          reason,
          notes: notes || `${reason} by ${admin.email}`,
          created_at: now,
        };

        await supabaseServiceFetch('/rest/v1/inventory_transactions', {
          method: 'POST',
          body: JSON.stringify([txRecord]),
        }).catch(() => {});

        return res.status(200).json({
          ok: true,
          previousStock,
          newStock,
          product: Array.isArray(patchRes.data) ? patchRes.data[0] : existing,
          transaction: {
            ...txRecord,
            product_name: existing.name || existing.title || productId,
          },
        });
      }

      case 'create_product': {
        const name = sanitizeServerText(payload.name || payload.title, 120);
        const category = sanitizeServerText(payload.category || 'snacks', 60);
        const price = Number(payload.price);
        const stockCount = Math.max(0, Number(payload.stock_count ?? payload.stock_quantity ?? 0));

        if (!name || !Number.isFinite(price) || price < 0) {
          return res.status(400).json({ error: 'Invalid product payload: name and non-negative price are required.' });
        }

        const now = new Date().toISOString();
        const productRow: Record<string, any> = {
          name,
          title: name,
          category,
          price,
          original_price: payload.original_price ? Number(payload.original_price) : null,
          stock_count: stockCount,
          stock_quantity: stockCount,
          low_stock_threshold: Number(payload.low_stock_threshold ?? 10),
          image: sanitizeServerText(payload.image || payload.image_url, 1200),
          image_url: sanitizeServerText(payload.image_url || payload.image, 1200),
          unit: sanitizeServerText(payload.unit || '1 pc', 40),
          description: sanitizeServerText(payload.description || '', 500),
          in_stock: stockCount > 0,
          is_active: payload.is_active !== false,
          is_popular: Boolean(payload.is_popular),
          is_late_night: Boolean(payload.is_late_night),
          is_flash_deal: Boolean(payload.is_flash_deal),
          created_at: now,
        };

        const insertRes = await mutateProductResilient('/rest/v1/products', 'POST', productRow);

        if (!insertRes.ok) {
          return res.status(insertRes.status).json({
            error: formatSupabaseError(insertRes.data, 'Failed to create product'),
          });
        }

        const created = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
        if (created?.id) {
          await supabaseServiceFetch('/rest/v1/inventory_transactions', {
            method: 'POST',
            body: JSON.stringify([
              {
                id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                product_id: String(created.id),
                change_amount: stockCount,
                previous_stock: 0,
                new_stock: stockCount,
                reason: 'Initial Stock',
                notes: `Product created by ${admin.email}`,
                created_at: now,
              },
            ]),
          }).catch(() => {});
        }

        return res.status(200).json({
          ok: true,
          product: created,
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
          const cleanImg = sanitizeServerText(payload.image, 1200);
          updates.image = cleanImg;
          updates.image_url = cleanImg;
        }
        if (payload.unit !== undefined) updates.unit = sanitizeServerText(payload.unit, 40);
        if (payload.description !== undefined) {
          updates.description = sanitizeServerText(payload.description, 500);
        }
        if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active);
        if (payload.is_popular !== undefined) updates.is_popular = Boolean(payload.is_popular);
        if (payload.is_late_night !== undefined) updates.is_late_night = Boolean(payload.is_late_night);
        if (payload.is_flash_deal !== undefined) updates.is_flash_deal = Boolean(payload.is_flash_deal);

        const updateRes = await mutateProductResilient(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}`,
          'PATCH',
          updates
        );

        if (!updateRes.ok) {
          return res.status(updateRes.status).json({
            error: formatSupabaseError(updateRes.data, 'Failed to update product'),
          });
        }

        const updatedRow = Array.isArray(updateRes.data) ? updateRes.data[0] : updateRes.data;
        if (!updatedRow) {
          return res.status(404).json({ error: `Product ${productId} not found in database.` });
        }

        return res.status(200).json({
          ok: true,
          product: updatedRow,
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
          return res.status(deleteRes.status).json({
            error: formatSupabaseError(deleteRes.data, 'Failed to delete product'),
          });
        }

        return res.status(200).json({ ok: true });
      }

      case 'upload_product_image': {
        const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
        const rawFileName = sanitizeServerText(payload.fileName || 'product.png', 80);
        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

        if (!match) {
          return res.status(400).json({ error: 'Invalid image upload payload.' });
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.byteLength > 5 * 1024 * 1024) {
          return res.status(413).json({ error: 'Image exceeds 5MB upload limit.' });
        }

        const ext = (rawFileName.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'png';
        const filePath = `catalog/item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();

        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/product-images/${filePath}`,
          {
            method: 'POST',
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              'Content-Type': mimeType,
              'x-upsert': 'true',
            },
            body: buffer,
          }
        );

        if (!uploadRes.ok) {
          const errText = await uploadRes.text().catch(() => '');
          return res.status(uploadRes.status).json({
            error: `Storage upload failed (${uploadRes.status}): ${errText.slice(0, 180)}`,
          });
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
        return res.status(200).json({ ok: true, publicUrl });
      }

      case 'get_store_status': {
        const statusRes = await supabaseServiceFetch(
          '/rest/v1/store_settings?select=*&id=eq.primary&limit=1'
        );
        if (!statusRes.ok) {
          return res.status(statusRes.status).json({
            error: formatSupabaseError(statusRes.data, 'Failed to read store status'),
          });
        }
        const row = Array.isArray(statusRes.data) ? statusRes.data[0] : null;
        return res.status(200).json({
          ok: true,
          isOpen: typeof row?.is_open === 'boolean' ? row.is_open : true,
        });
      }

      case 'toggle_store_status': {
        const isOpen = Boolean(payload.isOpen);
        const now = new Date().toISOString();
        const toggleRes = await supabaseServiceFetch('/rest/v1/store_settings?on_conflict=id', {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify([{ id: 'primary', is_open: isOpen, updated_at: now }]),
        });

        if (!toggleRes.ok) {
          return res.status(toggleRes.status).json({
            error: formatSupabaseError(toggleRes.data, 'Failed to update store status'),
          });
        }

        return res.status(200).json({ ok: true, isOpen });
      }

      case 'seed_demo_data': {
        const products = Array.isArray(payload.products) ? payload.products : [];
        const orders = Array.isArray(payload.orders) ? payload.orders : [];

        if (products.length > 0) {
          const prodRes = await supabaseServiceFetch('/rest/v1/products?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(products),
          });
          if (!prodRes.ok) {
            return res.status(prodRes.status).json({
              error: formatSupabaseError(prodRes.data, 'Failed to seed products'),
            });
          }
        }

        if (orders.length > 0) {
          const ordRes = await supabaseServiceFetch('/rest/v1/orders?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(orders),
          });
          if (!ordRes.ok) {
            return res.status(ordRes.status).json({
              error: formatSupabaseError(ordRes.data, 'Failed to seed orders'),
            });
          }
        }

        return res.status(200).json({
          ok: true,
          message: 'Successfully seeded campus data to Supabase via secure admin API!',
        });
      }

      default:
        return res.status(400).json({ error: `Unsupported admin action: ${String(action)}` });
    }
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || 500);
    return res.status(statusCode).json({
      error: err?.message || 'Internal server error',
    });
  }
}
