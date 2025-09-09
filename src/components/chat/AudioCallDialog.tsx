import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, PhoneOff } from "lucide-react"
import type { User } from "@/lib/types"

interface AudioCallDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  members: User[]
}

export default function AudioCallDialog({ isOpen, onOpenChange, members }: AudioCallDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col items-center justify-center text-center gap-4 p-6">
        <DialogHeader>
          <DialogTitle>Audio Call</DialogTitle>
          <DialogDescription>{members.length} participants</DialogDescription>
        </DialogHeader>
        <Mic className="h-16 w-16 text-primary" />
        <div className="flex gap-4">
          <Button variant="secondary">Mute</Button>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            <PhoneOff className="mr-2 h-4 w-4" /> End
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
