"use client";
import { useContext, useState, useEffect, createContext } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            // Check if we have a cached valid auth state
            if (isAuthenticated && user) {
                return true;
            }

            // First check if user is valid
            const checkResponse = await fetch("/api/auth/check", {
                method: "GET",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                cache: 'no-store' // Prevent caching of auth check
            });
            
            const checkData = await checkResponse.json();
            
            if (!checkResponse.ok || checkData.error === "Token expired") {
                // If token expired, try to refresh
                const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "GET",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
                    cache: 'no-store' // Prevent caching of refresh
                });
                
                const refreshData = await refreshResponse.json();
                
                if (!refreshResponse.ok || !refreshData.success) {
                    throw new Error(refreshData.error || 'Auth refresh failed');
                }

                setUser(refreshData.user);
                setIsAuthenticated(true);
                return true;
            }

            if (!checkData.user) {
                throw new Error('Auth check failed');
            }

            setUser(checkData.user);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.log('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            return false;
        }
    };

    const logout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            router.replace('/auth/login');
            setUser(null);
            setIsAuthenticated(false);
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Failed to logout');
            console.error('Logout error:', error);
        }
    };

    // Initial auth check
    useEffect(() => {
        let mounted = true;
        
        const initializeAuth = async () => {
            try {
                await checkAuth();
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            mounted = false;
        };
    }, []);

    // Handle automatic token refresh
    useEffect(() => {
        let intervalId;
        let mounted = true;

        const refreshToken = async () => {
            if (!mounted) return;
            
            try {
                // Only refresh if we're actually authenticated
                if (isAuthenticated && user) {
                    const success = await checkAuth();
                    if (!success) {
                        clearInterval(intervalId);
                        toast.error("Session expired. Please login again.");
                        router.replace('/auth/login');
                    }
                }
            } catch (error) {
                console.error('Token refresh error:', error);
                clearInterval(intervalId);
                toast.error("Session error. Please login again.");
                router.replace('/auth/login');
            }
        };

        if (isAuthenticated) {
            // Refresh every 4 minutes (access token is 10 minutes)
            intervalId = setInterval(refreshToken, 240000);
            // Also run immediately to ensure we have a valid token
            refreshToken();
        }

        return () => {
            mounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [isAuthenticated, router, user]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            isAuthenticated,
            setUser,
            setIsAuthenticated,
            checkAuth,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}