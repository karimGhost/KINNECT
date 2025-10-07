import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useVCallParticipants(callId: string | null) {
  const [participants, setParticipants] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!callId) return;

    const ref = doc(db, "calls", callId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      // ✅ get participants map
      setParticipants(data.participants || {});
    });

    return () => unsub();
  }, [callId]);

  return participants;
}
