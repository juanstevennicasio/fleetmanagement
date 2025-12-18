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

interface ClientMapProps {
    lat: number;
    lng: number;
    height?: string;
}

export default function ClientMap({
    lat,
    lng,
    height = '200px'
}: ClientMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        if (!mapRef.current) {
            // Initialize map with interactions disabled
            const map = L.map(`client-map-${lat}-${lng}`, {
                center: [lat, lng],
                zoom: 17, // High zoom for closeness
                zoomControl: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                dragging: false,
                boxZoom: false,
                keyboard: false,
                attributionControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add marker
            L.marker([lat, lng], { interactive: false }).addTo(map);

            mapRef.current = map;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isClient, lat, lng]);

    if (!isClient) {
        return (
            <div style={{ height }} className="bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-xs">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div id={`client-map-${lat}-${lng}`} style={{ height }} className="w-full h-full" />
    );
}
