import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Building,
  GraduationCap,
  Home,
  DoorOpen,
  BookOpen,
  Navigation,
  Compass,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { CampusZone } from '../types';
import { verifyGPSInsideBoundary } from '../utils/geolocation';

interface CampusLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedZone: CampusZone;
  onSelectZone: (zone: CampusZone) => void;
  allZones: CampusZone[];
  isOutsideBoundary?: boolean;
}

export const CampusLocationModal: React.FC<CampusLocationModalProps> = ({
  isOpen,
  onClose,
  selectedZone,
  onSelectZone,
  allZones,
  isOutsideBoundary = false,
}) => {
  // Local state for custom PG input & verification
  const [isCustomExpanded, setIsCustomExpanded] = useState(
    selectedZone.isCustom || selectedZone.id === 'custom-pg-location'
  );
  const [customInputText, setCustomInputText] = useState(
    selectedZone.customLocation || ''
  );
  const [customVerificationState, setCustomVerificationState] = useState<
    'idle' | 'verifying' | 'inside' | 'outside' | 'error'
  >(() => {
    if (selectedZone.isCustom && selectedZone.isVerifiedInside) return 'inside';
    return 'idle';
  });
  const [verificationFeedback, setVerificationFeedback] = useState<string>('');

  if (!isOpen) return null;

  const getZoneIcon = (id: string) => {
    switch (id) {
      case 'academic-complex':
        return <GraduationCap className="w-4 h-4 text-[#0A84FF]" />;
      case 'boys-hostel':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'girls-hostel':
        return <Home className="w-4 h-4 text-purple-600" />;
      case 'campus-main-gate':
        return <DoorOpen className="w-4 h-4 text-amber-600" />;
      case 'library-labs':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'upper-pg-enclave':
        return <Compass className="w-4 h-4 text-rose-600" />;
      case 'custom-pg-location':
        return <MapPin className="w-4 h-4 text-orange-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle clicking a standard preset zone
  const handlePresetSelect = (zone: CampusZone) => {
    if (zone.isCustom) {
      setIsCustomExpanded(true);
      return;
    }
    onSelectZone({
      ...zone,
      isCustom: false,
      isOutsideDelivery: false,
      isVerifiedInside: true,
    });
    onClose();
  };

  // Handle GPS location verification for Custom PG
  const handleVerifyCustomLocation = async () => {
    if (!customInputText.trim()) {
      setCustomVerificationState('error');
      setVerificationFeedback('Please enter your PG / Building / House Name & Landmark first.');
      return;
    }

    setCustomVerificationState('verifying');
    setVerificationFeedback('Acquiring high-precision GPS coordinates to verify campus delivery boundary...');

    try {
      const result = await verifyGPSInsideBoundary();

      if (result.isInside) {
        setCustomVerificationState('inside');
        setVerificationFeedback(result.message);

        // Auto-save the verified custom zone
        const verifiedZone: CampusZone = {
          id: 'custom-pg-location',
          name: customInputText.trim(),
          block: 'Verified Campus Delivery Zone',
          estMinutes: '10-15 mins',
          isOnline: true,
          deliveryFee: 10,
          coordinates: { lat: result.latitude, lng: result.longitude },
          isCustom: true,
          customLocation: customInputText.trim(),
          isVerifiedInside: true,
          isOutsideDelivery: false,
        };
        onSelectZone(verifiedZone);
      } else {
        setCustomVerificationState('outside');
        setVerificationFeedback(result.message);

        // Mark as outside boundary
        const unverifiedZone: CampusZone = {
          id: 'custom-pg-location',
          name: customInputText.trim(),
          block: 'Outside Express Campus Boundary',
          estMinutes: 'Not Deliverable',
          isOnline: false,
          deliveryFee: 0,
          coordinates: { lat: result.latitude, lng: result.longitude },
          isCustom: true,
          customLocation: customInputText.trim(),
          isVerifiedInside: false,
          isOutsideDelivery: true,
        };
        onSelectZone(unverifiedZone);
      }
    } catch (err: any) {
      setCustomVerificationState('error');
      setVerificationFeedback(
        err.message || 'Could not verify location via GPS. Please enable location access and retry.'
      );
    }
  };

  return (
    <AnimatePresence>
      <div
        id="campus-location-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 relative my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base font-display">
                  Select Campus Location
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Express 10–15 min student delivery directly to your building
                </p>
              </div>
            </div>
            <button
              type="button"
              id="close-campus-location-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close location selector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Outside Boundary Notice Banner if currently active */}
          {isOutsideBoundary && (
            <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-300 rounded-2xl text-xs text-amber-900 flex-shrink-0">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>📍 Location Outside Delivery Area</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                We currently deliver only within campus and nearby affiliated PGs (10-15 min express).
                Coming Soon to your area! Tap any verified campus spot below to order now.
              </p>
            </div>
          )}

          {/* Scrollable list */}
          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Preset Campus Delivery Spots (10–15 Mins)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Express Zone
              </span>
            </div>

            {/* Standard Preset Zones */}
            {allZones
              .filter((z) => !z.isCustom)
              .map((zone) => {
                const isSelected =
                  selectedZone.id === zone.id && !selectedZone.isCustom && !isOutsideBoundary;

                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handlePresetSelect(zone)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#0A84FF] bg-blue-50/70 shadow-xs ring-2 ring-[#0A84FF]/20'
                        : 'border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getZoneIcon(zone.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-1.5 truncate">
                          <span>{zone.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0A84FF] flex-shrink-0" />}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {zone.block} • ₹{zone.deliveryFee ?? 10} express fee
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        ⚡ 10-15 mins
                      </span>
                    </div>
                  </button>
                );
              })}

            {/* CUSTOM PG / OTHER SPECIFIC LOCATION CARD */}
            <div className="pt-2">
              <div
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  selectedZone.isCustom
                    ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-200'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <button
                  type="button"
                  id="select-custom-pg-option-btn"
                  onClick={() => setIsCustomExpanded(!isCustomExpanded)}
                  className="w-full text-left p-3.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-1.5 truncate">
                        <span>Custom PG / Other Specific Location</span>
                        {selectedZone.isCustom && selectedZone.isVerifiedInside && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                        {selectedZone.isCustom && selectedZone.isOutsideDelivery && (
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">
                        Nearby affiliated hostels, outside PG buildings & private residences
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      GPS Verify
                    </span>
                  </div>
                </button>

                {/* Expanded Custom Input & GPS Verification Box */}
                {isCustomExpanded && (
                  <div className="p-3.5 pt-0 border-t border-gray-100 mt-1 space-y-3 bg-white/70">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        PG / Building / House Name & Landmark
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          id="custom-pg-input-field"
                          value={customInputText}
                          onChange={(e) => {
                            setCustomInputText(e.target.value);
                            setCustomVerificationState('idle');
                          }}
                          placeholder="Enter your PG / Building / House Name & Landmark..."
                          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />

                        <button
                          type="button"
                          id="verify-custom-location-gps-btn"
                          onClick={handleVerifyCustomLocation}
                          disabled={customVerificationState === 'verifying'}
                          className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-70 flex-shrink-0"
                        >
                          {customVerificationState === 'verifying' ? (
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

                    {/* Verification Result Feedback Badge */}
                    {customVerificationState === 'inside' && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>✓ Verified: Within 10-15 Min Express Campus Delivery Zone</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-snug">
                          Location confirmed inside campus boundary. You can proceed with instant checkout!
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                          >
                            Confirm & Continue to Store
                          </button>
                        </div>
                      </div>
                    )}

                    {customVerificationState === 'outside' && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-rose-800">
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>📍 Location Outside Delivery Area</span>
                        </div>
                        <p className="text-[11px] text-rose-700 leading-snug">
                          We currently deliver only within campus and nearby affiliated PGs (10-15 min express). Coming Soon to your area!
                        </p>
                      </div>
                    )}

                    {customVerificationState === 'error' && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-snug">
                        {verificationFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-center text-[11px] text-gray-500 font-medium flex items-center justify-center gap-1.5 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Express 10-15 min delivery to all verified campus and affiliated PG blocks</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
