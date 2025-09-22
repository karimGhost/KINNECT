'use client'
import type { Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, Phone, MapPin, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import VideoCallDialog from './video-call-dialog';
import LocationDialog from './location-dialog';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/hooks/useAuth';
import { SidebarInset, SidebarTrigger } from '../ui/sidebar';
import AudioCallDialog from './AudioCallDialog';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { DialogHeader } from '../ui/dialog';
import { useRouter } from 'next/navigation';
interface ChatHeaderProps {
  group: Group;
    onOpenChange: (open: boolean) => void;
  callId?: string | null;
  videoCall: any;
audiocall: any;
  
}

export default function ChatHeader({ group , onOpenChange, callId , videoCall, audiocall}: ChatHeaderProps) {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [isAudioCallOpen, setIsAudioCallOpen] = useState(false)
const {userData, user} = useAuth();
const router = useRouter();
const currentuserIs = {
  id: user?.uid ?? "",  // fallback to empty string
  name: userData?.fullName,
  avatar: userData?.avatarUrl,
  familyId: userData?.familyId,
  isOnline: userData?.isActive,
};

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
  const [internalCallId, setInternalCallId] = useState<string | null>(callId ?? hookCallId ?? null);
  const [open, setOpen] = useState(false);


const normalizeMembersForCall = (members: User[]) =>
  members.map((m) => ({
    id: (m as any).id ?? (m as any).uid ?? String((m as any).uid ?? (m as any).id ?? ""),
    name: (m as any).fullName ?? (m as any).name ?? "",
    avatar: (m as any).avatar ?? (m as any).avatarUrl ?? "",
  })) as Member[];

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

 
  const handleAccept = async (id: string | null) => {
 const idToUse = id ?? hookCallId;
  if (!idToUse) return;
  const targets = normalizeMembersForCall(members);
  try {
    await acceptCall(idToUse, targets);
    setInternalCallId(idToUse);
    setIsVideoCallOpen(true)
  } catch (err) {
    console.error("acceptCall error", err);
  }
  };

  const handleopen =()=>{
    setIsVideoCallOpen(false)
  }



 const handleShareLocation = async (latitude: any, longitude: any) => {
  const newMessage = {
    type: 'location',
    latitude,
    longitude,
    timestamp: new Date(),
    userId: userData.id,
    userName: userData.name,
  };

  try {
    await addDoc(
      collection(db, "families", userData.familyId, "messages"),
      newMessage
    );
    console.log("Location shared successfully");
  } catch (error) {
    console.error("Error sharing location:", error);
  }
};


  const handleDecline = async (id: string | null) => {
    const idToUse = id ?? hookCallId;
    if (!idToUse) return;
    await declineCall(idToUse);
    setInternalCallId(null);
    setIsVideoCallOpen(false)
  };

  const handleEnd = async () => {
    await hangUp();
    onOpenChange(false);
    setInternalCallId(null);
  };

        const { members, loading } = useFamilyMembers(userData?.familyId );
  
  const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";

  const approvedMembers = members.filter((m) => m?.approved);

  useEffect(()=>{
console.log("videoCall", videoCall)
  },[videoCall])

  // if(open){
  //   return(
  //       <Dialog open={open} onOpenChange={setOpen}>
  //       <DialogContent className="max-w-md rounded-2xl">
  //         <DialogHeader>
  //           <DialogTitle>Family Members</DialogTitle>
  //         </DialogHeader>

  //         <div className="space-y-4">
  //           {members.map((member) => (
  //             <div
  //               key={member.id ?? member.uid}
  //               className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer"
  //             >
  //               {/* Avatar */}
  //               <img
  //                 src={member.photoURL ?? "/default-avatar.png"}
  //                 alt={member.name ?? "User"}
  //                 className="h-10 w-10 rounded-full object-cover"
  //               />

  //               {/* Details */}
  //               <div className="flex flex-col">
  //                 <span className="font-medium">{member.name ?? "Unknown"}</span>
  //                 <span className="text-sm text-muted-foreground">
  //                   {member.email ?? "No details"}
  //                 </span>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   )
  // }
  return (
    <>

      <div style={{zIndex:"10"}} className="flex items-center gap-4 border-b p-4 fixed top-0  bg-background  mx-auto w-full   ">
        <div className="flex items-center gap-3 flex-1">
                            <SidebarTrigger />

          <Avatar>
            <AvatarFallback className="bg-secondary text-lg">{familyName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-headline text-lg font-semibold">{familyName } Family</h2>
            <p className="text-sm text-muted-foreground">{approvedMembers.length} members</p>
          </div>
        </div>
        
        <div style={{float:"right", width:"50%"}} className="flex items-center gap-2 bg-red">
          <Button variant="ghost" size="icon" onClick={() => setIsVideoCallOpen(true)} aria-label="Start video call">
            <Video className="h-5 w-5" />
          </Button>
          <Button           onClick={() => setIsAudioCallOpen(true)}
 variant="ghost" size="icon" aria-label="Start audio call">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsLocationOpen(true)} aria-label="Share location">
            <MapPin className="h-5 w-5" />
          </Button>

           <>
      {/* More options button */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="More options"
        onClick={() => setOpen(true)}
      >
        <MoreVertical className="h-5 w-5" />
      </Button>

      {/* Bottom sheet */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed bottom-0 left-0 right-0 m-0 h-[70vh] mx-auto max-w-2xl top-0 rounded-t-2xl border-t bg-background p-4 shadow-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Family Members</DialogTitle>
          </DialogHeader>

          {/* Scrollable list */}
          <div className="mt-4 max-h-[60vh] mx-auto max-w-2xl   overflow-y-auto space-y-3">
            {members.map((member) => (
              <div
              onClick={() => router.push(`/dashboard/profile/${member.id}`) }
                key={member.id ?? member.uid}
                className="flex items-center space-x-3 rounded-xl border p-3 hover:bg-accent cursor-pointer"
              >
                {/* Avatar */}
                <img
                  src={member.photoURL ?? "/default-avatar.png"}
                  alt={member.fullName ?? "User"}
                  className="h-12 w-12 rounded-full object-cover"
                />

                {/* Info */}
                <div className="flex flex-col">
                  <span className="font-medium">{member.fullName ?? "Unknown"}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.email ?? "No details"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
        </div>
      </div>
 



    {/* {videoCall?.ended  && videoCall?.author.id  !== user?.uid && (
             <div className="absolute top-10 inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
               <p className="text-xl">{videoCall?.author?.name} is calling...</p>
               <div className="flex gap-4">
                 <Button onClick={() => handleAccept(videoCall?.callId)} className="bg-green-600 text-white">Accept</Button>
                 <Button onClick={() => handleDecline(videoCall?.callId)} variant="destructive">Decline</Button>
               </div>
             </div>
           )} */}


<VideoCallDialog
 callerId={videoCall?.callId}
 videocalling={videoCall}
  isOpen={isVideoCallOpen}
  onOpenChange={setIsVideoCallOpen}
  members={approvedMembers}        // array of {id,name,avatar,fullName}
  groupId={userData?.familyId}  
  setIsVideoCallOpen={setIsVideoCallOpen}
currentuserIs={{
        id: user?.uid,
        name: userData?.fullName,
        avatar: userData?.avatarUrl,
        familyId: userData?.familyId,
        isOnline: userData?.isActive
      }} />


         <AudioCallDialog
          callerId={audiocall?.callId}
audiocaller={audiocall}
        isOpen={isAudioCallOpen}
        onOpenChange={setIsAudioCallOpen}
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
 <LocationDialog
      isOpen={isLocationOpen}
      onOpenChange={setIsLocationOpen}
      members={members}
      onShareLocation={handleShareLocation}
    />    </>
  );
}
