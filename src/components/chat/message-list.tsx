'use client'
import { useRef, useState, useEffect, forwardRef } from "react"
import type { Message, User } from "@/lib/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ArrowDown, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { doc, Timestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import LinkPreview from "./LinkPreview";
import { formatMessageTime } from "./formatMessageTime"
interface MessageListProps {
  messages: Message[]
  currentUser: User
  onReply: (msg: Message) => void
  containerRefs: any
}

export default function MessageList({ messages, currentUser, onReply, containerRefs }: MessageListProps) {
  const { userData } = useAuth();
   const containerRef = useRef<HTMLDivElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
  const container = containerRefs.current
  if (!container) return

  const handleScroll = () => {
    const threshold = 150
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight

    console.log("scrollTop:", container.scrollTop, "distance:", distance)

    const isNearBottom = distance < threshold
    setShowScrollButton(!isNearBottom)

    if (isNearBottom) {
      setNewMessagePulse(false)
      setUnreadCount(0)
    }
  }

  container.addEventListener("scroll", handleScroll)
  handleScroll() // run once to init

  return () => container.removeEventListener("scroll", handleScroll)
  }, [containerRefs])

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
<div className="relative h-full ">
  <div
    ref={containerRef}
    className="space-y-6 overflow-y-auto  pr-2 "
    style={{
      scrollbarWidth: "thin",
      scrollbarGutter: "stable",
      marginTop:"100px", marginBottom:"100px"
    }}

  >

        
      {messages
  ?.sort((a, b) =>
    (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
  )
  .map((message) => (
    <MessageBubble
      key={message.id}
      ref={(el: HTMLDivElement | null) => (messageRefs.current[message.id] = el)}
      message={message}
      isCurrentUser={message.author.id === currentUser.id}
      onReply={onReply}
      onReact={handleReact}
      onScrollTo={scrollToMessage}
      setPreviewUrl={setPreviewUrl}
    />
))}


     {previewUrl && (
  <div
    onClick={() => setPreviewUrl(null)}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
  >
    {previewUrl.endsWith(".mp4") || previewUrl.includes("video") ? (
      <video src={previewUrl} controls autoPlay className="max-h-full max-w-full rounded" />
    ) : (
      <img src={previewUrl} alt="preview" className="max-h-full max-w-full rounded" />
    )}
  </div>
     
    )
  }

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
    </div>
  )
}
const MessageBubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ message, isCurrentUser, setPreviewUrl, onReply, onReact, onScrollTo,reply,  isReply }, ref) => {

function extractUrl(text: string): string[] | null {
  const match = text?.match(/(https?:\/\/[^\s.,!?")\]\}]+)/g);
  return match ? match : null;
}
  const { userData , user} = useAuth();

  const url = extractUrl(message?.text);
  const urL = extractUrl(message?.text);

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        className="text-black-100 underline break-words"
        target="_blank"
        rel="noopener noreferrer"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

if(isReply){
return(
   <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 group",
          isCurrentUser && "flex-row-reverse"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
          <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="max-w-xs md:max-w-md lg:max-w-lg space-y-1">
          {/* Author name (skip if current user) */}
          {!isCurrentUser && (
            <i className="text-xs"> {reply.author.name} –{" "}
  {reply.createdAt &&
    formatDistanceToNow(
      reply.createdAt instanceof Timestamp
        ? reply.createdAt.toDate()
        : new Date(reply.createdAt),
      { addSuffix: true }
    )}</i>
          )}
           {isCurrentUser && (
            <i className="text-xs">
               {" "}
  {reply.createdAt &&
    formatDistanceToNow(
      reply.createdAt instanceof Timestamp
        ? reply.createdAt.toDate()
        : new Date(reply.createdAt),
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
            {reply.replyTo && (
              <div
                onClick={() => onScrollTo(reply.replyTo)}
                className="mb-2 px-2 py-1 text-xs rounded-md bg-muted/40 cursor-pointer hover:bg-muted/70 truncate"
              >
                ↩ Replying to{" "}
               <span className="font-medium">{reply.replyAuthorName}</span>:{" "}
    {reply.replyPreview}
              </div>
            )}

            {/* Content */}
            {reply.fileUrl && reply.type === "image" && (
              <Image
                src={reply.fileUrl}
                    onClick={() => setPreviewUrl(reply.fileUrl)}
                alt="uploaded"
                width={400}
                height={300}
                    className="w-full max-w-[75%] md:max-w-[400px] rounded-lg object-contain cursor-pointer rounded-lg mb-2"

              />
            )}
            {reply.fileUrl && reply.type === "video" && (
              <video
                src={reply.fileUrl}
                controls
                className="rounded-lg mb-2 w-full max-w-sm"
               

              />
            )}

            

            {reply.text && 

<>
<p className="text-sm break-words whitespace-pre-wrap break-all">
      {linkify(reply.text)}
</p>
    {urL ?  <LinkPreview url={urL} /> : <></>}
</>
  }
            {/* Reactions */}
            {reply.reactions && Object.keys(reply.reactions).length > 0 && (
              <div className="flex gap-1 mt-2">
                {Object.entries(reply.reactions).map(([uid, emoji]) => (
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
              <button onClick={() => onReply(reply)} className="text-xs">
                💬
              </button>
              <button onClick={() => onReact(reply, "❤️")} className="text-xs">
                ❤️
              </button>
              <button onClick={() => onReact(reply, "👍")} className="text-xs">
                👍
              </button>
            </div>
          </div>
        </div>


        
      </div>
)
}

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
          <AvatarImage src={isCurrentUser? userData?.avatarUrl : message?.author?.avatar} alt={message.author.name} />
          <AvatarFallback>{isCurrentUser ?  userData?.fullName?.charAt(0) : message.author.name.charAt(0)}</AvatarFallback>
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
 
      
    
       message.call === "calling"

      ? " bg-green-500" : message?.call === "ended" ? "bg-red-500" :  isCurrentUser 
      ? "bg-primary text-white"
      : "bg-card border"   ,
    
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
                    onClick={() => setPreviewUrl(message.fileUrl)}
                alt="uploaded"
                width={400}
                height={300}
                    className="w-full max-w-[75%] md:max-w-[400px] rounded-lg object-contain cursor-pointer rounded-lg mb-2"

              />
            )}
            {message.fileUrl && message.type === "video" && (
              <video
                src={message.fileUrl}
                controls
                className="rounded-lg mb-2 w-full max-w-sm"
               

              />
            )}

         

            {message.text && 

<>
<p className="text-sm break-words   whitespace-pre-wrap break-all">
      {linkify(message.text)}
</p>
    {url ?  <LinkPreview url={url} /> : <></>}
</>
  }
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
