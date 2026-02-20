import React, { useEffect, useState } from 'react';
import MapComponent from '../../components/MapComponent';
import HeatmapLayer from '../../components/HeatmapLayer';
import { SkeletonStats } from '../../components/Skeleton';
import api from '../../utils/api';

const BANNER_IMG = 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?q=80&w=2670&auto=format&fit=crop';

export default function Analytics() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/a/spatial-analytics');
                setPoints(Array.isArray(res.data) ? res.data : []);
            } catch {
                // Fallback demo points
                setPoints([
                    { lat: 19.076, lng: 72.8777, intensity: 0.9 },
                    { lat: 19.0544, lng: 72.8402, intensity: 0.75 },
                    { lat: 19.0896, lng: 72.8656, intensity: 0.95 },
                    { lat: 19.0178, lng: 72.8478, intensity: 0.55 },
                    { lat: 19.1136, lng: 72.8697, intensity: 0.6 },
                    { lat: 19.0330, lng: 72.8454, intensity: 0.85 },
                    { lat: 19.0628, lng: 72.8736, intensity: 0.7 },
                    { lat: 19.0990, lng: 72.8481, intensity: 1.0 },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const avg = points.length > 0
        ? (points.reduce((s, p) => s + p.intensity, 0) / points.length).toFixed(2)
        : '—';
    const peak = points.length > 0
        ? Math.max(...points.map((p) => p.intensity)).toFixed(2)
        : '—';

    return (
        <div className="page-container">
            {/* Banner */}
            <div className="page-banner">
                <img src={BANNER_IMG} alt="Heatmap analytics" loading="lazy" />
                <div className="page-banner-overlay">
                    <h2>Spatial Analytics</h2>
                    <p>Real-time complaint density across Mumbai wards</p>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <SkeletonStats count={3} />
            ) : (
                <div className="stats-grid">
                    <div className="stat-card blue">
                        <div className="stat-value">{points.length}</div>
                        <div className="stat-label">Data Points</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-value">{avg}</div>
                        <div className="stat-label">Avg Intensity</div>
                    </div>
                    <div className="stat-card amber">
                        <div className="stat-value">{peak}</div>
                        <div className="stat-label">Peak Intensity</div>
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="glass-card" style={{ padding: 0, height: 500, overflow: 'hidden', marginTop: 32 }}>
                {loading ? (
                    <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                ) : (
                    <MapComponent>
                        {points.length > 0 && (
                            <HeatmapLayer
                                fitBoundsOnLoad
                                fitBoundsOnUpdate
                                points={points}
                                longitudeExtractor={(m) => m.lng}
                                latitudeExtractor={(m) => m.lat}
                                intensityExtractor={(m) => m.intensity}
                            />
                        )}
                    </MapComponent>
                )}
            </div>
        </div>
    );
}
