"use client";
import { getFamilyMembers } from "@/lib/data";
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
import { useEffect, useState, Key } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import FamilyPendingPage from "@/components/FamilyPages/FamilyPendingPage";
import FamilyProfile from "./FamilyProfile";
import { useAuthState } from "react-firebase-hooks/auth";

// ✅ Single Member card
const MemberCard = ({
  user,
  keyd,
  onRemove,
  isAdminView,
  member,
}: {
  user: User;
  keyd: string;
  onRemove?: () => void;
  isAdminView: boolean;
  member:any;
}) => (
  <div
    key={keyd}
    className="flex items-center justify-between p-4 border-b last:border-b-0 animate-in fade-in-50 duration-500"
  >
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage
          src={user.avatarUrl}
          alt={user.fullName}
          data-ai-hint="profile photo"
        />
        <AvatarFallback>
          {user.fullName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div onClick={() => window.location.href=`/dashboard/profile/${member?.uid}` }>
        {user?.isAdmin && <i className="text-xs text-primary">Created by</i>}
        <p  className="font-semibold">{user.fullName}</p>
        <p className="text-sm text-muted-foreground">
          {user.location.city}, {user.location.country}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {user.isAdmin && <Badge variant="outline">Admin</Badge>}
      {isAdminView  &&   (
        <Button
          size="sm"
          variant="outline"
          onClick={onRemove}
          className="text-destructive border-destructive"
        >
          Remove
        </Button>
      )}
    </div>
  </div>
);
// ✅ Request Card with full details created by
const PendingRequestCard = ({
  member,
  setPreviewUrl,
  user,
  familyId,
  familyName,
  keyd,
  acceptRequest,
  reject,
  showConfirmDialog,
  setShowConfirmDialog,
}: {
  member:any;
  setPreviewUrl:any;
  user: any;
  familyId: string,
  familyName: string,
  keyd: string;
  acceptRequest: any;
  reject: any;
  showConfirmDialog: boolean;
  setShowConfirmDialog: any;
}) => (

  <div
    key={keyd}
    className="flex items-center justify-between p-4 border-b last:border-b-0 animate-in fade-in-50 duration-500"
  >
    {!showConfirmDialog ? (
      <>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback>
              {user.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div onClick={() => window.location.href=`/dashboard/profile/${member.uid}`}>
            <p  className="font-semibold">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">
              Wants to join the family
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setShowConfirmDialog(true);
          }}
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          View
        </Button>
      </>
    ) : null}

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join Request</DialogTitle>
          <DialogDescription>
            Review details of {user.fullName}&apos;s request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            <b>Name:</b> {user.fullName}
          </p>
          {user.country && (
            <p>
              <b>Country:</b> {user.country}
            </p>
          )}
          {user.requestMessage && (
            <div>
              <b>Message:</b>
              <p className="mt-1 p-2 border rounded bg-muted">
                {user.requestMessage}
              </p>
            </div>
          )}

          {user.images && user.images.length > 0 && (
            <div>
              <b>Attachments:</b>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.images.map((url: string, idx: Key) => (
                  <img
                    onClick={() => setPreviewUrl(url)}
                    key={idx}
                    src={url}
                    alt="request attachment"
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => reject(familyId,familyName, user.id, user.uid, user.fullName)}
          >
            Reject
          </Button>
          <Button
            onClick={() => acceptRequest(familyId,FamilyName, user.id, user.uid, user.fullName)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);

export default function MembersPage() {
 const {userData} = useAuth();
      const { members,requests, loading  } = useFamilyMembers(userData?.familyId );
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [Adding,setAdding] = useState(false);
const [Removing,setRemoving] = useState(false);
const {toast} = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


//    useEffect(() => {
// console.log("pendingMembers", requests.filter((m) => !m?.approved)) 
//   },[requests])
  // // Assume current
const route = useRouter()

  const familyName = members.length > 0 ? userData?.familyName || "Family" : "Family";


    const [ user] = useAuthState(auth);
  const router = useRouter();

  const {loadings} = useAuth();
  
    useEffect(() => {
  if(!user && !loadings){
    router.push("/")
  }

        console.log("loading", loadings)

},[user, loadings]);
/**
 * Accept a pending family join request
 * @param familyId string - family document ID
 * @param requestId string - ID of the request doc inside families/{familyId}/requests
 * @param userId string - UID of the user being accepted
 */
 
    //  
// async function acceptFamilyRequest(familyId: string, requestId: string, userId: string, username:string, family:string) {


 async function rejectRequest(familyId: string,familyName:string, requestId: string, userId: string,username:string) {
  try {
 
    // 2️⃣ Update user profile → approved + linked
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        familyId: "",
        approved: false,
        inFamily: "", 
        familyName:""
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


 async function acceptFamilyRequest(familyId: string,familyName:string, requestId: string, userId: string, username:string) {
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
        familyName: familyName,
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

  if (loadings) {
    return <p className="p-6 text-center">Loading members...</p>;
  }


  const approvedMembers = members.filter((m) => m?.approved);
  const pendingMembers = requests.filter((m) => !m?.approved);



  const currentUserIsAdmin = members.find((m) => m.AdminId === user?.uid ) !== undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ✅ Family profile card */}
     <FamilyProfile familyId={userData?.familyId} approvedMembers={approvedMembers}/>



     {previewUrl && (
  <div
    onClick={() => setPreviewUrl(null)}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
  >
  
      <img src={previewUrl} alt="preview" className="max-h-full max-w-full rounded" />
  
  </div>
     
    )
  }

      <div className="grid md:grid-cols-2 gap-8 items-start mt-4">
        {/* ✅ Approved members */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({approvedMembers.length})</CardTitle>
            <CardDescription>Current family members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
         

            <>
  {/* Admins first */}
  {approvedMembers
    .filter((i) => i.isAdmin)
    .map((member) => (
                    <div key={member.id} style={{cursor:"pointer"}} >

                              <MemberCard  keyd={member.id} user={member} isAdminView={user?.uid !== member.AdminId} member={member} />
      </div>

    ))}

  {/* Then normal members */}
  {approvedMembers
    .filter((i) => !i.isAdmin)
    .map((member) => (
 <div key={member.id} style={{cursor:"pointer"}} >

                              <MemberCard  keyd={member.id} user={member}  isAdminView={user?.uid !== member.AdminId}  member={member}/>
      </div>    ))}
</>
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
                                <div key={member.id} style={{cursor:"pointer"}} >



                  <PendingRequestCard member={member} setPreviewUrl={setPreviewUrl} familyId={userData.familyId} familyName={userData.familyName}
   
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
