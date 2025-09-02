"use client";

import ChatLayout from "@/components/chat/chat-layout";
import { Card } from "@/components/ui/card";
export default function FamChat() {

  return (
   <>
           {/* <div  style={{overflow:"hidden"}}className="max-w-2xl mx-auto w-full   space-y-6"> */}
     <div className="flex flex-col   bg-background max-w-2xl mx-auto w-full">
      <ChatLayout />
    </div>
   </>
  );
}
