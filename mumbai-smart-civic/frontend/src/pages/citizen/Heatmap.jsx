import React, { useEffect, useState } from 'react';
import MapComponent from '../../components/MapComponent';
import HeatmapLayer from '../../components/HeatmapLayer';
import api from '../../utils/api';

export default function Heatmap() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/c/heatmap');
                setPoints(Array.isArray(res.data) ? res.data : []);
            } catch {
                setPoints([
                    { lat: 19.076, lng: 72.8777, intensity: 0.85 },
                    { lat: 19.0544, lng: 72.8402, intensity: 0.6 },
                    { lat: 19.0896, lng: 72.8656, intensity: 0.95 },
                    { lat: 19.0178, lng: 72.8478, intensity: 0.7 },
                    { lat: 19.1136, lng: 72.8697, intensity: 0.5 },
                    { lat: 19.0330, lng: 72.8454, intensity: 0.8 },
                    { lat: 19.0628, lng: 72.8736, intensity: 0.65 },
                    { lat: 19.0990, lng: 72.8481, intensity: 0.9 },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="page-container" id="heatmap-page">
            <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">Complaint Heatmap</h2>
                <p className="section-subtitle" style={{ marginBottom: 0 }}>
                    Visual representation of complaint intensity across Mumbai
                </p>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 'calc(100vh - 240px)', borderRadius: 'var(--radius-xl)' }} />
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
    );
}
