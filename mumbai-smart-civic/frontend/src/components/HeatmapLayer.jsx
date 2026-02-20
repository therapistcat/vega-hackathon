import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * Custom HeatmapLayer component using leaflet.heat
 *
 * Props:
 *   points       – array of objects
 *   latitudeExtractor  – fn(point) => lat
 *   longitudeExtractor – fn(point) => lng
 *   intensityExtractor – fn(point) => intensity
 *   fitBoundsOnLoad    – boolean
 *   fitBoundsOnUpdate  – boolean
 *   radius, blur, maxZoom, max – leaflet.heat options
 */
export default function HeatmapLayer({
    points = [],
    latitudeExtractor = (p) => p.lat,
    longitudeExtractor = (p) => p.lng,
    intensityExtractor = (p) => p.intensity,
    fitBoundsOnLoad = false,
    fitBoundsOnUpdate = false,
    radius = 25,
    blur = 15,
    maxZoom = 18,
    max = 1.0,
}) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heatData = points.map((p) => [
            latitudeExtractor(p),
            longitudeExtractor(p),
            intensityExtractor(p),
        ]);

        const heat = L.heatLayer(heatData, {
            radius,
            blur,
            maxZoom,
            max,
            gradient: {
                0.0: '#0d0887',
                0.2: '#6a00a8',
                0.4: '#b12a90',
                0.6: '#e16462',
                0.8: '#fca636',
                1.0: '#f0f921',
            },
        });

        heat.addTo(map);

        // Fit bounds
        if ((fitBoundsOnLoad || fitBoundsOnUpdate) && heatData.length > 0) {
            const bounds = L.latLngBounds(heatData.map(([lat, lng]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        return () => {
            map.removeLayer(heat);
        };
    }, [points, radius, blur, maxZoom, max, map]);

    return null;
}
