import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';
import { supabase, SUPABASE_URL, invokeAdminAction } from '../../lib/supabase';
import { getCooldownRemainingSeconds, recordCooldownAction } from '../../utils/security';

interface AdminLoginProps {
  onSuccess: (user: { email: string; role: string; name: string }) => void;
}

const ALLOWED_STAFF_ROLES = new Set(['staff', 'admin', 'super_admin']);

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot.trim()) {
      return;
    }

    const remaining = getCooldownRemainingSeconds('admin_login_lock', 30000);
    if (remaining > 0) {
      setErrorMessage(`Too many failed attempts. Please wait ${remaining}s before trying again.`);
      return;
    }

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

      // Verify staff authorization server-side first via /api/admin-action
      const apiRes = await invokeAdminAction<{
        authorized?: boolean;
        user?: { email: string; role: string; name: string };
      }>('verify_admin', {}, data.session.access_token);

      let resolvedUser: { email: string; role: string; name: string } | null = null;

      if (apiRes.ok && apiRes.data?.authorized && apiRes.data.user) {
        resolvedUser = {
          email: apiRes.data.user.email || cleanEmail,
          role: apiRes.data.user.role,
          name: apiRes.data.user.name || cleanEmail.split('@')[0],
        };
      } else if (apiRes.endpointMissing) {
        // Local Vite dev fallback: verify role strictly against admin_users or user_roles table
        let verifiedRole = '';
        let verifiedName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];

        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('role, is_active, full_name')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (adminRow && adminRow.is_active !== false && ALLOWED_STAFF_ROLES.has(String(adminRow.role))) {
          verifiedRole = String(adminRow.role);
          if (adminRow.full_name) verifiedName = String(adminRow.full_name);
        } else {
          const { data: roleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (roleRow?.role && ALLOWED_STAFF_ROLES.has(String(roleRow.role))) {
            verifiedRole = String(roleRow.role);
          }
        }

        if (verifiedRole) {
          resolvedUser = {
            email: data.user.email || cleanEmail,
            role: verifiedRole,
            name: verifiedName,
          };
        }
      }

      if (!resolvedUser || !ALLOWED_STAFF_ROLES.has(resolvedUser.role)) {
        await supabase.auth.signOut().catch(() => {});
        throw new Error('Access denied: This account does not have Infinity Operations staff privileges.');
      }

      setFailedCount(0);
      localStorage.setItem('infinity_staff_session', JSON.stringify(resolvedUser));
      onSuccess(resolvedUser);
    } catch (err: any) {
      const nextFailures = failedCount + 1;
      setFailedCount(nextFailures);
      if (nextFailures >= 3) {
        recordCooldownAction('admin_login_lock');
      }
      setErrorMessage(
        err?.message || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const projectSlug = SUPABASE_URL
    ? SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0]
    : 'Offline / Env Pending';

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[#30D158]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#131A26] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#0055D4] text-white shadow-lg shadow-[#0A84FF]/25 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight flex items-center justify-center gap-2">
            Infinity Operations
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5 font-medium">
            Authorized Store Staff & Dispatch Authentication
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#1E293B]/80 border border-gray-700/50 text-[11px] text-gray-300">
            <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
            <span>Supabase Auth Connected</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all"
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
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
      </motion.div>

      {/* Database indicator */}
      <div className="mt-6 text-center text-xs text-gray-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Supabase Project: {projectSlug}</span>
      </div>
    </div>
  );
};

export default AdminLogin;
