'use client';
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mountedRef = useRef(false);
  const authCheckedRef = useRef(false);
  const intervalIdRef = useRef(null); // Track interval ID

  const checkInitialAuth = async () => {
    if (!mountedRef.current || authCheckedRef.current) return;

    // Skip auth check for public routes
    const publicRoutes = ['/auth/', '/register', '/reportGenerator'];
    const currentPath = window.location.pathname;
    
    // Allow homepage access without auth check
    if (currentPath === '/' || publicRoutes.some(route => currentPath.startsWith(route))) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.status === 401 || !data.user) {
        setUser(null);
        setIsAuthenticated(false);
        // Only redirect to login if we're on a protected route
        if (currentPath.startsWith('/dashboard')) {
          router.push('/auth/login');
        }
      } else {
        setUser(data.user);
        setIsAuthenticated(true);
      }

      authCheckedRef.current = true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      // Only redirect to login if we're on a protected route
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/dashboard')) {
        router.push('/auth/login');
      }
      authCheckedRef.current = true;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    if (!mountedRef.current || !isAuthenticated) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Token refresh failed');

      const data = await res.json();

      if (data.user) {
        setUser(data.user);
      } else {
        throw new Error('No user returned');
      }
    } catch (error) {
      toast.error('Session expired. Please login again.');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/auth/login');
    }
  };

  const startTokenRefreshInterval = () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);

    intervalIdRef.current = setInterval(async () => {
      await refreshToken();
    }, 9 * 60 * 1000); // 9 minutes
  };

  // Initial auth check on mount
  useEffect(() => {
    mountedRef.current = true;
    checkInitialAuth();

    return () => {
      mountedRef.current = false;
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  // Re-run auth check on route change (handles proxy login soft navigation)
  useEffect(() => {
    if (!mountedRef.current) return;
    authCheckedRef.current = false;
    checkInitialAuth();
  }, [pathname]);

  // Start refresh interval when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      startTokenRefreshInterval();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      setUser,
      setIsAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
