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
import { useVCallParticipants } from "@/hooks/useVCallParticipants";
import { useIncomingVCalls } from "@/hooks/useIncomingVCalls";
interface Member {
  uid(uid?: any): unknown; id?: string; name?: string; avatar?: string; fullName?: string 
}



interface VideoCallDialogProps {
  currentuserIs: Currentuser;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  callId?: string ;
  members: User[]; 
  groupId: string; // <-- NEW: id of the group / chat where we'll post the call invite
  callerId: string;
  setIsVideoCallOpen: any;
  videocalling: any;
}


export default function VideoCallDialog({videocalling, setIsVideoCallOpen, currentuserIs, isOpen,groupId, onOpenChange, callId, members , callerId}: VideoCallDialogProps) {
  const {
    localVideoRef,
    getRemoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo,
 isCalling,
    muted,
    videoOn,
    status,
    caller,
    ID,
    callId: hookCallId,
  } = useWebRTCCall({ currentuserIs });

  const {user, userData} = useAuth();
  const [internalCallId, setInternalCallId] = useState<string | null>(callId ?? hookCallId ?? null);
const [incomingCall, setIncomingCall] = useState<any>();
const [ringoff,setringoff] = useState(false);

  useEffect(() => {
    // sync with hook callId if not set
    if (!internalCallId && hookCallId) setInternalCallId(hookCallId);
  }, [hookCallId, internalCallId]);

useIncomingVCalls(currentuserIs.id, (callId: any, callData: { status: any; caller: any; members: any }) => {
  setIncomingCall({
    id: callId,
    from: callData.caller.id,
    members: callData.members,
    status: callData.status,
  });
});

const participants = useVCallParticipants(hookCallId);


  const EndCallMessage = async () => {
setringoff(true)

    if(videocalling?.author?.id  !== user?.uid) return;
  try {
    if (!groupId) return;
    const messagesCol = collection(db, "families", groupId, "messages");
    // customize the message shape to match your app's messages schema
    await addDoc(messagesCol, {
      type: "Call_Ended",
      ended: false,
      call:"ended",
      from: { id: currentuserIs?.id, name: currentuserIs?.name },
      text: `${currentuserIs?.name} ended a video call`,
      // optional: any extra metadata your chat uses:
      metadata: { callId },
    });

  location.reload();    

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
  //   }   const id = await startCall(members);
    // setInternalCallId(id);
  // };

  const [isopen, setisopen] = useState(true)

  const handleAccept = async () => {
    setringoff(true)
    const idToUse = callerId  ;
    if (!idToUse) {
      console.error("No call id to accept");
      return;
    }
    try {

      await acceptCall(idToUse, members);
          console.log("started", idToUse)

      setInternalCallId(idToUse);
setIsVideoCallOpen(true)
setisopen(false);

      onOpenChange(true)
    } catch (err) {
      console.error("acceptCall error", err);
    }
  };

  const handleDecline = async () => {
    setringoff(true)
    const idToUse = callerId  ;
    if (!idToUse) return;
    await declineCall(idToUse);
    setInternalCallId(null);
    setisopen(false)
  };




  const endCall = async () => {
    setringoff(true)

    const callId = callerId;
  try {
    if (!groupId) return;

    const messagesCol = collection(db, "families", groupId, "messages");
    // find the message that matches this callId
    const q = query(messagesCol, where("callId", "==", callId));

    const snap = await getDocs(q);
    snap.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        ended: false,
              call:"ended",

              text: `${currentuserIs?.name}   video call ended `,

      });
    });
  } catch (err) {
    console.error("Error ending call:", err);
  }
};




  const handleEnd = async () => {
    setringoff(true)
       if(videocalling?.author?.id  !== user?.uid) {
         await hangUp();
    onOpenChange(false);
    setInternalCallId(null);
handleDecline()

       }else{
endCall();

EndCallMessage()

    await hangUp();
    onOpenChange(false);
    setInternalCallId(null);

       }

    




  };


const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);
  const isCaller = videocalling?.author?.id !== currentuserIs?.id


// useEffect(() => {
//   if (status === "ringing" &&  isCaller) {
//     const audio = new Audio("/sounds/phone-call.mp3");
//     audio.loop = true;
//     audio.play().catch(() => {});
//     setRingtone(audio);
//   } else if (status === "active" || status === "ended") {
//     ringtone?.pause();
//     ringtone && (ringtone.currentTime = 0);
//   }
// }, [status]);
useEffect(() => {
  if (participants && Object.keys(participants).length === 0) {
    const timer = setTimeout(() => {
      handleEnd();
      // setonlyActive(true);
    }, 5 * 60 * 1000); // 5 minutes in ms

    return () => clearTimeout(timer);
  }
}, [participants]);


