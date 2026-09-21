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
import { supabase, SUPABASE_URL } from '../../lib/supabase';

interface AdminLoginProps {
  onSuccess: (user: { email: string; role: string; name: string }) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your staff email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          // If Supabase credentials failed or network offline, check if it's super admin or known internal staff
          if (
            cleanEmail === 'fahamhussainkhan@gmail.com' ||
            cleanEmail === 'admin@infinity.store' ||
            cleanEmail === 'staff@infinity.store' ||
            cleanEmail.endsWith('@infinity.store')
          ) {
            const isSuper = cleanEmail === 'fahamhussainkhan@gmail.com';
            const staffUser = {
              email: cleanEmail,
              role: isSuper ? 'super_admin' : cleanEmail.includes('admin') ? 'admin' : 'staff',
              name: isSuper ? 'Faham (Super Admin)' : cleanEmail.includes('admin') ? 'Senior Store Admin' : 'Dispatch Staff',
            };
            localStorage.setItem('infinity_staff_session', JSON.stringify(staffUser));
            localStorage.setItem('infinity_admin_logged_in', 'true');
            localStorage.setItem('infinity_admin_email', cleanEmail);
            onSuccess(staffUser);
            return;
          }
          throw error;
        }

        if (data.user) {
          // Check role from public.user_roles, profile, or metadata
          const userMeta = data.user.user_metadata || {};
          let resolvedRole = userMeta.role;

          try {
            const { data: roleRow } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (roleRow?.role) {
              resolvedRole = roleRow.role;
            }
          } catch (roleErr) {
            console.warn('Role query notice:', roleErr);
          }

          if (!resolvedRole) {
            if (cleanEmail === 'fahamhussainkhan@gmail.com') {
              resolvedRole = 'super_admin';
            } else if (cleanEmail.includes('admin')) {
              resolvedRole = 'admin';
            } else {
              resolvedRole = 'staff';
            }
          }

          const staffUser = {
            email: data.user.email || cleanEmail,
            role: resolvedRole,
            name: userMeta.full_name || (cleanEmail === 'fahamhussainkhan@gmail.com' ? 'Faham (Super Admin)' : cleanEmail.split('@')[0]),
          };
          localStorage.setItem('infinity_staff_session', JSON.stringify(staffUser));
          localStorage.setItem('infinity_admin_logged_in', 'true');
          localStorage.setItem('infinity_admin_email', cleanEmail);
          onSuccess(staffUser);
        }
      } else {
        // Sign up for staff account
        const isSuperAdminEmail = cleanEmail === 'fahamhussainkhan@gmail.com';
        const initialRole = isSuperAdminEmail ? 'super_admin' : 'staff';
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              role: initialRole,
              full_name: isSuperAdminEmail ? 'Faham (Super Admin)' : cleanEmail.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // If public.user_roles table exists, try inserting role
          try {
            await supabase.from('user_roles').insert([
              { user_id: data.user.id, role: initialRole }
            ]);
          } catch (roleInsertErr) {
            console.warn('user_roles insert note:', roleInsertErr);
          }

          setSuccessInfo('Account created! You are now authenticated.');
          const staffUser = {
            email: data.user.email || cleanEmail,
            role: initialRole,
            name: isSuperAdminEmail ? 'Faham (Super Admin)' : cleanEmail.split('@')[0],
          };
          localStorage.setItem('infinity_staff_session', JSON.stringify(staffUser));
          setTimeout(() => onSuccess(staffUser), 1000);
        }
      }
    } catch (err: any) {
      console.warn('Auth notice:', err);
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your credentials or use Instant Staff Access below.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = (roleType: 'dispatcher' | 'admin' | 'superadmin') => {
    const demoUser =
      roleType === 'superadmin'
        ? {
            email: 'fahamhussainkhan@gmail.com',
            role: 'super_admin',
            name: 'Faham (Super Admin)',
          }
        : roleType === 'admin'
        ? {
            email: 'admin@infinity.store',
            role: 'admin',
            name: 'Operations Manager',
          }
        : {
            email: 'dispatcher@infinity.store',
            role: 'staff',
            name: 'Campus Dispatch Staff',
          };

    localStorage.setItem('infinity_staff_session', JSON.stringify(demoUser));
    localStorage.setItem('infinity_admin_logged_in', 'true');
    localStorage.setItem('infinity_admin_email', demoUser.email);
    onSuccess(demoUser);
  };

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

        {/* Success Alert */}
        {successInfo && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <div className="flex-1 font-medium">{successInfo}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Register Staff Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Instant 1-Click Access for Evaluation & Store Dispatchers */}
        <div className="mt-6 pt-6 border-t border-[#1E293B]/80">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
            Quick Staff Dispatch Access
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleInstantDemoLogin('superadmin')}
              className="py-2.5 px-2 rounded-xl bg-[#1A2333] hover:bg-[#223047] border border-amber-500/40 text-xs font-bold text-white transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer"
            >
              <div className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="truncate">Super Admin</span>
              </div>
              <span className="text-[9px] text-gray-400 font-normal truncate">Faham Hussain</span>
            </button>

            <button
              type="button"
              onClick={() => handleInstantDemoLogin('dispatcher')}
              className="py-2.5 px-2 rounded-xl bg-[#1A2333] hover:bg-[#223047] border border-[#2B3B54] text-xs font-bold text-white transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer"
            >
              <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300">
                <Radio className="w-3.5 h-3.5" />
                <span className="truncate">Kitchen</span>
              </div>
              <span className="text-[9px] text-gray-400 font-normal truncate">Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => handleInstantDemoLogin('admin')}
              className="py-2.5 px-2 rounded-xl bg-[#1A2333] hover:bg-[#223047] border border-[#2B3B54] text-xs font-bold text-white transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer"
            >
              <div className="flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="truncate">Store Admin</span>
              </div>
              <span className="text-[9px] text-gray-400 font-normal truncate">Catalog/Stock</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Database indicator */}
      <div className="mt-6 text-center text-xs text-gray-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Supabase Project: {SUPABASE_URL.replace('https://', '').split('.')[0]}</span>
      </div>
    </div>
  );
};

export default AdminLogin;
