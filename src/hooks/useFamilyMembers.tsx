
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";

export function useFamilyMembers(familyId: string) {
  const [members, setMembers] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;

    // 🔹 Realtime listener for family members
    const q = query(collection(db, "users"), where("familyId", "==", familyId));
    const unsubscribeMembers = onSnapshot(q, (snap) => {
      const list = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as User)
      );
      setMembers(list);
    });

    // 🔹 Realtime listener for join requests (subcollection)
    const reqRef = collection(db, "families", familyId, "requests");
    const unsubscribeRequests = onSnapshot(reqRef, async (snap) => {
      if (snap.empty) {
        setRequests([]);
        return;
      }

      const users = await Promise.all(
        snap.docs.map(async (reqDoc) => {
          const { userId } = reqDoc.data();
          const uDoc = await getDoc(doc(db, "users", userId));
          return uDoc.exists()
            ? ({ id: reqDoc.id, ...uDoc.data() } as User)
            : null;
        })
      );

      setRequests(users.filter(Boolean) as User[]);
    });

    setLoading(false);

    return () => {
      unsubscribeMembers();
      unsubscribeRequests();
    };
  }, [familyId]);

  return { members, requests, loading };
}
