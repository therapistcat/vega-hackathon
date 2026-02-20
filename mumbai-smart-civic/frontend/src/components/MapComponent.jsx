import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MUMBAI_CENTER = [19.076, 72.8777];

export default function MapComponent({ children, center = MUMBAI_CENTER, zoom = 12, style }) {
    return (
        <div className="map-container" style={style}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {children}
            </MapContainer>
        </div>
    );
}
