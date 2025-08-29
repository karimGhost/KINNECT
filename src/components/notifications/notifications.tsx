"use client";

import { dbe } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";


interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "shared" | "reply" | "PolicyViolation" | "forum";
       fullName: string;
    avatarUrl: string;

  fromUser:string ;
  postId?: string;
  commentId?: string;
  timestamp: string;
  read: boolean;
}

 export function notification(userId: string | undefined) {
 const [notifications, setNotifications] = useState<Notification[]>([]);

 
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const q = query(
        collection(dbe, "notifications"),
        where("toUser", "==", userId),
        
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(list);
      console.log("LOGING", list)
    };

    fetchNotifications();
  }, [userId]);


  return notifications;
  }