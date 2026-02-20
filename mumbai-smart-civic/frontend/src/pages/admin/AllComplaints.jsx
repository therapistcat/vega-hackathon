import React, { useEffect, useState } from 'react';
import { SkeletonTable } from '../../components/Skeleton';
import api from '../../utils/api';

export default function AllComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/a/complaints');
                setComplaints(Array.isArray(res.data) ? res.data : res.data.complaints || []);
            } catch { /* ignore */ }
            finally { setLoading(false); }
        })();
    }, []);

    const filtered = filter === 'all'
        ? complaints
        : complaints.filter((c) => (c.status || '').toLowerCase() === filter);

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton skeleton-text" style={{ height: 32, width: '40%', marginBottom: 32 }} />
                <div className="table-glass-container"><SkeletonTable rows={8} /></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        All Complaints
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Showing {filtered.length} {filter !== 'all' ? filter : 'total'} records
                    </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.2)', backdropFilter: 'blur(8px)' }}>
                    {['all', 'pending', 'resolved', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                textTransform: 'capitalize', color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                                background: filter === f ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                                transition: 'all 0.2s', border: filter === f ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-glass-container">
                {filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>🔍</div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>No results found</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your filters</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Attribute</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => (
                                    <tr key={c.id || i}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{c.id || 1000 + i}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title || c.description?.slice(0, 40)}</td>
                                        <td>
                                            <span className="badge-pill" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 11 }}>
                                                {c.category || 'General'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {c.latitude ? `${Number(c.latitude).toFixed(3)}, ${Number(c.longitude).toFixed(3)}` : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge-pill status-${(c.status || 'pending').toLowerCase()}`}>
                                                {c.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
