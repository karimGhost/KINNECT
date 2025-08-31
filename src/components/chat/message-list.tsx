'use client'
import { useRef, useState, useEffect, forwardRef } from "react"
import type { Message, User } from "@/lib/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ArrowDown } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { doc, Timestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"

interface MessageListProps {
  messages: Message[]
  currentUser: User
  onReply: (msg: Message) => void
}

export default function MessageList({ messages, currentUser, onReply }: MessageListProps) {
  const { userData } = useAuth()
   const containerRef = useRef<HTMLDivElement | null>(null)
  
  const familyId = userData?.familyId
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [newMessagePulse, setNewMessagePulse] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const endRef = useRef<HTMLDivElement | null>(null)
  const prevMsgCount = useRef(messages?.length)
  // Reaction handler
  const handleReact = async (message: Message, emoji: string) => {
    if (!familyId) return
    const ref = doc(db, "families", familyId, "messages", message.id)
    const newReactions = { ...(message.reactions || {}), [userData.uid]: emoji }
    await updateDoc(ref, { reactions: newReactions })
  }

  useEffect(()=>{
console.log("messages",messages)
  },[messages])
  // Auto-scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const threshold = 150
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold

    if (isNearBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
      setNewMessagePulse(false)
      setUnreadCount(0)
    } else if (messages?.length > prevMsgCount.current) {
      setNewMessagePulse(true)
      setUnreadCount((c) => c + (messages?.length - prevMsgCount.current))
    }

    prevMsgCount.current = messages?.length
  }, [messages])

  // Scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
        console.log("scroll",  container.scrollHeight )

    const handleScroll = () => {
      const threshold = 150
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold
        console.log("scroll",  "fff" )
        console.log("scroll",  container.scrollHeight )

      setShowScrollButton(!isNearBottom)
      if (isNearBottom) {
        setNewMessagePulse(false)
        setUnreadCount(0)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [containerRef])

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
    setNewMessagePulse(false)
    setUnreadCount(0)
  }

  // Helper → get replies for a message
  const getReplies = (parentId: string) => {
    return messages.filter((m) => m.replyTo === parentId)
  }

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})

const scrollToMessage = (id: string) => {
  const el = messageRefs.current[id]
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    el.classList.add("ring-2", "ring-primary")
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary")
    }, 2000) // highlight fades after 2s
  }
}

  return (
    <div className="relative h-full"  >
   <div
 ref={containerRef} 
 style={{ scrollbarWidth:"thin" , height:"100vh", scrollbarGutter:"stable", msScrollbarBaseColor:"black", scrollbarColor:"black"}}

        className="space-y-6 mt-6 overflow-y-scroll  pr-2 h-screen overflow-y-scroll pr-2 scrollbar-custom"
      >
        <div   style={{ marginTop: "150px", marginBottom: "100px"  }}
>


        
       {messages?.filter((msg) => !msg.replyTo).map((message) => {
  const isCurrentUser = message.author.id === currentUser.id
  const replies = getReplies(message.id)

  console.log("reply", messages.filter((m) => m.replyTo === message.id));
  return (
    <div key={message.id} className="space-y-2">
      <MessageBubble
        ref={(el: HTMLDivElement | null) => (messageRefs.current[message.id] = el)}
        message={message}
        isCurrentUser={isCurrentUser}
        onReply={onReply}
        onReact={handleReact}
        onScrollTo={scrollToMessage}
      />

      {replies.length > 0 && (
        <div className="ml-10 space-y-2 border-l pl-3">
          {replies.map((reply) => (
            <MessageBubble
              key={reply.id}
              ref={(el: HTMLDivElement | null) => (messageRefs.current[reply.id] = el)}
              message={reply}
              isCurrentUser={reply.author.id === currentUser.id}
              onReply={onReply}
              onReact={handleReact}
              onScrollTo={scrollToMessage}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
})}

        <div ref={endRef} />
      </div>

      {(showScrollButton || newMessagePulse) && (
        <button
          onClick={scrollToBottom}
          style={{zIndex:"99"}}
          className={cn(

            "absolute bottom-20 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition flex items-center gap-1",
            newMessagePulse && "animate-bounce"
          )}
        >
          <ArrowDown className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="ml-1 text-xs font-bold bg-white text-primary rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div></div>
  )
}
const MessageBubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ message, isCurrentUser, onReply, onReact, onScrollTo, isReply }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 group",
          isCurrentUser && "flex-row-reverse"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.author.avatar} alt={message.author.name} />
          <AvatarFallback>{message.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="max-w-xs md:max-w-md lg:max-w-lg space-y-1">
          {/* Author name (skip if current user) */}
          {!isCurrentUser && (
            <i className="text-xs"> {message.author.name} –{" "}
  {message.createdAt &&
    formatDistanceToNow(
      message.createdAt instanceof Timestamp
        ? message.createdAt.toDate()
        : new Date(message.createdAt),
      { addSuffix: true }
    )}</i>
          )}
           {isCurrentUser && (
            <i className="text-xs">
               {" "}
  {message.createdAt &&
    formatDistanceToNow(
      message.createdAt instanceof Timestamp
        ? message.createdAt.toDate()
        : new Date(message.createdAt),
      { addSuffix: true }  
    )} 
    {" - "}    you    </i>
          
          )}

          <div
            className={cn(
              "rounded-xl p-3 text-sm relative",
              isCurrentUser ? "bg-primary text-white" : "bg-card border"
            )}
          >
            {/* Reply preview */}
            {message.replyTo && (
              <div
                onClick={() => onScrollTo(message.replyTo)}
                className="mb-2 px-2 py-1 text-xs rounded-md bg-muted/40 cursor-pointer hover:bg-muted/70 truncate"
              >
                ↩ Replying to{" "}
               <span className="font-medium">{message.replyAuthorName}</span>:{" "}
    {message.replyPreview}
              </div>
            )}

            {/* Content */}
            {message.fileUrl && message.type === "image" && (
              <Image
                src={message.fileUrl}
                alt="uploaded"
                width={400}
                height={300}
                className="rounded-lg mb-2"
              />
            )}
            {message.fileUrl && message.type === "video" && (
              <video
                src={message.fileUrl}
                controls
                className="rounded-lg mb-2 w-full max-w-sm"
              />
            )}
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex gap-1 mt-2">
                {Object.entries(message.reactions).map(([uid, emoji]) => (
                  <span
                    key={uid}
                    className="text-xs bg-white/20 rounded px-1 py-0.5"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            )}

            {/* Hover actions */}
            <div className="absolute -bottom-1 right-0 opacity-0 group-hover:opacity-100 flex gap-2 transition">
              <button onClick={() => onReply(message)} className="text-xs">
                💬
              </button>
              <button onClick={() => onReact(message, "❤️")} className="text-xs">
                ❤️
              </button>
              <button onClick={() => onReact(message, "👍")} className="text-xs">
                👍
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)



MessageBubble.displayName = "MessageBubble"
