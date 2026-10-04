import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  room?: string;
  avatar?: string;
  provider?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getLocalStudent = (): AuthUser | null => {
    try {
      const isVerified = localStorage.getItem('infinity_user_verified') === 'true';
      const phone = localStorage.getItem('infinity_user_phone') || '';
      const name = localStorage.getItem('infinity_user_name') || '';
      const room = localStorage.getItem('infinity_user_room') || '';

      if (isVerified || (phone && name)) {
        return {
          id: `student-${phone.replace(/\D/g, '') || 'verified'}`,
          name: name || 'Campus Student',
          phone: phone,
          room: room,
          email: `${(name || 'student').toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Campus')}`,
          isVerified: isVerified,
        };
      }
    } catch {}
    return null;
  };

  const [user, setUser] = useState<AuthUser | null>(getLocalStudent);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Sync state if localStorage changes in other tabs/windows
  const refreshUser = () => {
    setUser(getLocalStudent());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getLocalStudent());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const openLoginModal = () => {
    // No-op: Login modal removed in favor of smart WhatsApp verification at checkout
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const signInWithGoogle = async () => {
    // No-op: Google login eliminated per store specifications
    console.log('[Auth] Google OAuth bypassed - using WhatsApp 1-click verification flow');
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('infinity_user_verified');
      localStorage.removeItem('infinity_user_phone');
      localStorage.removeItem('infinity_user_name');
      localStorage.removeItem('infinity_user_room');
      localStorage.removeItem('infinity_student_profile');
      localStorage.removeItem('infinity_auth_user');
    } catch {}
    setUser(null);
    setIsLoginModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.isVerified),
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        signInWithGoogle,
        signOut,
        refreshUser,
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
