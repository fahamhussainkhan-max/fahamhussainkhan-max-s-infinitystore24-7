import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  room?: string;
  hostel?: string;
  avatar?: string;
  provider: 'whatsapp';
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  verifyAndLoginWithWhatsApp: (name: string, phone: string, room?: string, hostel?: string) => Promise<void>;
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
      const profileStr = localStorage.getItem('infinity_student_profile');
      const profile = profileStr ? JSON.parse(profileStr) : {};

      if (isVerified || (phone && name)) {
        const cleanDigits = phone.replace(/\D/g, '');
        return {
          id: `student-${cleanDigits || 'verified'}`,
          name: name || profile.fullName || 'Campus Student',
          phone: phone || profile.phone || '',
          room: room || profile.roomNo || '',
          hostel: profile.hostel || 'CCCT — Academic Complex & Admin',
          email: `${(name || 'student').toLowerCase().replace(/\s+/g, '.')}@campus.infinity.store`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Campus')}`,
          provider: 'whatsapp',
          isVerified: true,
        };
      }
    } catch {}
    return null;
  };

  const [user, setUser] = useState<AuthUser | null>(getLocalStudent);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Sync state if localStorage changes across windows/components
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
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const verifyAndLoginWithWhatsApp = async (name: string, phone: string, room?: string, hostel?: string) => {
    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const trimmedName = name.trim();
      const trimmedRoom = (room || '').trim();
      const selectedHostel = hostel || 'CCCT — Academic Complex & Admin';

      localStorage.setItem('infinity_user_name', trimmedName);
      localStorage.setItem('infinity_user_phone', cleanPhone);
      if (trimmedRoom) {
        localStorage.setItem('infinity_user_room', trimmedRoom);
      }
      localStorage.setItem('infinity_user_verified', 'true');
      localStorage.setItem('infinity_whatsapp_verified', 'true');

      const profilePayload = {
        fullName: trimmedName,
        phone: cleanPhone,
        hostel: selectedHostel,
        roomNo: trimmedRoom,
        verifiedVia: 'whatsapp',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('infinity_student_profile', JSON.stringify(profilePayload));

      setUser({
        id: `student-${cleanPhone}`,
        name: trimmedName,
        phone: cleanPhone,
        room: trimmedRoom,
        hostel: selectedHostel,
        email: `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@campus.infinity.store`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
        provider: 'whatsapp',
        isVerified: true,
      });
      setIsLoginModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('infinity_user_verified');
      localStorage.removeItem('infinity_whatsapp_verified');
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
        verifyAndLoginWithWhatsApp,
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
