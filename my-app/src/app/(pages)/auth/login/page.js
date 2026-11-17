"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import "./page.css";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RefreshCw, ArrowLeft, ShieldCheck, CalendarCheck, Users, LogIn } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

const HIGHLIGHTS = [
    { icon: CalendarCheck, text: "Choose a 7-day slot and submit daily field reports" },
    { icon: Users, text: "Work with student leads and faculty mentors" },
    { icon: ShieldCheck, text: "Track evaluation and download your certificate" },
];

const Login = () => {
    const [captcha, setCaptcha] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const router = useRouter();
    const { setUser, setIsAuthenticated } = useAuth();

    const generateCaptcha = useCallback(() => {
        const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz123456789';
        let next = '';
        for (let i = 0; i < 6; i++) {
            next += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setCaptcha(next);
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    const refreshCaptcha = () => {
        generateCaptcha();
        setCaptchaInput('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError('');

        if (captchaInput.trim().toLowerCase() !== captcha.toLowerCase()) {
            setFormError('The verification code doesn’t match. Please try again.');
            toast.error('Incorrect verification code');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: username.trim(), password }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.user) {
                setUser(data.user);
                setIsAuthenticated(true);
                toast.success('Signed in successfully');
                router.push(`/dashboard/${data.user.role}`);
            } else {
                const message = data.error || 'Sign-in failed. Please check your ID and password.';
                setFormError(message);
                toast.error(message);
            }
        } catch (error) {
            console.error('Login error:', error);
            setFormError('We couldn’t reach the server. Check your connection and try again.');
            toast.error('Sign-in failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <aside className="login-brand">
                <Image
                    src="/hero/20230516_30205PMByGPSMapCamera.jpeg"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 960px) 0px, 50vw"
                    className="login-brand-photo"
                />
                <div className="login-brand-overlay" />
                <div className="login-brand-content">
                    <div className="login-brand-logo">
                        <img src="/klu.png" alt="KL University" width={120} height={48} />
                    </div>
                    <div>
                        <p className="login-brand-eyebrow">Student Activity Center</p>
                        <h2 className="login-brand-title">Social Internship Programme</h2>
                        <p className="login-brand-subtitle">
                            Smart Village Revolution — community engagement for KL University students.
                        </p>
                    </div>
                    <ul className="login-brand-list">
                        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                            <li key={text}>
                                <span className="login-brand-list-icon"><Icon size={16} aria-hidden="true" /></span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <main className="login-panel">
                <div className="login-card">
                    <Link href="/" className="login-back">
                        <ArrowLeft size={16} aria-hidden="true" /> Back to home
                    </Link>

                    <div className="login-mobile-logo">
                        <img src="/klu.png" alt="KL University" width={110} height={44} />
                    </div>

                    <header className="login-header">
                        <h1>Sign in</h1>
                        <p>Use your university ID number and password to access your dashboard.</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label htmlFor="username">ID number</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. 2500030000"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <div className="login-input-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="login-icon-btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                    disabled={isSubmitting}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="captcha">Verification code</label>
                            <div className="login-captcha-row">
                                <div className="login-captcha" aria-label={`Verification code: ${captcha.split('').join(' ')}`} role="img" suppressHydrationWarning>
                                    {captcha}
                                </div>
                                <button
                                    type="button"
                                    className="login-icon-btn is-bordered"
                                    onClick={refreshCaptcha}
                                    disabled={isSubmitting}
                                    aria-label="Get a new verification code"
                                    title="New code"
                                >
                                    <RefreshCw size={16} aria-hidden="true" />
                                </button>
                                <input
                                    id="captcha"
                                    name="captcha"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    type="text"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder="Type the code"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="login-error" role="alert" aria-live="assertive">
                            {formError}
                        </div>

                        <button type="submit" className="login-submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="login-spinner" aria-hidden="true" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} aria-hidden="true" /> Sign in
                                </>
                            )}
                        </button>
                    </form>

                    <p className="login-footer-text">
                        New to the programme? <Link href="/register">Register for a slot</Link>
                    </p>
                </div>

                <p className="login-help">
                    Trouble signing in? Contact <a href="mailto:sac@kluniversity.in">sac@kluniversity.in</a>
                </p>
            </main>
        </div>
    );
};

export default Login;
