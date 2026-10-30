import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Institution } from '../types';
import { DEMO_USERS } from '../lib/mockData';
import { campusStore } from '../lib/store';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  institution: Institution | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginAsDemoRole: (roleKey: string) => void;
  logout: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cs_active_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Student (Amanpreet Kaur) for immediate accessibility, or restore from storage
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed parsing stored auth:', e);
    }
    return DEMO_USERS.student; // Default initial view
  });

  const [institution, setInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      if (user.institution_id) {
        const inst = campusStore.getInstitutions().find((i) => i.id === user.institution_id);
        setInstitution(inst || null);
      } else {
        setInstitution(null);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setInstitution(null);
    }
  }, [user]);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    // Find matching demo user by email
    const matched = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      setUser(matched);
      return true;
    }

    // If new email, create a default student session
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      full_name: email.split('@')[0],
      role: 'student',
      institution_id: 'inst-1',
      institution_name: 'Khalsa College of Engineering & Technology',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    return true;
  };

  const loginAsDemoRole = (roleKey: string) => {
    if (DEMO_USERS[roleKey]) {
      setUser(DEMO_USERS[roleKey]);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        institution,
        isAuthenticated: !!user,
        login,
        loginAsDemoRole,
        logout,
        isDemoMode: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

