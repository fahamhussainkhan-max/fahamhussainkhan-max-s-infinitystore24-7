import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, MapPin, Clock, ShieldCheck, ChevronDown, Check, Navigation, Sparkles } from 'lucide-react';
import { CAMPUS_ZONES } from '../data/mockData';
import { CampusZone } from '../types';
import { detectNearestCampusZone } from '../utils/geolocation';

interface DeliveryStatusCardProps {
  selectedZone: CampusZone;
  onSelectZone: (zone: CampusZone) => void;
  onToastMessage?: (msg: string) => void;
}

export const DeliveryStatusCard: React.FC<DeliveryStatusCardProps> = ({
  selectedZone,
  onSelectZone,
  onToastMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const result = await detectNearestCampusZone(CAMPUS_ZONES);
      onSelectZone(result.zone);
      if (onToastMessage) {
        onToastMessage(result.message);
      }
      setIsOpen(false);
    } catch (err: any) {
      if (onToastMessage) {
        onToastMessage(err.message || 'Could not auto-detect location');
      }
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-[#FAFAF7] to-white border border-gray-200/90 shadow-lg p-5 sm:p-6 lg:p-7">
        {/* Subtle decorative glowing corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#30D158]/10 via-[#0A84FF]/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left info column */}
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-black tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>⚡ FAST CAMPUS DELIVERY</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#111111] font-display tracking-tight">
              Your essentials are closer than you think.
            </h3>

            <p className="text-sm text-gray-600 font-medium">
              Available around your college & nearby area. Delivered straight to your hostel gate, floor, or study quad.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="w-4 h-4 text-[#0A84FF]" />
                <span>Avg. Arrival: <strong className="text-black">{selectedZone.estMinutes}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#30D158]" />
                <span>
                  Delivery: <strong className="text-black">₹{selectedZone.deliveryFee ?? 10}</strong> (Free &gt; ₹150)
                </span>
              </div>
            </div>
          </div>

          {/* Right zone selector & live status beacon */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3">
            {/* Live Availability Badge with Pulsing Green Pin */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
              </span>
              <span>Hub Online & Dispatching</span>
            </div>

            {/* Campus location dropdown button */}
            <div className="relative w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-2xl shadow-md transition-all active:scale-95 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        scale: [1, 1.25, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="p-1 rounded-full bg-[#30D158]/20 text-[#30D158]"
                    >
                      <MapPin className="w-4 h-4" />
                    </motion.div>
                    <div className="text-left">
                      <div className="text-[10px] text-gray-400 font-medium leading-none">Delivering to</div>
                      <div className="font-bold text-white leading-tight">{selectedZone.name}</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={isDetecting}
                  title="Auto-detect campus zone with GPS"
                  className="p-2.5 bg-blue-50 text-[#0A84FF] hover:bg-blue-100 rounded-2xl border border-blue-200 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Zone Dropdown Menu */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <span>Campus Wing / Block</span>
                    <button
                      type="button"
                      onClick={handleAutoDetect}
                      className="text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" /> Auto-GPS
                    </button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {CAMPUS_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => {
                          onSelectZone(zone);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs sm:text-sm font-semibold cursor-pointer ${
                          selectedZone.id === zone.id
                            ? 'bg-blue-50 text-[#0A84FF] font-bold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" />
                          <div>
                            <div>{zone.name}</div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              {zone.block} • {zone.estMinutes} • ₹{zone.deliveryFee ?? 10} fee
                            </div>
                          </div>
                        </div>
                        {selectedZone.id === zone.id && (
                          <Check className="w-4 h-4 text-[#30D158]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 p-2 bg-emerald-50 rounded-xl text-center text-[10px] font-bold text-emerald-800">
                    <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />
                    Free delivery automatically unlocked on orders &gt; ₹150
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
