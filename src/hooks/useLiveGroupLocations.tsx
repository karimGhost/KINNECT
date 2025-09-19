import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Member {
  uid: string;
  latitude: number;
  longitude: number;
  userName: string;
  accuracy?: number;
  updatedAt?: { seconds: number; nanoseconds: number };
}

export function useLiveGroupLocations(familyId?: string) {
  const [members, setMembers] = useState<Member[]>([]);

   useEffect(() => {
    if (!familyId) return;

    // Create a query to exclude private locations
    const q = query(
      collection(db, 'families', familyId, 'locations'),
      where('isPrivate', '!=', true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as Member[];

      setMembers(data);
    });

    return () => unsub();
  }, [familyId]);

  return members;
}
 