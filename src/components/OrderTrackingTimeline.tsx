import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CookingPot,
  Bike,
  PackageCheck,
  Package,
  MapPin,
  Phone,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Truck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminOrder, OrderStatus } from '../types';

interface OrderTrackingTimelineProps {
  order: AdminOrder;
  onBack: () => void;
  onClose?: () => void;
  onStatusUpdate?: (updatedOrder: AdminOrder) => void;
}

interface TimelineStep {
  id: string;
  statusKey: OrderStatus | 'Received';
  title: string;
  subtitle: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  estimatedTimeText: string;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  order: initialOrder,
  onBack,
  onClose,
  onStatusUpdate,
}) => {
  const [currentOrder, setCurrentOrder] = useState<AdminOrder>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [callingRunner, setCallingRunner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Normalize order status to numerical step
  // 1: Received / Placed / Confirmed / Pending
  // 2: Preparing / ready
  // 3: Out for Delivery
  // 4: Delivered
  const getStepIndex = (status: string = ''): number => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'delivered') return 4;
    if (s.includes('out') || s.includes('delivery') || s.includes('dispatched') || s.includes('transit')) return 3;
    if (s.includes('prep') || s.includes('pack') || s.includes('ready')) return 2;
    return 1; // pending, confirmed, received, placed
  };

  const activeStep = getStepIndex(currentOrder.status);

  // Order timeline milestones
  const steps: TimelineStep[] = [
    {
      id: 'received',
      statusKey: 'Received',
      title: 'Order Received',
      subtitle: 'Verified by Campus Store',
      detail: 'Order recorded, kitchen/store alert triggered',
      icon: PackageCheck,
      accentColor: 'text-[#0A84FF] bg-blue-50 border-blue-200',
      estimatedTimeText: 'Just now',
    },
    {
      id: 'preparing',
      statusKey: 'Preparing',
      title: 'Preparing & Packing',
      subtitle: 'At Campus Dispatch Hub',
      detail: 'Items picked from inventory and sealed in security bag',
      icon: CookingPot,
      accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
      estimatedTimeText: '2–4 mins',
    },
    {
      id: 'out_for_delivery',
      statusKey: 'Out for Delivery',
      title: 'Out for Delivery',
      subtitle: 'Campus Runner En Route',
      detail: 'Express 10-min dash to your hostel room/gate',
      icon: Bike,
      accentColor: 'text-purple-600 bg-purple-50 border-purple-200',
      estimatedTimeText: '6–10 mins',
    },
    {
      id: 'delivered',
      statusKey: 'Delivered',
      title: 'Delivered',
      subtitle: 'Handed Over at Hostel',
      detail: 'Order fulfilled. Enjoy your snacks & supplies!',
      icon: CheckCircle2,
      accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      estimatedTimeText: 'Completed',
    },
  ];

  const handleCopyOrderId = () => {
    const textToCopy = currentOrder.order_number || currentOrder.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateNextStep = () => {
    let nextStatus: OrderStatus = 'Preparing';
    if (activeStep === 1) nextStatus = 'Preparing';
    else if (activeStep === 2) nextStatus = 'Out for Delivery';
    else if (activeStep === 3) {
      nextStatus = 'Delivered';
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0A84FF', '#30D158', '#FFD60A', '#FF3B30'],
      });
    } else {
      nextStatus = 'Pending';
    }

    const updated = {
      ...currentOrder,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    setCurrentOrder(updated);
    onStatusUpdate?.(updated);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleCallRunner = () => {
    setCallingRunner(true);
    setTimeout(() => {
      setCallingRunner(false);
      alert('Connecting to campus runner Vikram (+91 98765 00192)...');
    }, 800);
  };

  const orderTime = new Date(currentOrder.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const orderDate = new Date(currentOrder.created_at).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Bar with Back Navigation */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#FAFAF7] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
          <span>Back to All Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors cursor-pointer"
            title="Refresh order status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
        {/* Order Identifier & Status Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#0A84FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0A84FF] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  Live Campus Tracking
                </span>
                <span className="text-xs text-neutral-400">
                  {orderTime} • {orderDate}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <h3 className="text-lg sm:text-xl font-black font-mono tracking-tight text-white">
                  {currentOrder.order_number || currentOrder.id}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  {currentOrder.delivery_zone} • {currentOrder.room_details}
                </span>
              </p>
            </div>

            {/* Live Status Pill */}
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                  currentOrder.status === 'Delivered'
                    ? 'bg-emerald-500 text-white'
                    : currentOrder.status === 'Out for Delivery'
                    ? 'bg-purple-500 text-white animate-pulse'
                    : currentOrder.status === 'Preparing'
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {currentOrder.status === 'Delivered' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : currentOrder.status === 'Out for Delivery' ? (
                  <Bike className="w-3.5 h-3.5" />
                ) : currentOrder.status === 'Preparing' ? (
                  <CookingPot className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{currentOrder.status}</span>
              </div>

              <span className="text-[11px] text-neutral-400">
                {currentOrder.status === 'Delivered'
                  ? 'Fulfilled & Closed'
                  : 'Est. 10–15 min campus rush'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Timeline Section */}
        <div className="bg-[#FAFAF7] rounded-3xl p-5 sm:p-6 border border-gray-200/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 font-display">
                Delivery Progress Timeline
              </h4>
              <p className="text-xs text-gray-500">
                Step-by-step dispatch from campus hub to your room
              </p>
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              onClick={handleSimulateNextStep}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 shadow-2xs hover:bg-gray-50 transition cursor-pointer"
              title="Click to simulate advancing order stage"
            >
              Advance Stage ⚡
            </button>
          </div>

          {/* Stepper Timeline */}
          <div className="relative pl-2 sm:pl-4">
            {/* Connecting Vertical Track Bar */}
            <div className="absolute left-[19px] sm:left-[27px] top-6 bottom-8 w-0.5 bg-gray-200 -z-0" />

            <div className="space-y-6 sm:space-y-7 relative z-10">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = activeStep > stepNum;
                const isCurrent = activeStep === stepNum;
                const isPending = activeStep < stepNum;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="flex items-start gap-3.5 sm:gap-4 group">
                    {/* Node Icon */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md'
                            : isCurrent
                            ? 'bg-[#0A84FF] text-white shadow-lg ring-4 ring-blue-100 scale-105'
                            : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>

                      {/* Animated Pulse Ring on current node */}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-2xl bg-blue-500/20 animate-ping pointer-events-none" />
                      )}
                    </div>

                    {/* Step Description & Details */}
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h5
                            className={`font-bold text-xs sm:text-sm ${
                              isCurrent
                                ? 'text-blue-900 font-extrabold'
                                : isCompleted
                                ? 'text-gray-900'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.title}
                          </h5>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 animate-pulse">
                              In Progress
                            </span>
                          )}

                          {isCompleted && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50">
                              Done
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] sm:text-xs font-semibold text-gray-400">
                          {isCompleted ? 'Completed' : isCurrent ? 'Now' : step.estimatedTimeText}
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-0.5 ${
                          isCurrent
                            ? 'text-gray-700 font-medium'
                            : isCompleted
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.subtitle}
                      </p>

                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Campus Runner Contact Card (if Preparing or Out for Delivery) */}
        {(activeStep === 2 || activeStep === 3) && (
          <div className="rounded-2xl p-4 bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-extrabold text-xs sm:text-sm text-purple-950">
                    Runner: Vikram S.
                  </h5>
                  <span className="text-[10px] font-bold bg-white text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200">
                    4.9 ★ (Campus Runner)
                  </span>
                </div>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Rushing directly to {currentOrder.delivery_zone}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCallRunner}
              disabled={callingRunner}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{callingRunner ? 'Dialing...' : 'Call Runner'}</span>
            </button>
          </div>
        )}

        {/* Items Summary & Delivery Address Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Items In Order */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                <span>Ordered Items ({currentOrder.items.length})</span>
              </span>
              <span className="text-xs font-black text-gray-900">₹{currentOrder.total_amount}</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-700 font-extrabold text-[10px] flex items-center justify-center">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Payment Method:</span>
              <span className="font-bold text-gray-800">
                {currentOrder.payment_method || 'Cash on Delivery'}
              </span>
            </div>
          </div>

          {/* Destination & Contact */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span>Campus Delivery Spot</span>
            </span>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">
                  Campus Zone
                </span>
                <span className="font-bold text-gray-900">{currentOrder.delivery_zone}</span>
              </div>

              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">
                  Room & Wing
                </span>
                <span className="font-semibold text-gray-800">{currentOrder.room_details}</span>
              </div>

              {currentOrder.delivery_address?.notes && (
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 mt-2">
                  <span className="font-bold text-gray-700 block">Hostel Instructions:</span>
                  <span>"{currentOrder.delivery_address.notes}"</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingTimeline;
