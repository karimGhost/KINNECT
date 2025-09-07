
"use client";
import React, { useEffect } from "react";
import NotificationItem from "@/components/notifications/NotificationItem";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function Notification() {


   const [ user, loading] = useAuthState(auth);
  const router = useRouter()
  
  
    useEffect(() => {
  if(!user && !loading){
    router.push("/")
  }
},[user, loading]);



  return (
    <div className="space-y-4 p-4">
    
        <NotificationItem  />
  
    </div>
  );
}
