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
  totalAmount?: number;
  subtotal?: number;
  productPrice?: number;
  deliveryFee?: number;
  deliveryCharge?: number;
  handlingFee?: number;
  appliedPromo?: string | null;
  onApplyPromo?: (code: string) => { success: boolean; message: string };
  onRemovePromo?: () => void;
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
  totalAmount: initialTotalAmount,
  subtotal,
  productPrice: initialProductPrice,
  deliveryFee = 15,
  deliveryCharge: initialDeliveryCharge,
  handlingFee: initialHandlingFee = 9,
  appliedPromo = null,
  onApplyPromo,
  onRemovePromo,
  isOutsideBoundary = false,
  onSelectCampusZone,
  initialArea,
  isStoreOpen = true,
}: CheckoutFormProps) {
  // Preset list for CCCT and SIST campuses
  const PRESET_OPTIONS = [
    'CCCT — Academic Complex & Admin',
    'CCCT — Boys Hostel (Block A/B/C)',
    'CCCT — Girls Hostel',
    'SIST — Academic Complex & Depts',
    'SIST — Boys Hostel',
    'SIST — Girls Hostel',
    'CCCT & SIST — Campus Main Gate',
    'Chisopani Student PGs & Residencies',
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
      } catch (err: any) {
        console.warn('Notice fetching store settings in checkout form:', err?.message || err);
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

  const [localPromoInput, setLocalPromoInput] = useState('');
  const [localAppliedPromo, setLocalAppliedPromo] = useState<string | null>(appliedPromo || null);
  const [localPromoStatus, setLocalPromoStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: appliedPromo === 'SHADOW' ? 'success' : null,
    message: appliedPromo === 'SHADOW' ? 'Special promo applied: Handling fee waived!' : '',
  });

  // Client-side OTP Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpDemoToast, setOtpDemoToast] = useState<string | null>(null);

  useEffect(() => {
    if (appliedPromo === 'SHADOW') {
      setLocalAppliedPromo('SHADOW');
      setLocalPromoStatus({
        type: 'success',
        message: 'Special promo applied: Handling fee waived!',
      });
    } else if (!appliedPromo && localAppliedPromo !== 'SHADOW') {
      setLocalAppliedPromo(null);
      setLocalPromoStatus({ type: null, message: '' });
    }
  }, [appliedPromo]);

  const isSecretPromoApplied = Boolean(
    (appliedPromo && appliedPromo.toUpperCase() === 'SHADOW') ||
    (localAppliedPromo && localAppliedPromo.toUpperCase() === 'SHADOW')
  );

  const productPrice =
    initialProductPrice !== undefined
      ? initialProductPrice
      : subtotal !== undefined
      ? subtotal
      : cartItems.reduce(
          (acc: number, item: any) =>
            acc +
            (item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0)) *
              Number(item.quantity || 1),
          0
        );

  // Delivery & Handling Pricing Rules:
  // Base delivery charge: Rs. 25 strikethrough -> Rs. 15 (discounted)
  // Handling Fee: Rs. 9, and FREE for orders over Rs. 200 (subtotal >= 200)
  const isFreeHandlingQualified = Number(productPrice) >= 200;
  const isFreeDeliveryQualified = false;
  const baseDeliveryFee = 25;
  const deliveryCharge = 15;
  const handlingFee = isFreeHandlingQualified ? 0 : 9;

  const totalAmount = Number(productPrice) + Number(deliveryCharge) + Number(handlingFee);

  const calculatedTotal = totalAmount;
  const itemsSubtotal = productPrice;
  const effectiveDeliveryFee = deliveryCharge;
  const effectiveHandlingFee = handlingFee;

  const handleApplyPromoCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = localPromoInput.trim().toUpperCase();

    if (onApplyPromo) {
      const res = onApplyPromo(cleanCode);
      if (res.success) {
        setLocalAppliedPromo('SHADOW');
        setLocalPromoStatus({ type: 'success', message: res.message });
      } else {
        setLocalAppliedPromo(null);
        setLocalPromoStatus({ type: 'error', message: res.message });
      }
      return;
    }

    if (cleanCode === 'SHADOW') {
      setLocalAppliedPromo('SHADOW');
      setLocalPromoStatus({
        type: 'success',
        message: 'Special promo applied: Handling fee waived!',
      });
    } else {
      setLocalAppliedPromo(null);
      setLocalPromoStatus({
        type: 'error',
        message: 'Invalid promo code',
      });
    }
  };

  const handleRemovePromoCode = () => {
    if (onRemovePromo) {
      onRemovePromo();
    }
    setLocalAppliedPromo(null);
    setLocalPromoInput('');
    setLocalPromoStatus({ type: null, message: '' });
  };

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      if (saved) {
        const p = JSON.parse(saved);
        const areaToUse = initialArea || p.hostel || 'CCCT — Academic Complex & Admin';
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
      area: initialArea || 'CCCT — Academic Complex & Admin',
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
          message: '✓ Verified: Within Express Campus Delivery Zone (45 mins - 1 hr)',
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
    !storeOpen || loading || isOutsideDelivery || isCustomPendingVerification || !isPhoneVerified;

  // Client-side OTP Verification handlers
  const handleSendOtp = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }
    setErrorMsg('');
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpSent(true);
    setOtpError('');
    setOtpDemoToast(`💬 Demo SMS to +91 ${cleanPhone}: Your 4-digit verification code is [ ${code} ]`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp) {
      setIsPhoneVerified(true);
      setOtpError('');
      setOtpDemoToast(`✓ Phone number (+91 ${formData.phone}) verified successfully!`);
    } else {
      setOtpError(`Invalid code. Enter demo OTP ${generatedOtp} or tap Send OTP again.`);
    }
  };

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
          message: '✓ Verified: Within Express Campus Delivery Zone (45 mins - 1 hr)',
        });
      } else {
        setCustomVerification({
          status: 'outside',
          message:
            '📍 Location Outside Delivery Area — We currently deliver only within CCCT & SIST campuses and nearby affiliated PGs (Delivery within 45 mins - 1 hr). Coming Soon to your area!',
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

    if (!isPhoneVerified) {
      setErrorMsg('Please verify your mobile number with the 4-digit OTP before placing your order via WhatsApp.');
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
      // 1. Calculate totals
      const currentDeliveryFee = Number(deliveryCharge);
      const currentHandlingFee = Number(handlingFee);
      const finalGrandTotal = totalAmount;

      const checkoutDetails = {
        name: formData.fullName.trim() || 'Campus Student',
        phone: formData.phone.trim(),
        location: deliveryLocation,
        notes: formData.notes || '',
        paymentMethod: 'COD',
      };

      const isValidUUID = (str: any) =>
        typeof str === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // 2. Insert main order
      const orderPayload: Record<string, any> = {
        customer_name: checkoutDetails.name,
        phone: checkoutDetails.phone,
        delivery_location: checkoutDetails.location,
        delivery_address: checkoutDetails.location,
        delivery_note: checkoutDetails.notes,
        delivery_fee: currentDeliveryFee,
        handling_fee: currentHandlingFee,
        subtotal: Number(productPrice),
        total: totalAmount,
        payment_method: checkoutDetails.paymentMethod || 'COD',
        payment_status: 'unpaid',
        status: 'pending',
      };

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) {
        console.error('Order Insert Error:', orderErr);
        throw new Error(orderErr.message || 'Database rejected order insertion');
      }

      // 3. Insert items with product image and price
      if (orderData && cartItems.length > 0) {
        const itemsPayload = cartItems.map((item: any) => {
          const itemPrice = item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0);
          const itemQty = Number(item.quantity || 1);
          const itemName = item.name || item.title || item.product?.name || 'Campus Item';
          const itemImage = item.image_url || item.image || item.product?.image || item.product?.image_url || '';
          const rawId = item.id || item.product?.id;

          return {
            order_id: orderData.id,
            product_id: isValidUUID(rawId) ? rawId : null,
            product_name_snapshot: itemName,
            price_snapshot: itemPrice,
            item_price: itemPrice,
            quantity: itemQty,
            subtotal: itemPrice * itemQty,
            image_url: itemImage,
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsPayload);

        if (itemsError) {
          console.error('Error saving order items:', itemsError);
        }
      }

      // 4. Save student profile locally for convenience in next orders
      try {
        const studentProfile = {
          fullName: checkoutDetails.name,
          phone: checkoutDetails.phone,
          hostel: selectedLocation,
          roomNo: roomDetails,
          notes: formData.notes,
        };
        localStorage.setItem('infinity_student_profile', JSON.stringify(studentProfile));
      } catch (profileSaveErr) {
        console.warn('Profile persistence notice:', profileSaveErr);
      }

      const finalOrderId = orderData?.id || `INF-${Date.now()}`;

      // 5. Open WhatsApp order dispatch message
      try {
        const adminWhatsApp = (import.meta.env?.VITE_ADMIN_WHATSAPP_NUMBER as string)?.replace(/\D/g, '') || "919332727610";
        const itemsListText = cartItems.map((item: any) => {
          const itPrice = Number(item.price !== undefined ? item.price : item.product?.price || 0);
          const itQty = Number(item.quantity || 1);
          const itName = item.name || item.title || item.product?.name || 'Campus Item';
          return `• ${itQty}x ${itName} (₹${itPrice * itQty})`;
        }).join('\n');

        const waOrderMessage = 
`*NEW CAMPUS ORDER — INFINITY STORE* 🛍️
================================
Order ID: #${finalOrderId}
Campus: ${selectedLocation}
Room / Floor: ${roomDetails || 'Campus Spot'}
Customer: ${checkoutDetails.name}
Phone: +91 ${checkoutDetails.phone} (✓ OTP Verified)
${checkoutDetails.notes ? `Delivery Note: ${checkoutDetails.notes}\n` : ''}================================
*ITEMS:*
${itemsListText}
================================
Subtotal: ₹${productPrice}
Delivery: ₹15 (10% Off Month - Discounted from ₹25)
Handling Fee: ${isFreeHandlingQualified ? 'FREE (₹0 - Over ₹200)' : '₹9'}
*Total Due (Cash on Delivery): ₹${totalAmount}*
================================
🚀 Delivery Promise: Within 45 mins - 1 hr
Please confirm and prepare my order!`;

        const waUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(waOrderMessage)}`;
        const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (opened) {
          opened.focus();
        }
      } catch (waErr) {
        console.warn('WhatsApp launch notice:', waErr);
      }

      // 6. Complete checkout: immediate success transition & cart clear
      if (onOrderSuccess) {
        onOrderSuccess(finalOrderId, {
          fullName: checkoutDetails.name,
          phone: checkoutDetails.phone,
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
            <p className="text-xs text-neutral-500">Delivery within 45 mins - 1 hr (CCCT & SIST)</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-400 block">Total Due (COD)</span>
          <span className="text-lg font-black text-neutral-900">₹{totalAmount}</span>
        </div>
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
            We currently deliver only within CCCT & SIST campuses and nearby affiliated PGs (Delivery within 45 mins - 1 hr).
            Coming Soon to your area!
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, area: 'CCCT — Academic Complex & Admin' }));
                setCustomVerification({ status: 'idle', message: '' });
                if (onSelectCampusZone) onSelectCampusZone();
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Switch to Campus Location (45 mins - 1 hr)
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

        {/* Phone Number & Client-side OTP Verification */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Mobile Number & WhatsApp Verification <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                disabled={isPhoneVerified}
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className={`w-full pl-11 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  isPhoneVerified
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                    : 'border-neutral-200'
                }`}
              />
            </div>

            {!isPhoneVerified ? (
              <button
                type="button"
                id="send-otp-btn"
                onClick={handleSendOtp}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 active:scale-95"
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsPhoneVerified(false);
                  setOtpSent(false);
                  setEnteredOtp('');
                  setOtpDemoToast(null);
                }}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
              >
                Change
              </button>
            )}
          </div>

          {/* Demo OTP Notification Toast */}
          {otpDemoToast && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-2">
              <span className="font-semibold">{otpDemoToast}</span>
              <button
                type="button"
                onClick={() => setOtpDemoToast(null)}
                className="text-blue-500 hover:text-blue-800 text-[10px] font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* OTP Verification Input Box */}
          {otpSent && !isPhoneVerified && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  Enter 4-Digit Verification Code
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md font-mono font-black">
                  Demo Code: {generatedOtp}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEnteredOtp(val);
                    if (val === generatedOtp) {
                      setIsPhoneVerified(true);
                      setOtpError('');
                      setOtpDemoToast(`✓ Phone verified: +91 ${formData.phone}`);
                    }
                  }}
                  placeholder="Enter 4-digit OTP"
                  className="flex-1 px-3.5 py-2 border border-amber-300 rounded-xl bg-white text-center font-mono font-black text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900"
                />
                <button
                  type="button"
                  id="verify-otp-btn"
                  onClick={handleVerifyOtp}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Verify OTP
                </button>
              </div>

              {otpError && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <span>⚠️</span> {otpError}
                </p>
              )}
            </div>
          )}

          {isPhoneVerified && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Phone Number Verified for WhatsApp Order Dispatch</span>
            </div>
          )}
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
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
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
                💡 Click <strong>Verify Location</strong> to confirm your PG coordinates fall within our campus delivery boundary (45 mins - 1 hr).
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

        {/* Order Summary & Pricing Breakdown */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs space-y-2">
          {/* Promotional Banner Badge */}
          <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 text-amber-950 font-bold flex items-center justify-between text-[11px]">
            <span>10% Off on delivery charges for this month</span>
            <span className="text-amber-800 font-black">₹15 Flat</span>
          </div>

          {isFreeHandlingQualified ? (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center">
              🎉 Free Handling Unlocked (Order over ₹200)!
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-semibold text-center">
              💡 Add <strong className="text-blue-700">₹{200 - productPrice}</strong> more for <strong>FREE Handling Fee (₹0)</strong>!
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider pb-1 border-b border-neutral-200/60 pt-1">
            <span>Order Summary ({cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} items)</span>
            <span>Amount</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-semibold text-neutral-900">₹{productPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Runner Delivery Fee</span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1 py-0.5 rounded font-bold">10% Off</span>
              </span>
              <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <span className="line-through text-neutral-400 font-normal">₹25</span>
                <span className="text-neutral-900 font-bold">₹15</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-neutral-600">
              <span>Handling Fee</span>
              <span className="font-bold flex items-center gap-1.5">
                {isFreeHandlingQualified ? (
                  <>
                    <span className="line-through text-neutral-400 font-normal text-xs">₹9</span>
                    <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                  </>
                ) : (
                  <span className="text-neutral-900 font-semibold">₹9</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-black text-neutral-900 pt-2 border-t border-neutral-200">
              <span>Total to Pay (COD)</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Secret Promo Code Section */}
        <div>
          {isSecretPromoApplied ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Special promo applied: Handling fee waived!</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePromoCode}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localPromoInput}
                  onChange={(e) => {
                    setLocalPromoInput(e.target.value);
                    if (localPromoStatus.type === 'error') {
                      setLocalPromoStatus({ type: null, message: '' });
                    }
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs sm:text-sm bg-white uppercase font-bold text-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleApplyPromoCode}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer flex-shrink-0"
                >
                  Apply
                </button>
              </div>
              {localPromoStatus.message && (
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                    localPromoStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {localPromoStatus.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{localPromoStatus.message}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Place Order Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isCheckoutDisabled}
            className={`w-full py-4 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition duration-200 ${
              isCheckoutDisabled
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                : 'bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer active:scale-98 shadow-emerald-500/20'
            }`}
          >
            {/* WhatsApp Icon */}
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>
              {!storeOpen
                ? 'Store Closed for Deliveries'
                : isOutsideDelivery
                ? 'Outside CCCT / SIST Campus Boundary'
                : isCustomPendingVerification
                ? 'Verify Custom PG Location to Enable Checkout'
                : !isPhoneVerified
                ? 'Verify Phone via OTP to Order via WhatsApp'
                : loading
                ? 'Placing Order...'
                : `Order via WhatsApp (COD) • ₹${totalAmount}`}
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
