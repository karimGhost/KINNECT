'use client'
import type { Group } from '@/lib/types';
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
interface ChatHeaderProps {
  group: Group;
    onOpenChange: (open: boolean) => void;
  callId?: string | null;
  videoCall: any;

}

export default function ChatHeader({ group , onOpenChange, callId , videoCall}: ChatHeaderProps) {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [isAudioCallOpen, setIsAudioCallOpen] = useState(false)
const {userData, user} = useAuth();

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

 
  const handleAccept = async (id: string | null) => {

    const idToUse = id ?? hookCallId;
  
    if (!idToUse) {
      console.error("No call id to accept");
      return;
    }
    try {
      await acceptCall(idToUse, members);
      setInternalCallId(idToUse);
      setIsVideoCallOpen(true)
    } catch (err) {
      console.error("acceptCall error", err);
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

          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
 



    {videoCall?.ended  && videoCall?.author.id  !== user?.uid && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white space-y-4 z-50">
               <p className="text-xl">{videoCall?.author?.name} is calling...</p>
               <div className="flex gap-4">
                 <Button onClick={() => handleAccept(videoCall?.callId)} className="bg-green-600 text-white">Accept</Button>
                 <Button onClick={() => handleDecline(videoCall?.callId)} variant="destructive">Decline</Button>
               </div>
             </div>
           )}


<VideoCallDialog
 callerId={videoCall?.callId}
  isOpen={isVideoCallOpen}
  onOpenChange={setIsVideoCallOpen}
  members={approvedMembers}        // array of {id,name,avatar,fullName}
  groupId={userData?.familyId}  
  
currentuserIs={{
        id: user?.uid,
        name: userData?.fullName,
        avatar: userData?.avatarUrl,
        familyId: userData?.familyId,
        isOnline: userData?.isActive
      }} />


         <AudioCallDialog
        isOpen={isAudioCallOpen}
        onOpenChange={setIsAudioCallOpen}
        members={approvedMembers}
      />
      <LocationDialog isOpen={isLocationOpen} onOpenChange={setIsLocationOpen} members={approvedMembers} />
    </>
  );
}
