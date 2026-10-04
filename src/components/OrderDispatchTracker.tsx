import React from 'react';
import { motion } from 'motion/react';
import {
  PackageCheck,
  MessageCircle,
  Bike,
  CheckCircle2,
  Check,
  Phone,
  Radio,
  ExternalLink,
} from 'lucide-react';

export interface OrderDispatchTrackerProps {
  orderId: string;
  status: string; // 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' etc.
  createdAt?: string;
  deliveryZone?: string;
  roomDetails?: string;
  totalAmount?: number;
  onTrackLive?: () => void;
  showContactActions?: boolean;
}

export const OrderDispatchTracker: React.FC<OrderDispatchTrackerProps> = ({
  orderId,
  status = 'Pending',
  createdAt,
  deliveryZone,
  roomDetails,
  totalAmount,
  onTrackLive,
  showContactActions = true,
}) => {
  // Map raw order status to active step (1 to 4)
  // 1: Order Placed
  // 2: WhatsApp Verified
  // 3: Packed & Dispatched
  // 4: Delivered to Room/Gate
  const getStepIndex = (rawStatus: string = ''): number => {
    const s = rawStatus.toLowerCase().trim();
    if (s === 'delivered') return 4;
    if (s.includes('out') || s.includes('delivery') || s.includes('dispatched') || s.includes('transit')) return 3;
    if (s.includes('prep') || s.includes('pack') || s.includes('ready')) return 3;
    if (s.includes('verif') || s.includes('confirm') || s.includes('whatsapp') || s.includes('accepted')) return 2;
    // Default initial step after placing order
    return 1;
  };

  const activeStep = getStepIndex(status);

  const steps = [
    {
      step: 1,
      title: 'Order Placed',
      subtitle: 'Recorded in campus dispatch',
      icon: PackageCheck,
    },
    {
      step: 2,
      title: 'WhatsApp Verified',
      subtitle: 'Confirmed via student runner',
      icon: MessageCircle,
    },
    {
      step: 3,
      title: 'Packed & Dispatched',
      subtitle: 'In 30-45 min campus transit',
      icon: Bike,
    },
    {
      step: 4,
      title: 'Delivered to Room/Gate',
      subtitle: 'Handed over safely',
      icon: CheckCircle2,
    },
  ];

  // Direct WhatsApp Runner dispatch link
  const waRunnerUrl = `https://wa.me/919332727610?text=${encodeURIComponent(
    `Hi Runner! I need an update on my Infinity Store order #${orderId || 'NEW'}`
  )}`;

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/90 shadow-sm space-y-4 sm:space-y-5 text-left">
      {/* Header Row: Title & Active Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-display">
              Live Dispatch Timeline
            </span>
            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
              #{orderId}
            </span>
          </div>
          {(deliveryZone || roomDetails) && (
            <p className="text-xs text-gray-500 mt-1">
              Destination: <strong className="text-gray-800">{deliveryZone || 'Campus Zone'}</strong>
              {roomDetails && ` • ${roomDetails}`}
            </p>
          )}
        </div>

        {totalAmount !== undefined && (
          <div className="text-right">
            <span className="text-sm sm:text-base font-black text-gray-900">₹{totalAmount}</span>
            <p className="text-[10px] font-semibold text-emerald-600">Cash on Delivery</p>
          </div>
        )}
      </div>

      {/* 4-Step Interactive Progress Tracker */}
      <div className="relative pt-1 pb-2">
        {/* Progress Bar Track (Desktop/Tablet) */}
        <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-gray-100 -z-0">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width:
                activeStep === 1
                  ? '12%'
                  : activeStep === 2
                  ? '40%'
                  : activeStep === 3
                  ? '72%'
                  : '100%',
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#0A84FF] via-[#30D158] to-emerald-500 rounded-full"
          />
        </div>

        {/* 4 Steps Grid (Responsive Desktop & Mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
          {steps.map((st) => {
            const isCompleted = activeStep > st.step;
            const isCurrent = activeStep === st.step;
            const Icon = st.icon;

            return (
              <div
                key={`dispatch-step-${st.step}`}
                className={`flex flex-col items-start sm:items-center text-left sm:text-center p-2.5 sm:p-2 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-blue-50/80 sm:bg-transparent border border-blue-200 sm:border-none'
                    : isCompleted
                    ? 'bg-emerald-50/40 sm:bg-transparent'
                    : 'opacity-60'
                }`}
              >
                {/* Node Circle */}
                <div className="relative mb-2">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#30D158] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[#0A84FF] text-white shadow-md ring-4 ring-blue-100 scale-105'
                        : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {isCurrent && (
                    <span className="absolute -inset-1 rounded-2xl bg-blue-500/20 animate-ping pointer-events-none" />
                  )}
                </div>

                {/* Step Title & Subtitle */}
                <div>
                  <div className="flex items-center gap-1 sm:justify-center">
                    <span className="text-[10px] font-black text-gray-400 sm:hidden">
                      {st.step}.
                    </span>
                    <h5
                      className={`text-xs sm:text-xs font-extrabold leading-tight ${
                        isCurrent
                          ? 'text-[#0A84FF]'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {st.title}
                    </h5>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-tight">
                    {st.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Contact Actions: WhatsApp Runner & Track Live Status */}
      {showContactActions && (
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Action 1: Direct WhatsApp Runner */}
          <a
            href={waRunnerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer select-none"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.2]" />
            <span>Need Help? WhatsApp Runner (+91 93327 27610)</span>
          </a>

          {/* Action 2: Track Live Status */}
          {onTrackLive && (
            <button
              type="button"
              onClick={onTrackLive}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#111111] hover:bg-black active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer select-none"
            >
              <Radio className="w-3.5 h-3.5 text-[#30D158] animate-pulse" />
              <span>Track Live Status</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
