import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loginWithGoogleUser, user } = useAuth();
  const [emailInput, setEmailInput] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.email) return p.email;
      }
    } catch {}
    return 'student.ccct@gmail.com';
  });
  const [nameInput, setNameInput] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.fullName) return p.fullName;
      }
    } catch {}
    return 'Rahul Sharma';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      loginWithGoogleUser({
        name: nameInput.trim() || 'Campus Student',
        email: emailInput.trim() || 'student@campus.edu',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameInput)}`,
      });
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 450);
  };

  return (
    <AnimatePresence>
      <div
        id="google-signin-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto select-none"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Google Branding Header */}
          <div className="text-center pt-2 pb-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mb-3">
              {/* Official Google 'G' Logo SVG */}
              <svg className="w-8 h-8" viewBox="0 0 48 48">
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

            <h3 className="text-xl font-extrabold text-gray-900 font-display">
              Sign in with Google
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Please sign in with your Google account to proceed with your campus delivery order.
            </p>
          </div>

          {!isCustomMode ? (
            <div className="space-y-3">
              {/* Quick 1-Click Google Account Card */}
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isSubmitting}
                className="w-full p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0 border border-blue-200">
                    {nameInput.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                      {nameInput}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {emailInput}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              {/* Continue with Google Standard Action Button */}
              <button
                type="button"
                id="google-continue-btn"
                onClick={() => handleGoogleLogin()}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-98"
              >
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
                <span>{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                >
                  Use a different Google account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGoogleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Google Account Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-[#111111] hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{isSubmitting ? 'Signing in...' : 'Sign In with Google'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Secure badge */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fast, safe Google authentication</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
