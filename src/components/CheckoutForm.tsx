import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Aapka supabase client path
import { recordCampusOrder, handleQuickOrder, placeFastOrder } from '../lib/supabase';
import { ShieldCheck, Truck, ArrowLeft } from 'lucide-react';

interface CheckoutFormProps {
  cartItems: any[];
  onOrderSuccess?: (orderId: string, deliveryAddress?: any) => void;
  onCancel?: () => void;
  grandTotal?: number;
}

export default function CheckoutForm({
  cartItems,
  onOrderSuccess,
  onCancel,
  grandTotal,
}: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    area: 'Campus Hostels',
    roomNo: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Phone validation
    if (formData.phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      // 1. Prepare Address JSON payload
      const addressPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        area: formData.area,
        roomNo: formData.roomNo,
        notes: formData.notes,
      };

      // 2. Calculate Order Total
      const mappedItems = cartItems.map((item: any) => ({
        id: item.id || item.product?.id || 'item',
        name: item.name || item.title || item.product?.name || 'Campus Item',
        quantity: item.quantity || 1,
        price: item.price !== undefined ? item.price : (item.product?.price || 0),
      }));

      const calculatedSubtotal = mappedItems.reduce(
        (acc: number, it: any) => acc + it.price * it.quantity,
        0
      );
      const orderTotal = grandTotal !== undefined ? grandTotal : calculatedSubtotal;

      let finalOrderId: string | null = null;

      // 3. Primary Fast Checkout: Direct single-roundtrip insert using placeFastOrder
      try {
        const fastOrder = await placeFastOrder(
          {
            name: formData.fullName,
            phone: formData.phone,
            zone: formData.area,
            room: formData.roomNo,
            notes: formData.notes,
          },
          mappedItems.map((it: any) => ({
            id: it.id,
            title: it.name,
            price: it.price,
            quantity: it.quantity,
          })),
          orderTotal
        );

        if (fastOrder?.id) {
          finalOrderId = fastOrder.order_number || fastOrder.id;
        }
      } catch (fastErr) {
        console.warn('placeFastOrder direct attempt notice, falling back:', fastErr);
      }

      // 4. Resilient Fallback to recordCampusOrder
      if (!finalOrderId) {
        const recordRes = await recordCampusOrder({
          customerName: formData.fullName,
          studentPhone: formData.phone,
          deliveryZone: formData.area,
          roomDetails: `${formData.roomNo}${formData.notes ? ` • Note: ${formData.notes}` : ''}`,
          deliveryAddress: addressPayload,
          items: mappedItems,
          total: orderTotal,
          paymentMethod: 'Cash on Delivery',
        });

        finalOrderId = recordRes.order.id;
      }

      if (!finalOrderId) {
        throw new Error('Could not generate order ID');
      }

      console.log(`Order placed successfully! Order ID: ${finalOrderId}`);

      if (onOrderSuccess) {
        onOrderSuccess(finalOrderId, addressPayload);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Order failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors mr-1"
              aria-label="Back to Cart"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Delivery Details</h2>
            <p className="text-xs text-neutral-500">10-Minute Campus Hostel Delivery</p>
          </div>
        </div>

        {grandTotal !== undefined && (
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Total Due (COD)</span>
            <span className="text-lg font-black text-neutral-900">₹{grandTotal}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Delivery Area
          </label>
          <select
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="College Main Gate (Fatak)">
              College Main Gate (Fatak)
            </option>
            <option value="Campus Hostels">Campus Hostels</option>
            <option value="Faculty Quarters">Faculty Quarters</option>
            <option value="Upper PG Area">Upper PG Area</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Room / Flat / Block No
          </label>
          <input
            type="text"
            name="roomNo"
            required
            value={formData.roomNo}
            onChange={handleChange}
            placeholder="e.g. Room 302, Hostel B"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Delivery Note (Optional)
          </label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Call when outside"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF3B30] text-white font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>{loading ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pay in cash or UPI at the doorstep • 0 extra fees</span>
        </div>
      </form>
    </div>
  );
}
export { CheckoutForm };
