import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// High-Res Mumbai Landmarks (Unsplash Source)
const IMAGES = [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=90&w=2535&auto=format&fit=crop', // Gateway of India
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=90&w=2670&auto=format&fit=crop', // Skyline
    'https://images.unsplash.com/photo-1605218439352-22aa84db55ee?q=90&w=2670&auto=format&fit=crop', // Marine Drive Night
    'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=90&w=2535&auto=format&fit=crop', // Sea Link
];

const DEMO_ACCOUNTS = {
    'citizen@example.com': { password: 'citizen123', role: 'citizen', name: 'Demo Citizen' },
    'admin@example.com': { password: 'admin123', role: 'admin', name: 'Demo Admin' },
};

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('citizen@example.com');
    const [password, setPassword] = useState('citizen123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);

    // Auto-slide background every 6s for slower, premium feel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const fillDemo = (role) => {
        if (role === 'admin') {
            setEmail('admin@example.com');
            setPassword('admin123');
        } else {
            setEmail('citizen@example.com');
            setPassword('citizen123');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { access_token, user } = res.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard', { replace: true });
        } catch (err) {
            // Offline fallback
            const demo = DEMO_ACCOUNTS[email];
            if (demo && demo.password === password) {
                localStorage.setItem('token', 'demo_token_' + demo.role);
                localStorage.setItem('user', JSON.stringify({ email, name: demo.name, role: demo.role }));
                navigate(demo.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard', { replace: true });
            } else {
                setError(err.response?.data?.detail || 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Immersive Background Carousel */}
            <div className="login-carousel">
                {IMAGES.map((img, index) => (
                    <div
                        key={index}
                        className={`carousel-slide ${index === currentImage ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                    />
                ))}
                <div className="carousel-overlay" />
            </div>

            {/* Glass Login Card */}
            <div className="login-card-glass">
                <div className="login-header">
                    <div style={{
                        width: 72, height: 72, background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                        borderRadius: '20px', color: '#fff', fontSize: '28px', fontWeight: '800',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                        boxShadow: '0 15px 35px -5px rgba(37,99,235,0.4)'
                    }}>
                        SC
                    </div>
                    <h1>Smart Civic</h1>
                    <p>Building a Smarter Mumbai Together</p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--danger-bg)', color: '#DC2626', padding: '12px',
                        borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '600',
                        border: '1px solid rgba(220,38,38,0.2)', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-gradient" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
                        QUICK DEMO ACCESS
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            type="button"
                            onClick={() => fillDemo('citizen')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border-default)',
                                background: '#fff', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                        >
                            👤 Citizen
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemo('admin')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border-default)',
                                background: '#fff', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                        >
                            🛡️ Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
