import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect } from "react";

export function useIncomingVCalls(userId: any, onIncoming: any) {
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "calls"),
      where("members", "array-contains", userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const callId = change.doc.id;
          const callData = change.doc.data();

          if (callData.status === "ringing" && callData.initiator !== userId) {
            onIncoming(callId, callData);
          }
        }
      });
    });

    return () => unsub();
  }, [userId, onIncoming]);
}
