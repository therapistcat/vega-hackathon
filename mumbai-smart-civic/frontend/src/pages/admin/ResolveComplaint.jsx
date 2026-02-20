import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function ResolveComplaint() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchOpen = async () => {
        try {
            const res = await api.get('/a/complaints');
            const data = Array.isArray(res.data) ? res.data : [];
            setComplaints(data.filter((c) => (c.status || '').toLowerCase() === 'open'));
        } catch {
            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpen();
    }, []);

    const handleStatus = async (id, status) => {
        try {
            await api.patch(`/a/complaints/${id}/status`, { status });
            setToast({ type: 'success', message: `Complaint marked as ${status}` });
            fetchOpen();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Action failed' });
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Resolve Complaints</h2>
                <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Resolve Open Complaints
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                Open complaints: {complaints.length}
            </p>

            {complaints.length === 0 ? (
                <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No open complaints</h3>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {complaints.map((c) => (
                        <div key={c.id} className="glass-panel" style={{ padding: 20 }}>
                            <div style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                                #{c.id}
                            </div>
                            <h3 style={{ marginBottom: 8 }}>{c.description?.slice(0, 80) || 'Complaint'}</h3>
                            <p style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                                {c.category} | {c.ward}
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => handleStatus(c.id, 'In Progress')}
                                    className="btn-gradient"
                                    style={{ width: 'auto', padding: '10px 18px' }}
                                >
                                    Mark In Progress
                                </button>
                                <button
                                    onClick={() => handleStatus(c.id, 'Resolved')}
                                    className="btn-gradient"
                                    style={{ width: 'auto', padding: '10px 18px', background: 'var(--success)' }}
                                >
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, padding: '10px 18px',
                    borderRadius: 12, color: '#fff',
                    background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
