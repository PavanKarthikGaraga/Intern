"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./page.css";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
    const [captcha, setCaptcha] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const router = useRouter();
    const { setIsAuthenticated, checkAuth } = useAuth();

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setCaptcha(randomNum.toString());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (captchaInput !== captcha) {
            toast.error('Incorrect captcha');
            return;
        }

        try {

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    idNumber,
                    password
                })
            });
            
            
            const data = await response.json();
            
            if (response.ok) {
                await checkAuth(); // This will set the user and isAuthenticated state
                toast.success('Login successful');
                router.push(`/dashboard/${data.user.role}`);
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (error) {
            console.log('Login error:', error);
            toast.error('Login failed');
        }
    };

    return (
        <div className="login-component">
            {/* <Toaster position="top-center" /> */}
            <div className="login-component-in">
                <div className="login-header">
                    <h1>Smart Village <span>Revolution</span></h1>
                    <h2>Please sign in to continue</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="idNumber">ID Number</label>
                        <input 
                            type="text" 
                            id="idNumber" 
                            value={idNumber} 
                            autoComplete="Id-Number"
                            onChange={(e)=>setIdNumber(e.target.value)} 
                            placeholder="Enter your ID number"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="text" 
                            value={password} 
                            autoComplete="current-password"
                            onChange={(e)=>setPassword(e.target.value)} 
                            id="password" 
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div className="form-group-recaptive">
                        <label className="captcha">{captcha}</label>
                        <input
                            value={captchaInput} 
                            onChange={(e)=>setCaptchaInput(e.target.value)}
                            type="text" 
                            placeholder="Enter the code above"
                            required
                        />
                    </div>
                    <div className="form-group-button">
                        <button type="submit">Sign In</button>
                        <Link href="/auth/forgot-password">
                            <p>Forgot Password?</p>
                        </Link>
                        <Link href="/internship">
                            <p>Don't have an account? Register here</p>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;