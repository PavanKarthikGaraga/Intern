"use client";
import { useState } from "react";
import Link from "next/link";
import "./page.css";
import axios from "axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('/api/auth/forgot-password', { email });
            
            if (response.data.success) {
                setSubmitted(true);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.error || 'Failed to process request');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error(error.response?.data?.error || 'Failed to process request');
        }
    };

    return (
        <div className="forgot-password-component">
            <div className="forgot-password-component-in">
                <div className="forgot-password-header">
                    <h1>Reset <span>Password</span></h1>
                    {!submitted ? (
                        <p>Enter your email address and we'll send you instructions to reset your password.</p>
                    ) : (
                        <p className="success-message">
                            If an account exists with this email, you will receive password reset instructions.
                        </p>
                    )}
                </div>
                {!submitted && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input 
                                type="email" 
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        <div className="form-group-button">
                            <button type="submit">Send Reset Link</button>
                            <Link href="/auth/login">
                                <p>Back to Login</p>
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword; 