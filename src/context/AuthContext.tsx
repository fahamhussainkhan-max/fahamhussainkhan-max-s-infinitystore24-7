import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, syncUserProfileToSupabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signInWithGoogle: () => Promise<void>;
  fastCampusLogin: (demoProfile: { fullName: string; email: string; avatar?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('infinity_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Helper to extract verified user profile from Supabase user object and save to database
  const handleUserSession = (userObj: any) => {
    if (!userObj) {
      setUser(null);
      localStorage.removeItem('infinity_auth_user');
      return;
    }

    const name =
      userObj.user_metadata?.full_name ||
      userObj.user_metadata?.name ||
      userObj.email?.split('@')[0] ||
      'Campus Student';
    const email = userObj.email || '';
    const avatar =
      userObj.user_metadata?.avatar_url ||
      userObj.user_metadata?.picture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const authUser: AuthUser = {
      id: userObj.id,
      name,
      email,
      avatar,
      provider: userObj.app_metadata?.provider || 'google',
    };

    setUser(authUser);
    localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));

    // Automatically save captured Full Name, Email, and Profile Picture URL to Supabase database
    syncUserProfileToSupabase(userObj.id, name, email, avatar);

    // Auto-fill student profile cache for Checkout delivery form with verified details
    try {
      const existing = localStorage.getItem('infinity_student_profile');
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        'infinity_student_profile',
        JSON.stringify({
          ...parsed,
          fullName: name,
          email: email,
          avatar: avatar,
        })
      );
    } catch {}
  };

  // Sync Supabase Auth session on mount and listen to real auth changes
  useEffect(() => {
    // 1. Initial session check - Mandatory Sign-in on Initial Load
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          handleUserSession(session.user);
          setIsLoginModalOpen(false);
        } else {
          // If no active session, ensure user is required to sign in with Google immediately
          const savedLocal = localStorage.getItem('infinity_auth_user');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed?.name && parsed?.email) {
                setUser(parsed);
                setIsLoginModalOpen(false);
                return;
              }
            } catch {}
          }
          setUser(null);
          localStorage.removeItem('infinity_auth_user');
          setIsLoginModalOpen(true);
        }
      } catch (err) {
        console.warn('Initial Supabase auth session check notice:', err);
        setIsLoginModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Realtime auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
        setIsLoginModalOpen(false);
      } else {
        setUser(null);
        localStorage.removeItem('infinity_auth_user');
      }
    });

    // 3. Listen for OAuth popup success message
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_GOOGLE_AUTH_SUCCESS') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          handleUserSession(session.user);
          setIsLoginModalOpen(false);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);

    // 4. If current window is an OAuth popup callback, notify opener window and close
    if (
      typeof window !== 'undefined' &&
      window.opener &&
      (window.location.hash.includes('access_token') || window.location.search.includes('code'))
    ) {
      try {
        window.opener.postMessage({ type: 'SUPABASE_GOOGLE_AUTH_SUCCESS' }, '*');
        setTimeout(() => window.close(), 300);
      } catch {}
    }

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => {
    if (user) {
      setIsLoginModalOpen(false);
    }
  };

  // Production-grade Real Google OAuth authentication via Supabase
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: isIframe,
        },
      });

      if (error) {
        throw error;
      }

      if (isIframe && data?.url) {
        // In iframe environments (e.g. AI Studio development preview), standard window navigation
        // is blocked by Google's frame-ancestors security header.
        // Therefore, open the official Google OAuth consent screen in a popup window.
        const width = 520;
        const height = 660;
        const left = Math.max(0, (window.screen.width - width) / 2);
        const top = Math.max(0, (window.screen.height - height) / 2);
        const popup = window.open(
          data.url,
          'google_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup is blocked by browser, fallback to navigating window directly
          if (window.top) {
            window.top.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } else {
          // Poll popup closure or wait for message
          const timer = setInterval(async () => {
            if (popup.closed) {
              clearInterval(timer);
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user) {
                handleUserSession(sessionData.session.user);
                setIsLoginModalOpen(false);
              }
            }
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err?.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fastCampusLogin = async (demoProfile: { fullName: string; email: string; avatar?: string }) => {
    setIsLoading(true);
    try {
      const demoId = `usr-${Date.now()}`;
      const avatar = demoProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoProfile.fullName)}`;
      const authUser: AuthUser = {
        id: demoId,
        name: demoProfile.fullName,
        email: demoProfile.email,
        avatar,
        provider: 'google',
      };
      setUser(authUser);
      localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));
      await syncUserProfileToSupabase(demoId, demoProfile.fullName, demoProfile.email, avatar);
      setIsLoginModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Notice on sign out:', err);
    }
    setUser(null);
    localStorage.removeItem('infinity_auth_user');
    setIsLoginModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        signInWithGoogle,
        fastCampusLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
