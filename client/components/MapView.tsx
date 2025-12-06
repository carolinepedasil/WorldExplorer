'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event } from '@/lib/api';

interface MapViewProps {
  events: Event[];
}

interface EventWithCoordinates extends Event {
  lat: number;
  lng: number;
}

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({ events }: MapViewProps) {
  const [eventsWithCoords, setEventsWithCoords] = useState<EventWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const geocodeEvents = async () => {
      setIsLoading(true);
      const geocoded: EventWithCoordinates[] = [];

      for (const event of events) {
        try {
          // Build location query from available data
          const locationParts = [
            event.venue,
            event.city,
            event.state,
            event.country,
          ].filter(Boolean);

          if (locationParts.length === 0) {
            continue; // Skip events without location data
          }

          const locationQuery = locationParts.join(', ');

          // Use Nominatim (OpenStreetMap) for geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`,
            {
              headers: {
                'User-Agent': 'WorldExplorer/1.0',
              },
            }
          );

          const data = await response.json();

          if (data && data.length > 0) {
            geocoded.push({
              ...event,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          }

          // Add delay to respect API rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error geocoding event ${event.name}:`, error);
        }
      }

      setEventsWithCoords(geocoded);
      setIsLoading(false);
    };

    geocodeEvents();
  }, [events]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">
          Loading map and geocoding locations...
        </div>
      </div>
    );
  }

  if (eventsWithCoords.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300 text-center p-4">
          <p className="mb-2">No events with location data to display on map</p>
          <p className="text-sm">Make sure your events have venue, city, or location information</p>
        </div>
      </div>
    );
  }

  // Calculate map center based on all event coordinates
  const centerLat = eventsWithCoords.reduce((sum, e) => sum + e.lat, 0) / eventsWithCoords.length;
  const centerLng = eventsWithCoords.reduce((sum, e) => sum + e.lng, 0) / eventsWithCoords.length;

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={eventsWithCoords.length === 1 ? 13 : 6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                {event.date && (
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(event.date).toLocaleString()}
                  </p>
                )}
                {event.venue && (
                  <p className="text-sm text-gray-600 mb-1">{event.venue}</p>
                )}
                {event.city && (
                  <p className="text-sm text-gray-600 mb-1">
                    {event.city}
                    {event.state && `, ${event.state}`}
                  </p>
                )}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    View Event →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
