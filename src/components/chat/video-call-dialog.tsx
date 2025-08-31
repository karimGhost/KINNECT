import type { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, Video, PhoneOff } from 'lucide-react';
import { Badge } from '../ui/badge';

interface VideoCallDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  members: User[];
}

export default function VideoCallDialog({ isOpen, onOpenChange, members }: VideoCallDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Team Sync - Video Call</DialogTitle>
          <DialogDescription>{members.length} participants</DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 overflow-y-auto bg-muted/20">
          {members.map(user => (
            <div key={user.id} className="relative aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center border">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">{user.name}</Badge>
              </div>
               <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                  <Mic className="h-3 w-3" />
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center gap-4 p-4 border-t bg-background">
          <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" aria-label="Toggle microphone"><Mic className="h-6 w-6" /></Button>
          <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" aria-label="Toggle video"><Video className="h-6 w-6" /></Button>
          <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={() => onOpenChange(false)} aria-label="End call">
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
