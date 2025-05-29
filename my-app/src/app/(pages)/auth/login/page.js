"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "./page.css";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext"

const Login = () => {
    const [captcha, setCaptcha] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { setUser, setIsAuthenticated } = useAuth();

    const generateCaptcha = useCallback(() => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setCaptcha(captcha);
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
            toast.error('Incorrect captcha');
            generateCaptcha();
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                toast.success('Login successful');
                router.push(`/dashboard/${data.user.role}`);
            } else {
                console.log('Login error:', data);
                toast.error(data.error || 'Login failed');
                generateCaptcha();
            }
        } catch (error) {
            console.log('Login error:', error);
            toast.error('Login failed');
            generateCaptcha();
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-component">
            {/* <Toaster position="top-center" /> */}
            <div className="login-component-in">
                <div className="login-header">
                    <h1>Social Internship <span>Dashboard</span></h1>
                    <h2>Please sign in to continue</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">ID Number</label>
                        <input 
                            type="text" 
                            id="username" 
                            value={username} 
                            autoComplete="Id-Number"
                            onChange={(e)=>setUsername(e.target.value)} 
                            placeholder="Enter your ID number"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            autoComplete="current-password"
                            onChange={(e)=>setPassword(e.target.value)} 
                            id="password" 
                            placeholder="Enter your password"
                            required
                            disabled={isSubmitting}
                        />
                        <button 
                            type="button" 
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                            disabled={isSubmitting}
                            suppressHydrationWarning
                        >
                            {showPassword ? (
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor"
                                    suppressHydrationWarning
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                >
                                    <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                                    <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                                    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
                                </svg>
                            ) : (
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor"
                                    suppressHydrationWarning
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                >
                                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="form-group-recaptive">
                        <label className="captcha">{captcha}</label>
                        <input
                            value={captchaInput} 
                            onChange={(e)=>setCaptchaInput(e.target.value)}
                            type="text" 
                            placeholder="Enter the code above"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group-button">
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="loader"></span>
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                        {/* <Link href="/register" prefetch={true}>
                            <p>Don't have an account? Register here</p>
                        </Link>
                        <Link href="/auth/forgot-password" prefetch={true}>
                            <p>Forgot Password?</p>
                        </Link> */}
                        <Link href="/reportGenerator" className="report-generator-button" prefetch={true}>
                            
                                <h6>Report Generator</h6>
                        </Link>
                    </div>
                </form>
            </div>
            {/* <Link href="/reportGenerator" className="floating-blob">
                <span className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </span>
                <span className="text">Report Generator</span>
            </Link> */}
        </div>
    );
};

export default Login;