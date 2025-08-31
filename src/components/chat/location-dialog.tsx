'use client'
import type { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MapView from '../map-view';
import { useState, useEffect } from 'react';

interface LocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  members: User[];
}

export default function LocationDialog({ isOpen, onOpenChange, members }: LocationDialogProps) {
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);

    useEffect(() => {
        // This ensures env variable is read only on client side.
        setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[70vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Live Location</DialogTitle>
                    <DialogDescription>Real-time location of group members</DialogDescription>
                </DialogHeader>
                <div className="flex-1 bg-muted/30">
                    {apiKey ? (
                         <MapView apiKey={apiKey} members={members} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground p-4 text-center">Google Maps API Key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
