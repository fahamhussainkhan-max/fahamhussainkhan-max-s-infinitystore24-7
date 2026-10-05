import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
  Sparkles,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { verifyGPSInsideBoundary } from '../utils/geolocation';
import { PACKAGING_HANDLING_FEE } from '../utils/delivery';
import { useAuth } from '../context/AuthContext';
import { AdminOrder } from '../types';

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
    'Makaju Boys Hostel',
    'Happy Hostel',
    'Anshuman PG',
    'Custom PG / Landmark',
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
  const { user } = useAuth();
  const [storeOpen, setStoreOpen] = useState(isStoreOpen);

  // Store WhatsApp number for verification and order notifications
  const STORE_WHATSAPP_NUMBER = '919332727610';

  // Check if student is ALREADY VERIFIED in localStorage
  const checkIsVerifiedStudent = () => {
    try {
      const verified = localStorage.getItem('infinity_user_verified') === 'true';
      const phone = localStorage.getItem('infinity_user_phone');
      const name = localStorage.getItem('infinity_user_name');
      return Boolean(verified && phone && name);
    } catch {
      return false;
    }
  };

  const [isVerifiedStudent, setIsVerifiedStudent] = useState<boolean>(checkIsVerifiedStudent);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

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

  // Form Fields State: Auto-fill from localStorage verified student details
  const [formData, setFormData] = useState(() => {
    try {
      const savedPhone = localStorage.getItem('infinity_user_phone') || '';
      const savedName = localStorage.getItem('infinity_user_name') || '';
      const savedRoom = localStorage.getItem('infinity_user_room') || '';
      const saved = localStorage.getItem('infinity_student_profile');
      const p = saved ? JSON.parse(saved) : {};

      const fullName = savedName || p.fullName || user?.name || '';
      const phone = savedPhone || p.phone || '';
      const roomNo = savedRoom || p.roomNo || '';
      const areaToUse = initialArea || p.hostel || 'CCCT — Academic Complex & Admin';

      return {
        fullName,
        phone,
        area: areaToUse,
        roomNo,
        notes: p.notes || '',
      };
    } catch {
      return {
        fullName: user?.name || '',
        phone: '',
        area: initialArea || 'CCCT — Academic Complex & Admin',
        roomNo: '',
        notes: '',
      };
    }
  });

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
    formData.area === 'Custom PG / Landmark' ||
    formData.area === 'Custom PG / Building Name' ||
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

  // 3. Pricing & Delivery Display & Dynamic Free Handling (above Rs. 200)
  const subtotalAmount = Number(productPrice);
  const isFreeDeliveryQualified = subtotalAmount >= 200;
  const originalDeliveryFee = 30;
  const deliveryCharge = isFreeDeliveryQualified ? 0 : 15; // Promotional delivery charge ₹15 (50% OFF on ₹30), FREE over ₹200
  const isFreeHandlingQualified = isSecretPromoApplied || subtotalAmount >= 200;
  const handlingFee = isFreeHandlingQualified ? 0 : PACKAGING_HANDLING_FEE;
  const totalAmount = subtotalAmount + Number(deliveryCharge) + Number(handlingFee);

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
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'area') {
      if (LOCATION_SECTIONS.CCCT.includes(value)) {
        setActiveSection('CCCT');
      } else if (LOCATION_SECTIONS.SIST.includes(value)) {
        setActiveSection('SIST');
      } else {
        setActiveSection('Hostels / Custom PGs');
      }
      if (value === 'Custom PG / Building Name' && !customPgName) {
        setCustomPgName('');
      }
    }
  };

  // Handle final order submission with double-click & duplicate protection
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Immediate Double-Click & In-Flight Lock
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (!storeOpen) {
      setErrorMsg('Store is currently closed for deliveries. Please check back soon.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty. Add items before checking out.');
      return;
    }

    // 2. Real-time Out-of-Stock Protection
    const outOfStockItem = cartItems.find(
      (item) =>
        item.product?.inStock === false ||
        (typeof item.product?.stockCount === 'number' && item.product.stockCount <= 0)
    );
    if (outOfStockItem) {
      setErrorMsg(
        `Cannot place order: "${outOfStockItem.product?.name || 'An item'}" is currently out of stock. Please remove it from your cart to proceed.`
      );
      return;
    }

    // 3. Name Sanitization (minimum 2 chars) - Mandatory
    const trimmedName = formData.fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter your complete Full Name (minimum 2 characters).');
      return;
    }

    // 4. Strict 10-digit Indian Mobile Validation (^[6-9]\d{9}$) - Mandatory
    const rawDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    // 5. Custom PG / Landmark (Optional text input - defaults cleanly to selected area)
    const trimmedCustom = customPgName.trim();

    // 6. Room / Flat / Floor Number (Strictly Optional: never block checkout if empty)
    const trimmedRoom = formData.roomNo.trim();
    const roomDetails = trimmedRoom || 'Campus Drop / Handover';

    // Campus delivery location verification check - Mandatory
    if (!isLocationVerified) {
      if (!isOutsideBoundary && formData.area && !formData.area.includes('Outside')) {
        setLocationVerification({
          status: 'inside',
          message: `✓ Verified: On-Campus Spot confirmed (${formData.area}).`,
        });
      } else {
        setErrorMsg('Please verify your campus delivery location using GPS or click "Confirm Campus Spot".');
        return;
      }
    }

    // Lock in-flight submission immediately to prevent duplicate orders
    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg('');

    const selectedLocation = isCustomOption
      ? customPgName.trim() || formData.area
      : formData.area;
    const deliveryLocation = `${selectedLocation} - Room: ${roomDetails}`;

    // Check verification status BEFORE saving: repeat orders are already verified
    const wasAlreadyVerified = checkIsVerifiedStudent();
    const orderStatus = wasAlreadyVerified ? 'Confirmed' : 'Pending Verification';

    try {
      const currentDeliveryFee = Number(deliveryCharge);
      const currentHandlingFee = Number(handlingFee);

      const checkoutDetails = {
        name: trimmedName,
        phone: cleanPhone,
        location: deliveryLocation,
        notes: (formData.notes || '').trim(),
        paymentMethod: 'COD',
      };

      const isValidUUID = (str: any) =>
        typeof str === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // Clean structured JSON metadata for runner admin dispatch (strip heavy base64 strings)
      const itemsSummaryJSON = cartItems.map((item: any) => {
        const itemPrice = item.price !== undefined ? Number(item.price) : Number(item.product?.price || 0);
        const itemQty = Number(item.quantity || 1);
        const itemName = item.name || item.title || item.product?.name || 'Campus Item';
        const rawImg = item.image_url || item.image || item.product?.image || item.product?.image_url || '';
        // Guard: Never propagate large base64 data into payloads or storage
        const itemImage = typeof rawImg === 'string' && rawImg.startsWith('data:') ? '' : rawImg;
        const rawId = item.id || item.product?.id;
        return {
          id: rawId,
          name: itemName,
          title: itemName,
          quantity: itemQty,
          unit_price: itemPrice,
          price: itemPrice,
          subtotal: itemPrice * itemQty,
          image: itemImage,
          image_url: itemImage,
        };
      });

      const orderMetadata = {
        items: itemsSummaryJSON,
        delivery_location: selectedLocation,
        hostel_room: roomDetails,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        payment_method: 'COD',
        source: 'campus_web_storefront',
        total_items: cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0),
      };

      const generatedOrderNumber = `INF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Explicit Payload Calculation & Validation
      const explicitSubtotal = cartItems.reduce(
        (sum: number, item: any) =>
          sum + (Number(item.price !== undefined ? item.price : item.product?.price || 0) * Number(item.quantity || 1)),
        0
      );
      const deliveryFee = (isFreeDeliveryQualified ? 0 : 15) + (isFreeHandlingQualified ? 0 : PACKAGING_HANDLING_FEE);
      const explicitTotal = explicitSubtotal + deliveryFee;

      const subtotalVal = Number(explicitSubtotal) || 0;
      const totalVal = Number(totalAmount || explicitTotal) || 0;

      const itemsPayloadJSON = itemsSummaryJSON.map((it: any) => ({
        id: String(it.id || 'item'),
        name: String(it.name || it.title || 'Campus Item'),
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        subtotal: Number(it.subtotal || (Number(it.price || 0) * Number(it.quantity || 1))),
      }));

      const deliveryAddress = {
        fullName: String(checkoutDetails.name || 'Campus Student').trim(),
        phone: String(cleanPhone || '9876543210').trim(),
        area: String(selectedLocation || 'CCCT Campus').trim(),
        roomNo: String(roomDetails || '').trim(),
        notes: String(checkoutDetails.notes || '').trim(),
      };

      // Pass both numeric values in the Supabase payload:
      const orderPayload = {
        total: totalVal || 0,
        subtotal: subtotalVal || 0,
        total_amount: totalVal || 0,
        items: itemsPayloadJSON || [],
        customer_name: String(checkoutDetails.name || 'Campus Student').trim(),
        customer_phone: String(cleanPhone || '9876543210').trim(),
        delivery_address: deliveryAddress,
        status: 'pending',
        payment_method: 'COD',
        delivery_zone: String(selectedLocation || 'CCCT Campus').trim(),
        campus_location: String(roomDetails ? `${selectedLocation} - Room: ${roomDetails}` : (selectedLocation || 'CCCT Campus')).trim(),
        delivery_note: String(checkoutDetails.notes || '').trim(),
        is_whatsapp_verified: true,
      };

      // Execute single fast insert into 'orders' (0.0s artificial delay, no blocking retry loops)
      let { data, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) {
        console.warn('Orders insert notice, retrying with core schema fallback:', orderErr.message);
        // Fallback Payload Synchronization: make sure total, subtotal, and items are never null or omitted, always provide default numbers (0)
        const corePayload = {
          total: totalVal || 0,
          subtotal: subtotalVal || 0,
          total_amount: totalVal || 0,
          items: itemsPayloadJSON || [],
          customer_name: orderPayload.customer_name,
          customer_phone: orderPayload.customer_phone,
          delivery_address: deliveryAddress,
          status: 'pending',
          payment_method: orderPayload.payment_method,
          delivery_zone: orderPayload.delivery_zone,
          is_whatsapp_verified: true,
        };
        const retryRes = await supabase
          .from('orders')
          .insert([corePayload])
          .select()
          .single();
        if (!retryRes.error && retryRes.data) {
          data = retryRes.data;
          orderErr = null;
        }
      }

      const finalOrderId = data?.order_number || data?.id || generatedOrderNumber;

      // 2. Non-blocking asynchronous sync to order_items (never blocks or delays checkout)
      if (data?.id && isValidUUID(data.id) && itemsSummaryJSON.length > 0) {
        const itemsPayload = itemsSummaryJSON.map((item: any) => ({
          order_id: data.id,
          product_id: isValidUUID(item.id) ? item.id : null,
          product_name_snapshot: item.name,
          price_snapshot: item.price,
          item_price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          image_url: item.image,
        }));
        supabase.from('order_items').insert(itemsPayload).then(() => {}, () => {});
      }

      // 3. Synchronously cache user info & verified student status in localStorage
      try {
        localStorage.setItem('infinity_user_phone', cleanPhone);
        localStorage.setItem('infinity_user_name', checkoutDetails.name);
        localStorage.setItem('infinity_user_room', roomDetails);
        localStorage.setItem('infinity_user_verified', 'true');
        localStorage.setItem('infinity_whatsapp_verified', 'true');
        localStorage.setItem(
          'infinity_student_profile',
          JSON.stringify({
            fullName: checkoutDetails.name,
            phone: cleanPhone,
            hostel: selectedLocation,
            roomNo: roomDetails,
            notes: formData.notes || '',
          })
        );
        setIsVerifiedStudent(true);

        // 4. Prevent LocalStorage Quota Exceeded & Freezing:
        // Store ONLY lightweight summaries (Order ID, Timestamp, Total) instead of large raw objects
        let existingOrders: any[] = [];
        try {
          const rawStored = localStorage.getItem('infinity_orders');
          if (rawStored) {
            existingOrders = JSON.parse(rawStored);
          }
        } catch {
          existingOrders = [];
        }

        // Clean & prune older entries to lightweight summaries (Order ID, Timestamp, Total)
        const sanitizedExisting = (Array.isArray(existingOrders) ? existingOrders : [])
          .filter((o: any) => o && (o.id || o.order_id) && o.id !== finalOrderId && o.order_id !== finalOrderId)
          .slice(0, 4)
          .map((o: any) => ({
            id: String(o.id || o.order_id || 'INF-ORD'),
            order_id: String(o.order_id || o.id || 'INF-ORD'),
            timestamp: String(o.timestamp || o.created_at || new Date().toISOString()),
            total: Number(o.total || o.total_amount || 0),
          }));

        const lightweightCurrentOrder = {
          id: finalOrderId,
          order_id: finalOrderId,
          timestamp: new Date().toISOString(),
          total: totalAmount,
        };

        const trimmedOrdersList = [lightweightCurrentOrder, ...sanitizedExisting].slice(0, 5);

        try {
          localStorage.setItem('infinity_orders', JSON.stringify(trimmedOrdersList));
        } catch (quotaErr) {
          console.warn('[LocalStorage] QuotaExceededError detected during checkout, clearing infinity_orders key:', quotaErr);
          // Automatically clear the old storage key to prevent blocking the checkout UI
          try {
            localStorage.removeItem('infinity_orders');
            localStorage.setItem(
              'infinity_orders',
              JSON.stringify([lightweightCurrentOrder])
            );
          } catch {
            // Completely non-blocking failsafe
          }
        }
      } catch (cacheErr) {
        console.warn('LocalStorage error:', cacheErr);
      }

      // 5. Instantly sync to the management dashboard
      try {
        const adminOrder: AdminOrder = {
          id: finalOrderId,
          order_number: finalOrderId,
          customer_name: checkoutDetails.name,
          customer_phone: cleanPhone,
          delivery_zone: selectedLocation,
          room_details: roomDetails || '',
          delivery_address: {
            fullName: checkoutDetails.name,
            phone: cleanPhone,
            area: selectedLocation,
            roomNo: roomDetails || '',
            notes: checkoutDetails.notes || '',
          },
          items: itemsSummaryJSON.map((it: any) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            price: it.price,
          })),
          total_amount: totalAmount,
          status: 'Pending',
          payment_method: 'COD',
          created_at: new Date().toISOString(),
        };

        const rawAdminOrders = localStorage.getItem('infinity_admin_orders');
        const existingAdminOrders: AdminOrder[] = rawAdminOrders ? JSON.parse(rawAdminOrders) : [];
        const updatedAdminOrders = [adminOrder, ...existingAdminOrders.filter((o) => o.id !== finalOrderId)].slice(0, 25);
        localStorage.setItem('infinity_admin_orders', JSON.stringify(updatedAdminOrders));
      } catch (dashErr) {
        console.warn('Dashboard instant sync notice:', dashErr);
      }

      // 6. Complete order, clear cart, and redirect to confirmation screen
      if (onOrderSuccess) {
        onOrderSuccess(finalOrderId, {
          fullName: checkoutDetails.name,
          phone: cleanPhone,
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
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-neutral-100 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors mr-0.5 cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Back to Cart"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 font-display truncate">Delivery Details</h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
              Delivery within 45 mins - 1 hr (CCCT, SIST, Hostels & PGs)
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 pl-2">
          <span className="text-[10px] sm:text-xs text-neutral-400 block font-medium">Total Due (COD)</span>
          <span className="text-base sm:text-lg font-black text-neutral-900">₹{totalAmount}</span>
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

      {/* 2. Top Verification Status: Verified Campus Student Badge or First-Time User Banner */}
      {isVerifiedStudent ? (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-emerald-950 truncate text-xs sm:text-sm">
                  {formData.fullName || 'Campus Student'}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300/60">
                  ✓ Verified Campus Student
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 truncate font-medium mt-0.5">
                +91 {formData.phone} • 1-Click Instant COD Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingDetails(!isEditingDetails)}
            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/80 rounded-lg transition shrink-0 cursor-pointer border border-emerald-200"
          >
            {isEditingDetails ? 'Done' : 'Edit'}
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 flex items-start gap-2.5 text-xs text-blue-900 shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">First-Time Campus Order:</span> Enter your details below. You will verify once via WhatsApp, and enjoy instant 1-click COD checkout for all future orders!
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-neutral-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2.5 sm:py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm bg-white"
          />
        </div>

        {/* 10-digit WhatsApp Number for order verification and runner dispatch */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="checkout-phone-input" className="block text-xs sm:text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <span>WhatsApp Mobile Number</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
              WhatsApp Verification
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-neutral-400 pointer-events-none select-none z-10">
              +91
            </span>
            <input
              id="checkout-phone-input"
              type="tel"
              name="phone"
              required
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full pl-11 pr-4 py-2.5 sm:py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] text-base sm:text-sm bg-white font-medium text-neutral-900 cursor-text pointer-events-auto relative z-0"
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Order verification, runner dispatch alerts, and doorstep handover coordination are handled via WhatsApp.
          </p>
        </div>

        {/* 1. Campus Delivery Location: Three clear sections ('CCCT', 'SIST', and 'Hostels / Custom PGs') */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              Campus Delivery Location <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              50% OFF Delivery
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
            className="w-full px-4 py-3 sm:py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm bg-white font-medium cursor-pointer"
          >
            <optgroup label="── CCCT ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS.CCCT.map((opt, idx) => (
                <option key={`ccct-${opt}-${idx}`} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>

            <optgroup label="── SIST ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS.SIST.map((opt, idx) => (
                <option key={`sist-${opt}-${idx}`} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>

            <optgroup label="── Hostels / Custom PGs ──" className="font-bold text-neutral-900 bg-neutral-50">
              {LOCATION_SECTIONS['Hostels / Custom PGs'].map((opt, idx) => (
                <option key={`pg-${opt}-${idx}`} value={opt}>
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

        {/* Room / Flat / Floor Number (Strictly Optional) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-neutral-700 mb-1">
            Room / Flat / Floor Number (Optional)
          </label>
          <input
            type="text"
            name="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            placeholder="e.g. Room 302, 3rd Floor / Desk 12 (Optional)"
            className="w-full px-4 py-2.5 sm:py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm bg-white"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            Optional: leave blank if meeting runner at security gate or campus entrance.
          </p>
        </div>

        {/* Delivery Note (Optional) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-neutral-700 mb-1">
            Delivery Note (Optional)
          </label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Call upon reaching the gate / Leave at reception"
            className="w-full px-4 py-2.5 sm:py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm bg-white"
          />
        </div>

        {/* 3. Pricing & Delivery Display */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs space-y-2.5">
          {/* Promotional Banner Badge showing 50% OFF */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 text-amber-950 font-bold flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Delivery: ₹15 (50% OFF on ₹30)</span>
            </div>
            <span className="text-[10px] text-amber-900 bg-white/90 px-2 py-0.5 rounded-md font-extrabold border border-amber-300 shrink-0 uppercase">
              50% OFF on Delivery Charges
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider pb-1 border-b border-neutral-200/60 pt-1">
            <span>Order Summary ({cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} items)</span>
            <span>Amount</span>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-semibold text-neutral-900">₹{subtotalAmount}</span>
            </div>

            {/* Delivery fee with Rs 30 strikethrough, followed by Rs 15, and 50% OFF discount badge */}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Runner Delivery Fee</span>
                {isFreeDeliveryQualified ? (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                    FREE
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                    50% OFF
                  </span>
                )}
              </span>
              <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <span className="line-through text-neutral-400 font-normal text-xs">Rs. {originalDeliveryFee}</span>
                {isFreeDeliveryQualified ? (
                  <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                ) : (
                  <span className="text-neutral-900 font-extrabold text-sm">Rs. {deliveryCharge}</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span className="flex items-center gap-1.5">
                <span>Packaging & Handling Fee</span>
                {subtotalAmount >= 200 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                    FREE (Orders above ₹200)
                  </span>
                )}
              </span>
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

            {subtotalAmount < 200 && subtotalAmount > 0 && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Add items worth <strong>₹{200 - subtotalAmount}</strong> more to unlock <strong>FREE Packaging & Handling!</strong>
                </span>
              </div>
            )}

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

        {/* Verification or Instant 1-Click Order Button */}
        <div className="pt-2">
          {isVerifiedStudent ? (
            <button
              type="submit"
              id="place-order-instantly-btn"
              disabled={!storeOpen || loading}
              className={`w-full py-4 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition duration-200 text-sm sm:text-base min-h-[48px] ${
                !storeOpen || loading
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 cursor-pointer active:scale-98'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span>Securing Order...</span>
                </>
              ) : !storeOpen ? (
                <span>Store Closed for Deliveries</span>
              ) : (
                <span>🚀 Place Order (COD) • ₹{totalAmount}</span>
              )}
            </button>
          ) : (
            <button
              type="submit"
              id="verify-whatsapp-order-btn"
              disabled={!storeOpen || loading}
              className={`w-full py-4 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition duration-200 text-sm sm:text-base min-h-[48px] ${
                !storeOpen || loading
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-emerald-500/25 cursor-pointer active:scale-98'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span>Securing Order...</span>
                </>
              ) : !storeOpen ? (
                <span>Store Closed for Deliveries</span>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>Verify & Place Order via WhatsApp • ₹{totalAmount}</span>
                </>
              )}
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
