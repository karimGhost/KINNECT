"use client"

import { useAuth } from "@/hooks/useAuth"
import ChatView from "@/components/chat/chat-view"
import { useFamilyChat } from "@/hooks/useFamilyChat" // live messages
import { useRef } from "react"
import { Card } from "../ui/card"
import { useRouter } from "next/navigation"

export default function ChatLayout() {
  const { userData, user } = useAuth()
  const { messages, loading , videoCall} = useFamilyChat(userData?.familyId)
 const containerRef = useRef<HTMLDivElement | null>(null)

   const router = useRouter();
  // if(!user && loading){
  //   router.push("/")

  // }

  if (!userData) return <div>Loading...</div>
  if (!userData.familyId) return <div>You are not part of a family yet.</div>
  if (loading) return <div>Loading chat...</div>

   
  return (
   

   
<div >
  
  
 <ChatView
 videoCall={videoCall}
      messages={messages}
      containerRef={containerRef}
      currentUser={{
        id: userData.uid,
        name: userData.fullName,
        avatar: userData.avatarUrl,
        fullName:userData.fullName,
         uid:userData.uid,
        
      }}
    />

 
      </div>
   
  )
}
