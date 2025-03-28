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
            const response = await fetch("/api/auth/refresh", {
                method: "GET",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Auth check failed');
            }

            setUser(data.user);
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
        checkAuth().finally(() => setIsLoading(false));
    }, []);

    // Handle automatic token refresh
    useEffect(() => {
        let intervalId;

        const refreshToken = async () => {
            const success = await checkAuth();
            if (!success) {
                clearInterval(intervalId);
                toast.error("Session expired. Please login again.");
                router.replace('/auth/login');
            }
        };

        if (isAuthenticated) {
            // Refresh every 10 seconds (before the 15-second token expiry)
            intervalId = setInterval(refreshToken, 270000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isAuthenticated, router]);


    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            isAuthenticated,
            setUser,
            setIsAuthenticated,
            checkAuth,
            logout  // Add logout to context
        }}>
            {children}
        </AuthContext.Provider> 
    );
}

export function useAuth() {
    return useContext(AuthContext);
}