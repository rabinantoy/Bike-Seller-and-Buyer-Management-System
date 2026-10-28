import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';
import { storageService } from '../services/storage';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAdmin: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'apex_current_user_session';

const DEFAULT_ADMIN: AuthUser = {
  uid: 'usr-admin-01',
  email: 'admin@apexmotohub.com',
  displayName: 'Vikram Sengupta (General Manager)',
  role: 'admin',
};

const DEFAULT_STAFF: AuthUser = {
  uid: 'usr-staff-02',
  email: 'staff@apexmotohub.com',
  displayName: 'Rohit Joshi (Sales Executive)',
  role: 'staff',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMIN; // default pre-authenticated for instant demo usability
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, forcedRole?: UserRole) => {
    const role: UserRole = forcedRole || (email.toLowerCase().includes('admin') ? 'admin' : 'staff');
    const newUser: AuthUser = {
      uid: `usr-${Date.now()}`,
      email,
      displayName: role === 'admin' ? 'Dealership Manager' : 'Sales Representative',
      role,
    };
    setUser(newUser);
    storageService.addAuditLog('LOGIN', 'auth', newUser.uid, `User signed in: ${email} with role [${role.toUpperCase()}]`, email);
  };

  const logout = () => {
    if (user) {
      storageService.addAuditLog('LOGOUT', 'auth', user.uid, `User signed out: ${user.email}`, user.email);
    }
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      setUser(DEFAULT_ADMIN);
      storageService.addAuditLog('LOGIN', 'auth', DEFAULT_ADMIN.uid, `Switched session to Admin`, DEFAULT_ADMIN.email);
    } else {
      setUser(DEFAULT_STAFF);
      storageService.addAuditLog('LOGIN', 'auth', DEFAULT_STAFF.uid, `Switched session to Staff`, DEFAULT_STAFF.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'staff',
        isAdmin: user?.role === 'admin',
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
