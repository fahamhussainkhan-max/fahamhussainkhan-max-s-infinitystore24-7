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
  Check,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { verifyGPSInsideBoundary } from '../utils/geolocation';
import { PACKAGING_HANDLING_FEE } from '../utils/delivery';
import { useAuth } from '../context/AuthContext';

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

// 1. Delivery Location Options: Three clear sections: 'CCCT', 'SIST', and 'Hostels / Custom PGs'
const LOCATION_SECTIONS = {
  CCCT: [
    'CCCT — Academic Complex & Admin',
    'CCCT — Boys Hostel (Block A/B/C)',
    'CCCT — Girls Hostel',
    'CCCT — Mech Dept (Workshop & Labs)',
    'CCCT — Main Security Gate',
  ],
  SIST: [
    'SIST — Academic Complex & Depts',
    'SIST — Boys Hostel',
    'SIST — Girls Hostel',
    'SIST — Mech Dept (Workshops)',
    'SIST — Main Security Gate',
  ],
  'Hostels / Custom PGs': [
    'Campus Boys Hostel (Hostel Area)',
    'Campus Girls Hostel (Hostel Area)',
    'Central Academic Quad & Study Hall',
    'Makaju PG / Chisopani Corridor',
    'Happy PG / Chisopani Road',
    'Chisopani Outer Residencies',
    'Custom PG / Other Specific Location',
  ],
};

type LocationSectionKey = 'CCCT' | 'SIST' | 'Hostels / Custom PGs';

