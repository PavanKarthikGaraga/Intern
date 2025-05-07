'use client';
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mountedRef = useRef(false);
  const authCheckedRef = useRef(false);
  const intervalIdRef = useRef(null); // Track interval ID

  const checkInitialAuth = async () => {
    if (!mountedRef.current || authCheckedRef.current) return;

    console.log('[AuthContext] checkInitialAuth called');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const data = await res.json();
      console.log('[AuthContext] checkData', data);

      if (res.status === 401 || !data.user) {
        setUser(null);
        setIsAuthenticated(false);
        router.push('/auth/login');
      } else {
        setUser(data.user);
        setIsAuthenticated(true);
      }

      authCheckedRef.current = true;
    } catch (error) {
      console.log('[AuthContext] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
      authCheckedRef.current = true;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    if (!mountedRef.current || !isAuthenticated) return;

    console.log('[AuthContext] Refreshing token...');

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Token refresh failed');

      const data = await res.json();
      console.log('[AuthContext] refreshToken data', data);

      if (data.user) {
        setUser(data.user); // Optional: update user if new data returned
        console.log('[AuthContext] Token refreshed successfully');
      } else {
        throw new Error('No user returned');
      }
    } catch (error) {
      console.log('[AuthContext] Token refresh error:', error);
      toast.error('Session expired. Please login again.');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/auth/login');
    }
  };

  const startTokenRefreshInterval = () => {
    console.log('[AuthContext] Starting refresh interval');
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);

    let refreshCount = 0;

    intervalIdRef.current = setInterval(async () => {
      if (refreshCount >= 3) {
        console.log('[AuthContext] Max refresh count reached. Clearing interval.');
        clearInterval(intervalIdRef.current);
        return;
      }

      await refreshToken();
      refreshCount++;
      console.log(`[AuthContext] Token refreshed. Count: ${refreshCount}`);
    }, 9 * 60 * 1000); // 9 minutes
  };

  // Initial auth check on mount
  useEffect(() => {
    mountedRef.current = true;
    checkInitialAuth();

    return () => {
      console.log('[AuthContext] Cleanup on unmount');
      mountedRef.current = false;
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  // Start refresh interval when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[AuthContext] Authenticated: setting interval');
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
