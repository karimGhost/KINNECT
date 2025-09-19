'use client';

import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // your firebase config
import { useAuth } from '@/hooks/useAuth'; // assuming you have a hook to get the current user

export function useAutoLocationShare() {
  const { userData } = useAuth(); // must return current user info

useEffect(() => {
  if (!userData?.uid || !navigator.geolocation) return;

  // Helper to check last update time (stored locally)
  const LAST_UPDATE_KEY = `lastLocationUpdate_${userData.uid}`;

  async function updateLocationIfNeeded() {
    const lastUpdateStr = localStorage.getItem(LAST_UPDATE_KEY);
    const now = Date.now();

    // 1 day = 86400000 ms, 2 days = 172800000 ms, adjust as needed
    const UPDATE_INTERVAL = 2 * 24 * 60 * 60 * 1000; // 2 days in ms

    if (lastUpdateStr) {
      const lastUpdate = parseInt(lastUpdateStr, 10);
      if (now - lastUpdate < UPDATE_INTERVAL) {
        console.log("Skipping location update — updated recently");
        return; // skip update if not enough time passed
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          await setDoc(
            doc(db, 'families', userData.familyId, 'locations', userData.uid),
            {
              latitude,
              longitude,
              accuracy,
              profileImageUrl: userData.avatarUrl || null,
              userName: userData.fullName,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          localStorage.setItem(LAST_UPDATE_KEY, now.toString());
          console.log("Location updated successfully");
        } catch (err) {
          console.error("Error updating location:", err);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );
  }

  updateLocationIfNeeded();

  // No need to clear anything, since it's just a one-time call

}, [userData]);

}


