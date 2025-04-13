"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import "./page.css";

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            toast.error('Invalid reset link');
            router.push('/auth/login');
            return;
        }
        setToken(token);
    }, [searchParams, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/auth/reset-password', {
                token,
                password
            });

            if (response.data.success) {
                toast.success('Password reset successful');
                router.push('/auth/login');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return null;
    }

    return (
        <div className="reset-password-component">
            <div className="reset-password-component-in">
                <div className="reset-password-header">
                    <h1>Reset <span>Password</span></h1>
                    <p>Enter your new password below</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group-button">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <Link href="/auth/login">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
} 