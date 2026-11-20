import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  Key,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  supabase,
  SUPABASE_URL,
  unlockAdminWithPassphrase,
  verifyAdminToken,
  AdminSessionUser,
} from '../../lib/supabase';
import { getCooldownRemainingSeconds, recordCooldownAction } from '../../utils/security';

interface AdminLoginProps {
  onSuccess: (user: AdminSessionUser) => void;
  mode?: 'page' | 'modal';
  initialMessage?: string | null;
  onClose?: () => void;
}

const ALLOWED_STAFF_ROLES = new Set(['staff', 'admin', 'super_admin']);

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  mode = 'page',
  initialMessage = null,
  onClose,
}) => {
  const [authTab, setAuthTab] = useState<'passphrase' | 'staff'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialMessage);
  const [failedCount, setFailedCount] = useState(0);

  const checkCooldown = (): boolean => {
    const remaining = getCooldownRemainingSeconds('admin_login_lock', 30000);
    if (remaining > 0) {
      setErrorMessage(`Too many failed attempts. Please wait ${remaining}s before trying again.`);
      return true;
    }
    return false;
  };

  const recordFailure = (message: string) => {
    const nextFailures = failedCount + 1;
    setFailedCount(nextFailures);
    if (nextFailures >= 3) {
      recordCooldownAction('admin_login_lock');
    }
    setErrorMessage(message);
  };

  const handlePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot.trim()) return;
    if (checkCooldown()) return;

    if (!passphrase.trim()) {
      setErrorMessage('Please enter your Admin Unlock Passphrase.');
      return;
    }

    setLoading(true);
    try {
      const res = await unlockAdminWithPassphrase(passphrase);
      if (!res.ok || !res.user) {
        recordFailure(res.error || 'Invalid admin passphrase.');
        return;
      }

      setFailedCount(0);
      setPassphrase('');
      onSuccess(res.user);
    } catch (err: any) {
      recordFailure(err?.message || 'Unable to verify passphrase with backend API.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot.trim()) return;
    if (checkCooldown()) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your staff email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user || !data.session?.access_token) {
        throw error || new Error('Invalid staff credentials.');
      }

      const verifyRes = await verifyAdminToken(data.session.access_token);
      if (!verifyRes.ok || !verifyRes.user || !ALLOWED_STAFF_ROLES.has(verifyRes.user.role)) {
        await supabase.auth.signOut().catch(() => {});
        throw new Error(
          verifyRes.error ||
            'Access denied: This account does not have Infinity Operations staff privileges.'
        );
      }

      setFailedCount(0);
      onSuccess(verifyRes.user);
    } catch (err: any) {
      recordFailure(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const projectSlug = SUPABASE_URL
    ? SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0]
    : 'Backend API Mode';

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="w-full max-w-md bg-[#131A26] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
    >
      {mode === 'modal' && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header Branding */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#0055D4] text-white shadow-lg shadow-[#0A84FF]/25 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-white font-display tracking-tight">
          {mode === 'modal' ? 'Unlock Admin Session' : 'Infinity Operations'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1.5 font-medium">
          {mode === 'modal'
            ? 'Re-verify your admin passphrase to continue managing orders & inventory'
            : 'Secure Server-Verified Admin & Management Console'}
        </p>
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#1E293B]/80 border border-gray-700/50 text-[11px] text-gray-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#30D158]" />
          <span>Signed Session Token • Server Service-Role API</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0B0F17] border border-[#1E293B] mb-5">
        <button
          type="button"
          onClick={() => {
            setAuthTab('passphrase');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            authTab === 'passphrase'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Passphrase Unlock</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthTab('staff');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            authTab === 'staff'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Staff Account</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-950/50 border border-red-800/70 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Passphrase Unlock Form */}
      {authTab === 'passphrase' ? (
        <form onSubmit={handlePassphraseSubmit} className="space-y-4">
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Admin Unlock Passphrase
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassphrase ? 'text' : 'password'}
                required
                autoFocus
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter server admin secret passphrase"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all select-text"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Verified strictly on the server via <code className="text-gray-400">/api/admin-action</code>. Issues a short-lived signed session token in <code className="text-gray-400">sessionStorage</code>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-sm shadow-lg shadow-[#0A84FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Staff Email / Password Supabase Auth Form */
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@infinity.store"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all select-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all select-text"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-sm shadow-lg shadow-[#0A84FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[#30D158]/5 rounded-full blur-3xl pointer-events-none" />

      {cardContent}

      {/* Database indicator */}
      <div className="mt-6 text-center text-xs text-gray-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Connected Node: {projectSlug}</span>
      </div>
    </div>
  );
};

export default AdminLogin;
