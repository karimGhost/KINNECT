import type { User } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface UserProfileSheetProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileSheet({ user, onOpenChange }: UserProfileSheetProps) {
  if (!user) return null;

  return (
    <Sheet open={!!user} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader className="text-center items-center pt-8">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          <SheetTitle className="text-2xl font-headline">{user.name}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", user.isOnline ? "bg-green-500" : "bg-gray-400")} />
              <span>{user.isOnline ? "Online" : "Offline"}</span>
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 px-2 space-y-6">
            <Separator />
            <div className='space-y-4'>
                <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" aria-label="Send message"><MessageSquare className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" aria-label="Call user"><Phone className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" aria-label="Email user"><Mail className="h-4 w-4"/></Button>
                </div>
            </div>
             <Separator />
            <div className='space-y-2'>
                <h3 className="text-sm font-medium text-muted-foreground">About</h3>
                <p className="text-sm text-foreground">A passionate designer making the world a more beautiful place, one pixel at a time.</p>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
