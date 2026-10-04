import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
        if (parsed?.id && parsed?.email) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Helper to extract verified user profile from Supabase user object and save to database
  const handleUserSession = useCallback((userObj: any) => {
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

    console.log('[AuthContext] Setting authenticated user:', authUser.email);
    setUser(authUser);
    localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));

    // Automatically sync captured Full Name, Email, and Profile Picture URL to Supabase database
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
  }, []);

  // Sync Supabase Auth session on mount and listen to real auth changes
  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        setIsLoading(true);

        // 1. Check if the URL has OAuth callback params (?code=... or #access_token=...)
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get('code');
        const hash = window.location.hash;
        const errorDesc = currentUrl.searchParams.get('error_description') || currentUrl.searchParams.get('error');

        if (errorDesc) {
          console.error('[OAuth] Callback error from provider:', errorDesc);
          // Clean the query parameters from URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. If PKCE code exists in query params, exchange it for session immediately
        if (code) {
          console.log('[OAuth] Detected code in URL, exchanging for session...');
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.warn('[OAuth] exchangeCodeForSession notice:', error.message);
            } else if (data?.session?.user && isMounted) {
              console.log('[OAuth] Session exchange successful for:', data.session.user.email);
              handleUserSession(data.session.user);
              setIsLoginModalOpen(false);
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          } catch (exchangeErr) {
            console.warn('[OAuth] Code exchange exception:', exchangeErr);
          }
        }

        // 3. Check existing session via getSession() (also handles implicit hash if present)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[OAuth] getSession notice:', sessionError.message);
        }

        if (session?.user && isMounted) {
          console.log('[OAuth] Active session found for:', session.user.email);
          handleUserSession(session.user);
          setIsLoginModalOpen(false);
          if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (isMounted) {
          // If no active session, check if we have a valid saved local user
          const savedLocal = localStorage.getItem('infinity_auth_user');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed?.id && parsed?.email) {
                setUser(parsed);
                setIsLoginModalOpen(false);
                return;
              }
            } catch {}
          }

          // If genuinely unauthenticated and no callback params pending, do not block user
          if (!code && !hash.includes('access_token')) {
            setUser(null);
            localStorage.removeItem('infinity_auth_user');
            setIsLoginModalOpen(false);
          }
        }
      } catch (err) {
        console.error('[OAuth] Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    processAuth();

    // 4. Realtime auth state listener - handles sign-in, sign-out, token refresh
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, session?.user?.email);
      if (session?.user && isMounted) {
        handleUserSession(session.user);
        setIsLoginModalOpen(false);
        // Clean URL parameters if still present
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
        localStorage.removeItem('infinity_auth_user');
        setIsLoginModalOpen(true);
      }
    });

    // 5. Listen for OAuth popup success message (if opened via popup window)
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_GOOGLE_AUTH_SUCCESS') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          handleUserSession(session.user);
          setIsLoginModalOpen(false);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);

    // 6. If current window is an OAuth popup callback, notify opener window and close
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
      isMounted = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [handleUserSession]);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => {
    // Only allow manual dismissal if user is authenticated or explicitly closed
    setIsLoginModalOpen(false);
  };

  // Production-grade Google OAuth authentication with origin redirect URL
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;

      console.log('[Auth] Initiating signInWithGoogle with redirectTo:', redirectUrl, 'isIframe:', isIframe);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isIframe,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('[Auth] signInWithOAuth error:', error);
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
      console.error('[Auth] Google Sign-In failed:', err?.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fastCampusLogin = async (demoProfile: { fullName: string; email: string; avatar?: string }) => {
    setIsLoading(true);
    try {
      const demoId = `usr-${Date.now()}`;
      const avatar =
        demoProfile.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoProfile.fullName)}`;
      const authUser: AuthUser = {
        id: demoId,
        name: demoProfile.fullName,
        email: demoProfile.email,
        avatar,
        provider: 'google',
      };
      console.log('[Auth] Fast campus login for:', authUser.email);
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
