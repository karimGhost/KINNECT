// hooks/useFamilyChat.ts
'use client';
import type { User } from '@/lib/types';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  DocumentData,
  QueryDocumentSnapshot,
  addDoc, serverTimestamp
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  text?: string; // make optional since not all messages have text
  author: User;
  createdAt: Date | null; // instead of any
  type: "text" | "image" | "video" | "file" | "call_invite";
  
  // for media messages
  fileUrl?: string | null;
  file?: {
    name: string;
    size: number;
  };

  // for call messages
  callId?: string;
  ended?: boolean;

  // extras
  replyTo?: string | null;
  reactions?: Record<string, string>; // emoji reactions
}

export function useFamilyChat(familyId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
const [videoCall, setVideoCall] = useState<ChatMessage | null>(null);
  // const [loadings, setLoadings] = useState(true);

 useEffect(() => {
  if (!familyId) return;

  const q = query(
    collection(db, "families", familyId, "messages"),
    orderBy("createdAt", "asc")
  );

  const unsub = onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,            // include Firestore doc ID
        ...data,               // spread Firestore fields
      } as ChatMessage;
    });

    // 🔎 Find any active call invite
    const activeCall = msgs.find(
      (m) =>
        m.type === "call_invite" &&
        m.ended === true && // not ended yet
        m.callId // has a callId
    );
      // console.log("videoCC", msgs)

    if (activeCall) {
      console.log("videoCC", activeCall)
  setVideoCall(activeCall);
} else {
  setVideoCall(null);
}

    setMessages(msgs); // ✅ still set all messages
    setLoading(false);
  });

  return () => unsub();
}, [familyId]);


  return { messages,videoCall, loading, loadings: loading };
}

// hooks/useFamilyChat.ts (continued)

export async function sendFamilyMessage(
  familyId: string,
  user: User,
  text: string,
  imageUrl?: string
) {
  if (!familyId || !user) return;

  await addDoc(collection(db, 'families', familyId, 'messages'), {
    text,
    imageUrl: imageUrl || null,
    authorId: user.id || user?.uid, // depending on your user type
    authorName: user.name || user?.fullName,
    authorAvatar: user.avatar || user?.avatarUrl,
    createdAt: serverTimestamp(),
  });
}
