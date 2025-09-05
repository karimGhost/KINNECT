
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, User, Users, Compass, Heart, LogOut, GroupIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserById } from "@/lib/data";
import UserDP from "./UserDP";
import PendingList from "@/components/setup/PendingList";
import ChatSidebar from "@/components/chat/chat-sidebar";
import IsChat from "@/components/chat/IsChat";
// import { useRouter } from "next/navigation";
import SidebarLink from "@/components/SidebarLink";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  // We'll mock the current user as the admin of the first family.
// const router = useRouter()

//  const handleLogout = async () => {
//     try {

//       await signOut(auth);
//       router.push("/"); // or home, wherever you want messages dark News video
//       // clearUserCache()
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

  return (
   <SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-2 rounded-lg bg-primary/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6">
            <defs>
              <linearGradient id="heartGradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#a800ff" />
              </linearGradient>
            </defs>
            <path
              d="M12 21s-6.2-4.6-9-8.5C1 9 3 4 7 4c2.3 0 3.6 1.3 5 3 
                 1.4-1.7 2.7-3 5-3 4 0 6 5 4 8.5-2.8 3.9-9 8.5-9 8.5z"
              fill="url(#heartGradient)"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <h1 className="text-lg md:text-xl font-headline font-bold text-primary truncate group-data-[collapsible=icon]:hidden">
          Kinnect
        </h1>
      </div>
    </SidebarHeader>

    <SidebarContent>
    <SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Family Feed">
      <SidebarLink href="/dashboard" >
            <Home  />

        Family Feed
      </SidebarLink>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Members">
      <SidebarLink href="/dashboard/members" >
            <Users  />

        Members <PendingList />
      </SidebarLink>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Family Chat">
      <SidebarLink href="/dashboard/Chat" >
            <GroupIcon  />

        Family Chat
      </SidebarLink>
    </SidebarMenuButton>
    <IsChat />
  </SidebarMenuItem>

  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Discover">
      <SidebarLink href="/dashboard/discover" >
                  <Compass  />

        Discover
      </SidebarLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
</SidebarMenu>
    </SidebarContent>

    <SidebarFooter>
      <UserDP />
    </SidebarFooter>
  </Sidebar>

  <SidebarInset>
    {/* Topbar for mobile */}
    <div className="md:hidden p-3 border-b flex items-center gap-2">
      <SidebarTrigger />
      <div className="p-2 rounded-lg bg-primary/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <defs>
            <linearGradient id="heartGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#a800ff" />
            </linearGradient>
          </defs>
          <path
            d="M12 21s-6.2-4.6-9-8.5C1 9 3 4 7 4c2.3 0 3.6 1.3 5 3 
               1.4-1.7 2.7-3 5-3 4 0 6 5 4 8.5-2.8 3.9-9 8.5-9 8.5z"
            fill="url(#heartGradient)"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <h1 className="text-lg font-headline font-bold text-primary truncate">
        Kinnect
      </h1>
    </div>

    <main className="flex-1 overflow-y-auto">{children}</main>
  </SidebarInset>
</SidebarProvider>
  );
}


 