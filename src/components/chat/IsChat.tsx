"use client";
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import ChatSidebar from '@/components/chat/chat-sidebar';
import ChatView from '@/components/chat/chat-view';
import type { User, Message, Group } from '@/lib/types';


import { usePathname } from "next/navigation";

export default function IsChat() {
  const pathname = usePathname();

  const isFamchat = pathname === "/dashboard/Chat";

    const mockUsers: User[] = [
    { id: '1', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/150/150', isOnline: true },
    { id: '2', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/150/150', isOnline: false },
    { id: '3', name: 'You', avatar: 'https://picsum.photos/seed/you/150/150', isOnline: true },
    { id: '4', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/150/150', isOnline: true },
    { id: '5', name: 'Diana', avatar: 'https://picsum.photos/seed/diana/150/150', isOnline: false },
  ];

  const mockMessages: Message[] = [
    { id: 'm1', author: mockUsers[0], text: 'Hey everyone, what\'s up?', timestamp: '10:00 AM' },
    { id: 'm2', author: mockUsers[1], text: 'Not much, just working on the new project. How about you?', timestamp: '10:01 AM' },
    { id: 'm3', author: mockUsers[3], text: 'I found this cool article, check it out!', timestamp: '10:02 AM' },
    { id: 'm4', author: mockUsers[0], text: 'Looks interesting! Thanks for sharing.', timestamp: '10:03 AM' },
    { id: 'm5', author: mockUsers[2], text: 'I\'ll take a look. By the way, I pushed the latest changes.', timestamp: '10:04 AM' },
    { id: 'm6', author: mockUsers[0], image: 'https://picsum.photos/400/300', text: 'Here is a preview of the new design', 'data-ai-hint': 'design preview', timestamp: '10:05 AM'},
    { id: 'm7', author: mockUsers[4], text: 'Wow, that looks amazing! Great job!', timestamp: '10:06 AM' },
  ];

  const mockGroup: Group = {
    id: 'g1',
    name: 'Design Team',
    avatar: '🎨',
    members: mockUsers,
    messages: mockMessages,
  };

  const mockGroups: Group[] = [
    mockGroup,
    { id: 'g2', name: 'Frontend Wizards', avatar: '🧙', members: [], messages: [] },
    { id: 'g3', name: 'Project Phoenix', avatar: '🔥', members: [], messages: [] },
    { id: 'g4', name: 'Marketing', avatar: '📈', members: [], messages: [] },
  ];

if(!isFamchat) return;
  return (
   

        <ChatSidebar groups={mockGroups} />
    
    
       
  );
}
