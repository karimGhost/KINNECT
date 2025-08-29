"use client";
import { getFamilyMembers, getUserById } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";



const MemberCard = ({ user, keyd }: { user: User, keyd: string }) => (
  <div key={keyd} className="flex items-center justify-between p-4 border-b last:border-b-0 animate-in fade-in-50 duration-500">
    <div  className="flex items-center gap-4" >
      <Avatar className="h-12 w-12">
        <AvatarImage
          src={user.avatarUrl}
          alt={user.fullName}
          data-ai-hint="profile photo"
        />
        <AvatarFallback>{user.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
               { user?.isAdmin && <i>created By</i>}

        <p className="font-semibold">{user.fullName}</p>
        <p className="text-sm text-muted-foreground">
          {user.location.city}, {user.location.country}
        </p>
      </div>
    </div>
    {user.isAdmin && <Badge variant="outline ">Admin</Badge>}
  </div>
);




const PendingRequestCard = ({ user, keyd, acceptRequest, reject, showConfirmDialog, setShowConfirmDialog, setAdding, setRemoving, Removing,Adding,
 }: { user: User,
   keyd: string, acceptRequest: any, reject: any, showConfirmDialog:any, setShowConfirmDialog:any , setAdding: any, setRemoving:any, Removing: any,Adding:any
}) => (
  <div key={keyd}  className="flex items-center justify-between p-4 border-b last:border-b-0 animate-in fade-in-50 duration-500">
    <div  className="flex items-center gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage
          src={user.avatarUrl}
          alt={user.fullName}
          data-ai-hint="profile photo"
        />
        <AvatarFallback>{user.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{user.fullName}</p>
        <p className="text-sm text-muted-foreground">Wants to join the family</p>
      </div>
    </div>
    <div className="flex gap-2">
      <Button
            onClick={() =>{setAdding(false); setRemoving(true), setShowConfirmDialog(true)}}
        size="icon"
        variant="outline"
        className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
      onClick={() =>{setRemoving(false); setAdding(true);  setShowConfirmDialog(true)}}
        size="icon"
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        <Check className="h-4 w-4" />
      </Button>


    </div>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Confirm!</DialogTitle>
          <DialogDescription>
     {Adding ?  `confirm adding ${user?.fullName} to family?` : `confirm Removing ${user.fullName}` }
          </DialogDescription>
        </DialogHeader>
    
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
Adding ?   acceptRequest(user?.familyId,user.id, user.uid, user.fullName ) : reject(user?.familyId, user.id, user.uid, user.fullName) ;
              setShowConfirmDialog(false);
            }}
          >
            Confirm 
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);

export default function MembersPage() {
  const {userData, user} = useAuth();
      const { members,requests, loading } = useFamilyMembers(userData?.familyId );
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [Adding,setAdding] = useState(false);
const [Removing,setRemoving] = useState(false);
const {toast} = useToast()
//    useEffect(() => {
// console.log("pendingMembers", requests.filter((m) => !m?.approved)) 
//   },[requests])
  // // Assume current
const route = useRouter()

  const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";


/**
 * Accept a pending family join request
 * @param familyId string - family document ID
 * @param requestId string - ID of the request doc inside families/{familyId}/requests
 * @param userId string - UID of the user being accepted
 */
 
    //  
// async function acceptFamilyRequest(familyId: string, requestId: string, userId: string, username:string, family:string) {


 async function rejectRequest(familyId: string, requestId: string, userId: string,username:string) {
  try {
 
    // 2️⃣ Update user profile → approved + linked
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        familyId: "",
        approved: false,
        inFamily: "", 
      },
      { merge: true }
    );

    // 3️⃣ Remove request from "requests" subcollection
    const reqRef = doc(db, "families", familyId, "requests", requestId);
    await deleteDoc(reqRef);
 toast({
      title: "Removed ",
      description: `${username} rejected & removed from family ${familyName}`,
      variant: "destructive",
    }); 
    // console.log(`✅ User ${userId} rejected & removed from family ${familyId}`);
  } catch (err) {
     toast({
      title: "Error failed  ",
      description: `removing ${username}  from ${familyName} Requests failed try again after sometime! `,
      variant: "destructive",
    }); 
    // console.error("❌ rejecting  family request:", err);
    throw err;
  }
} 


 async function acceptFamilyRequest(familyId: string, requestId: string, userId: string, username:string) {
  try {
    // 1️⃣ Update family doc → add user to members
    const familyRef = doc(db, "families", familyId);
    await updateDoc(familyRef, {
      members: arrayUnion(userId),
    });

    // 2️⃣ Update user profile → approved + linked
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        familyId: familyId,
        approved: true,
        welcome: true,
        inFamily: familyId, // optional, since you had this field
      },
      { merge: true }
    );

    // 3️⃣ Remove request from "requests" subcollection
    const reqRef = doc(db, "families", familyId, "requests", requestId);
    await deleteDoc(reqRef);

     toast({
      title: "Added successfully ",
      description: `${username} has been approved and  added to  ${familyName} family`,
      variant: "default",
    }); 
    // console.log(`✅ User ${userId} approved & added to family ${familyId}`);
  } catch (err) {
      toast({
      title: "Error adding ",
      description: `Adding ${username} to   ${familyName} family failed please try again later!`,
      variant: "default",
    }); 
    console.error("❌ Error accepting family request:", err);
    throw err;
  }
}

  if (loading) {
    return <p className="p-6 text-center">Loading members...</p>;
  }


  const approvedMembers = members.filter((m) => m?.approved);
  const pendingMembers = requests.filter((m) => !m?.approved);



  const currentUserIsAdmin = members.find((m) => m.AdminId === user?.uid ) !== undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        title={`The ${familyName} Family`}
        description="Manage and view all members of your family."
      />

      <div className="grid md:grid-cols-2 gap-8 items-start mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Approved Members ({approvedMembers.length})
            </CardTitle>
            <CardDescription>
              Official members of the {familyName} family.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {approvedMembers.map((member) => (
              <div key={member.id} style={{cursor:"pointer"}} onClick={() => route.push(`/dashboard/profile/${member.uid}`)}
>
                              <MemberCard  keyd={member.id} user={member} />
              </div>
            ))}
          </CardContent>
        </Card>

        {currentUserIsAdmin && (
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline">
                Pending Requests ({pendingMembers.length})
              </CardTitle>
              <CardDescription>Approve or reject requests to join.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingMembers ? (
                pendingMembers.map((member) => (
                                <div key={member.id} style={{cursor:"pointer"}} onClick={() => route.push(`/dashboard/profile/${member.uid}`)}>



                  <PendingRequestCard toast={toast} setAdding={setAdding} setRemoving={setRemoving} Removing={Removing} Adding={Adding}
 showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} acceptRequest={acceptFamilyRequest} reject={rejectRequest} keyd={member.id} user={member} />
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-muted-foreground">
                  No pending requests.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
