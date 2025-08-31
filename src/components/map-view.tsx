'use client'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface MapViewProps {
    apiKey: string;
    members: User[];
}

// Mock locations for demo purposes
const locations = [
    { lat: 34.052235, lng: -118.243683 }, // Los Angeles
    { lat: 40.712776, lng: -74.005974 }, // New York
    { lat: 41.878113, lng: -87.629799 }, // Chicago
    { lat: 29.760427, lng: -95.369804 }, // Houston
    { lat: 33.448376, lng: -112.074036 }, // Phoenix
];

export default function MapView({ apiKey, members }: MapViewProps) {
    const center = { lat: 39.8283, lng: -98.5795 }; // Center of USA

    return (
        <APIProvider apiKey={apiKey}>
            <Map
                defaultCenter={center}
                defaultZoom={4}
                mapId="chirpchat-map"
                className="w-full h-full rounded-b-lg"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {members.map((member, index) => (
                    <AdvancedMarker key={member.id} position={locations[index % locations.length]}>
                        <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </AdvancedMarker>
                ))}
            </Map>
        </APIProvider>
    );
}
