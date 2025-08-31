"use client"
import { useAuth } from "@/hooks/useAuth";

import { useState } from "react"
import type { Message, User } from "@/lib/types"
import MessageList from "./message-list"
import MessageInput from "./message-input"
import ChatHeader from "./chat-header"

interface ChatViewProps {
  messages: Message[]
  currentUser: User
  containerRef: any
}

export default function ChatView({ messages, currentUser, containerRef }: ChatViewProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const { userData } = useAuth();
  if (!userData?.familyId) return <p>No family joined yet.</p>;

  return (
    <div className="flex flex-col " >
      <ChatHeader group={{ id: userData.familyId, avatar: "👨‍👩‍👧‍👦", members: [] }} />
<div >
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <MessageList
        containerRef={containerRef}
          messages={messages}
          currentUser={currentUser}
          onReply={(msg) => setReplyTo(msg)}
        />
      </div>

      {/* Input */}
      <div className="p-2 border-t bg-background fixed bottom-0  max-w-2xl mx-auto w-full">
        <MessageInput
          currentUser={currentUser}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSent={() => setReplyTo(null)} // clear reply after sending
        />
      </div>

      </div>
    </div>
  )
}
