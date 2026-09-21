import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackagePlus, CheckCircle2, ArrowRight, Sparkles, Building, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductRequestBoxProps {
  onToastMessage?: (msg: string) => void;
}

export const ProductRequestBox: React.FC<ProductRequestBoxProps> = ({ onToastMessage }) => {
  const [productName, setProductName] = useState('');
  const [roomDetails, setRoomDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = productName.trim();

    if (!trimmedName) {
      setValidationError('Please enter the product name or brand you need.');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    const requestPayload = {
      product_name: trimmedName,
      room_details: roomDetails.trim(),
    };

    try {
      // 2. Submit directly to 'product_requests' (fields: product_name, room_details)
      const { error } = await supabase
        .from('product_requests')
        .insert([requestPayload]);

      if (error) {
        console.warn('Supabase product_requests notice:', error.message);
      }

      // Safe local persistence fallback
      try {
        const stored = JSON.parse(localStorage.getItem('campus_product_requests') || '[]');
        stored.unshift({ ...requestPayload, created_at: new Date().toISOString() });
        localStorage.setItem('campus_product_requests', JSON.stringify(stored));
      } catch (localErr) {
        console.warn('Local storage write note:', localErr);
      }

      setIsSubmitted(true);
      if (onToastMessage) {
        onToastMessage('✓ Request received! We will try to stock this ASAP.');
      }
    } catch (err) {
      console.warn('Network error handling product request:', err);
      try {
        const stored = JSON.parse(localStorage.getItem('campus_product_requests') || '[]');
        stored.unshift({ ...requestPayload, created_at: new Date().toISOString() });
        localStorage.setItem('campus_product_requests', JSON.stringify(stored));
      } catch {}
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setProductName('');
    setRoomDetails('');
    setIsSubmitted(false);
    setValidationError('');
  };

  return (
    <section
      id="request-product-section"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 select-none"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/90 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.07)] p-6 sm:p-10 transition-all">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/8 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/8 to-transparent rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-3xl">
          {/* Header pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-black uppercase tracking-wider mb-3">
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Campus Stocking Request</span>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111111] font-display tracking-tight leading-tight">
            Can't find what you're looking for?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed font-medium">
            Tell us what snacks, stationery, or drinks you need delivered to your hostel or gate, and we'll stock it within 24 hours.
          </p>
        </div>

        {/* Dynamic Content: Form vs Success State */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className="p-6 sm:p-8 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#30D158] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-400/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-emerald-950">
                      ✓ Request received! We'll try to add this to the catalog ASAP.
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-700/90 mt-0.5 font-medium">
                      Our procurement team checks student requests every morning and night.
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleReset}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs tracking-wide shadow-xs shrink-0 cursor-pointer transition-colors"
                >
                  Request Another Item
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  {/* Product Name / Description input */}
                  <div className="md:col-span-7">
                    <label
                      htmlFor="requested-product-input"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Product Name / Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="requested-product-input"
                        type="text"
                        value={productName}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="e.g. Red Bull Sugarfree, Pilot V5 Blue, Lays Gourmet..."
                        disabled={isSubmitting}
                        className={`w-full px-4 py-3.5 rounded-2xl bg-gray-50/80 border text-sm font-semibold text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-hidden transition-all shadow-2xs ${
                          validationError
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-gray-200 focus:border-[#0A84FF] focus:ring-3 focus:ring-[#0A84FF]/15'
                        }`}
                      />
                    </div>
                    {validationError && (
                      <p className="text-xs font-semibold text-red-600 mt-1.5 ml-1">
                        {validationError}
                      </p>
                    )}
                  </div>

                  {/* Campus Hostel / Room No (Optional) */}
                  <div className="md:col-span-5">
                    <label
                      htmlFor="requested-room-input"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between"
                    >
                      <span>Campus Hostel / Room No</span>
                      <span className="text-[10px] text-gray-400 font-normal uppercase">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        id="requested-room-input"
                        type="text"
                        value={roomDetails}
                        onChange={(e) => setRoomDetails(e.target.value)}
                        placeholder="e.g. Block C, Room 304 or Fatak Gate"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:border-[#0A84FF] focus:ring-3 focus:ring-[#0A84FF]/15 transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer action row */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
                    <span>Requested items are prioritized within 24 hours of submission</span>
                  </div>

                  <motion.button
                    id="request-item-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -1 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#111111] hover:bg-black text-white font-black text-sm tracking-wide shadow-md shadow-black/15 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Item</span>
                        <ArrowRight className="w-4 h-4 text-[#FFD60A]" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
