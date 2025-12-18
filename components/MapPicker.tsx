'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
    height?: string;
}

export default function MapPicker({
    initialLat = 18.4861,
    initialLng = -69.9312,
    onLocationSelect,
    height = '400px'
}: MapPickerProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        if (!mapRef.current) {
            // Initialize map
            const map = L.map('map-picker').setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add marker
            const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

            // Handle marker drag
            marker.on('dragend', () => {
                const position = marker.getLatLng();
                onLocationSelect(position.lat, position.lng);
            });

            // Handle map click
            map.on('click', (e) => {
                marker.setLatLng(e.latlng);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            });

            mapRef.current = map;
            markerRef.current = marker;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isClient, initialLat, initialLng, onLocationSelect]);

    if (!isClient) {
        return (
            <div style={{ height }} className="bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div id="map-picker" style={{ height }} className="rounded-lg overflow-hidden border border-input" />
    );
}
