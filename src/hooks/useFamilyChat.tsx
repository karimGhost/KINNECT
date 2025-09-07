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
 id: string
  text: string
  author: User
  createdAt: any | null
  type: "text" | "image" | "video" | "file"
  fileUrl?: string | null
  file?: {
    name: string
    size: number
  }
  replyTo?: string | null
  reactions?: Record<string, string>
}

export function useFamilyChat(familyId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
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
        id: doc.id,            // include the Firestore document ID
        ...data,               // spread the fields from Firestore
      } as ChatMessage;
    });

    setMessages(msgs);         // ✅ use msgs, not data
    setLoading(false);
  });

  return () => unsub();
}, [familyId]);

  return { messages, loading, loadings: loading };
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
