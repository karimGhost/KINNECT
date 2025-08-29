"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onClose: () => void;
  familyId: string | null;
};

export default function FamilyProfileModal({ open, onClose, familyId }: Props) {
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !familyId) return;

    const fetchFamily = async () => {
      setLoading(true);
      try {
        const famSnap = await getDoc(doc(db, "families", familyId));
        if (famSnap.exists()) {
          const famData = famSnap.data();
          setFamily({ id: famSnap.id, ...famData });

          // fetch members
          if (famData.members?.length > 0) {
            const users: any[] = [];
            for (const uid of famData.members) {
              const uSnap = await getDoc(doc(db, "users", uid));
              if (uSnap.exists()) users.push({ id: uSnap.id, ...uSnap.data() });
            }
            setMembers(users);
          }

          // fetch posts belonging to this family
          const q = query(collection(db, "posts"), where("familyId", "==", familyId));
          const snap = await getDocs(q);
          setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Error fetching family:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamily();
  }, [open, familyId]);

  if (!familyId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{family?.familyName  || "Family Profile"} Family</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : family ? (
          <ScrollArea style={{marginTop:"-250px"}} className="h-full space-y-6 pr-2">
            {/* Family Info */}
            <div>
              <p className="text-sm text-muted-foreground">
                Origin: {family?.continent} — Country: {family?.country}
              </p>
            </div>

            {/* Members */}
            <Card>
                <CardHeader className="text-center font-bold " >{family?.familyName.toUpperCase() } Family Members</CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col items-center text-center space-y-2"
                  >
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback>{m.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.location?.city}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Family Posts</h3>
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <p className="text-sm">{post.content}</p>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="mt-2 rounded-lg w-full max-h-60 object-cover"
                        />
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(post.timestamp).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No family found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
