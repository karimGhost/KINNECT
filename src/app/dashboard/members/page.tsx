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
import { db } from "@/lib/firebase";
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

// ✅ Single Member card
const MemberCard = ({
  user,
  keyd,
  onRemove,
  isAdminView,
}: {
  user: User;
  keyd: string;
  onRemove?: () => void;
  isAdminView: boolean;
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
      <div>
        {user?.isAdmin && <i className="text-xs text-muted">Created by</i>}
        <p className="font-semibold">{user.fullName}</p>
        <p className="text-sm text-muted-foreground">
          {user.location.city}, {user.location.country}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {user.isAdmin && <Badge variant="outline">Admin</Badge>}
      {isAdminView && !user.isAdmin && (
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

// ✅ Request Card with full details
const PendingRequestCard = ({
  user,
  keyd,
  acceptRequest,
  reject,
  showConfirmDialog,
  setShowConfirmDialog,
}: {
  user: any;
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
          <div>
            <p className="font-semibold">{user.fullName}</p>
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
            onClick={() => reject(user?.familyId, user.id, user.uid, user.fullName)}
          >
            Reject
          </Button>
          <Button
            onClick={() => acceptRequest(user?.familyId, user.id, user.uid, user.fullName)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);

export default function MembersPage() {
  const { userData, user } = useAuth();
  const { members, requests, loading } = useFamilyMembers(userData?.familyId);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const route = useRouter();

  if (loading) {
    return <p className="p-6 text-center">Loading members...</p>;
  }

  const familyName =
    members.length > 0 ? userData?.familyName || "Family" : "Family";

  const approvedMembers = members.filter((m) => m?.approved);
  const pendingMembers = requests.filter((m) => !m?.approved);

  const currentUserIsAdmin =
    members.find((m) => m.AdminId === user?.uid) !== undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ✅ Family profile card */}
      <Card className="flex items-center gap-4 p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={userData?.familyAvatar} />
          <AvatarFallback>
            {familyName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{familyName}</h2>
          <p className="text-sm text-muted-foreground">
            {approvedMembers.length} members
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 items-start mt-4">
        {/* ✅ Approved members */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({approvedMembers.length})</CardTitle>
            <CardDescription>Current family members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {approvedMembers.map((member) => (
              <div
                key={member.id}
                style={{ cursor: "pointer" }}
                onClick={() => route.push(`/dashboard/profile/${member.uid}`)}
              >
                <MemberCard
                  keyd={member.id}
                  user={member}
                  isAdminView={currentUserIsAdmin}
                  onRemove={() =>
                    console.log("TODO remove", member.fullName)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ✅ Pending requests */}
        {currentUserIsAdmin && (
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle>Pending Requests ({pendingMembers.length})</CardTitle>
              <CardDescription>Approve or reject requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingMembers.length > 0 ? (
                pendingMembers.map((member) => (
                  <PendingRequestCard
                    key={member.id}
                    showConfirmDialog={showConfirmDialog}
                    setShowConfirmDialog={setShowConfirmDialog}
                    acceptRequest={() =>
                      console.log("accept", member.fullName)
                    }
                    reject={() => console.log("reject", member.fullName)}
                    user={member}
                    keyd={member.id}
                  />
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
