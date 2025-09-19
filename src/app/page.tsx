"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Search, Users, Heart } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase"; // <-- our firebase setup
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import FamilySearch from "@/components/setup/FamilySearch";
import FamilyPendingPage from "@/components/FamilyPages/FamilyPendingPage";
import FamilyFeedPage from "@/components/FamilyPages/FamilyFeedPage";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import Spinner from "@/components/Animations/spiner";
export default function Home() {
  const [ loading] = useAuthState(auth);
  const router = useRouter();
  const { user,userData, setUserData} = useAuth()
  


 const handleLogout = async () => {
    try {

      await signOut(auth);
      router.push("/"); // or home, wherever you want messages dark News video
      // clearUserCache()
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


    if(user){

    router.push("/dashboard")
  }
   if( loading){
    return <Spinner />
  
   }



 
  
 

if(!user)
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
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
          <nav>
            {!user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="ml-2">
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </>
            ) : (

              <>
               <Button onClick={handleLogout}  variant="ghost">
                  sign out 
                </Button>

              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              </>
              
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-32">
          <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tight leading-tight">
            Rediscover Your Roots, <br /> Reconnect Your Family.
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Kinnect is a private space for your family to share stories,
            preserve history, and find lost connections. Build your legacy
            together.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={!user ? "/signup" : "/dashboard"}>
                {user ? "Go to Dashboard" : "Create Your Family Space"}{" "}
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="bg-secondary/50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
            <Card className="text-center animate-in fade-in-50 slide-in-from-bottom-10 duration-700">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">
                  Private Family Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A secure feed for your family to share updates, photos, and
                  memories away from public social media.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center animate-in fade-in-50 slide-in-from-bottom-10 duration-700 delay-150">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">
                  Lost Family Finder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                 suggestions for similar family names and origins,
                  helping you uncover new branches of your tree.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center animate-in fade-in-50 slide-in-from-bottom-10 duration-700 delay-300">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">
                  Preserve Your Legacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create detailed profiles and collaboratively build a rich
                  tapestry of your family's history for generations to come.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kinnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
function setDataLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

