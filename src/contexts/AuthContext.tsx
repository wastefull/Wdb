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
  onSessionExpired?: () => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onSessionExpired }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');

  // Handle session expiry
  useEffect(() => {
    const handleSessionExpired = () => {
      authLogger.warn('Session expired - clearing state and redirecting to sign-in');
      setUser(null);
      setUserRole('user');
      sessionStorage.removeItem('wastedb_user');
      sessionStorage.removeItem('wastedb_access_token');
      
      // Call the parent callback to navigate to auth view
      if (onSessionExpired) {
        authLogger.log('Calling onSessionExpired callback to navigate to auth');
        onSessionExpired();
      } else {
        authLogger.warn('No onSessionExpired callback registered');
      }
    };

    // Register the callback with the API module
    api.setSessionExpiredCallback(handleSessionExpired);

    return () => {
      // Clean up callback on unmount
      api.setSessionExpiredCallback(() => {});
    };
  }, [onSessionExpired]);
  
  // Periodic session validation (check every 5 minutes)
  useEffect(() => {
    if (!user || !api.isAuthenticated()) {
      return;
    }

    const validateSession = async () => {
      try {
        // Try to fetch user role as a lightweight session check
        await api.getUserRole();
        authLogger.log('Session validation successful');
      } catch (error) {
        authLogger.warn('Session validation failed - session may have expired');
        // The API module will handle the session expiry via the callback
      }
    };

    // Initial validation after 1 minute
    const initialTimeout = setTimeout(validateSession, 60000);
    
    // Then every 5 minutes
    const intervalId = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [user]);

  // Initialize auth state from session storage
  useEffect(() => {
    const loadUserAndRole = async () => {
      authLogger.log('Initializing auth state from session storage');

      try {
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
              authLogger.info('User role loaded:', role);
            } catch (error) {
              authLogger.error('Error fetching user role:', error);
              // If role fetch fails (likely expired session), the API module will handle it
              // by calling onSessionExpired. We don't need to do anything here.
              // Just log and continue - the session expired handler will clean up.
            }
          }
        } else {
          authLogger.log('No authenticated session found');
        }
      } catch (error) {
        authLogger.error('Error during auth initialization:', error);
        // Clear state on error
        setUser(null);
        setUserRole('user');
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