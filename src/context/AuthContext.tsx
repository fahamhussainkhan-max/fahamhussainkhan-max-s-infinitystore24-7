import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  loginWithGoogleUser: (googleUser: { name: string; email: string; avatar?: string }) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('infinity_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync Supabase Auth session on mount and listen to auth changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Campus Student',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
            provider: session.user.app_metadata?.provider || 'google',
          };
          setUser(authUser);
          localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));
        }
      } catch (err) {
        console.warn('Notice checking initial auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Campus Student',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          provider: session.user.app_metadata?.provider || 'google',
        };
        setUser(authUser);
        localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));
      } else {
        // If Supabase signed out and no manual login saved
        const local = localStorage.getItem('infinity_auth_user');
        if (!local) {
          setUser(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const loginWithGoogleUser = (googleUser: { name: string; email: string; avatar?: string }) => {
    const authUser: AuthUser = {
      id: `usr-google-${Date.now()}`,
      name: googleUser.name.trim() || 'Campus Student',
      email: googleUser.email.trim(),
      avatar: googleUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleUser.name)}`,
      provider: 'google',
    };
    setUser(authUser);
    localStorage.setItem('infinity_auth_user', JSON.stringify(authUser));

    // Update student profile cache for auto-fill
    try {
      const existing = localStorage.getItem('infinity_student_profile');
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem('infinity_student_profile', JSON.stringify({
        ...parsed,
        fullName: authUser.name,
        email: authUser.email,
      }));
    } catch {}

    setIsLoginModalOpen(false);
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.warn('OAuth redirect notice, displaying Google Sign-In prompt modal:', err?.message || err);
      // Fallback: Show the Google sign-in modal for user interaction
      openLoginModal();
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem('infinity_auth_user');
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
        loginWithGoogleUser,
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
