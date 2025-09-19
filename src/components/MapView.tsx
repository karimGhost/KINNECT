'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import default Leaflet marker icons properly for Next.js
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface Member {
  uid: string;
  latitude: number;
  longitude: number;
  userName: string;
  profileImageUrl?: string; // <-- profile pic URL for custom icon
  accuracy?: number;
  updatedAt?: { seconds: number; nanoseconds: number };
}

interface MapViewProps {
  members: Member[];
  isOpen: boolean; // for modal/dialog visibility
}

// Fix default icon URLs for Leaflet default marker
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function formatTimestamp(updatedAt?: { seconds: number; nanoseconds: number }) {
  if (!updatedAt) return 'Unknown';
  const date = new Date(updatedAt.seconds * 1000 + updatedAt.nanoseconds / 1000000);
  return date.toLocaleString();
}

export default function MapView({ members, isOpen }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  // Initialize map once
  useEffect(() => {
    if (!isOpen) return; // Wait for container to be visible
    if (mapRef.current || !mapContainerRef.current) return;

    console.log('Initializing map as container is visible');
    mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      console.log('Not removing map on close — keep instance alive to preserve markers');
      // Optionally, don't remove map here to preserve state
      // mapRef.current?.remove();
      // mapRef.current = null;
    };
  }, []);

  // Invalidate map size if container visibility changes (for modals)
  useEffect(() => {
    if (isOpen && mapRef.current) {
      console.log('Invalidating map size due to visibility change');
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    }
  }, [isOpen]);

  // Update markers when members data changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove markers for users no longer in the list
    Object.keys(markersRef.current).forEach((uid) => {
      if (!members.find((m) => m.uid === uid)) {
        markersRef.current[uid].remove();
        delete markersRef.current[uid];
      }
    });

members.forEach(({ uid, latitude, longitude, userName, profileImageUrl,  accuracy, updatedAt }) => {
  
     const popupContent = `
        <b>${userName}</b><br/>
        Accuracy: ${accuracy ?? 'N/A'} meters<br/>
        Updated: ${updatedAt ? new Date(updatedAt.seconds * 1000).toLocaleString() : 'Unknown'}
      `;

  const customIcon = profileImageUrl
    ? L.icon({
        iconUrl: profileImageUrl,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'profile-icon',
      })
    : undefined;

  if (markersRef.current[uid]) {
    markersRef.current[uid].setLatLng([latitude, longitude]);
    if (customIcon) {
      markersRef.current[uid].setIcon(customIcon);
    }
    markersRef.current[uid].getTooltip()?.setContent(userName);
  } else {
    const marker = customIcon
      ? L.marker([latitude, longitude], { icon: customIcon })
      : L.marker([latitude, longitude]);  // <-- create marker *without* icon if no customIcon

    marker.addTo(mapRef.current!).bindPopup(popupContent).bindTooltip(userName, {
      permanent: true,
      direction: 'top',
      className: 'user-label',
      offset: [0, -10],
    });

    markersRef.current[uid] = marker;
  }
});

    // Fit map to show all markers nicely
    if (members.length > 0) {
      const group = L.featureGroup(
        members.map(({ latitude, longitude }) => L.marker([latitude, longitude]))
      );
      mapRef.current.fitBounds(group.getBounds().pad(0.5));
    }
  }, [members]);

  return (
    <>
      <style>{`
        .leaflet-marker-icon.profile-icon {
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
        .leaflet-tooltip.user-label {
          background: rgba(255, 255, 255, 0.85);
          color: #333;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          pointer-events: none;
          white-space: nowrap;
        }
      `}</style>
      <div ref={mapContainerRef} style={{ height: '500px', width: '100%' }} />
    </>
  );
}
