// File: frontend/src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { pb } from '@/lib/pocketbase';
import type { AuthModel } from 'pocketbase'; // Pocketbase type for authenticated user model

// Define the shape of the context data
interface AuthContextType {
  user: AuthModel | null; // User object from Pocketbase, null if not logged in
  token: string | null;   // JWT token, null if not logged in
  login: (user: AuthModel, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isLoading: boolean; // To handle initial auth state loading
}

// Create the context with a default undefined value
// We assert a default value to satisfy TypeScript, but Provider will supply the actual value.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * This component wraps parts of the application that need access to authentication state.
 * It initializes the Pocketbase auth state from cookies and provides login/logout functions.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthModel | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // This effect runs once on mount to initialize auth state from Pocketbase's store
    // Pocketbase JS SDK automatically loads the auth store from localStorage/cookie.
    const initializeAuth = () => {
      if (pb.authStore.isValid) {
        setUser(pb.authStore.model as AuthModel); // Cast model to AuthModel
        setToken(pb.authStore.token);
      } else {
        // Ensure state is cleared if authStore is not valid
        setUser(null);
        setToken(null);
        pb.authStore.clear(); // Clear any remnants
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange((newToken, newModel) => {
      console.log("AuthStore changed:", newModel, newToken);
      setUser(newModel as AuthModel); // Cast model to AuthModel
      setToken(newToken);
      // Persist to cookie for SSR/API routes (optional, but good practice)
      // document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: process.env.NODE_ENV === 'production' });
    }, true); // true to immediately invoke with current state (already handled by initializeAuth)

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const login = (loggedInUser: AuthModel, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
    // The Pocketbase SDK's authWithPassword already updates pb.authStore.
    // This function is more about updating the React state from that.
    // If needed, ensure cookie is set here as well if not handled by onChange.
    // document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: process.env.NODE_ENV === 'production' });
  };

  const logout = () => {
    pb.authStore.clear(); // Clear Pocketbase's auth store
    setUser(null);
    setToken(null);
    // Clear cookie
    // document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });
    // console.log("User logged out, auth store cleared.");
  };

  const isAuthenticated = () => {
    // Check based on the presence of a user and token, and Pocketbase's validity check
    return !!user && !!token && pb.authStore.isValid;
  };

  // Context value
  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the AuthContext
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
