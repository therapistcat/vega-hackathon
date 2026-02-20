import React, { useEffect, useState } from 'react';
import { SkeletonTable } from '../../components/Skeleton';
import api from '../../utils/api';

export default function ResolveComplaint() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchPending = async () => {
        try {
            const res = await api.get('/a/complaints?status=pending');
            const data = Array.isArray(res.data) ? res.data : res.data.complaints || [];
            setComplaints(data.filter((c) => (c.status || '').toLowerCase() === 'pending'));
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (id, action) => {
        try {
            await api.patch(`/a/complaints/${id}`, { status: action });
            setToast({ type: 'success', message: `Complaint #${id} marked as ${action}` });
            fetchPending();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Action failed' });
        } finally {
            setTimeout(() => setToast(null), 3500);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton skeleton-text" style={{ height: 32, width: '40%', marginBottom: 32 }} />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />
                ))}
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Review Pending Complaints
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
                Action required on {complaints.length} new items
            </p>

            {complaints.length === 0 ? (
                <div className="glass-panel" style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>All caught up!</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No pending complaints to resolve right now</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {complaints.map((c, i) => (
                        <div
                            key={c.id || i}
                            className="glass-panel glass-hover"
                            style={{ padding: 24, cursor: 'normal' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ flex: 1, minWidth: 280 }}>
                                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                        <span className="badge-pill" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>Pending Review</span>
                                        <span className="badge-pill" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{c.category || 'General'}</span>
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                                        {c.title || 'Untitled Complaint'}
                                    </h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, maxWidth: 600 }}>
                                        {c.description || 'No description provided.'}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Filed by {c.citizen_name || c.user_email || 'Anonymous'} • {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: 12, borderLeft: '1px solid rgba(148, 163, 184, 0.2)', paddingLeft: 24 }}>
                                    <button
                                        onClick={() => handleAction(c.id, 'resolved')}
                                        className="btn-gradient"
                                        style={{ background: 'var(--success)', width: 'auto', padding: '10px 20px', fontSize: 13 }}
                                    >
                                        ✓ Approve Resolve
                                    </button>
                                    <button
                                        onClick={() => handleAction(c.id, 'rejected')}
                                        className="btn-gradient"
                                        style={{ background: '#fff', color: 'var(--danger)', border: '1px solid var(--danger)', width: 'auto', padding: '10px 20px', fontSize: 13, boxShadow: 'none' }}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div className="glass-primary" style={{
                    position: 'fixed', bottom: 24, right: 24,
                    background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff', padding: '12px 24px', borderRadius: 16,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600,
                    animation: 'floatUp 0.3s ease-out', border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
