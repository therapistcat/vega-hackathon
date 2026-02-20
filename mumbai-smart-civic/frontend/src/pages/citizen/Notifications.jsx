import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/c/notifications');
                setNotifications(Array.isArray(res.data) ? res.data : res.data.notifications || []);
            } catch {
                setNotifications([
                    {
                        id: 1,
                        title: 'Complaint #1042 Resolved',
                        message: 'Your pothole complaint on MG Road has been resolved by the municipal maintenance team.',
                        read: false,
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 2,
                        title: 'Status Update — Streetlight #847',
                        message: 'Your streetlight complaint has been forwarded to the electrical department for action.',
                        read: false,
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                    },
                    {
                        id: 3,
                        title: 'New Heatmap Feature',
                        message: 'You can now view real-time complaint heatmaps to see civic issue density in your area.',
                        read: true,
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                    },
                    {
                        id: 4,
                        title: 'Garbage Pickup Scheduled',
                        message: 'Your garbage collection complaint for Andheri West has been scheduled for tomorrow.',
                        read: true,
                        created_at: new Date(Date.now() - 172800000).toISOString(),
                    },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton skeleton-text" style={{ height: 28, width: '25%', marginBottom: 24 }} />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)', marginBottom: 10 }} />
                ))}
            </div>
        );
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="page-container" id="notifications-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Notifications</h2>
                {unreadCount > 0 && (
                    <span className="badge badge-pending" style={{ fontSize: 11 }}>
                        {unreadCount} new
                    </span>
                )}
            </div>
            <p className="section-subtitle">Stay updated on your complaint statuses</p>

            {notifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔔</div>
                    <h3>No notifications</h3>
                    <p>You'll be notified when there are updates on your complaints</p>
                </div>
            ) : (
                <div className="notification-list">
                    {notifications.map((n, i) => (
                        <div
                            key={n.id || i}
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            style={{ animationDelay: `${i * 0.05}s` }}
                            id={`notification-${n.id || i}`}
                        >
                            {!n.read && <div className="notification-dot" />}
                            <div className="notification-body" style={{ flex: 1 }}>
                                <h4>{n.title}</h4>
                                <p>{n.message}</p>
                                <div className="notification-time">
                                    {n.created_at ? timeAgo(n.created_at) : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
