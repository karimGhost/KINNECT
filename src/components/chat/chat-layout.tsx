"use client"

import { useAuth } from "@/hooks/useAuth"
import ChatView from "@/components/chat/chat-view"
import { useFamilyChat } from "@/hooks/useFamilyChat" // live messages
import { useRef } from "react"

export default function ChatLayout() {
  const { userData } = useAuth()
  const { messages, loading } = useFamilyChat(userData?.familyId)
 const containerRef = useRef<HTMLDivElement | null>(null)

  
  if (!userData) return <div>Loading...</div>
  if (!userData.familyId) return <div>You are not part of a family yet.</div>
  if (loading) return <div>Loading chat...</div>

   
  return (
    <div  >

  
    <div     >    
  <div >
 <ChatView
      messages={messages}
      containerRef={containerRef}
      currentUser={{
        id: userData.uid,
        name: userData.fullName,
        avatar: userData.avatarUrl,
      }}
    />

  </div>


    </div>
      </div>
   
  )
}
