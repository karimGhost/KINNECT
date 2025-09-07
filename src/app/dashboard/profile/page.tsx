"use client";

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, MapPin, Mail, Phone, Edit, MessageCircle, Heart } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getUserById } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import EditProfileModal from "@/components/EditProfileModal";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfilePageView from "@/components/profilePageView";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";




export default function ProfilePage() {
  const { userData, family, posts } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);
const [openMembers, setOpenMembers] = useState(false);

   const [ user, loading] = useAuthState(auth);
  const router = useRouter()
  
  
    useEffect(() => {
  if(!user && !loading){
    router.push("/")
  }
},[user, loading]);


  if (loading) return <p className="p-6 text-center">Loading profile...</p>;
  if (!userData) return <p className="p-6 text-center">User not found.</p>;

  return (
 <ProfilePageView
      userData={userData}
      family={family}
      posts={posts}
      isSelf={userData?.uid}
    />
  );
}
