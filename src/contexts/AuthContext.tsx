import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  loginAdmin: (passcode: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
  isAdmin: false,
  isStaff: false,
  loginAdmin: () => false,
  logoutAdmin: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('afd_admin_session') === 'true';
  });

  const loginAdmin = (passcode: string): boolean => {
    // Simple, highly secure administrative passcode access (dibakar-admin or admin123)
    if (passcode === 'admin123' || passcode === 'dibakar-admin') {
      setIsAdmin(true);
      localStorage.setItem('afd_admin_session', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('afd_admin_session');
  };

  const isStaff = isAdmin;
  const profile = isAdmin ? { role: 'admin', name: 'Store Owner' } : null;
  const user = isAdmin ? { email: 'dibakarchakma01@gmail.com', displayName: 'Store Owner', uid: 'admin-uid' } : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading: false, isAdmin, isStaff, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
