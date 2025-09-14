"use client"
import { useAuth } from "@/hooks/useAuth";

import { useRef, useState } from "react"
import type { Message, User } from "@/lib/types"
import MessageList from "./message-list"
import MessageInput from "./message-input"
import ChatHeader from "./chat-header"
import { useRouter } from "next/navigation";
import { boolean } from "zod";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

interface ChatViewProps {
  messages: Message[]
  currentUser: User
  containerRef: any
  videoCall: any
audiocall: any
}
export default function ChatView({ messages, currentUser,videoCall, containerRef, audiocall }: ChatViewProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const { userData, user } = useAuth();

   const containerRefs = useRef<HTMLDivElement | null>(null)

     const { members, loading } = useFamilyMembers(userData?.familyId );
     
     const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";
   
     const approvedMembers = members.filter((m) => m?.approved);
  if (!userData?.familyId) return <p>No family joined yet.</p>;

  return (
<div className="flex flex-col h-[100dvh]  h-screen bg-background max-w-2xl mx-auto w-full">
      {/* Chat Header */}
      <ChatHeader audiocall={audiocall} videoCall={videoCall} group={{ id: "famId", avatar: "👨‍👩‍👧‍👦", members: members}} onOpenChange={() => void 0}  />

  {/* Scrollable messages */}
  <div     ref={containerRefs}
 className="flex-1 overflow-y-auto scrollbar-custom h-full  p-4 md:p-6">
    <MessageList
     
      messages={messages}
      currentUser={currentUser}
      onReply={(msg) => setReplyTo(msg)}
      containerRefs={containerRefs}
    />
      </div>

      {/* Input (always visible, not inside scroll) */}
      <div className="p-2 border-t bg-background">
    <MessageInput
      currentUser={currentUser}
      replyTo={replyTo}
      onCancelReply={() => setReplyTo(null)}
      onSent={() => setReplyTo(null)}
    />
      </div>
    </div>
  )
}
