import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LegalModal, LegalModalType } from './LegalModal';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isMandatory?: boolean;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const { signInWithGoogle, isLoading, user } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalType, setLegalType] = useState<LegalModalType>(null);

  // Auto-dismiss modal immediately as soon as user is authenticated
  React.useEffect(() => {
    if (user && isOpen) {
      console.log('[GoogleSignInModal] User is authenticated, auto-dismissing modal');
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [user, isOpen, onClose, onSuccess]);

  if (!isOpen || (user && !isSubmitting)) return null;

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[GoogleSignInModal] Google Sign-In error:', err);
      setAuthError(
        err?.message || 'Unable to open Google Sign-In. Please check network and browser pop-up permissions.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="google-signin-modal-backdrop"
          id="google-signin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto select-none"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative my-auto max-h-[92vh] overflow-y-auto"
          >
          {/* Close button - available whenever modal is not mandatory */}
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Official Google Branding Header */}
          <div className="text-center pt-1 pb-3 sm:pb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mb-2.5">
              {/* Official Google 'G' Logo SVG */}
              <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 mb-2 inline-block">
              {isMandatory ? 'Mandatory Student Sign-In' : 'Campus Express Authentication'}
            </span>

            <h3 className="text-xl font-extrabold text-gray-900 font-display">
              Sign in with Google
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Please sign in with your Google account to access InfinityStore, auto-fill your delivery info, and place campus orders.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Official Google OAuth Action Button */}
          <div className="space-y-3">
            <button
              type="button"
              id="google-continue-btn"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-sm rounded-2xl transition duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Connecting to Google Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Triggers the official Google account chooser to select your verified student account.
            </p>
          </div>

          {/* Secure badge */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Production-grade Google OAuth • Powered by Supabase</span>
          </div>

          {/* Legal note in Google Sign-In */}
          <div className="mt-2.5 text-center text-[10.5px] text-gray-400">
            By signing in, you agree to our{' '}
            <button
              type="button"
              onClick={() => setLegalType('terms')}
              className="text-gray-500 hover:text-gray-900 underline cursor-pointer"
            >
              Terms of Service
            </button>{' '}
            &{' '}
            <button
              type="button"
              onClick={() => setLegalType('privacy')}
              className="text-gray-500 hover:text-gray-900 underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Privacy Policy / Terms of Service Modal */}
      <LegalModal
        key="google-signin-legal-modal"
        isOpen={Boolean(legalType)}
        type={legalType}
        onClose={() => setLegalType(null)}
      />
    </>
  );
};
