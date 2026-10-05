import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Mail, ExternalLink } from 'lucide-react';

export type LegalModalType = 'privacy' | 'terms' | null;

interface LegalModalProps {
  isOpen: boolean;
  type: LegalModalType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <AnimatePresence>
      <motion.div
        key={`legal-modal-backdrop-${type}`}
        id="legal-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 14 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden relative my-auto select-text"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/70 select-none">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                  isPrivacy
                    ? 'bg-blue-50 text-[#0A84FF] border-blue-100'
                    : 'bg-emerald-50 text-[#30D158] border-emerald-100'
                }`}
              >
                {isPrivacy ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    CCCT & SIST Campus Express
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight mt-0.5">
                  {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Last updated: October 4, 2026
                </p>
              </div>
            </div>

            {/* Clear Close (✕) button */}
            <button
              type="button"
              id="legal-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/80 transition cursor-pointer shrink-0"
              aria-label="Close"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-sm text-gray-700 leading-relaxed font-sans">
            {isPrivacy ? (
              <>
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs sm:text-sm text-blue-950 font-medium">
                  Welcome to <strong>InfinityStore</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We operate the InfinityStore platform designed for CCCT & SIST Campus Express. We respect your privacy and are committed to protecting personal data.
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    Information We Collect
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    When you verify using WhatsApp, we collect limited personal details strictly necessary for account verification and delivery coordination:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-8 text-xs sm:text-sm text-gray-700 font-medium">
                    <li>Full Name</li>
                    <li>WhatsApp Mobile Number</li>
                    <li>Campus Hostel & Room / Delivery Spot</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    How We Use Your Information
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    We use the collected information solely to verify student sessions, process campus orders, enable runner delivery updates, and support customer queries. We never sell, rent, or trade your personal data.
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    Third-Party Services
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    We use WhatsApp for runner communications and order verification, and Supabase for secure database and real-time backend infrastructure.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    Data Security & Retention
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    Appropriate technical measures are maintained to safeguard your account details. Data is retained only as long as your account remains active.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      5
                    </span>
                    Contact Us
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    For any privacy questions or requests, contact:{' '}
                    <a
                      href="mailto:infinitys486@gmail.com"
                      className="font-bold text-[#0A84FF] hover:underline inline-flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      infinitys486@gmail.com
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs sm:text-sm text-emerald-950 font-medium">
                  Welcome to <strong>InfinityStore</strong> (CCCT & SIST Campus Express). These terms govern your use of our platform, orders, and delivery services.
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    Acceptance of Terms
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    By accessing or using InfinityStore, you agree to comply with and be bound by these Terms.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    User Accounts & WhatsApp Verification
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    To place campus orders and access 1-click express delivery, you verify your identity using your active WhatsApp mobile number. You are responsible for ensuring accurate delivery contact details.
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    Campus Community Guidelines
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    InfinityStore is tailored for students and staff of CCCT & SIST. Fraudulent orders, abuse of delivery staff, or attempts to disrupt backend systems will lead to immediate account suspension.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    Service Modifications
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    We reserve the right to alter pricing, availability, or delivery zones at any time.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                      5
                    </span>
                    Contact Information
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8">
                    For support regarding these Terms, contact:{' '}
                    <a
                      href="mailto:infinitys486@gmail.com"
                      className="font-bold text-[#0A84FF] hover:underline inline-flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      infinitys486@gmail.com
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer with Close button */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 select-none">
            <span className="text-[11px] text-gray-500">
              Official Campus Documentation
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-extrabold transition shadow-xs cursor-pointer active:scale-95"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
