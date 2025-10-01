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
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { useCallParticipants } from "@/hooks/useCallParticipants";

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
  
const [incomingCall, setIncomingCall] = useState<any>();
  const [isopen, setisopen] = useState(true)
const [onlyActive, setonlyActive] = useState(false)
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

const participants = useCallParticipants(callId);
const [ringoff,setringoff] = useState(false);

// useEffect(() => {
// console.log("incomingCall", incomingCall)
// }, [incomingCall]) {id: 'c2b9db30-14ae-4df0-8d8b-e2b72b0ae795', from: 'LbgXIt9xlTfZGLDGLZXcsBnOmF33', members: Array(4), status: 'ringing'}

const router = useRouter()


useIncomingCalls(currentuserIs.id, (callId: any, callData: { status: any; caller: any; members: any }) => {
  setIncomingCall({
    id: callId,
    from: callData.caller.id,
    members: callData.members,
    status: callData.status,
  });
});




      const EndCallMessage = async () => {
    
        if(audiocaller?.author?.id  !== user?.uid) return;
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
       
    call:"ended",

        type: "Call_Ended",
        callId,
        ended: true,
        from: { id: currentuserIs?.id, name: currentuserIs?.name },
          text: `${currentuserIs?.name} ended a voice call`,
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
  call:"calling",
        replyTo:  "",
              replyAuthorName: "",
                    replyPreview: "", // short snippet
  
  
        fileUrl: "",
       
  
        type: "V_call_invite",
        callId,
        ended: false,
        from: { id: currentuserIs?.id, name: currentuserIs?.name },
        text: `${currentuserIs?.name} started a Voice call`,
        // optional: any extra metadata your chat uses:
        metadata: { callId },
      });
  
  
    } catch (err) {
      console.error("Failed to post call message:", err);
    }
  };
  

  const handlehungup = () => {
setringoff(true)
    if(audiocaller?.author?.id  === user?.uid){
        EndCallMessage();

   router.refresh();

    }
  hangUp();
   onOpenChange(false)
setisopen(false);
}


useEffect(() => {
  // Check if there are NO participants
  if (Object.keys(participants).length === 0) {
    const timer = setTimeout(() => {
      handlehungup();
      setonlyActive(true)
      
    }, 60 * 1000); // 1 minute in ms

    // Cleanup if participants change before timeout
    return () => clearTimeout(timer);
  }
}, [participants]);

if(onlyActive){

  return(
         <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{audiocaller?.author?.name} Opps ended the call, Looks Like you are the only one on call for long...</p>
              <div className="flex gap-4">
            <Button onClick={() => setonlyActive(false)}>exit</Button>
              </div>
            </div>
      )
}



  // useEffect(() => {
  
  //     if( audiocaller?.author?.id  === user?.uid && audiocaller?.ended  &&   incomingCall.status === "ringing"){
  // hangdlehungup();
  
  
  //     }  {id: 'c2b9db30-14ae-4df0-8d8b-e2b72b0ae795', from: 'LbgXIt9xlTfZGLDGLZXcsBnOmF33', members: Array(4), status: 'ringing'}
  
  
  // }, [audiocaller, incomingCall])
    const isCaller = callerId !== currentuserIs?.id



useEffect(() => {
  if (status === "ringing" &&  isCaller) {
    const audio = new Audio("/sounds/phone-call.mp3");
    audio.loop = true;
    audio.play().catch(() => {});
    setRingtone(audio);


    if(ringoff){
          ringtone?.pause();

    }
  } else if (status === "active" || status === "ended") {
    ringtone?.pause();
    ringtone && (ringtone.currentTime = 0);
  }
}, [status, ringoff]);


  // Start a call
useEffect(() => {
  let ring: HTMLAudioElement | null = null;

  if (status === "ringing" && !isCaller) {
    ring = new Audio("/sounds/incoming-call.mp3");
    ring.loop = true;
    ring.play().catch(() => {});
  }

  // ✅ cleanup when status changes or component unmounts
  return () => {
    if (ring) {
      ring.pause();
      ring.currentTime = 0;
    }
  };
}, [status]);



  const handleStart = async () => {
    const id = await startCall(members)

    postCallMessage(id)
    console.log("audio call started", id)
  }




  // Accept (callee)
  const handleAccept = async () => {
    setringoff(true)
     if (!incomingCall) return;
  await acceptCall(incomingCall?.id, incomingCall?.members);

    onOpenChange(true)
setisopen(false);
  }



if (
  incomingCall &&
  incomingCall.from !== currentuserIs.id &&
  incomingCall.status === "ringing" &&
  isopen
) {  return(
 <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{audiocaller?.author?.name} is calling...</p>
              <div className="flex gap-4">
 <Button onClick={handleAccept} className="bg-green-600 text-white">
              Accept
            </Button>                <Button onClick={handlehungup}  variant="destructive">Decline</Button>
              </div>
            </div>

  )
    
          };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handlehungup()
        onOpenChange(open)
      }}
    >
      <DialogContent 
      onInteractOutside={(e) => isCalling && e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
  className="flex flex-col items-center space-y-6 [&_button.absolute.right-4.top-4]:hidden"
  >
  <DialogHeader className="text-center">
          <DialogTitle>Audio Call</DialogTitle>
          <DialogDescription>
             <div className="p-4">
      <p className="font-semibold mb-2">
    {members.length} members..    Participants ({Object.keys(participants).length})
      </p>
      <ul className="space-y-2">
        {Object.entries(participants).map(([uid, info]) => (
          <li
            key={uid}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <span className="font-medium">{info.user}</span>
            <div className="text-sm text-gray-500">
             <i style={{color: info.muted ? "red" : "green"}}> Mic: {info.muted ? "Off" : "On"} </i> 
              {/* {info.videoOn ? "On" : "Off"} */}
            </div>
          </li>
        ))}
      </ul>
    </div>
            {/* {members.length} participants : Active:(({Object.keys(participants).length})) · Status: {status || "idle"} */}
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
    ref={getRemoteAudioRef(m.id ?? m.uid)}   />
        ))}
<Button onClick={() => playAllRemote()}>
  Enable Audio
</Button>
        {/* Action buttons depending on state */}
        <div className="flex gap-2">
          {!status && (
            <Button onClick={() =>  handleStart()} disabled={isCalling}>
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
                handlehungup()
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
