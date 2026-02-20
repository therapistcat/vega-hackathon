import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const IMAGES = [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=90&w=2535&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=90&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605218439352-22aa84db55ee?q=90&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=90&w=2535&auto=format&fit=crop',
];

const DEMO_ACCOUNTS = {
    citizen: {
        email: 'citizen@example.com',
        password: 'Citizen@12345',
    },
    authority: {
        email: 'authority@example.com',
        password: 'Authority@12345',
        authorityCode: 'MUM-COM-4404',
    },
};

const inputClassName =
    'w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/70 backdrop-blur-md transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState(DEMO_ACCOUNTS.citizen.email);
    const [password, setPassword] = useState(DEMO_ACCOUNTS.citizen.password);
    const [loginAs, setLoginAs] = useState('citizen');
    const [authorityCode, setAuthorityCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const fillDemo = (mode) => {
        if (mode === 'authority') {
            setLoginAs('authority');
            setEmail(DEMO_ACCOUNTS.authority.email);
            setPassword(DEMO_ACCOUNTS.authority.password);
            setAuthorityCode(DEMO_ACCOUNTS.authority.authorityCode);
            return;
        }
        setLoginAs('citizen');
        setEmail(DEMO_ACCOUNTS.citizen.email);
        setPassword(DEMO_ACCOUNTS.citizen.password);
        setAuthorityCode('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                email,
                password,
                login_as: loginAs,
            };
            if (loginAs === 'authority') {
                payload.authority_code = authorityCode;
            }

            const res = await api.post('/auth/login', payload);
            const { access_token, role, authority_rank, authority_level } = res.data;

            const user = {
                email,
                name: email.split('@')[0],
                role,
                authority_rank,
                authority_level,
            };

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            if (role === 'authority' || role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/citizen/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
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

            <div className="pointer-events-none absolute -top-16 left-8 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl animate-blob" />
            <div className="pointer-events-none absolute -bottom-20 right-8 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl animate-blob [animation-delay:2s]" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/30 to-black/40 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/35 hover:shadow-[0_0_42px_rgba(96,165,250,0.35)] sm:p-8 animate-authFade">
                <div className="mb-5 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-500/35">
                        SC
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Smart Civic</h1>
                    <p className="mt-2 text-white/70">Mumbai Civic Portal</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-300/50 bg-red-500/20 px-4 py-2 text-center text-sm font-medium text-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-as" className="mb-2 block text-sm font-semibold text-white/80">
                            Login As
                        </label>
                        <select
                            id="login-as"
                            className={inputClassName}
                            value={loginAs}
                            onChange={(e) => setLoginAs(e.target.value)}
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

                    {loginAs === 'authority' && (
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
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-white/60">
                    Authority rank is validated by authority code during login.
                </p>

                <div className="mt-5 border-t border-white/20 pt-4">
                    <p className="mb-3 text-center text-xs font-semibold tracking-[0.22em] text-white/60">QUICK FILL</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => fillDemo('citizen')}
                            className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/25"
                        >
                            Citizen
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemo('authority')}
                            className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/25"
                        >
                            Authority
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-center text-sm text-white/60">
                    <span>New here?</span>
                    <Link className="ml-2 font-semibold text-blue-200 hover:text-white" to="/signup">
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    );
}
