import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, PhoneOff, PhoneIncoming, PhoneOutgoing } from "lucide-react"
import type { User } from "@/lib/types"
import { useWebRTCAudioCall } from "@/hooks/useWebRTCAudioCall"
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
interface AudioCallDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  members: User[]
  currentuserIs: any
  groupId: any
  callerId: any
  audiocaller: any
}

export default function AudioCallDialog({ isOpen, onOpenChange,callerId, members, currentuserIs, groupId , audiocaller}: AudioCallDialogProps) {
  const {
    playAllRemote,
    getLocalAudioRef,
    getRemoteAudioRef,
    startCall,
    acceptCall,
    hangUp,
    toggleMute,
    isCalling,
    muted,
    status,
    caller,
    callId,
  } = useWebRTCAudioCall({ currentuserIs })

    const {user, userData} = useAuth();
  
const router = useRouter()


      const EndCallMessage = async () => {
    
        if(audiocaller?.author?.id  !== user?.uid) return;
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
       
  
        type: "V_call_invite",
        callId,
        ended: true,
        from: { id: currentuserIs?.id, name: currentuserIs?.name },
        text: `${currentuserIs?.name} started a Voice call`,
        // optional: any extra metadata your chat uses:
        metadata: { callId },
      });
  
  
    } catch (err) {
      console.error("Failed to post call message:", err);
    }
  };
  

  const hangdlehungup = () => {

    if(audiocaller?.author?.id  === user?.uid){
        EndCallMessage();

   router.refresh();

    }
  hangUp();
   onOpenChange(false)
setisopen(false);
}

  useEffect(() => {
  
      if( audiocaller?.author?.id  === user?.uid && audiocaller?.ended  && status === "ended"){
  hangdlehungup();
  
  
      } 
  
  
  }, [audiocaller, status])
  
  // Start a call (caller)
  const handleStart = async () => {
    const id = await startCall(members)

    postCallMessage(id)
    console.log("audio call started", id)
  }
  const [isopen, setisopen] = useState(true)




  // Accept (callee)
  const handleAccept = async () => {
    if (!callerId) return
    await acceptCall(callerId, members);
    onOpenChange(true)
setisopen(false);
  }

  const isCaller = callerId !== currentuserIs?.id


if( audiocaller?.ended  &&   audiocaller?.author?.id  !== user?.uid && isopen){
  return(
 <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{audiocaller?.author?.name} is calling...</p>
              <div className="flex gap-4">
 <Button onClick={handleAccept} className="bg-green-600 text-white">
              Accept
            </Button>                <Button onClick={hangdlehungup}  variant="destructive">Decline</Button>
              </div>
            </div>

  )
    
          }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) hangUp()
        onOpenChange(open)
      }}
    >
      <DialogContent className="flex flex-col items-center space-y-6">
        <DialogHeader className="text-center">
          <DialogTitle>Audio Call</DialogTitle>
          <DialogDescription>
            {members.length} participants : Active:(1) · Status: {status || "idle"}
          </DialogDescription>
        </DialogHeader>

        {/* Icon changes by status */}
        {status === "ringing" && !isCaller && <PhoneIncoming className="h-16 w-16 text-yellow-500 animate-pulse" />}
        {status === "ringing" && isCaller && <PhoneOutgoing className="h-16 w-16 text-blue-500 animate-pulse" />}
        {status === "active" && <Mic className="h-16 w-16 text-green-500" />}
        {status === "ended" && <PhoneOff className="h-16 w-16 text-red-500" />}
        {!status && <Mic className="h-16 w-16 text-primary" />}

        {/* Local preview (muted) */}
        <audio ref={getLocalAudioRef} autoPlay playsInline />

        {/* Remote audios */}
        {members.map((m) => (
          <audio key={m.id ?? m.uid}  autoPlay
  playsInline
  controls  ref={getRemoteAudioRef(m.id ?? m.uid)}   />
        ))}
<Button onClick={() => playAllRemote()}>
  Enable Audio
</Button>
        {/* Action buttons depending on state */}
        <div className="flex gap-2">
          {!status && (
            <Button onClick={handleStart} disabled={isCalling}>
              Start Call
            </Button>
          )}

         

          {status === "active" && (
            <Button onClick={() => toggleMute()}>
              {muted[currentuserIs?.id] ? "Unmute" : "Mute"}
            </Button>
          )}

          {status !== "ended" && status && (
            <Button
              variant="destructive"
              onClick={() => {
                hangUp()
                onOpenChange(false)
              }}
            >
              End Call
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
