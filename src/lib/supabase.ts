import { createClient } from '@supabase/supabase-js';

// Environment variables for optional live Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to record orders or track analytics
 * Uses Supabase when available, otherwise saves to localStorage
 */
export async function recordCampusOrder(orderData: {
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  total: number;
  deliveryZone: string;
  roomDetails: string;
  studentPhone?: string;
}) {
  const orderId = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();
  const fullOrder = { id: orderId, ...orderData, timestamp, status: 'Preparing' };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('campus_orders')
        .insert([fullOrder])
        .select();

      if (!error && data) {
        return { success: true, order: data[0] };
      }
    } catch (err) {
      console.warn('Supabase order insert fallback to local:', err);
    }
  }

  // Fallback to localStorage persistence
  try {
    const existing = JSON.parse(localStorage.getItem('infinity_store_orders') || '[]');
    existing.unshift(fullOrder);
    localStorage.setItem('infinity_store_orders', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save order locally', e);
  }

  return { success: true, order: fullOrder };
}
