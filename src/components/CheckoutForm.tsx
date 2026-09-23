import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { verifyGPSInsideBoundary } from '../utils/geolocation';

interface CheckoutFormProps {
  cartItems: any[];
  onOrderSuccess?: (orderId: string, deliveryAddress?: any) => void;
  onCancel?: () => void;
  grandTotal?: number;
  isOutsideBoundary?: boolean;
  onSelectCampusZone?: () => void;
  initialArea?: string;
  isStoreOpen?: boolean;
}

export default function CheckoutForm({
  cartItems,
  onOrderSuccess,
  onCancel,
  grandTotal,
  isOutsideBoundary = false,
  onSelectCampusZone,
  initialArea,
  isStoreOpen = true,
}: CheckoutFormProps) {
  // Preset list as required
  const PRESET_OPTIONS = [
    'Academic Complex & Main Campus',
    'Boys Hostel (Block A/B/C)',
    'Girls Hostel',
    'Campus Main Gate',
    'Library & Student Labs',
    'Upper PG & Outside PG Enclave',
    'Custom PG / Other Specific Location',
  ];

  const [storeOpen, setStoreOpen] = useState(isStoreOpen);

  useEffect(() => {
    setStoreOpen(isStoreOpen);
  }, [isStoreOpen]);

  // Realtime listener directly in checkout form
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'primary')
          .single();
        if (data && typeof data.is_open === 'boolean') {
          setStoreOpen(data.is_open);
        }
      } catch (err) {
        console.error('Error fetching store settings in checkout form:', err);
      }
    };

    fetchStatus();

    const channel = supabase
      .channel('public:store_settings:checkout-modal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload: any) => {
          if (payload.new && typeof payload.new.is_open === 'boolean') {
            setStoreOpen(payload.new.is_open);
          } else {
            fetchStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      if (saved) {
        const p = JSON.parse(saved);
        const areaToUse = initialArea || p.hostel || 'Academic Complex & Main Campus';
        return {
          fullName: p.fullName || '',
          phone: p.phone || '',
          area: areaToUse,
          roomNo: p.roomNo || '',
          notes: p.notes || '',
        };
      }
    } catch {}
    return {
      fullName: '',
      phone: '',
      area: initialArea || 'Academic Complex & Main Campus',
      roomNo: '',
      notes: '',
    };
  });

  // Custom PG specific fields and verification state
  const isCustomOption =
    formData.area === 'Custom PG / Other Specific Location' ||
    (!PRESET_OPTIONS.includes(formData.area) && Boolean(formData.area));

  const [customPgName, setCustomPgName] = useState(() => {
    if (!PRESET_OPTIONS.includes(formData.area)) {
      return formData.area;
    }
    return '';
  });

  const [customVerification, setCustomVerification] = useState<{
    status: 'idle' | 'verifying' | 'inside' | 'outside' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync initialArea prop if changed
  useEffect(() => {
    if (initialArea) {
      if (initialArea === 'Custom PG / Other Specific Location') {
        setFormData((prev) => ({ ...prev, area: 'Custom PG / Other Specific Location' }));
      } else if (PRESET_OPTIONS.includes(initialArea)) {
        setFormData((prev) => ({ ...prev, area: initialArea }));
      } else {
        setFormData((prev) => ({ ...prev, area: 'Custom PG / Other Specific Location' }));
        setCustomPgName(initialArea);
        setCustomVerification({
          status: 'inside',
          message: '✓ Verified: Within 10-15 Min Express Campus Delivery Zone',
        });
      }
    }
  }, [initialArea]);

  // Determine if delivery is outside boundary
  const isOutsideDelivery =
    isOutsideBoundary ||
    (isCustomOption && customVerification.status === 'outside');

  // If custom option is chosen, require verification to be inside before enabling checkout
  const isCustomPendingVerification =
    isCustomOption && customVerification.status !== 'inside';

  const isCheckoutDisabled =
    !storeOpen || loading || isOutsideDelivery || isCustomPendingVerification;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'area') {
      if (value === 'Custom PG / Other Specific Location') {
        setCustomVerification({ status: 'idle', message: '' });
      } else {
        setCustomVerification({ status: 'idle', message: '' });
      }
    }
  };

  // Run GPS verification for custom PG
  const handleVerifyCustomLocation = async () => {
    if (!customPgName.trim()) {
      setCustomVerification({
        status: 'error',
        message: 'Please enter your PG / Building / House Name & Landmark first.',
      });
      return;
    }

    setCustomVerification({
      status: 'verifying',
      message: 'Acquiring GPS coordinates & checking campus KML delivery boundary...',
    });

    try {
      const result = await verifyGPSInsideBoundary();

      if (result.isInside) {
        setCustomVerification({
          status: 'inside',
          message: '✓ Verified: Within 10-15 Min Express Campus Delivery Zone',
        });
      } else {
        setCustomVerification({
          status: 'outside',
          message:
            '📍 Location Outside Delivery Area — We currently deliver only within campus and nearby affiliated PGs (10-15 min express). Coming Soon to your area!',
        });
      }
    } catch (err: any) {
      setCustomVerification({
        status: 'error',
        message:
          err.message || 'GPS location permission denied. Please allow location access.',
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeOpen) {
      setErrorMsg('Store is currently closed for orders.');
      alert('Store is currently closed for orders.');
      return;
    }

    if (isOutsideDelivery) {
      setErrorMsg(
        'We currently deliver only within campus and nearby affiliated PGs. Please select a valid campus location.'
      );
      return;
    }

    if (isCustomOption && customVerification.status !== 'inside') {
      setErrorMsg(
        'Please verify your custom PG / Building location with GPS before placing your order.'
      );
      return;
    }

    if (!formData.roomNo.trim()) {
      setErrorMsg('Please enter your Room / Flat / Floor Number so the runner can reach you.');
      return;
    }

    if (formData.phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Determine final delivery location string
    const selectedLocation = isCustomOption
      ? customPgName.trim()
      : formData.area;
    const roomDetails = formData.roomNo.trim();
    const deliveryLocation = `${selectedLocation} - Room: ${roomDetails || 'N/A'}`;

    try {
      const calculatedSubtotal = cartItems.reduce(
        (acc: number, item: any) =>
          acc +
          (item.price !== undefined ? item.price : item.product?.price || 0) *
            (item.quantity || 1),
        0
      );
      const cartTotal = grandTotal !== undefined ? grandTotal : calculatedSubtotal;
      const customerName = formData.fullName.trim();
      const customerPhone = formData.phone.trim();

      const isValidUUID = (str: any) =>
        typeof str === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // 1. Insert into orders table using verified Supabase schema
      const orderPayload: Record<string, any> = {
        customer_name: customerName || 'Campus Student',
        phone: customerPhone || '',
        delivery_location: deliveryLocation,
        delivery_note: formData.notes || '',
        status: 'preparing',
        payment_method: 'COD',
        payment_status: 'unpaid',
        subtotal: Number(cartTotal),
        total: Number(cartTotal),
        delivery_fee: 0,
        discount: 0,
        delivery_address: deliveryLocation,
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderError) {
        console.error('Order Insert Error:', orderError);
        throw new Error(orderError.message || 'Database rejected order insertion');
      }

      // 2. Insert items using verified order_items schema
      if (cartItems && cartItems.length > 0 && orderData) {
        const itemsPayload = cartItems.map((item: any) => {
          const itemPrice = item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0);
          const itemQty = Number(item.quantity || 1);
          const rawId = item.id || item.product?.id;
          return {
            order_id: orderData.id,
            product_id: isValidUUID(rawId) ? rawId : null,
            product_name_snapshot: item.name || item.title || item.product?.name || 'Campus Item',
            price_snapshot: itemPrice,
            quantity: itemQty,
            subtotal: itemPrice * itemQty,
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsPayload);

        if (itemsError) {
          console.error('Order Items Insert Error:', itemsError);
        }
      }

      // 3. Save student profile locally for convenience in next orders
      try {
        const studentProfile = {
          fullName: customerName,
          phone: customerPhone,
          hostel: selectedLocation,
          roomNo: roomDetails,
          notes: formData.notes,
        };
        localStorage.setItem('infinity_student_profile', JSON.stringify(studentProfile));
      } catch (profileSaveErr) {
        console.warn('Profile persistence notice:', profileSaveErr);
      }

      const finalOrderId = orderData?.id || `INF-${Date.now()}`;

      // 4. Complete checkout: immediate success transition & cart clear
      if (onOrderSuccess) {
        onOrderSuccess(finalOrderId, {
          fullName: customerName,
          phone: customerPhone,
          area: selectedLocation,
          roomNo: roomDetails,
          notes: formData.notes,
        });
      }
    } catch (err: any) {
      console.error('Checkout failure:', err);
      const displayMsg = 'Failed to place order: ' + (err?.message || 'Check connection');
      setErrorMsg(displayMsg);
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
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors mr-1 cursor-pointer"
              aria-label="Back to Cart"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Delivery Details</h2>
            <p className="text-xs text-neutral-500">10-15 Min Campus Express Delivery (COD)</p>
          </div>
        </div>

        {grandTotal !== undefined && (
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Total Due (COD)</span>
            <span className="text-lg font-black text-neutral-900">₹{grandTotal}</span>
          </div>
        )}
      </div>

      {!storeOpen && (
        <div
          id="checkout-store-closed-banner"
          className="mb-4 p-3.5 bg-red-50 text-red-800 rounded-xl text-xs sm:text-sm border border-red-300 flex items-start gap-2 shadow-xs"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">
            ⚠️ Store is Currently Closed — We are not accepting new orders right now. Check back soon!
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          id="checkout-error-toast"
          className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm border border-red-200 flex items-start gap-2 shadow-xs animate-shake"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{errorMsg}</div>
        </div>
      )}

      {/* Outside Boundary Notice */}
      {isOutsideDelivery && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>📍 Location Outside Delivery Area</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            We currently deliver only within campus and nearby affiliated PGs (10-15 min express).
            Coming Soon to your area!
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, area: 'Academic Complex & Main Campus' }));
                setCustomVerification({ status: 'idle', message: '' });
                if (onSelectCampusZone) onSelectCampusZone();
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Switch to Campus Location (10-15 Mins)
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Full Name */}
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

        {/* Phone Number */}
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

        {/* Campus Delivery Location Dropdown */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Campus Delivery Location
          </label>
          <select
            name="area"
            value={
              PRESET_OPTIONS.includes(formData.area)
                ? formData.area
                : 'Custom PG / Other Specific Location'
            }
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium cursor-pointer"
          >
            <option value="Academic Complex & Main Campus">
              Academic Complex & Main Campus
            </option>
            <option value="Boys Hostel (Block A/B/C)">
              Boys Hostel (Block A/B/C)
            </option>
            <option value="Girls Hostel">
              Girls Hostel
            </option>
            <option value="Campus Main Gate">
              Campus Main Gate
            </option>
            <option value="Library & Student Labs">
              Library & Student Labs
            </option>
            <option value="Upper PG & Outside PG Enclave">
              Upper PG & Outside PG Enclave
            </option>
            <option value="Custom PG / Other Specific Location">
              Custom PG / Other Specific Location (GPS Verified)
            </option>
          </select>
        </div>

        {/* CUSTOM PG / MANUAL LOCATION INPUT & GPS VERIFICATION */}
        {isCustomOption && (
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Custom PG / Building Name & Landmark
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPgName}
                  onChange={(e) => {
                    setCustomPgName(e.target.value);
                    setCustomVerification({ status: 'idle', message: '' });
                  }}
                  placeholder="Enter your PG / Building / House Name & Landmark..."
                  className="flex-1 px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm bg-white"
                />

                <button
                  type="button"
                  id="checkout-verify-custom-location-btn"
                  onClick={handleVerifyCustomLocation}
                  disabled={customVerification.status === 'verifying'}
                  className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  {customVerification.status === 'verifying' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD60A]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-[#30D158]" />
                      <span>Verify Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verification Status Feedback */}
            {customVerification.status === 'inside' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{customVerification.message}</span>
              </div>
            )}

            {customVerification.status === 'outside' && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{customVerification.message}</span>
              </div>
            )}

            {customVerification.status === 'error' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {customVerification.message}
              </div>
            )}

            {customVerification.status === 'idle' && (
              <p className="text-[11px] text-neutral-500">
                💡 Click <strong>Verify Location</strong> to confirm your PG coordinates fall within our 10-15 min express delivery boundary.
              </p>
            )}
          </div>
        )}

        {/* ALWAYS PROMPT FOR ROOM / FLAT / FLOOR NUMBER */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Room / Flat / Floor Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomNo"
            required
            value={formData.roomNo}
            onChange={handleChange}
            placeholder="e.g. Room 302, 3rd Floor / Flat 4B / Desk 12"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            Required so our student delivery runner can hand over directly to your doorstep.
          </p>
        </div>

        {/* Delivery Note (Optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Delivery Note (Optional)
          </label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Call upon reaching the gate / Leave at reception"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Place Order Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isCheckoutDisabled}
            className={`w-full py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition ${
              isCheckoutDisabled
                ? 'bg-gray-400 cursor-not-allowed opacity-80'
                : 'bg-[#FF3B30] hover:bg-red-600 cursor-pointer active:scale-98'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>
              {!storeOpen
                ? 'Store Closed for Deliveries'
                : isOutsideDelivery
                ? 'Checkout Disabled — Outside Campus Boundary'
                : isCustomPendingVerification
                ? 'Verify Custom PG Location to Enable Checkout'
                : loading
                ? 'Placing Order...'
                : 'Place Order (Cash on Delivery)'}
            </span>
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
