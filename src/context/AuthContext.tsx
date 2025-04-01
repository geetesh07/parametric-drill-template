import React from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string, rememberMe: boolean) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, metadata: { username: string; full_name: string; phone_number: string }) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  logout: () => void;
}

// Create a context with default values
const mockAuthContext: AuthContextType = {
  user: null,
  loading: false,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  logout: () => {},
};

// Export the mock hook
export function useAuth(): AuthContextType {
  return mockAuthContext;
}

// Empty AuthProvider for compatibility
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
