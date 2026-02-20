import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const IMAGES = [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=90&w=2535&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=90&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605218439352-22aa84db55ee?q=90&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=90&w=2535&auto=format&fit=crop',
];

const inputClassName =
    'w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/70 backdrop-blur-md transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400';

export default function Signup() {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signupAs, setSignupAs] = useState('citizen');
    const [authorityRank, setAuthorityRank] = useState('commissioner');
    const [authorityCode, setAuthorityCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (signupAs === 'authority') {
                await api.post('/auth/register/authority', {
                    name,
                    email,
                    password,
                    authority_rank: authorityRank,
                    authority_code: authorityCode,
                });
            } else {
                await api.post('/auth/register', { name, email, password });
            }
            setSuccess('Account created successfully. Redirecting to login...');
            setTimeout(() => navigate('/', { replace: true }), 1000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
            <div className="absolute inset-0">
                {IMAGES.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms] ${index === currentImage ? 'opacity-100' : 'opacity-0'}`}
                        style={{ backgroundImage: `url(${img})` }}
                    />
                ))}
            </div>

            <div className="pointer-events-none absolute -top-16 right-8 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl animate-blob" />
            <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl animate-blob [animation-delay:2s]" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/30 to-black/40 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/35 hover:shadow-[0_0_42px_rgba(96,165,250,0.35)] sm:p-8 animate-authFade">
                <div className="mb-5 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-500/35">
                        SC
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Create Account</h1>
                    <p className="mt-2 text-white/70">Join Mumbai Smart Civic Portal</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-300/50 bg-red-500/20 px-4 py-2 text-center text-sm font-medium text-red-100">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 rounded-xl border border-emerald-300/50 bg-emerald-500/20 px-4 py-2 text-center text-sm font-medium text-emerald-100">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="signup-as" className="mb-2 block text-sm font-semibold text-white/80">
                            Register As
                        </label>
                        <select
                            id="signup-as"
                            className={inputClassName}
                            value={signupAs}
                            onChange={(e) => setSignupAs(e.target.value)}
                        >
                            <option className="bg-slate-800 text-white" value="citizen">
                                Citizen
                            </option>
                            <option className="bg-slate-800 text-white" value="authority">
                                Authority
                            </option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-white/80">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            className={inputClassName}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-white/80">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={inputClassName}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-white/80">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={`${inputClassName} pr-16`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/80 transition hover:text-white"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {signupAs === 'authority' && (
                        <>
                            <div>
                                <label htmlFor="authority-rank" className="mb-2 block text-sm font-semibold text-white/80">
                                    Authority Rank
                                </label>
                                <select
                                    id="authority-rank"
                                    className={inputClassName}
                                    value={authorityRank}
                                    onChange={(e) => setAuthorityRank(e.target.value)}
                                >
                                    <option className="bg-slate-800 text-white" value="inspector">
                                        Inspector
                                    </option>
                                    <option className="bg-slate-800 text-white" value="ward_officer">
                                        Ward Officer
                                    </option>
                                    <option className="bg-slate-800 text-white" value="deputy_commissioner">
                                        Deputy Commissioner
                                    </option>
                                    <option className="bg-slate-800 text-white" value="commissioner">
                                        Commissioner
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="authority-code" className="mb-2 block text-sm font-semibold text-white/80">
                                    Authority Code
                                </label>
                                <input
                                    id="authority-code"
                                    type="text"
                                    className={inputClassName}
                                    value={authorityCode}
                                    onChange={(e) => setAuthorityCode(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-white/60">
                    <span>Already have an account?</span>
                    <Link className="ml-2 font-semibold text-blue-200 hover:text-white" to="/">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
