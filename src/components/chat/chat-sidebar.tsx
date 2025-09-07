"use client";
import type { Group } from '@/lib/types';
import Link from 'next/link';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, BotMessageSquare } from 'lucide-react';
import { group } from 'console';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface ChatSidebarProps {
  groups: Group[];
}

export default function ChatSidebar({ groups }: ChatSidebarProps) {

const {userData,user} = useAuth();
        const { members, loading } = useFamilyMembers(userData?.familyId );
  
  const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";
  const currentUserIsAdmin = members.find((m) => m.AdminId === user?.uid ) !== undefined;

  const approvedMembers = members.filter((m) => m?.approved);
  return (
    <>
      <SidebarHeader>
     
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
              <SidebarGroupLabel>{familyName} family chat</SidebarGroupLabel>
          <SidebarMenu>
            {/* {groups.map((group, index) => (
              <SidebarMenuItem key={group.id}>
                <SidebarMenuButton isActive={index === 0} tooltip={group.name}>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-secondary text-sm">{group.avatar}</AvatarFallback>
                  </Avatar>
                  <span>{group.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))} */}
                
             <SidebarMenuItem>
                <SidebarMenuButton >

                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-secondary text-sm">{familyName.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <span>{familyName} family </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/moderation" className="w-full">
                    <SidebarMenuButton tooltip="Intelligent Moderator">
                      
                      {currentUserIsAdmin && <> <BotMessageSquare /> <span>Moderator</span> </>   }
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
