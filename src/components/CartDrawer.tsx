import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Zap, CheckCircle2, Bike, MapPin, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, CampusZone } from '../types';
import { recordCampusOrder } from '../lib/supabase';
import CheckoutForm from './CheckoutForm';
import { calculateDeliveryFee, getBaseDeliveryFee, PACKAGING_HANDLING_FEE } from '../utils/delivery';
import { OrderDispatchTracker } from './OrderDispatchTracker';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  selectedZone: CampusZone;
  isOutsideBoundary?: boolean;
  onOpenZoneSelector?: () => void;
  isStoreOpen?: boolean;
  onOpenCustomerOrders?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onClearCart,
  selectedZone,
  isOutsideBoundary = false,
  onOpenZoneSelector,
  isStoreOpen = true,
  onOpenCustomerOrders,
}) => {
  const [roomDetails, setRoomDetails] = useState('Room 204, 2nd Floor');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoStatus, setPromoStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);

  const productPrice = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const subtotal = productPrice;

  // Destination-based Delivery & Packaging Fee Rules:
  // - Free delivery above Rs. 200 (subtotal >= 200)
  // - Otherwise: Rs. 15 for hostel/CCCT, Rs. 20 for outer/further spots
  // - Packaging & Handling Fee: Rs. 9 (waived with promo code 'SHADOW')
  const isFreeDeliveryQualified = subtotal >= 200;
  const baseDeliveryFee = getBaseDeliveryFee(selectedZone);
  const deliveryFee = calculateDeliveryFee(selectedZone, subtotal);
  const isFreeHandlingQualified = appliedPromo === 'SHADOW' || subtotal >= 200;
  const handlingFee = isFreeHandlingQualified ? 0 : PACKAGING_HANDLING_FEE;
  const deliveryCharge = deliveryFee;
  const totalAmount = subtotal > 0 ? subtotal + deliveryFee + handlingFee : 0;
  const grandTotal = totalAmount;

  // Real-time stock verification for cart items
  const outOfStockItems = cartItems.filter(
    (item) =>
      item.product?.inStock === false ||
      (typeof item.product?.stockCount === 'number' && item.product.stockCount <= 0)
  );
  const hasOutOfStockItems = outOfStockItems.length > 0;

  const handleApplyPromo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();
    if (cleanCode === 'SHADOW') {
      setAppliedPromo('SHADOW');
      setPromoStatus({
        type: 'success',
        message: 'Special promo applied: Handling fee waived!',
      });
    } else {
      setAppliedPromo(null);
      setPromoStatus({
        type: 'error',
        message: 'Invalid promo code',
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoStatus({ type: null, message: '' });
  };

  const handleCheckout = async () => {
    if (!isStoreOpen) {
      setPromoStatus({ type: 'error', message: 'Store is currently closed for orders.' });
      return;
    }
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => ({
        id: item.product.id,
        product_id: item.product.id,
        name: item.product.name,
        quantity: Number(item.quantity || 1),
        price: Number(item.product.price || 0),
      }));

      const res = await recordCampusOrder({
        items: orderItems,
        total: grandTotal,
        deliveryZone: selectedZone.name,
        roomDetails,
        handlingFee: handlingFee,
        deliveryFee: deliveryFee,
      });

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF3B30', '#FFD60A', '#0A84FF', '#30D158'],
      });

      setPlacedOrder(res.order);
      onClearCart();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="cart-drawer-container" className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <motion.div
            key="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 max-w-full flex sm:pl-10 justify-end items-end sm:items-stretch pointer-events-none">
            <motion.div
              initial={{ y: '100%', x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: '100%', x: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full sm:w-screen sm:max-w-md max-h-[92vh] sm:max-h-full bg-white rounded-t-3xl sm:rounded-t-none shadow-2xl flex flex-col justify-between overflow-hidden pointer-events-auto border-t sm:border-t-0 sm:border-l border-gray-100"
            >
              {/* Drawer Header with Universal Back / Close Navigation */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF7]">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCheckoutFormOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutFormOpen(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                      title="Back to Bag"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-700" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-md shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-[#111111] font-display truncate">
                      {isCheckoutFormOpen ? 'Checkout' : 'Campus Bag'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                      {selectedZone.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutFormOpen(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  aria-label="Close cart"
                >
                  <span>Close</span>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Placed Order Success Modal View */}
              {placedOrder ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#30D158] flex items-center justify-center shadow-lg animate-bounce shrink-0">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    Order Confirmed & Runner Dispatched
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                      Order Placed Successfully!
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mt-1 mx-auto">
                      Order <strong>#{placedOrder.id}</strong> has been transmitted to our campus runner desk.
                    </p>
                  </div>

                  {/* Active 4-step progress tracker with quick actions */}
                  <OrderDispatchTracker
                    orderId={placedOrder.id}
                    status="Pending"
                    deliveryZone={placedOrder.delivery_address?.area || placedOrder.deliveryZone}
                    roomDetails={placedOrder.delivery_address?.roomNo || placedOrder.roomDetails}
                    totalAmount={placedOrder.total}
                    onTrackLive={() => {
                      setPlacedOrder(null);
                      setIsCheckoutFormOpen(false);
                      onClose();
                      if (onOpenCustomerOrders) onOpenCustomerOrders();
                    }}
                    showContactActions={true}
                  />

                  {/* Delivery Location Summary */}
                  <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2 text-xs">
                    {placedOrder.delivery_address ? (
                      <div className="pb-2 border-b border-gray-200">
                        <p className="font-semibold text-neutral-900">{placedOrder.delivery_address?.fullName}</p>
                        <p className="text-neutral-600">📞 {placedOrder.delivery_address?.phone}</p>
                        <p className="text-neutral-700 mt-1">
                          📍 {placedOrder.delivery_address?.area}, {placedOrder.delivery_address?.roomNo}
                        </p>
                        {placedOrder.delivery_address?.notes && (
                          <p className="text-xs text-neutral-500 mt-1 italic">Note: "{placedOrder.delivery_address?.notes}"</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Destination:</span>
                          <span className="font-bold text-gray-900">{placedOrder.deliveryZone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Room Info:</span>
                          <span className="font-bold text-gray-900">{placedOrder.roomDetails}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Delivery:</span>
                      <span className="font-bold text-[#0A84FF]">30 - 45 mins</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold text-gray-700">Payment:</span>
                      <span className="font-black text-gray-900">Cash on Delivery (₹{placedOrder.total})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPlacedOrder(null);
                      setIsCheckoutFormOpen(false);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-[#111111] hover:bg-black text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : cartItems.length === 0 ? (
                /* Empty Cart State */
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 font-display">
                    Your campus bag is empty
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Craving snacks, study supplies or chilled drinks? Add anything to get delivery within 30 - 45 mins.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#0A84FF] transition-all"
                  >
                    Explore Campus Favourites
                  </button>
                </div>
              ) : isCheckoutFormOpen ? (
                /* Checkout Form Screen */
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <CheckoutForm
                    isStoreOpen={isStoreOpen}
                    cartItems={cartItems}
                    grandTotal={grandTotal}
                    totalAmount={totalAmount}
                    subtotal={subtotal}
                    productPrice={productPrice}
                    deliveryFee={deliveryFee}
                    deliveryCharge={deliveryCharge}
                    handlingFee={handlingFee}
                    appliedPromo={appliedPromo}
                    onApplyPromo={(codeToApply: string) => {
                      const clean = codeToApply.trim().toUpperCase();
                      if (clean === 'SHADOW') {
                        setAppliedPromo('SHADOW');
                        setPromoInput('SHADOW');
                        setPromoStatus({
                          type: 'success',
                          message: 'Special promo applied: Handling fee waived!',
                        });
                        return { success: true, message: 'Special promo applied: Handling fee waived!' };
                      } else {
                        setAppliedPromo(null);
                        setPromoStatus({
                          type: 'error',
                          message: 'Invalid promo code',
                        });
                        return { success: false, message: 'Invalid promo code' };
                      }
                    }}
                    onRemovePromo={handleRemovePromo}
                    isOutsideBoundary={isOutsideBoundary}
                    initialArea={selectedZone.name}
                    onSelectCampusZone={() => {
                      setIsCheckoutFormOpen(false);
                      onClose();
                      onOpenZoneSelector?.();
                    }}
                    onCancel={() => setIsCheckoutFormOpen(false)}
                    onOrderSuccess={(orderId, deliveryAddress) => {
                      confetti({
                        particleCount: 90,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#FF3B30', '#FFD60A', '#0A84FF', '#30D158'],
                      });
                      setPlacedOrder({
                        id: orderId,
                        deliveryZone: deliveryAddress?.area || selectedZone.name,
                        roomDetails: deliveryAddress?.roomNo || 'Hostel Delivery Details Recorded',
                        delivery_address: deliveryAddress,
                        total: grandTotal,
                      });
                      setIsCheckoutFormOpen(false);
                      onClearCart();
                    }}
                  />
                </div>
              ) : (
                /* Active Cart Items List */
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {/* Store Closed Alert Banner */}
                  {!isStoreOpen && (
                    <div className="rounded-2xl bg-red-50 border border-red-300 p-3 text-xs font-bold text-red-900 flex items-center gap-2 shadow-xs">
                      <span className="text-base">⚠️</span>
                      <span>Store is Currently Closed — We are not accepting new orders right now. Check back soon!</span>
                    </div>
                  )}

                  {/* Express delivery tracker banner */}
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-300/60 p-3 text-xs font-medium text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Delivery within 30 - 45 mins (CCCT, SIST, Hostels & PGs)</span>
                    </span>
                  </div>

                  {/* Cart items */}
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => (
                      <div
                        key={item.product?.id ? `${item.product.id}-${idx}` : `cart-item-${idx}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-gray-200/60 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          {(item.product?.inStock === false ||
                            (typeof item.product?.stockCount === 'number' && item.product.stockCount <= 0)) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md mt-0.5">
                              ⚠️ Out of Stock
                            </span>
                          )}
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            ₹{item.product.price} • {item.product.unit}
                          </div>
                          <div className="text-xs font-black text-gray-900 mt-1">
                            ₹{item.product.price * item.quantity}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        {(() => {
                          const itemStock = typeof item.product.stock === 'number'
                            ? item.product.stock
                            : (typeof item.product.stockCount === 'number' ? item.product.stockCount : 999);
                          const isMaxStock = item.quantity >= itemStock;
                          return (
                            <div
                              style={{ pointerEvents: 'auto' }}
                              className="relative z-20 pointer-events-auto flex items-center bg-white rounded-xl border border-gray-200 p-0.5 shadow-2xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.product.minQuantity && item.product.minQuantity > 1 && item.quantity <= item.product.minQuantity) {
                                    onUpdateQuantity(item.product.id, 0);
                                  } else {
                                    onUpdateQuantity(item.product.id, item.quantity - 1);
                                  }
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{ pointerEvents: 'auto' }}
                                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer pointer-events-auto"
                                aria-label="Decrease"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="px-2 text-xs font-bold text-gray-800 min-w-[18px] text-center select-none pointer-events-none">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMaxStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isMaxStock) return;
                                  onUpdateQuantity(item.product.id, item.quantity + 1);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{ pointerEvents: 'auto' }}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors pointer-events-auto ${
                                  isMaxStock
                                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-600 cursor-pointer'
                                }`}
                                aria-label="Increase"
                                title={isMaxStock ? `Max available stock (${itemStock}) reached` : 'Increase'}
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>

                  {/* Hostel Room Specifier */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Hostel Wing & Room #
                    </label>
                    <input
                      type="text"
                      value={roomDetails}
                      onChange={(e) => setRoomDetails(e.target.value)}
                      placeholder="e.g., Room 314, Block B, 3rd Floor"
                      className="w-full text-xs sm:text-sm font-semibold text-gray-900 p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  {/* Promo code input */}
                  <div className="pt-2">
                    {Boolean(appliedPromo) ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Special promo applied: Handling fee waived!</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyPromo}>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Promo Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value);
                              if (promoStatus.type === 'error') {
                                setPromoStatus({ type: null, message: '' });
                              }
                            }}
                            placeholder="Enter promo code"
                            className="flex-1 text-xs uppercase font-bold text-gray-900 p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-white"
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {promoStatus.message && (
                          <p
                            className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1.5 ${
                              promoStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {promoStatus.type === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            )}
                            <span>{promoStatus.message}</span>
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Drawer Footer & Checkout Action */}
              {!placedOrder && !isCheckoutFormOpen && cartItems.length > 0 && (
                <div className="p-5 sm:p-6 border-t border-gray-100 bg-[#FAFAF7] space-y-3">
                  {/* Delivery Promo Badge / 50% OFF Announcement */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Delivery: ₹15 (50% OFF on ₹30)</span>
                    </span>
                    <span className="text-[10px] text-amber-900 bg-white/90 px-2 py-0.5 rounded-md font-extrabold border border-amber-300 shrink-0 uppercase">
                      50% OFF on Delivery Charges
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                    <div className="flex justify-between">
                      <span>Item Subtotal</span>
                      <span className="font-semibold text-gray-900">₹{subtotal}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="truncate pr-2 flex items-center gap-1.5">
                        <span>Runner Delivery Fee</span>
                        {isFreeDeliveryQualified ? (
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                            FREE
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                            50% OFF
                          </span>
                        )}
                      </span>
                      <span className="font-semibold flex-shrink-0 text-gray-900 flex items-center gap-1.5">
                        <span className="line-through text-gray-400 font-normal">Rs. 30</span>
                        {isFreeDeliveryQualified ? (
                          <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                        ) : (
                          <span className="text-gray-900 font-bold">Rs. 15</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span>Packaging & Handling Fee</span>
                        {subtotal >= 200 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                            FREE (Orders above ₹200)
                          </span>
                        )}
                      </span>
                      <span className="font-bold flex items-center gap-1.5">
                        {isFreeHandlingQualified ? (
                          <>
                            <span className="line-through text-gray-400 font-normal text-xs">Rs. 9</span>
                            <span className="text-emerald-600 font-black">FREE (₹0)</span>
                          </>
                        ) : (
                          <span className="text-gray-900 font-semibold">Rs. 9</span>
                        )}
                      </span>
                    </div>

                    {subtotal < 200 && subtotal > 0 && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Add items worth <strong>₹{200 - subtotal}</strong> more to unlock <strong>FREE Packaging & Handling!</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm sm:text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                      <span>To Pay</span>
                      <span>₹{grandTotal}</span>
                    </div>
                  </div>

                  {!isStoreOpen ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-4 bg-gray-400 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 px-6 cursor-not-allowed opacity-85"
                    >
                      <span>Store Closed for Deliveries</span>
                    </button>
                  ) : isOutsideBoundary ? (
                    <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>📍 Delivery Locked - Outside Campus Boundary</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-tight">
                        Delivery timeframe: Delivery within 30 - 45 mins (CCCT, SIST, Hostels & PGs). Coming Soon to your location!
                      </p>
                      {onOpenZoneSelector && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenZoneSelector();
                          }}
                          className="mt-1 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Select CCCT / SIST Drop Spot to Order
                        </button>
                      )}
                    </div>
                  ) : hasOutOfStockItems ? (
                    <div className="w-full space-y-2">
                      <div className="w-full p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">Some items in your cart are currently out of stock. Please remove them to proceed.</span>
                      </div>
                      <button
                        type="button"
                        disabled
                        className="w-full py-4 bg-neutral-300 text-neutral-500 font-extrabold rounded-2xl shadow-none flex items-center justify-center gap-2 px-6 cursor-not-allowed text-xs sm:text-sm"
                      >
                        <span>Remove Out-of-Stock Items to Checkout</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutFormOpen(true)}
                      className="w-full py-4 bg-[#FF3B30] hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-between px-6 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <div className="text-left">
                        <div className="text-[10px] text-red-100 font-medium uppercase tracking-wider">
                          Delivery within 45 mins - 1 hr (CCCT, SIST, Hostels & PGs)
                        </div>
                        <div className="text-base font-black">₹{grandTotal}</div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
