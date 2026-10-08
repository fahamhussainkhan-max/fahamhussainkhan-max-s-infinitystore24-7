import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  calculateDeliveryFee,
  getBaseDeliveryFee,
  PACKAGING_HANDLING_FEE,
  DAY_DELIVERY_FEE,
  NIGHT_DELIVERY_FEE,
  isNightDeliveryTime,
} from '../utils/delivery';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface CheckoutProps {
  cart: CartItem[];
  isStoreOpen: boolean;
  onSuccess: (orderId: string) => void;
}

export const CheckoutSection: React.FC<CheckoutProps> = ({ cart, isStoreOpen, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Day / Night Fee Rules:
  // - Day Hours (06:00 AM to 07:59 PM): Base Delivery ₹15, Handling ₹9
  // - Night Hours (08:00 PM to 05:59 AM): Base Delivery ₹30, Handling ₹9
  // - Subtotal >= ₹500: Delivery Fee = ₹0 (FREE), Handling Fee = ₹0 (FREE)
  // - Subtotal >= ₹200: Handling Fee = ₹0 (FREE), Delivery Fee = baseDelivery (₹15 or ₹30)
  // - Subtotal < ₹200: Full charges apply: baseDelivery + ₹9 handling
  const productPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 20 || currentHour < 6;
  const baseDelivery = isNight ? NIGHT_DELIVERY_FEE : DAY_DELIVERY_FEE;
  const baseHandling = PACKAGING_HANDLING_FEE;

  let deliveryCharge = 0;
  let handlingFee = 0;

  if (productPrice >= 500) {
    deliveryCharge = 0;
    handlingFee = 0;
  } else if (productPrice >= 200) {
    handlingFee = 0;
    deliveryCharge = baseDelivery;
  } else {
    deliveryCharge = baseDelivery;
    handlingFee = baseHandling;
  }

  const isFreeDeliveryQualified = deliveryCharge === 0 && productPrice > 0;
  const isFreeHandlingQualified = handlingFee === 0 && productPrice > 0;
  const totalAmount = productPrice > 0 ? Number(productPrice) + Number(deliveryCharge) + Number(handlingFee) : 0;
  const itemsTotal = productPrice;
  const grandTotal = totalAmount;
  const DELIVERY_FEE = deliveryCharge;
  const HANDLING_FEE = handlingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isStoreOpen) {
      setErrorMsg('Store is closed right now.');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!location.trim()) {
      setErrorMsg('Please enter your Room / Hostel / Delivery Spot.');
      return;
    }

    setLoading(true);
    try {
      const orderNumber = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Explicit Payload Calculation & Validation
      const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
      const currentDeliveryFee = Number(deliveryCharge);
      const currentHandlingFee = Number(handlingFee);
      const subtotalVal = Number(subtotal) || 0;
      const totalVal = Number(totalAmount) || (subtotalVal > 0 ? subtotalVal + currentDeliveryFee + currentHandlingFee : 0);

      const itemsJSON = cart.map(item => ({
        id: item.id || 'item',
        product_id: item.id || 'item',
        name: item.name || 'Campus Item',
        title: item.name || 'Campus Item',
        price: Number(item.price || 0),
        unit_price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        subtotal: Number(item.price || 0) * Number(item.quantity || 1),
        image_url: item.image_url || '',
      }));

      const deliveryAddress = {
        fullName: name.trim() || 'Campus Student',
        phone: cleanPhone,
        area: location.trim() || 'Campus',
      };

      // Pass exact delivery_fee, handling_fee, subtotal, and total in the Supabase payload:
      const standardPayload = {
        total: totalVal || 0,
        subtotal: subtotalVal || 0,
        total_amount: totalVal || 0,
        delivery_fee: currentDeliveryFee,
        handling_fee: currentHandlingFee,
        items: itemsJSON || [],
        customer_name: name.trim() || 'Campus Student',
        customer_phone: cleanPhone,
        delivery_address: deliveryAddress,
        status: 'pending',
        payment_method: 'COD',
        delivery_zone: location.trim() || 'Campus',
        campus_location: location.trim() || 'Campus',
        delivery_note: '',
        is_whatsapp_verified: true,
      };

      let res = await supabase
        .from('orders')
        .insert([standardPayload])
        .select()
        .single();

      if (res.error) {
        console.warn('Orders insert notice, retrying with core schema fallback:', res.error.message);
        // Fallback retry function: make sure total, subtotal, and items are never null or omitted, always provide default numbers (0)
        const minimalPayload = {
          total: totalVal || 0,
          subtotal: subtotalVal || 0,
          total_amount: totalVal || 0,
          delivery_fee: currentDeliveryFee,
          handling_fee: currentHandlingFee,
          items: itemsJSON || [],
          customer_name: standardPayload.customer_name,
          customer_phone: standardPayload.customer_phone,
          delivery_address: deliveryAddress,
          status: 'pending',
          payment_method: standardPayload.payment_method,
          is_whatsapp_verified: true,
        };
        const retryRes = await supabase
          .from('orders')
          .insert([minimalPayload])
          .select()
          .single();
        if (!retryRes.error) {
          res = retryRes;
        }
      }

      const createdOrderId = res.data?.order_number || res.data?.id || orderNumber;

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
          .filter((o: any) => o && (o.id || o.order_id) && o.id !== createdOrderId && o.order_id !== createdOrderId)
          .slice(0, 4)
          .map((o: any) => ({
            id: String(o.id || o.order_id || 'INF-ORD'),
            order_id: String(o.order_id || o.id || 'INF-ORD'),
            timestamp: String(o.timestamp || o.created_at || new Date().toISOString()),
            total: Number(o.total || o.total_amount || 0),
          }));

        const currentOrderSummary = {
          id: createdOrderId,
          order_id: createdOrderId,
          timestamp: new Date().toISOString(),
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

      // Optional background sync to order_items (never blocks user)
      if (res.data?.id && typeof res.data.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(res.data.id) && cart.length > 0) {
        const itemsPayload = cart.map(item => ({
          order_id: res.data.id,
          product_name_snapshot: item.name,
          price_snapshot: item.price,
          item_price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          image_url: item.image_url || ''
        }));
        supabase.from('order_items').insert(itemsPayload).then(() => {}, () => {});
      }

      onSuccess(createdOrderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePlaceOrder} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white max-w-md mx-auto shadow-2xl">
      <h3 className="text-lg font-bold mb-4 font-display">Checkout & Delivery</h3>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs mb-4">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3 mb-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-400 text-white"
        />
        <input
          type="tel"
          maxLength={10}
          placeholder="10-Digit Mobile Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-400 text-white"
        />
        <input
          type="text"
          placeholder="Room / Hostel / Campus Spot"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-400 text-white"
        />
      </div>

      {/* Day / Night Slot Indicator Badge */}
      <div className="mb-3">
        {isNight ? (
          <div className="bg-indigo-950/60 border border-indigo-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs text-indigo-200">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <span>🌙</span>
              <span>🌙 Night Delivery (₹30)</span>
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-extrabold uppercase">
              {isFreeDeliveryQualified ? 'WAIVED (FREE)' : '8:00 PM - 5:59 AM'}
            </span>
          </div>
        ) : (
          <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <span>☀️</span>
              <span>☀️ Day Delivery (₹15)</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-extrabold uppercase">
              {isFreeDeliveryQualified ? 'WAIVED (FREE)' : '6:00 AM - 7:59 PM'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs text-slate-300 mb-4 border border-slate-700/50">
        <div className="flex justify-between">
          <span>Items Total:</span>
          <span className="font-semibold text-white">₹{productPrice}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span>Delivery Charge:</span>
            {isNight ? (
              <span className="text-[10px] bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 px-1.5 py-0.2 rounded font-bold">
                🌙 Night
              </span>
            ) : (
              <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700/60 px-1.5 py-0.2 rounded font-bold">
                ☀️ Day
              </span>
            )}
            {isFreeDeliveryQualified && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded font-extrabold uppercase">
                FREE
              </span>
            )}
          </span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            {isFreeDeliveryQualified ? (
              <>
                <span className="line-through text-slate-500 font-normal">₹{baseDelivery}</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </>
            ) : (
              `₹${deliveryCharge}`
            )}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span>Packaging & Handling:</span>
            {isFreeHandlingQualified && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded font-extrabold uppercase">
                FREE
              </span>
            )}
          </span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            {isFreeHandlingQualified ? (
              <>
                <span className="line-through text-slate-500 font-normal">₹9</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </>
            ) : (
              `₹${handlingFee}`
            )}
          </span>
        </div>
        <div className="flex justify-between font-bold text-sm text-emerald-400 border-t border-slate-700 pt-2 mt-1">
          <span>Total COD to Collect:</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isStoreOpen}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-xl text-sm transition cursor-pointer disabled:cursor-not-allowed shadow-lg active:scale-[0.99]"
      >
        {loading ? 'Placing Order...' : !isStoreOpen ? 'Store is Closed' : `Place COD Order • ₹${totalAmount}`}
      </button>
    </form>
  );
};

export default CheckoutSection;
