'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLiveGroupLocations } from '@/hooks/useLiveGroupLocations';
import { useAuth } from '@/hooks/useAuth';

import dynamic from 'next/dynamic';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
// Dynamically import MapView with no SSR to avoid window error
const MapView = dynamic(() => import('../MapView'), {
  ssr: false,
});

interface LocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShareLocation: (latitude: number, longitude: number) => void;
}

export default function LocationDialog({ isOpen, onOpenChange, onShareLocation }: LocationDialogProps) {
  const { userData } = useAuth();
  const [locationError, setLocationError] = useState<string | null>(null);
  const members = useLiveGroupLocations(userData?.familyId);
const router = useRouter()

  useEffect(() => {
console.log("members", members)
  },[members])
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onShareLocation(latitude, longitude);
      },
      (error) => {
        setLocationError('Failed to retrieve location. Please try again.');
      }
    );
  };

const handleTogglePrivate = async () => {
  try {
    const docRef = doc(db, 'families', userData?.familyId, 'locations', userData.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentIsPrivate = currentData?.isPrivate || false;

      // Toggle isPrivate
      await setDoc(
        docRef,
        {
          isPrivate: !currentIsPrivate,
        },
        { merge: true }
      );

      console.log(`Privacy toggled to ${!currentIsPrivate}`);
      if(currentIsPrivate === true){
          // location.reload();
      }
      // reload if you really need to refresh the UI (but better to update state)
    } else {
      console.log('Document does not exist!');
    }
  } catch (error) {
    console.error('Error toggling privacy:', error);
  }
};
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Live Location</DialogTitle>
          <DialogDescription>Real-time location of group members</DialogDescription>
        </DialogHeader>
        <div className="flex-1 bg-muted/30">
          <>
  <MapView members={members} isOpen={isOpen} />
            <div className="p-4">
              <button
              style={{cursor: "pointer" }}
className="btn btn-primary hover:text-black hover:bg-white hover:rounded-md"
                onClick={handleTogglePrivate}
              >
                Hide/show My Location 
              </button>

            </div>
          </>
          {locationError && (
            <div className="text-red-500 p-2 text-center">{locationError}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
