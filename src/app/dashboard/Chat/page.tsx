"use client";

import ChatLayout from "@/components/chat/chat-layout";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
export default function FamChat() {

   const [ user] = useAuthState(auth);
  const router = useRouter()
  const {loading} = useAuth();
  
    useEffect(() => {
  if(!user && !loading){
    router.push("/")
  }

        console.log("loading", loading)

},[user, loading]);

  return (
   <>
           {/* <div  style={{overflow:"hidden"}}className="max-w-2xl mx-auto w-full   space-y-6"> */}
     <div className="flex flex-col   bg-background max-w-2xl mx-auto w-full">
      <ChatLayout />
    </div>
   </>
  );
}
