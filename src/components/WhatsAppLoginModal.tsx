import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface WhatsAppLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STORE_WHATSAPP_NUMBER = '919332727610';

export const WhatsAppLoginModal: React.FC<WhatsAppLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, verifyAndLoginWithWhatsApp, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(() => {
    try {
      return localStorage.getItem('infinity_user_name') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('infinity_user_phone') || '';
    } catch {
      return '';
    }
  });
  const [campusHostel, setCampusHostel] = useState('CCCT — Academic Complex & Admin');
  const [roomNo, setRoomNo] = useState(() => {
    try {
      return localStorage.getItem('infinity_user_room') || '';
    } catch {
      return '';
    }
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-dismiss if already verified and open
  React.useEffect(() => {
    if (user?.isVerified && isOpen) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [user, isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleWhatsAppVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian WhatsApp mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Perform WhatsApp login verification via AuthContext
      await verifyAndLoginWithWhatsApp(trimmedName, cleanPhone, roomNo.trim(), campusHostel);

      // 2. Background sync to Supabase profiles table
      try {
        const studentId = `student-${cleanPhone}`;
        await supabase.from('profiles').upsert(
          [
            {
              id: studentId,
              full_name: trimmedName,
              phone: cleanPhone,
              email: `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@campus.infinity.store`,
              role: 'student',
              hostel_block: `${campusHostel} - ${roomNo.trim() || 'Room Pending'}`,
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'id' }
        );
      } catch (dbErr) {
        console.warn('Profiles sync note:', dbErr);
      }

      // 3. Open WhatsApp verification chat to dispatch desk
      const verificationCode = `INF-WA-${cleanPhone.slice(-4)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const waMessage = `👋 *INFINITY STORE CAMPUS VERIFICATION*
*Name:* ${trimmedName}
*WhatsApp:* +91${cleanPhone}
*Campus Location:* ${campusHostel}${roomNo.trim() ? `\n*Room/Floor:* ${roomNo.trim()}` : ''}
*Verification Token:* #${verificationCode}

Please verify my student account for 1-click campus delivery!`;

      const waUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('WhatsApp login error:', err);
      setErrorMsg(err?.message || 'Failed to complete WhatsApp verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="whatsapp-login-modal-backdrop"
        id="whatsapp-login-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="whatsapp-login-modal-card"
          id="whatsapp-login-modal-card"
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* WhatsApp Header Branding */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-3 shadow-xs border border-[#25D366]/20">
              <MessageCircle className="w-8 h-8 fill-[#25D366] text-[#25D366]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Student Verification
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
              Campus Login via WhatsApp
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
              Verify once with your WhatsApp number for 1-click COD orders, real-time runner updates, and saved hostel details.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl mb-4">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleWhatsAppVerifyAndLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#25D366] bg-[#FAFAF7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                WhatsApp Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-gray-500 pointer-events-none select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#25D366] bg-[#FAFAF7]"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Our runner will contact you on this WhatsApp number for doorstep handover.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Campus / Hostel</label>
                <select
                  value={campusHostel}
                  onChange={(e) => setCampusHostel(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#25D366] bg-[#FAFAF7]"
                >
                  <option value="CCCT — Academic Complex & Admin">CCCT Academic Complex</option>
                  <option value="CCCT — Boys Hostel 1">CCCT Boys Hostel 1</option>
                  <option value="CCCT — Boys Hostel 2">CCCT Boys Hostel 2</option>
                  <option value="CCCT — Girls Hostel">CCCT Girls Hostel</option>
                  <option value="SIST — Campus & Department Block">SIST Campus Block</option>
                  <option value="SIST — Student Hostels & PGs">SIST Hostels & PGs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Room / Floor (Optional)</label>
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#25D366] bg-[#FAFAF7]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white text-xs sm:text-sm font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying via WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>Verify & Login via WhatsApp</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Perks footer */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-around text-[10px] text-gray-500 font-semibold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Passwordless
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1-Click Checkout
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Direct Runner Chat
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhatsAppLoginModal;
