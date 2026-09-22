import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Zap, CheckCircle2, Bike, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, CampusZone } from '../types';
import { recordCampusOrder } from '../lib/supabase';
import CheckoutForm from './CheckoutForm';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  selectedZone: CampusZone;
  isOutsideBoundary?: boolean;
  onOpenZoneSelector?: () => void;
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
}) => {
  const [roomDetails, setRoomDetails] = useState('Room 204, 2nd Floor');
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);

  const FREE_DELIVERY_THRESHOLD = 150;
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const zoneFee = selectedZone.deliveryFee ?? 10;
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : zoneFee;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountApplied);
  const freeDeliveryShortfall = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'CAMPUS10' || code === 'EXAMCHILL') {
      const disc = Math.round(subtotal * 0.1);
      setDiscountApplied(disc);
      setPromoMessage(`10% Student Discount Applied (-₹${disc}) ✓`);
    } else if (code === 'FREEDELIVERY') {
      setDiscountApplied(deliveryFee);
      setPromoMessage('Free delivery unlocked! ✓');
    } else {
      setPromoMessage('Invalid promo code. Try "CAMPUS10" or "EXAMCHILL"');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const res = await recordCampusOrder({
        items: orderItems,
        total: grandTotal,
        deliveryZone: selectedZone.name,
        roomDetails,
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
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <motion.div
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
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-md">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#111111] font-display">
                      Campus Bag
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Delivering to {selectedZone.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCheckoutFormOpen(false);
                    onClose();
                  }}
                  className="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-200 transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Placed Order Success Modal View */}
              {placedOrder ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#30D158] flex items-center justify-center shadow-lg animate-bounce">
                    <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    Runner Dispatched
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 font-display">
                    Order Confirmed!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-xs">
                    Order <strong>#{placedOrder.id}</strong> has been sent to our campus hub. A verified student runner is packing your bag right now.
                  </p>

                  <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2 text-xs">
                    {/* order.delivery_address direct JSON object format me milta hai */}
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
                      <span className="text-gray-500">Est Arrival:</span>
                      <span className="font-bold text-[#0A84FF]">{selectedZone.estMinutes}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold text-gray-700">Payment:</span>
                      <span className="font-black text-gray-900">Cash on Delivery (₹{placedOrder.total})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPlacedOrder(null);
                      setIsCheckoutFormOpen(false);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-[#111111] hover:bg-black text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-sm"
                  >
                    Track or Continue Shopping
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
                    Craving snacks, study supplies or chilled drinks? Add anything to get 10-minute delivery.
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
                    cartItems={cartItems}
                    grandTotal={grandTotal}
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
                  {/* Free delivery tracker banner */}
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-300/60 p-3 text-xs font-medium text-amber-900 flex items-center justify-between">
                    {freeDeliveryShortfall > 0 ? (
                      <span>
                        Add <strong>₹{freeDeliveryShortfall}</strong> more for <strong>FREE campus delivery</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> You've unlocked FREE Campus Delivery!
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase bg-white/80 px-2 py-0.5 rounded-full">
                      ₹150 Free Tier
                    </span>
                  </div>

                  {/* Cart items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
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
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            ₹{item.product.price} • {item.product.unit}
                          </div>
                          <div className="text-xs font-black text-gray-900 mt-1">
                            ₹{item.product.price * item.quantity}
                          </div>
                        </div>

                        {/* Quantity Controls */}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.product.id, item.quantity + 1);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ pointerEvents: 'auto' }}
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer pointer-events-auto"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
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
                  <form onSubmit={handleApplyPromo} className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Student Promo Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Try 'CAMPUS10' or 'EXAMCHILL'"
                        className="flex-1 text-xs uppercase font-bold text-gray-900 p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-white"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className="text-[11px] font-semibold text-[#0A84FF] mt-1">
                        {promoMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}

              {/* Drawer Footer & Checkout Action */}
              {!placedOrder && !isCheckoutFormOpen && cartItems.length > 0 && (
                <div className="p-5 sm:p-6 border-t border-gray-100 bg-[#FAFAF7] space-y-3">
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Item Subtotal</span>
                      <span className="font-semibold text-gray-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate pr-2">Runner Delivery Fee ({selectedZone.name.split('(')[0].trim()})</span>
                      <span className="font-semibold flex-shrink-0">
                        {deliveryFee === 0 ? (
                          <span className="text-[#30D158] font-bold">FREE</span>
                        ) : (
                          `₹${deliveryFee}`
                        )}
                      </span>
                    </div>
                    {discountApplied > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount Applied</span>
                        <span>-₹{discountApplied}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm sm:text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                      <span>To Pay</span>
                      <span>₹{grandTotal}</span>
                    </div>
                  </div>

                  {isOutsideBoundary ? (
                    <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>📍 Delivery Locked - Outside Campus Boundary</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-tight">
                        We currently deliver exclusively within campus hostels and labs (10-15 min express). Coming Soon to your location!
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
                          Select Campus Drop Spot to Order
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutFormOpen(true)}
                      className="w-full py-4 bg-[#FF3B30] hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-between px-6 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <div className="text-left">
                        <div className="text-[10px] text-red-100 font-medium">10-MIN CAMPUS RUSH</div>
                        <div className="text-base font-black">₹{grandTotal}</div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        <span>Enter Delivery Details</span>
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
