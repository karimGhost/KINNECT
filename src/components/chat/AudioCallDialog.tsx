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

// useEffect(() => { createCall
// console.log("incomingCall", incomingCall)
// }, [incomingCall]) {id: 'c2b9db30-14ae-4df0-8d8b-e2b72b0ae795', from: 'LbgXIt9xlTfZGLDGLZXcsBnOmF33', members: Array(4), status: 'ringing'}

const router = useRouter()

useEffect(()=>{
console.log("audiocaller", audiocaller)
},[audiocaller])

useIncomingCalls(currentuserIs.id, (callId: any, callData: {ended:any, status: any; caller: any; members: any }) => {
  setIncomingCall({
    id: callId,
    from: callData.caller.id,
    members: callData.members,
    status: callData.status,
  });
});







   const EndCallMessage = async () => {
  if (incomingCall?.from !== user?.uid) return;
  try {
    if (!groupId) return;

    const messagesCol = collection(db, "families", groupId, "messages");
    // Query all messages with the matching callId
    const q = query(messagesCol, where("callId", "==", callId));  // fixed casing: "callId"
    const querySnapshot = await getDocs(q);

    // Update all matching call messages to mark as ended
    const updatePromises = querySnapshot.docs.map((docSnap) => {
      const docRef = docSnap.ref;
      return updateDoc(docRef, {
              ended: false,

      });
    });

    await Promise.all(updatePromises);

    // Add a new message indicating the call has ended
    await addDoc(messagesCol, {
      author: {
        id: user?.uid,
        name: userData?.fullName,
        avatar: userData?.avatarUrl,
        isOnline: true
      },
      createdAt: serverTimestamp(),
      reactions: {},
      replyTo: "",
      replyAuthorName: "",
      replyPreview: "",
      fileUrl: "",
      call: "ended",
      type: "Call_Ended",
      callId,  // Ensure this is defined in your scope
      ended: false,
      from: {
        id: currentuserIs?.id,
        name: currentuserIs?.name
      },
      text: `${currentuserIs?.name} ended a voice call`,
      metadata: { callId }
    });

    // Refresh the UI
    router.refresh();
 location.reload();

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
  

  const handlehungup = () => {
setringoff(true);
    if(incomingCall?.from  === user?.uid){
        EndCallMessage();
 hangUp();
//    router.refresh();
//  location.reload();

    }
     hangUp();

    setRingtone(null)
   onOpenChange(false);
setisopen(false);
}


useEffect(() => {
  if (participants && Object.keys(participants).length === 0) {
    const timer = setTimeout(() => {
      handlehungup();
      setonlyActive(true);
    }, 5 * 60 * 1000); // 5 minutes in ms

    return () => clearTimeout(timer);
  }
}, [participants]);





  // useEffect(() => {
  
  //     if( audiocaller?.author?.id  === user?.uid && audiocaller?.ended  &&   incomingCall.status === "ringing"){
  // hangdlehungup();
  
  
  //     }  {id: 'c2b9db30-14ae-4df0-8d8b-e2b72b0ae795', from: 'LbgXIt9xlTfZGLDGLZXcsBnOmF33', members: Array(4), status: 'ringing'}
  
  
  // }, [audiocaller, calls incomingCall])
    const isCaller = audiocaller?.author?.id === user?.uid;
useEffect(() =>{
if(incomingCall?.status === "ended"){
  setisopen(false);
  setIncomingCall({
    id: "",
    from:"",
    members: "",
    status: "",
ended: ""
  });
}
},[incomingCall])


useEffect(() => {

  if (status === "ringing" &&   incomingCall?.from === user?.uid) {
    console.log("called", audiocaller)

    const audio = new Audio("/sounds/phone-call.mp3");
    audio.loop = true;
    audio.play().catch(() => {});
    setRingtone(audio);

    if(Object.keys(participants).length > 0){
                ringtone?.pause();

    }

    if(ringoff){
          ringtone?.pause();

    }
  } else if (status === "active" || status === "ended") {
    ringtone?.pause();
    ringtone && (ringtone.currentTime = 0);
  }
}, [status, ringoff]);


useEffect(() => {
  let ring: HTMLAudioElement | null = null;
  if(!audiocaller) return;

  if (incomingCall?.status === "ringing" && incomingCall?.from !== user?.uid) {
    console.log("caller", incomingCall)
    ring = new Audio("/sounds/incoming-call.mp3");
    ring.loop = true;

    ring
      .play()
      .then(() => {
        setRingtone(ring); // store reference if needed
      })
      .catch((err) => {
        console.warn("Unable to play ringtone:", err);
      });
  }

   if(ringoff){
          ring?.pause();

    }

  return () => {
    if (ring) {
      ring.pause();
      ring.currentTime = 0;
    }
  };
}, [incomingCall?.status,audiocaller,ringoff, audiocaller?.author?.id, user?.uid]);


  const handleStart = async () => {
    const id = await startCall(members)

    postCallMessage(id)
    console.log("audio call started", id)
  }


const decline =  () => {
 onOpenChange(true)
 setisopen(false);
console.log("incomingCall", incomingCall)

}

const handleAccept = async () => {
  setringoff(true);

  if (!incomingCall) return;

  try {
    console.log("Calling acceptCall...",incomingCall);
    await acceptCall(incomingCall.id, incomingCall.members);
    console.log("acceptCall finished.", incomingCall);

    decline(); // should be called now
  } catch (error) {
    console.error("Error during acceptCall:", error);
  }
};
if(participants && onlyActive){

  return(
         <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{audiocaller?.author?.name} Opps ended the call, Looks Like you are the only one on call for long...</p>
              <div className="flex gap-4">
            <Button onClick={() => setonlyActive(false)}>exit</Button>
              </div>
            </div>
      )
}





const showIncomingCall =
    incomingCall &&
    incomingCall?.from !== user?.uid &&
    incomingCall?.status === "ringing" &&
     isopen;

useEffect(() =>{
console.log("incomingCall",     incomingCall?.from 
)
},[user])
if(showIncomingCall){
  return(
      <div  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
              <p className="text-xl">{audiocaller?.author?.name} is calling...</p>
              <div className="flex gap-4">
 <Button onClick={handleAccept} className="bg-green-600 text-white">
              Accept
            </Button>                <Button onClick={handlehungup}  variant="destructive">Decline</Button>
              </div>
            </div>
  )
}
   



  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handlehungup();
        onOpenChange(open)
      }}
    >
      <DialogContent 
      onInteractOutside={(e) => isCalling && e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
  className="flex flex-col items-center space-y-6 [&_button.absolute.right-4.top-4]:hidden"
  >
  <DialogHeader className="text-center">
          <DialogTitle>Audio Call {incomingCall?.status}</DialogTitle>
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