export default function CheckoutForm({
  cartItems,
  onOrderSuccess,
  onCancel,
  grandTotal: propGrandTotal,
  totalAmount: propTotalAmount,
  subtotal: propSubtotal,
  productPrice: initialProductPrice,
  deliveryFee: propDeliveryFee,
  deliveryCharge: initialDeliveryCharge,
  handlingFee: initialHandlingFee,
  appliedPromo = null,
  onApplyPromo,
  onRemovePromo,
  isOutsideBoundary = false,
  onSelectCampusZone,
  initialArea,
  isStoreOpen = true,
}: CheckoutFormProps) {
  const { user, isAuthenticated, openLoginModal, signOut } = useAuth();
  const [storeOpen, setStoreOpen] = useState(isStoreOpen);

  useEffect(() => {
    setStoreOpen(isStoreOpen);
  }, [isStoreOpen]);

  // Realtime listener directly in checkout form for store settings
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

  // Active section tab: 'CCCT' | 'SIST' | 'Hostels / Custom PGs'
  const [activeSection, setActiveSection] = useState<LocationSectionKey>(() => {
    if (initialArea) {
      if (initialArea.includes('SIST') || initialArea.includes('sist')) return 'SIST';
      if (initialArea.includes('CCCT') || initialArea.includes('ccct')) return 'CCCT';
      return 'Hostels / Custom PGs';
    }
    return 'CCCT';
  });

  // Form Fields State with Auto-fill from authenticated user or profile
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      const p = saved ? JSON.parse(saved) : {};
      const areaToUse = initialArea || p.hostel || 'CCCT — Academic Complex & Admin';
      return {
        fullName: user?.name || p.fullName || '',
        email: user?.email || p.email || '',
        phone: p.phone || '',
        area: areaToUse,
        roomNo: p.roomNo || '',
        notes: p.notes || '',
      };
    } catch {
      return {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        area: initialArea || 'CCCT — Academic Complex & Admin',
        roomNo: '',
        notes: '',
      };
    }
  });

  // Auto-fill user name/email whenever authenticated user updates
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: user.email,
      }));
    }
  }, [user]);

  // 3. Location Verification State (Confirm user is within delivery parameters)
  const [locationVerification, setLocationVerification] = useState<{
    status: 'idle' | 'verifying' | 'inside' | 'outside' | 'error';
    message: string;
  }>(() => {
    if (!isOutsideBoundary && initialArea && !initialArea.includes('Custom')) {
      return {
        status: 'inside',
        message: '✓ Verified: Location confirmed within Campus Delivery Zone',
      };
    }
    return {
      status: 'idle',
      message: '',
    };
  });

  // Custom PG specific fields
  const isCustomOption =
    formData.area === 'Custom PG / Other Specific Location' ||
    (!Object.values(LOCATION_SECTIONS).flat().includes(formData.area) && Boolean(formData.area));

  const [customPgName, setCustomPgName] = useState(() => {
    if (!Object.values(LOCATION_SECTIONS).flat().includes(formData.area)) {
      return formData.area;
    }
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      : propSubtotal !== undefined
      ? propSubtotal
      : cartItems.reduce(
          (acc: number, item: any) =>
            acc +
            (item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0)) *
              Number(item.quantity || 1),
          0
        );

  // 3. Pricing & Delivery Display:
  // - Show delivery fee strikethrough: 'Rs. 25' struck out to 'Rs. 15' with a highlighted '10% OFF' discount badge.
  // - Handling Fee: Rs. 9 (waived with promo code 'SHADOW')
  const originalDeliveryFee = 25;
  const deliveryCharge = 15; // Discounted flat rate
  const isFreeHandlingQualified = isSecretPromoApplied;
  const handlingFee = isFreeHandlingQualified ? 0 : PACKAGING_HANDLING_FEE;
  const totalAmount = Number(productPrice) + Number(deliveryCharge) + Number(handlingFee);

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

  // Sync initialArea prop if changed
  useEffect(() => {
    if (initialArea) {
      if (LOCATION_SECTIONS.CCCT.includes(initialArea)) {
        setActiveSection('CCCT');
        setFormData((prev) => ({ ...prev, area: initialArea }));
      } else if (LOCATION_SECTIONS.SIST.includes(initialArea)) {
        setActiveSection('SIST');
        setFormData((prev) => ({ ...prev, area: initialArea }));
      } else {
        setActiveSection('Hostels / Custom PGs');
        setFormData((prev) => ({ ...prev, area: initialArea }));
        if (!LOCATION_SECTIONS['Hostels / Custom PGs'].includes(initialArea)) {
          setCustomPgName(initialArea);
        }
      }
    }
  }, [initialArea]);

  // 3. Location Verification Status
  const isLocationVerified = locationVerification.status === 'inside';

  // 3. Trigger Location Verifier check
  const handleVerifyDeviceLocation = async () => {
    setLocationVerification({
      status: 'verifying',
      message: 'Checking GPS coordinates against campus delivery geofence...',
    });

    try {
      const result = await verifyGPSInsideBoundary();
      if (result.isInside) {
        setLocationVerification({
          status: 'inside',
          message: '✓ Verified: You are within the Campus Express Delivery Zone.',
        });
      } else {
        setLocationVerification({
          status: 'outside',
          message: '📍 Outside Delivery Area: Current coordinates are outside campus delivery boundaries.',
        });
      }
    } catch (err: any) {
      setLocationVerification({
        status: 'error',
        message: err.message || 'Unable to access GPS location. Please allow browser location permissions.',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'area') {
      if (LOCATION_SECTIONS.CCCT.includes(value)) {
        setActiveSection('CCCT');
      } else if (LOCATION_SECTIONS.SIST.includes(value)) {
        setActiveSection('SIST');
      } else {
        setActiveSection('Hostels / Custom PGs');
      }
    }
  };

  // Handle final order submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeOpen) {
      setErrorMsg('Store is currently closed for deliveries. Please check back soon.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty. Add items before checking out.');
      return;
    }

    // 2. Require Google Authentication before placing order
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    // 3. Location verification requirement
    if (!isLocationVerified) {
      setErrorMsg('Please verify your location to confirm you are within campus delivery parameters.');
      return;
    }

    const rawDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for the delivery runner.');
      return;
    }

    if (!formData.roomNo.trim()) {
      setErrorMsg('Please enter your Room / Flat / Floor Number so the runner can reach you.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const selectedLocation = isCustomOption
      ? customPgName.trim() || formData.area
      : formData.area;
    const roomDetails = formData.roomNo.trim();
    const deliveryLocation = `${selectedLocation} - Room: ${roomDetails || 'N/A'}`;

    try {
      const currentDeliveryFee = Number(deliveryCharge);
      const currentHandlingFee = Number(handlingFee);

      const checkoutDetails = {
        name: formData.fullName.trim() || user?.name || 'Campus Student',
        email: user?.email || formData.email || '',
        phone: cleanPhone,
        location: deliveryLocation,
        notes: formData.notes || '',
        paymentMethod: 'COD',
      };

      const isValidUUID = (str: any) =>
        typeof str === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // 1. Insert main order
      const orderPayload: Record<string, any> = {
        customer_name: checkoutDetails.name,
        phone: checkoutDetails.phone,
        customer_phone: checkoutDetails.phone,
        delivery_location: checkoutDetails.location,
        delivery_address: checkoutDetails.location,
        delivery_note: checkoutDetails.notes,
        delivery_fee: currentDeliveryFee,
        handling_fee: currentHandlingFee,
        subtotal: Number(productPrice),
        total: totalAmount,
        total_amount: totalAmount,
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

      // 2. Insert items with product image and price
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

      // 3. Save student profile locally for convenience in next orders
      try {
        const studentProfile = {
          fullName: checkoutDetails.name,
          email: checkoutDetails.email,
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

      // 4. Open WhatsApp order dispatch message
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
Email: ${checkoutDetails.email || 'N/A'} (✓ Google Authenticated)
Phone: +91 ${checkoutDetails.phone}
${checkoutDetails.notes ? `Delivery Note: ${checkoutDetails.notes}\n` : ''}================================
*ITEMS:*
${itemsListText}
================================
Subtotal: ₹${productPrice}
Delivery: ₹15 (10% OFF Discount - was ₹25)
Packaging & Handling: ${isFreeHandlingQualified ? 'FREE (₹0 - Promo Waived)' : '₹9'}
*Total Due (Cash on Delivery): ₹${totalAmount}*
================================
🚀 Delivery timeframe: Delivery within 45 mins - 1 hr (CCCT, SIST, Hostels & PGs)
Please confirm and prepare my order!`;

        const waUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(waOrderMessage)}`;
        const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (opened) {
          opened.focus();
        }
      } catch (waErr) {
        console.warn('WhatsApp launch notice:', waErr);
      }

      // 5. Complete checkout: immediate success transition & cart clear
      if (onOrderSuccess) {
        onOrderSuccess(finalOrderId, {
          fullName: checkoutDetails.name,
          email: checkoutDetails.email,
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
    <div className="max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-neutral-100 relative">
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
            <h2 className="text-xl font-bold text-neutral-900 font-display">Delivery Details</h2>
            <p className="text-xs text-neutral-500">
              Delivery within 45 mins - 1 hr (CCCT, SIST, Hostels & PGs)
            </p>
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

      {/* 2. Google Authentication Status / Sign In Prompt */}
      <div className="mb-4">
        {isAuthenticated && user ? (
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-blue-300 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-blue-950 truncate flex items-center gap-1.5">
                  <span>{user.name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    ✓ Google Verified
                  </span>
                </div>
                <div className="text-[11px] text-blue-700 truncate">{user.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="text-[11px] text-blue-600 hover:text-blue-900 font-semibold underline cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-blue-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-900">
                {/* Official Google G Logo */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google Sign-In Required</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Please sign in with Google to place orders and receive order receipts.
              </p>
            </div>

            <button
              type="button"
              id="checkout-google-signin-btn"
              onClick={openLoginModal}
              className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs rounded-xl border border-neutral-300 shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Full Name (Auto-filled from Google) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          />
        </div>

        {/* 1. Normal Contact Phone Number (Strictly for delivery agents, zero OTPs) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Contact Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
              +91
            </span>
            <input
              type="tel"
              name="phone"
              required
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number for delivery agent"
              className="w-full pl-11 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Our student delivery runner will call this number when arriving at your delivery spot.
          </p>
        </div>

        {/* 1. Campus Delivery Location: Three clear sections ('CCCT', 'SIST', and 'Hostels / Custom PGs') */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              Campus Delivery Location <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              10% OFF Delivery
            </span>
          </div>

          {/* Quick Section Switcher Tabs */}
          <div className="flex p-1 bg-neutral-100 rounded-xl mb-2 gap-1">
            {(['CCCT', 'SIST', 'Hostels / Custom PGs'] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setActiveSection(sec);
                  const firstSpot = LOCATION_SECTIONS[sec][0];
                  setFormData((prev) => ({ ...prev, area: firstSpot }));
                }}
                className={`flex-1 py-1.5 px-1 text-xs font-bold rounded-lg transition text-center truncate cursor-pointer ${
                  activeSection === sec
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Clearly sectioned dropdown using optgroup */}
          <select
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium cursor-pointer"
          >
            <optgroup label="── CCCT ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS.CCCT.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>

            <optgroup label="── SIST ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS.SIST.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>

            <optgroup label="── Hostels / Custom PGs ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS['Hostels / Custom PGs'].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 3. Location Verifier Feature to ensure user is within campus parameters */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
              <Navigation className="w-4 h-4 text-[#0A84FF] shrink-0" />
              <span>Campus Delivery Location Verifier</span>
              <span className="text-[10px] text-red-500 font-bold">*Required</span>
            </div>
            {isLocationVerified && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Inside Zone
              </span>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Delivery timeframe: <strong>Delivery within 45 mins - 1 hr (CCCT, SIST, Hostels & PGs)</strong>. Verify your location to proceed.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="verify-gps-location-btn"
              onClick={handleVerifyDeviceLocation}
              disabled={locationVerification.status === 'verifying'}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              {locationVerification.status === 'verifying' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD60A]" />
                  <span>Checking GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>{isLocationVerified ? 'Re-verify with GPS' : 'Verify Location (GPS)'}</span>
                </>
              )}
            </button>

            {!isLocationVerified && (
              <button
                type="button"
                onClick={() => {
                  setLocationVerification({
                    status: 'inside',
                    message: `✓ Verified: On-Campus Spot confirmed (${formData.area}). Within campus parameters.`,
                  });
                }}
                className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-xl transition cursor-pointer border border-neutral-200"
              >
                Confirm Campus Spot
              </button>
            )}
          </div>

          {/* Verification feedback */}
          {locationVerification.status === 'inside' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{locationVerification.message}</span>
            </div>
          )}

          {locationVerification.status === 'outside' && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{locationVerification.message}</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Please confirm your campus spot or select a location within the CCCT & SIST perimeter.</p>
              </div>
            </div>
          )}

          {locationVerification.status === 'error' && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationVerification.message}</span>
            </div>
          )}
        </div>

        {/* Custom PG input if selected */}
        {isCustomOption && (
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-2">
            <label className="block text-xs font-bold text-neutral-800">
              Custom PG / Building Name & Landmark <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customPgName}
              onChange={(e) => setCustomPgName(e.target.value)}
              placeholder="e.g. Makaju PG Wing 2, Near Chisopani Turn"
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm bg-white"
            />
          </div>
        )}

        {/* Room / Flat / Floor Number */}
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

        {/* 3. Pricing & Delivery Display */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs space-y-2.5">
          {/* Promotional Banner Badge showing 10% OFF */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 text-amber-950 font-bold flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>10% OFF on delivery charges for this month</span>
            </div>
            <span className="text-[11px] text-amber-900 bg-white/90 px-2 py-0.5 rounded-md font-extrabold border border-amber-300 shrink-0">
              ₹15 FLAT
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider pb-1 border-b border-neutral-200/60 pt-1">
            <span>Order Summary ({cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} items)</span>
            <span>Amount</span>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-semibold text-neutral-900">₹{productPrice}</span>
            </div>

            {/* Delivery fee with Rs 25 strikethrough, followed by Rs 15, and 10% OFF discount badge */}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Runner Delivery Fee</span>
                <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                  10% OFF
                </span>
              </span>
              <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <span className="line-through text-neutral-400 font-normal text-xs">Rs. {originalDeliveryFee}</span>
                <span className="text-neutral-900 font-extrabold text-sm">Rs. {deliveryCharge}</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span>Packaging & Handling Fee</span>
              <span className="font-bold flex items-center gap-1.5">
                {isFreeHandlingQualified ? (
                  <>
                    <span className="line-through text-neutral-400 font-normal text-xs">Rs. 9</span>
                    <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                  </>
                ) : (
                  <span className="text-neutral-900 font-semibold">Rs. 9</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm font-black text-neutral-900 pt-2 border-t border-neutral-200">
              <span>Total to Pay (COD)</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Promo Code Section */}
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
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={openLoginModal}
              className="w-full py-4 bg-white hover:bg-neutral-50 text-neutral-800 font-extrabold rounded-2xl flex items-center justify-center gap-2.5 shadow-md border-2 border-neutral-200 hover:border-neutral-300 transition duration-200 cursor-pointer active:scale-98"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google to Place Order • ₹{totalAmount}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!storeOpen || loading || !isLocationVerified}
              className={`w-full py-4 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition duration-200 ${
                !storeOpen || loading || !isLocationVerified
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer active:scale-98 shadow-emerald-500/20'
              }`}
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>
                {!storeOpen
                  ? 'Store Closed for Deliveries'
                  : !isLocationVerified
                  ? 'Verify Location to Place Order'
                  : loading
                  ? 'Placing Order...'
                  : `Order via WhatsApp (COD) • ₹${totalAmount}`}
              </span>
            </button>
          )}
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
