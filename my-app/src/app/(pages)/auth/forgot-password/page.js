"use client";
import { useState } from "react";
import Link from "next/link";
import "./page.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle password reset logic here
        setSubmitted(true);
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
}

export default ForgotPassword; 