import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, PhoneOff } from "lucide-react"
import type { User } from "@/lib/types"
import { useWebRTCAudioCall } from "@/hooks/useWebRTCAudioCall"

interface AudioCallDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  members: User[]
  currentuserIs: any;
}

export default function AudioCallDialog({ isOpen, onOpenChange, members, currentuserIs } : AudioCallDialogProps) {
  const {
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
  } = useWebRTCAudioCall({ currentuserIs });

  // Start a call (caller)
  const handleStart = async () => {
    const id = await startCall(members);
    console.log("audio call started", id);
  };

  // Accept (callee) — you should pass the callId you received in a chat message or UI
  const handleAccept = async () => {
    if (!callId) return;
    await acceptCall(callId, members);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) hangUp(); onOpenChange(open); }}>
      <DialogContent className="...">
        <DialogHeader> ... </DialogHeader>

        {/* Local preview (muted) */}
        <audio ref={getLocalAudioRef} autoPlay playsInline />

        {/* remote audios */}
        {members.map((m) => (
          <audio key={m.id ?? m.uid} ref={getRemoteAudioRef(m.id ?? m.uid)} autoPlay playsInline />
        ))}

        <div>
          <Button onClick={handleStart}>Start</Button>
          <Button onClick={handleAccept}>Accept call</Button>
          <Button onClick={() => { toggleMute(); }}>{muted[currentuserIs?.id] ? "Unmute" : "Mute"}</Button>
          <Button variant="destructive" onClick={() => { hangUp(); onOpenChange(false); }}>End</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
