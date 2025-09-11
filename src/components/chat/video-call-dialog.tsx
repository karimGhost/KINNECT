// components/VideoCallDialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Currentuser } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, Video, PhoneOff } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";
interface Member {
  uid(uid?: any): unknown; id?: string; name?: string; avatar?: string; fullName?: string 
}



interface VideoCallDialogProps {
  currentuserIs: Currentuser;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  callId?: string | null;
  members: User[]; 
  groupId: string; // <-- NEW: id of the group / chat where we'll post the call invite
  callerId: string;
}


export default function VideoCallDialog({ currentuserIs, isOpen,groupId, onOpenChange, callId, members , callerId}: VideoCallDialogProps) {
  const {
    localVideoRef,
    getRemoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo,
    muted,
    videoOn,
    status,
    caller,
    callId: hookCallId,
  } = useWebRTCCall({ currentuserIs });

  const {user, userData} = useAuth();
  const [internalCallId, setInternalCallId] = useState<string | null>(callId ?? hookCallId ?? null);

  useEffect(() => {
    // sync with hook callId if not set
    if (!internalCallId && hookCallId) setInternalCallId(hookCallId);
  }, [hookCallId, internalCallId]);



  const EndCallMessage = async () => {
  try {
    if (!groupId) return;
    const messagesCol = collection(db, "families", groupId, "messages");
    // customize the message shape to match your app's messages schema
    await addDoc(messagesCol, {
      type: "Call_Ended",
      ended: false,
      from: { id: currentuserIs?.id, name: currentuserIs?.name },
      text: `${currentuserIs?.name} started a video call`,
      // optional: any extra metadata your chat uses:
      metadata: { callId },
    });


  } catch (err) {
    console.error("Failed to post call message:", err);
  }
};

  useEffect(() => {
    if (!isOpen) {
      // hang up when dialog closed
      hangUp().catch(() => {});
      setInternalCallId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // const handleStart = async () => {
  //   try {
  //     const id = await startCall(members);
  //     setInternalCallId(id);
  //     // optionally: send chat message with callId to members
  //   } catch (err) {
  //     console.error("startCall error", err);
  //   }
  // };

  const handleAccept = async () => {
    const idToUse = internalCallId ?? hookCallId;
    if (!idToUse) {
      console.error("No call id to accept");
      return;
    }
    try {
      await acceptCall(idToUse, members);
      setInternalCallId(idToUse);
    } catch (err) {
      console.error("acceptCall error", err);
    }
  };

  const handleDecline = async () => {
    const idToUse = internalCallId ?? hookCallId;
    if (!idToUse) return;
    await declineCall(idToUse);
    setInternalCallId(null);
  };




  const endCall = async () => {
    const callId = callerId;
  try {
    if (!groupId) return;

    const messagesCol = collection(db, "families", groupId, "messages");
    // find the message that matches this callId
    const q = query(messagesCol, where("callId", "==", callId));

    const snap = await getDocs(q);
    snap.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        ended: true,
      });
    });
  } catch (err) {
    console.error("Error ending call:", err);
  }
};


  const handleEnd = async () => {
    endCall()
EndCallMessage()

    await hangUp();
    onOpenChange(false);
    setInternalCallId(null);
  };

  // responsive grid helper
  const getGridCols = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    if (count === 4) return "grid-cols-2 md:grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 9) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };



// inside the component, add this helper to post a message
const postCallMessage = async (callId: string) => {
  try {
    if (!groupId) return;
    const messagesCol = collection(db, "families", groupId, "messages");
    // customize the message shape to match your app's messages schema
    await addDoc(messagesCol, {


      author: {
        id: user?.uid,
        name: userData?.fullName,
        avatar: userData.avatarUrl,
        isOnline: true
      },

      createdAt: serverTimestamp(),
          reactions: {},

      replyTo:  "",
            replyAuthorName: "",
                  replyPreview: "", // short snippet


      fileUrl: "",
     

      type: "call_invite",
      callId,
      ended: true,
      from: { id: currentuserIs?.id, name: currentuserIs?.name },
      text: `${currentuserIs?.name} started a video call`,
      // optional: any extra metadata your chat uses:
      metadata: { callId },
    });


  } catch (err) {
    console.error("Failed to post call message:", err);
  }
};



// Then update handleStart to post the message
const handleStart = async () => {
  try {
    const id = await startCall(members);
    setInternalCallId(id);
    // post call id to group chat so others can join
    await postCallMessage(id);
    console.log("Call started with id:", id);
  } catch (err) {
    console.error("Start call error:", err);
  }
};


useEffect(() => {
console.log("members", members)
},[members])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex items-center justify-between">
          <div>
            <DialogTitle>Team Sync - Video Call</DialogTitle>
            <DialogDescription>{members.length} participants</DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            {!internalCallId && status !== "ringing" && (
              <Button onClick={handleStart} variant="secondary">Start Call</Button>
            )}
            {internalCallId && (
              <Button onClick={() => navigator.clipboard?.writeText(internalCallId)} variant="outline">
                Copy callId
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className={cn("flex-1 grid gap-2 p-4 overflow-y-auto bg-muted/20", getGridCols(members.length))}>
         {members.map((member) => {
  const memberId = String(member.uid);
  const isCurrentUser = memberId === currentuserIs?.id;

  const remoteRef = getRemoteVideoRef(memberId);

  return (
    <div
      key={memberId}
      className="relative aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center border"
    >
   <video
  ref={isCurrentUser ? localVideoRef : remoteRef}
  autoPlay
  playsInline
  muted={isCurrentUser}
  className="w-full h-full object-cover bg-black"
/>

      {/* avatar fallback when participant’s video is off */}
      {!videoOn[memberId] && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={member?.avatar} alt={member?.fullName} />
            <AvatarFallback className="text-3xl">
              {member?.fullName?.charAt(0) ??
                (member.fullName ? String(member.fullName).charAt(0) : "?")}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <Badge variant="secondary">
          {isCurrentUser ? "You" : member.fullName}
        </Badge>
        {muted[memberId] && (
          <Badge variant="destructive" className="text-xs">
            muted
          </Badge>
        )}
      </div>
    </div>
  );

})}



          {/* Ringing overlay (for non-caller participants) */}
          {status === "ringing" && caller && caller.id !== currentuserIs.id && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{caller.name} is calling...</p>
              <div className="flex gap-4">
                <Button onClick={handleAccept} className="bg-green-600 text-white">Accept</Button>
                <Button onClick={handleDecline} variant="destructive">Decline</Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 p-4 border-t bg-background">
          <Button
            variant={muted[currentuserIs?.id] ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => toggleMute()}
          >
            <Mic className="h-6 w-6" />
          </Button>

          <Button
            variant={!videoOn[currentuserIs?.id] ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => toggleVideo()}
          >
            <Video className="h-6 w-6" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={handleEnd}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