// useEffect(() => {

//   if (status === "ringing" &&  videocalling?.author?.id === user?.uid) {
//     const audio = new Audio("/sounds/phone-call.mp3");
//     audio.loop = true;
//     audio.play().catch(() => {});
//     setRingtone(audio);

//     if(ringoff){
//           ringtone?.pause();
// setRingtone(null)
//     }
//   } else if (status === "active" || status === "ended") {
//     ringtone?.pause();
//     ringtone && (ringtone.currentTime = 0);
//   }
// }, [status, ringoff, videocalling?.author?.id]);

  // Start a call
// useEffect(() => {
//   let ring: HTMLAudioElement | null = null;
// setringoff(false);
//   if (status === "ringing" && videocalling?.author?.id !== user?.uid) {
//     ring = new Audio("/sounds/incoming-call.mp3");
//     ring.loop = true;
//     ring.play().catch(() => {});
//   }

//   if( ringoff && ring){
//           ring.pause();
// setRingtone(null)

//   }
//   // ✅ cleanup when status changes or component unmounts
//   return () => {
//     if (ring) {
//       ring.pause();
//       ring.currentTime = 0;
//     }
//   };
// }, [status, ringoff, videocalling?.author?.id]);

  useEffect(() => {

    if( videocalling?.author?.id  === user?.uid && !internalCallId && status !== "ringing"){
handleEnd();

setIsVideoCallOpen(true)
setisopen(false);

    } 


}, [videocalling, status, internalCallId])

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
const postCallMessage = async (callId: any) => {
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
  call:"calling",

      createdAt: serverTimestamp(),
          reactions: {},

      replyTo:  "",
            replyAuthorName: "",
                  replyPreview: "", // short snippet createCall useIncomingcall


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
    console.log("started", id)
    // post call id to group chat so others can join
    await postCallMessage(id);
    console.log("Call started with id:", id);
  } catch (err) {
    console.error("Start call error:", err);
  }
};


useEffect(() => {
   {members.map((member) => {
const memberId = member.id ?? member.uid;
  const isCurrentUser = memberId === user?.uid;

console.log("members",  memberId , user?.uid)
   })}
},[members])


if( (videocalling?.ended)  && (videocalling?.author?.id  !== user?.uid) && isopen  ){

  return(

      
            <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{videocalling?.author?.name} is calling...</p>
              <div className="flex gap-4">
                <Button onClick={handleAccept} className="bg-green-600 text-white">Join Vcall</Button>
                <Button onClick={handleDecline} variant="destructive">Decline</Button>
              </div>
            </div>
          
  )
}
 

  return (
    
    <Dialog open={isOpen} onOpenChange={(open) => {
    if (!open) {
      // 🔴 user clicked X or pressed ESC
      setIsVideoCallOpen(false); 
      // <-- your custom cleanup function
    }
    onOpenChange(open); // still update state so dialog closes
  }}
>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0 [&_button.absolute.right-4.top-4]:hidden"
       onInteractOutside={(e) => isCalling && e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
  >
      
        <DialogHeader className="p-4 border-b flex items-center justify-between">
          <div>
            <DialogTitle>Team Sync - Video Call</DialogTitle>
            <DialogDescription>Members: {members.length},  Participants ({Object.keys(participants).length})</DialogDescription>
            
          </div>

          <div className="flex items-center gap-2">
            {!internalCallId && status  !== "ringing" && (

              <Button onClick={handleStart} variant="secondary">Start Call</Button>
            )}
           
            {internalCallId && (
              <Button onClick={() => navigator.clipboard?.writeText(internalCallId)} variant="outline">
                Copy callId
              </Button>
            )}

             {
              videocalling?.ended         &&      <Button onClick={handleAccept} style={{background:"green"}} variant="secondary">on going Call</Button>

            }
          </div>
        </DialogHeader>

        <div className={cn("flex-1 grid gap-2 p-4 overflow-y-auto bg-muted/20", getGridCols(members.length))}>
         {members.map((member) => {
const memberId = member.id ?? member.uid;
  const isCurrentUser = memberId === user?.uid;

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
            onClick={ handleEnd }
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
