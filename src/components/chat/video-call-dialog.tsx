// components/VideoCallDialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, Video, PhoneOff } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Member { id: string; name?: string; avatar?: string; fullName?: string }



interface VideoCallDialogProps {
  currentUser: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  callId?: string | null;
  members: Member[]; // pass the group members array
  groupId: string; // <-- NEW: id of the group / chat where we'll post the call invite
}


export default function VideoCallDialog({ currentUser, isOpen,groupId, onOpenChange, callId, members }: VideoCallDialogProps) {
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
  } = useWebRTCCall({ currentUser });

  const [internalCallId, setInternalCallId] = useState<string | null>(callId ?? hookCallId ?? null);

  useEffect(() => {
    // sync with hook callId if not set
    if (!internalCallId && hookCallId) setInternalCallId(hookCallId);
  }, [hookCallId, internalCallId]);

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

  const handleEnd = async () => {
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


  // Add `groupId` to the component props type:

// inside the component, add this helper to post a message
const postCallMessage = async (callId: string) => {
  try {
    if (!groupId) return;
    const messagesCol = collection(db, "groups", groupId, "messages");
    // customize the message shape to match your app's messages schema
    await addDoc(messagesCol, {
      type: "call_invite",
      callId,
      from: { id: currentUser.id, name: currentUser.name },
      text: `${currentUser.name} started a video call`,
      createdAt: serverTimestamp(),
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
            const memberId = String(member.id);
            const isCurrentUser = memberId === currentUser.id;

            const remoteRef = getRemoteVideoRef(memberId);

            return (
              <div key={memberId} className="relative aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center border">
                <video
                  ref={isCurrentUser ? (localVideoRef as any) : (remoteRef as any)}
                  autoPlay
                  playsInline
                  muted={isCurrentUser}
                  className="w-full h-full object-cover bg-black"
                />

                {/* avatar fallback when participant's video flagged off */}
                {!videoOn[memberId] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-3xl">
                        {member?.fullName?.charAt(0) ?? (member.name ? String(member.name).charAt(0) : "?")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <Badge variant="secondary">{isCurrentUser ? "You" : member.name}</Badge>
                  {muted[memberId] && <Badge variant="destructive" className="text-xs">muted</Badge>}
                </div>
              </div>
            );
          })}

          {/* Ringing overlay (for non-caller participants) */}
          {status === "ringing" && caller && caller.id !== currentUser.id && (
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
            variant={muted[currentUser.id] ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => toggleMute()}
          >
            <Mic className="h-6 w-6" />
          </Button>

          <Button
            variant={!videoOn[currentUser.id] ? "destructive" : "secondary"}
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
