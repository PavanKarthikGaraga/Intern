"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./page.css";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";


const Login = () => {
    const [captcha, setCaptcha] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');

    const router= useRouter() ;
    
    // Generate random 4-digit number for captcha
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
            const response = await axios.post('/api/auth/login', {
                idNumber,
                password
            });
            if(response.data.message === 'User Successfully Logged In'){
                toast.success('Login successful');
                router.replace('/');
            }else{
                toast.error('Login failed');
            }
        } catch (error) {
            console.error(error);
        }
    }
        


    return ( 
        <div className="login-component">
            <Toaster position="top-center" />

            <div className="login-component-in">
                <div className="login-header">
                    <h1>Smart Village <span>Revolution</span></h1>
                    <h2>Please sign in to continue</h2>
                </div>
                <form action="">
                    <div className="form-group">
                        <label htmlFor="idNumber">ID Number</label>
                        <input type="text" id="idNumber" value={idNumber} onChange={(e)=>setIdNumber(e.target.value)} placeholder="Enter your ID number"/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} id="password" placeholder="Enter your password"/>
                    </div>
                    <div className="form-group-recaptive">
                        <label className="captcha">{captcha}</label>
                        <input
                            value={captchaInput} 
                            onChange={(e)=>setCaptchaInput(e.target.value)}
                            type="text" 
                            placeholder="Enter the code above"
                        />
                    </div>
                    <div className="form-group-button">
                        <button onClick={handleSubmit} type="button">Sign In</button>
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