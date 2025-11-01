/**
 * Auth Context - Centralized Authentication & Authorization
 * 
 * Manages user authentication state, session persistence, and role management.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authLogger, userLogger } from '../utils/loggerFactories';
import * as api from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface User {
  id: string;
  email: string;
  name?: string;
}

type UserRole = 'user' | 'admin';

interface AuthContextType {
  // State
  user: User | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (userData: User) => Promise<void>;
  signOut: () => void;
  updateUserRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');

  // Initialize auth state from session storage
  useEffect(() => {
    const loadUserAndRole = async () => {
      authLogger.info('Initializing auth state...');
      
      // Check if user is authenticated
      if (api.isAuthenticated()) {
        const userInfo = sessionStorage.getItem('wastedb_user');
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          setUser(userData);
          authLogger.info('User loaded from session:', userData.email);
          
          // Fetch user role
          try {
            const role = await api.getUserRole();
            setUserRole(role);
            userLogger.info('User role:', role);
          } catch (error) {
            authLogger.error('Error fetching user role:', error);
            // If role fetch fails (likely expired session), clear user state
            if (!api.isAuthenticated()) {
              setUser(null);
              setUserRole('user');
            } else {
              setUserRole('user'); // Default to user role on error
            }
          }
        }
      } else {
        authLogger.info('No authenticated user found');
      }
    };
    
    loadUserAndRole();
  }, []);

  const signIn = async (userData: User) => {
    authLogger.info('Signing in user:', userData.email);
    setUser(userData);
    sessionStorage.setItem('wastedb_user', JSON.stringify(userData));
    
    // Fetch user role after successful auth
    try {
      const role = await api.getUserRole();
      setUserRole(role);
      userLogger.info('User role after sign in:', role);
    } catch (error) {
      authLogger.error('Error fetching user role:', error);
      setUserRole('user'); // Default to user role on error
    }
  };

  const signOut = () => {
    authLogger.info('Signing out user:', user?.email);
    api.signOut();
    setUser(null);
    setUserRole('user');
    sessionStorage.removeItem('wastedb_user');
    toast.success('Signed out successfully');
  };

  const updateUserRole = (newRole: UserRole) => {
    userLogger.info('Updating user role to:', newRole);
    setUserRole(newRole);
  };

  const value: AuthContextType = {
    user,
    userRole,
    isAuthenticated: user !== null,
    signIn,
    signOut,
    updateUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
