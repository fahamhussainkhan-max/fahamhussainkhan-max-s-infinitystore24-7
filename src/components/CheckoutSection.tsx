import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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

  // Fixed Fees
  const DELIVERY_FEE = 15;
  const HANDLING_FEE = 9;

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = itemsTotal + DELIVERY_FEE + HANDLING_FEE;

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
      // 1. Insert Main Order with Postgres enum & column safety
      let orderData: any = null;
      let orderErr: any = null;

      // Primary insertion attempt matching database schema
      const res = await supabase
        .from('orders')
        .insert([{
          customer_name: name.trim(),
          phone: cleanPhone,
          delivery_location: location.trim(),
          delivery_address: location.trim(),
          delivery_fee: DELIVERY_FEE,
          handling_fee: HANDLING_FEE,
          rider_payout: DELIVERY_FEE,
          subtotal: itemsTotal,
          total: grandTotal,
          payment_method: 'COD',
          payment_status: 'unpaid',
          status: 'pending'
        }])
        .select()
        .single();

      orderData = res.data;
      orderErr = res.error;

      // Schema compatibility fallback
      if (orderErr) {
        console.warn('Primary order insert notice, trying alternative schema columns:', orderErr.message);
        const fallbackRes = await supabase
          .from('orders')
          .insert([{
            customer_name: name.trim(),
            customer_phone: cleanPhone,
            delivery_location: location.trim(),
            delivery_address: location.trim(),
            delivery_fee: DELIVERY_FEE,
            handling_fee: HANDLING_FEE,
            rider_payout: DELIVERY_FEE,
            total_amount: grandTotal,
            payment_method: 'COD',
            status: 'Pending'
          }])
          .select()
          .single();

        if (fallbackRes.error) {
          throw orderErr;
        }
        orderData = fallbackRes.data;
      }

      // 2. Insert Order Items with Images
      if (orderData && cart.length > 0) {
        const itemsPayload = cart.map(item => ({
          order_id: orderData.id,
          product_name_snapshot: item.name,
          price_snapshot: item.price,
          item_price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          image_url: item.image_url || ''
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
        if (itemsErr) {
          console.warn('Notice saving order items with snapshot columns, attempting legacy schema:', itemsErr.message);
          await supabase.from('order_items').insert(
            cart.map(item => ({
              order_id: orderData.id,
              product_name: item.name,
              quantity: item.quantity,
              item_price: item.price,
              image_url: item.image_url || ''
            }))
          );
        }
      }

      onSuccess(orderData.id);
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
          placeholder="Room / Hostel / Delivery Spot"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-400 text-white"
        />
      </div>

      <div className="bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs text-slate-300 mb-4 border border-slate-700/50">
        <div className="flex justify-between">
          <span>Items Total:</span>
          <span className="font-semibold text-white">₹{itemsTotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charge:</span>
          <span className="font-semibold text-white">₹{DELIVERY_FEE}</span>
        </div>
        <div className="flex justify-between">
          <span>Handling Fee:</span>
          <span className="font-semibold text-white">₹{HANDLING_FEE}</span>
        </div>
        <div className="flex justify-between font-bold text-sm text-emerald-400 border-t border-slate-700 pt-2 mt-1">
          <span>Total COD to Collect:</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isStoreOpen}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-xl text-sm transition cursor-pointer disabled:cursor-not-allowed shadow-lg active:scale-[0.99]"
      >
        {loading ? 'Placing Order...' : !isStoreOpen ? 'Store is Closed' : `Place COD Order • ₹${grandTotal}`}
      </button>
    </form>
  );
};

export default CheckoutSection;
