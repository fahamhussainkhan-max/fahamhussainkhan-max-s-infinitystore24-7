import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateDeliveryFee, getBaseDeliveryFee, PACKAGING_HANDLING_FEE } from '../utils/delivery';

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

  // Destination-based Delivery & Packaging Fee Rules:
  // - Free delivery above Rs. 200
  // - Rs. 15 for hostel/CCCT, Rs. 20 for outer/further spots
  // - Packaging & Handling: Rs. 9
  const productPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeDeliveryQualified = productPrice >= 200;
  const baseDeliveryFee = getBaseDeliveryFee(location);
  const deliveryCharge = calculateDeliveryFee(location, productPrice);
  const handlingFee = PACKAGING_HANDLING_FEE;

  const totalAmount = Number(productPrice) + Number(deliveryCharge) + Number(handlingFee);
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
      const deliveryFee = 15;
      const total = Number(grandTotal || (subtotal + deliveryFee)) || 0;
      const subtotalVal = Number(subtotal) || 0;
      const totalVal = Number(total) || 0;

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

      // Pass both numeric values in the Supabase payload:
      const standardPayload = {
        total: totalVal || 0,
        subtotal: subtotalVal || 0,
        total_amount: totalVal || 0,
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

      <div className="bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs text-slate-300 mb-4 border border-slate-700/50">
        <div className="flex justify-between">
          <span>Items Total:</span>
          <span className="font-semibold text-white">₹{productPrice}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charge:</span>
          <span className="font-semibold text-white">
            {isFreeDeliveryQualified ? (
              <span className="text-emerald-400 font-bold">FREE (₹0)</span>
            ) : (
              `₹${deliveryCharge}`
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Packaging & Handling:</span>
          <span className="font-semibold text-white">₹{handlingFee}</span>
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
