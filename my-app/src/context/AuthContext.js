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
            // First check if user is valid
            const checkResponse = await fetch("/api/auth/check", {
                method: "GET",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });
            
            const checkData = await checkResponse.json();
            
            if (!checkResponse.ok || checkData.error === "Token expired") {
                // If token expired, try to refresh
                const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "GET",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
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

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            toast.success('Password changed successfully');
            return true;
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
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
            // Check auth every 4.5 minutes (access token is 5 minutes)
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
            logout,
            changePassword
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