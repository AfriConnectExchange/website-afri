
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define a more specific type for your mock user
export interface MockUser {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  avatarUrl?: string;
}

interface AuthContextType {
  isLoading: boolean;
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (user: Omit<MockUser, 'id'>) => void;
  logout: () => void;
  updateUser: (data: Partial<MockUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A mock user for demonstration purposes
const MOCK_USER: MockUser = {
  id: 'user_mock_12345',
  email: 'test.user@africonnect.com',
  fullName: 'Test User',
  roles: ['buyer', 'seller'],
  avatarUrl: 'https://picsum.photos/seed/user-avatar/100/100',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MockUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a session
    try {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('mockUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: Omit<MockUser, 'id'>) => {
    const newUser = { ...MOCK_USER, ...userData };
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    setUser(newUser);
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('mockUser');
    setUser(null);
    router.push('/auth/signin');
  }, [router]);

  const updateUser = useCallback((data: Partial<MockUser>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...data };
        localStorage.setItem('mockUser', JSON.stringify(updatedUser));
        return updatedUser;
    });
  }, []);

  const value = useMemo(() => ({
    isLoading,
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser
  }), [isLoading, user, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// A higher-order component to protect routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/auth/signin');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
      // You can return a loader here
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return <Component {...props} />;
  };
}
