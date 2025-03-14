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
            intervalId = setInterval(refreshToken, 14000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isAuthenticated, router]);

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setUser(null);
            setIsAuthenticated(false);
            router.replace('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            isAuthenticated,
            setUser,
            setIsAuthenticated,
            logout,
            checkAuth 
        }}>
            {children}
        </AuthContext.Provider> 
    );
}

export function useAuth() {
    return useContext(AuthContext);
}