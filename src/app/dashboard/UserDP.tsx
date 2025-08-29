 
"use client";
import Link from "next/link";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";
 export default function UserDP() {
const {userData, user} = useAuth();
const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);



 const handleLogout = async () => {
    try {

      await signOut(auth);
      router.push("/"); // or home, wherever you want messages dark News video
      // clearUserCache()
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!userData) return <div>User not found</div>;

return(

    <>
     {/* <Link href="/dashboard/profile" className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors duration-200">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={userData?.avatarUrl}
                  alt={userData?.fullName}
                  data-ai-hint="profile photo"
                />
                <AvatarFallback>{userData?.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm text-sidebar-foreground truncate">
                  {userData?.fullName}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                </span>
              </div>
            </div>
          </Link>
 */}






            <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userData?.avatarUrl} alt="@shadcn" data-ai-hint="profile avatar" />
                <AvatarFallback>  {(userData?.fullName ?? "").substring(0, 2) || "??"}
</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium leading-none">{userData?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
@{user?.email?.split("@")[0]}

                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile/">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            {

           (!user || user.email !== "abdulkarimkassimsalim@gmail.com") ?
           ""
            :
 (
               <DropdownMenuItem asChild>
              <Link href="/admin/inbox">Admin</Link>
            </DropdownMenuItem>
            )
  
            

          }
            <DropdownMenuSeparator />


  <Card className="">
      <CardHeader>
        <div className="flex justify-between items-start w-full">
          <div>
            <CardTitle             onClick={() => setIsOpen(!isOpen)}
 className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Legal & Support
            </CardTitle>
            <CardDescription>
              Learn more about your rights and our policies.
            </CardDescription>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md hover:bg-muted"
          >
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>

      {!isOpen && (
         <CardContent className="space-y-2">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="text-sm text-muted-foreground">Read our legal documents and policies:</p>
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
        <Link href="/dashboard/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
        <Link href="/dashboard/policy" className="text-sm text-primary hover:underline">Cookies Policy</Link>
        <Link href="/dashboard/help" className="text-sm text-primary hover:underline">Support</Link>
      </div>
    </div>
  </CardContent>

      )}
    </Card>


<Card className="">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <HelpCircle className="h-6 w-6 text-primary" /> Help & Support
    </CardTitle>
    <CardDescription>Find FAQs, contact support, or report a problem.</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/dashboard/help" className="text-sm text-primary hover:underline">Go to Help Center</Link>
  </CardContent>
</Card>


            <DropdownMenuItem asChild>
                <button
      onClick={handleLogout}
      className="flex items-center text-sm text-red-600 hover:underline"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>

)
 }