"use client"

import { useState, ChangeEvent } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { Message, User } from "@/lib/types"
import { useAuth } from "@/hooks/useAuth"
import { useAuthState } from "react-firebase-hooks/auth"
interface MessageInputProps {
  currentUser: User
  replyTo: Message | null
  onCancelReply: () => void
  onSent: () => void
}

export default function MessageInput({
  currentUser,
  replyTo,
  onCancelReply,
  onSent,
}: MessageInputProps) {
  const { userData } = useAuth()
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [ user] = useAuthState(auth);
  const handleSend = async () => {
    if ((!text.trim() && !file) || !userData?.familyId) return

    let fileUrl: string | null = null
    let type: "text" | "image" | "video" | "file" = "text"

    // If user attached a file
    if (file) {
      setUploading(true)
      try {
        // Cloudinary unsigned upload (swap for Firebase Storage if needed)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        fileUrl = data.secure_url

        if (file.type.startsWith("image")) type = "image"
        else if (file.type.startsWith("video")) type = "video"
        else type = "file"
      } catch (err) {
        console.error("Upload failed", err)
      } finally {
        setUploading(false)
      }
    }

    const newMessage: Omit<Message, "id"> = {
      text: text.trim(),
      author: {
        id: user?.uid,
        name: userData?.fullName,
        avatar: userData.avatarUrl,
        isOnline: false
      },

      createdAt: serverTimestamp(),
          reactions: {},

      replyTo: replyTo?.id || null,
            replyAuthorName: replyTo?.author?.name || null,
                  replyPreview: replyTo?.text.slice(0, 50) || null, // short snippet


      fileUrl: fileUrl || null,
      type,
    }

    await addDoc(
      collection(db, "families", userData.familyId, "messages"),
      newMessage
    )

    setText("")
    setFile(null)
    onSent()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }



  return (
    <div className="space-y-2">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between text-xs p-2 rounded-md bg-muted">
          <span>
            Replying to <strong>{replyTo?.author?.name}</strong>:{" "}
            {replyTo?.text.slice(0, 40)}
          </span>
          <button
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        {/* File Upload */}
        <input
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="fileUpload"
        />
        <label
          htmlFor="fileUpload"
          className="cursor-pointer px-3 py-2 border rounded-lg bg-background text-sm"
        >
          📎
        </label>

        {/* Text Input */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={uploading}
          className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>

      {/* File preview */}
      {file && (
        <p className="text-xs text-muted-foreground">
          Attached: {file.name}{" "}
          <button onClick={() => setFile(null)} className="ml-2 text-red-500">
            ✕
          </button>
        </p>
      )}
    </div>
  )
}
