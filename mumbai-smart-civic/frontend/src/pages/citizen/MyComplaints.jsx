import React, { useEffect, useState } from 'react';
import { SkeletonTable } from '../../components/Skeleton';
import api from '../../utils/api';

export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('pothole');
    const [ward, setWard] = useState('A Ward');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/c/complaints/me');
            setComplaints(Array.isArray(res.data) ? res.data : res.data.complaints || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchComplaints(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const finalDescription = title
                ? `${title} - ${description}`
                : description;
            await api.post('/c/complaints', {
                description: finalDescription,
                category,
                ward,
                location: {
                    lat: parseFloat(latitude) || 19.076,
                    lng: parseFloat(longitude) || 72.8777,
                },
            });
            setToast({ type: 'success', message: 'Complaint submitted successfully!' });
            setShowForm(false);
            setTitle('');
            setDescription('');
            setCategory('pothole');
            setWard('A Ward');
            setLatitude('');
            setLongitude('');
            fetchComplaints();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to submit complaint' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setToast(null), 3500);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton skeleton-text full" style={{ height: 30, width: '30%', marginBottom: 24 }} />
                <div className="data-table-wrap"><SkeletonTable rows={6} /></div>
            </div>
        );
    }

    return (
        <div className="page-container" id="my-complaints-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>My Complaints</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed
                    </p>
                </div>
                <button
                    className={`btn ${showForm ? 'btn-ghost' : 'btn-primary-filled'}`}
                    id="new-complaint-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Cancel' : '＋ New Complaint'}
                </button>
            </div>

            {showForm && (
                <div className="complaint-form" style={{ marginBottom: 24 }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="complaint-title">Title</label>
                            <input id="complaint-title" type="text" placeholder="Brief title for your complaint" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="complaint-desc">Description</label>
                            <textarea id="complaint-desc" placeholder="Describe the issue in detail…" value={description} onChange={(e) => setDescription(e.target.value)} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                            <div className="form-group">
                                <label htmlFor="complaint-cat">Category</label>
                                <select id="complaint-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="pothole">Pothole</option>
                                    <option value="garbage">Garbage</option>
                                    <option value="streetlight">Streetlight</option>
                                    <option value="water">Water Supply</option>
                                    <option value="sewage">Sewage</option>
                                    <option value="noise">Noise</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="complaint-ward">Ward</label>
                                <input
                                    id="complaint-ward"
                                    type="text"
                                    placeholder="A Ward"
                                    value={ward}
                                    onChange={(e) => setWard(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="complaint-lat">Latitude</label>
                                <input id="complaint-lat" type="number" step="any" placeholder="19.076" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="complaint-lng">Longitude</label>
                                <input id="complaint-lng" type="number" step="any" placeholder="72.8777" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success" id="submit-complaint" disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Submit Complaint'}
                        </button>
                    </form>
                </div>
            )}

            {complaints.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-img">
                        <img src="https://images.indianexpress.com/2025/12/potholes.jpg?w=1200" alt="City road" loading="lazy" />
                    </div>
                    <h3>No complaints filed</h3>
                    <p>Click "New Complaint" to report a civic issue in your area</p>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table" id="complaints-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map((c, i) => (
                                <tr key={c.id || i}>
                                    <td style={{ color: 'var(--text-faint)' }}>{i + 1}</td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.title || c.description?.slice(0, 50)}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{c.category || '—'}</td>
                                    <td>
                                        <span className={`badge badge-${(c.status || 'pending').toLowerCase().replace(/\s+/g, '_')}`}>
                                            {c.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {toast && <div className={`toast toast-${toast.type}`} id="toast">{toast.message}</div>}
        </div>
    );
}
