'use client'
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, Phone, MapPin, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import VideoCallDialog from './video-call-dialog';
import LocationDialog from './location-dialog';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/hooks/useAuth';

interface ChatHeaderProps {
  group: Group;
}

export default function ChatHeader({ group }: ChatHeaderProps) {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
const {userData} = useAuth();
        const { members, loading } = useFamilyMembers(userData?.familyId );
  
  const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";

  const approvedMembers = members.filter((m) => m?.approved);
  return (
    <>

      <div style={{zIndex:"10"}} className="flex items-center gap-4 border-b p-4 fixed top-0  bg-background max-w-2xl mx-auto w-full   ">
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarFallback className="bg-secondary text-lg">{group.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-headline text-lg font-semibold">{familyName } Family</h2>
            <p className="text-sm text-muted-foreground">{approvedMembers.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsVideoCallOpen(true)} aria-label="Start video call">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Start audio call">
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
      <VideoCallDialog isOpen={isVideoCallOpen} onOpenChange={setIsVideoCallOpen} members={group.members} />
      <LocationDialog isOpen={isLocationOpen} onOpenChange={setIsLocationOpen} members={group.members} />
    </>
  );
}
