
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('nts_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        localStorage.removeItem('nts_user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired',
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Mock login function (replace with real API call)
  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (!email.includes('@') || password.length < 6) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid email or password',
        }));
        toast.error('Invalid email or password');
        return false;
      }
      
      // Mock user data
      const user: User = {
        id: 1,
        email,
        name: email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      // Store user in localStorage
      localStorage.setItem('nts_user', JSON.stringify(user));
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast.success('Login successful');
      return true;
      
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to login',
      }));
      toast.error('Failed to login. Please try again.');
      return false;
    }
  };
  
  // Mock signup function (replace with real API call)
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (!email.includes('@') || password.length < 6 || !name) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid signup information',
        }));
        toast.error('Please provide valid signup information');
        return false;
      }
      
      // Mock user data
      const user: User = {
        id: Math.floor(Math.random() * 1000),
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      // Store user in localStorage
      localStorage.setItem('nts_user', JSON.stringify(user));
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast.success('Account created successfully');
      return true;
      
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create account',
      }));
      toast.error('Failed to create account. Please try again.');
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('nts_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.success('Logged out successfully');
  };
  
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
