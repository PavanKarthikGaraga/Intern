"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./page.css";

const Login = () => {
    const [captcha, setCaptcha] = useState('');
    
    // Generate random 4-digit number for captcha
    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setCaptcha(randomNum.toString());
    };

    return ( 
        <div className="login-component">
            <div className="login-component-in">
                <div className="login-header">
                    <h1>Smart Village <span>Revolution</span></h1>
                    <h2>Please sign in to continue</h2>
                </div>
                <form action="">
                    <div className="form-group">
                        <label htmlFor="idNumber">ID Number</label>
                        <input type="text" id="idNumber" placeholder="Enter your ID number"/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" placeholder="Enter your password"/>
                    </div>
                    <div className="form-group-recaptive">
                        <label>{captcha}</label>
                        <input 
                            type="text" 
                            placeholder="Enter the code above"
                        />
                    </div>
                    <div className="form-group-button">
                        <button type="submit">Sign In</button>
                        <Link href="/auth/forgot-password">
                            <p>Forgot Password?</p>
                        </Link>
                        <Link href="/internhsip">
                            <p>Don't have an account? Register here</p>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
     );
}
 
export default Login;