import { getPostsByFamily, getUserById } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { MessageCircle, Heart, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Post from "./Post";



export default function FamilyFeedPage() {

const {userData} = useAuth()
  const [posts, setPosts] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState<string>("");

  // Fetch family info
  useEffect(() => {
    const fetchFamily = async () => {
      if(!userData) return;
      const famSnap = await getDoc(doc(db, "families", userData?.familyId));
      if (famSnap.exists()) {
        const famData = famSnap.data();
        setFamilyName(famData.familyName || "Family");
      }
    };
    fetchFamily();
  }, [userData?.familyId]);

  // Fetch posts for this family
  useEffect(() => {
    if(!userData) return;
    const fetchPosts = async () => {

      const postsRef = collection(db, "families", userData?.familyId, "posts");
      const q = query(postsRef, orderBy("timestamp", "desc")); // latest first
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchPosts();
  }, [userData?.familyId]);
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        title={`The ${familyName} Family Feed`}
        description="A private space for our family to connect and share."
      />

      <Post />

      {/* <div className="max-w-2xl mx-auto space-y-6 mt-8">
      
      </div> */}
    </div>
  );
}
