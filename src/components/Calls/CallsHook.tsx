"use client";
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
import VideoCallDialog from "../chat/video-call-dialog"
import AudioCallDialog from "../chat/AudioCallDialog"
import { useFamilyChat } from "@/hooks/useFamilyChat"
import { useFamilyMembers } from "@/hooks/useFamilyMembers"


interface callProps {
isAudioCallOpen: any
isVideoCallOpen: any
setIsAudioCallOpen:any
 setIsVideoCallOpen:any
isGlobal: any
}

export default function CallsHook({isAudioCallOpen, isVideoCallOpen, setIsAudioCallOpen, isGlobal, setIsVideoCallOpen} : callProps) {
 const {userData, user} = useAuth();
  const { messages,  videoCall, audiocall} = useFamilyChat(userData?.familyId)
const [isVideoCallOpe, setIsVideoCallOpe] = useState(false);
    const [isAudioCallOpe, setIsAudioCallOpe] = useState(false);
  const [open, setOpen] = useState(false);
      const [isLocationOpen, setIsLocationOpen] = useState(false);
    const { members, loading } = useFamilyMembers(userData?.familyId );

    const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";
  
    const approvedMembers = members.filter((m) => m?.approved);
  return(
    <>
    
     <VideoCallDialog

              videocalling={videoCall}
              isOpen={isGlobal ? isVideoCallOpe : isVideoCallOpen}
              onOpenChange={isGlobal ? setIsVideoCallOpe : setIsVideoCallOpen  } 

              members={approvedMembers} // array of {id,name,avatar,fullName}
              groupId={userData?.familyId}
              setIsVideoCallOpen={isGlobal? setIsVideoCallOpe :  setIsAudioCallOpen}
              currentuserIs={{
                  id: user?.uid,
                  name: userData?.fullName,
                  avatar: userData?.avatarUrl,
                  familyId: userData?.familyId,
                  isOnline: userData?.isActive
              }}
               callerId={videoCall?.callId} />

     
              <AudioCallDialog
               callerId={audiocall?.callId}
     audiocaller={audiocall}
             isOpen={isGlobal ? isAudioCallOpe : isAudioCallOpen}
             onOpenChange={isGlobal ? setIsAudioCallOpe : setIsAudioCallOpen}
             members={approvedMembers}
             groupId={userData?.familyId}
             
             currentuserIs={{
             id: user?.uid,
             name: userData?.fullName,
             avatar: userData?.avatarUrl,
             familyId: userData?.familyId,
             isOnline: userData?.isActive
           }}
           />
         </>

  )
}
