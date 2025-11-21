
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
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
    // const reqRef = collection(db, "families", familyId, "requests");
    const reqRef = query(
  collection(db, "families", familyId, "requests"),
  orderBy("requestedAt", "desc")     // or "desc" if you want newest first
);

    const unsubscribeRequests = onSnapshot(reqRef, async (snap) => {
      if (snap.empty) {
        setRequests([]);
        return;
      }

    const users = await Promise.all(
  snap.docs.map(async (reqDoc) => {
    const { userId, images = [], requestMessage = "", requestedAt } = reqDoc.data();
    const uDoc = await getDoc(doc(db, "users", userId));

    if (!uDoc.exists()) return null;

    return {
      isid: reqDoc.id,             // request document id
  
      userId,                    // requester uid
      requestMessage,
      images,                    // array of Cloudinary URLs
      requestedAt: requestedAt?.toDate ? requestedAt.toDate() : requestedAt,
      ...uDoc.data(),            // spread user profile (name, country, etc.)
    } as any & {
      isid:any;
      id: string;
      userId: string;
      requestMessage: string;
      images: string[];
      requestedAt: Date | null;
    };
  })

);
      setRequests(users.filter(Boolean) as any[]);
    });

    setLoading(false);

    return () => {
      unsubscribeMembers();
      unsubscribeRequests();
    };
  }, [familyId]);

  return { members, requests, loading,setRequests , setMembers};
}
