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
const PostCard = ({ post }: { post: any }) => {
  if (!post) return null;

  return (
    <Card>
      <CardHeader className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
          <AvatarFallback>{post.author.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.author.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p>{post.content}</p>
        {post.imageUrl && (
          <Image src={post.imageUrl} alt="Post image" width={600} height={400} className="w-full h-auto object-cover" />
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-2 border-t">
        <Button variant="ghost"><Heart className="mr-2" /> Like</Button>
        <Button variant="ghost"><MessageCircle className="mr-2" /> Comment ({post.comments.length})</Button>
      </CardFooter>
    </Card>
  );
};

export default function FamilyPendingPage({ familyId }: { familyId: string }) {
const {userData} = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [familyName, setFamilyName] = useState<string>("");
  
    // Fetch family info
    useEffect(() => {
      const fetchFamily = async () => {
        const famSnap = await getDoc(doc(db, "families", familyId));
        if (famSnap.exists()) {
          const famData = famSnap.data();
          setFamilyName(famData.familyName || "Family");
        }
      };
      fetchFamily();
    }, [familyId]);
  
    // Fetch posts for this family
    useEffect(() => {
      const fetchPosts = async () => {
        const postsRef = collection(db, "families", familyId, "posts");
        const q = query(postsRef, orderBy("timestamp", "desc")); // latest first
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      };
      fetchPosts();
    }, [familyId]);
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">The {familyName} Family Feed Join Request Pending`</h1>
      <p className="text-muted-foreground mt-2">
        Your request to join this family is awaiting approval by the admin.
        You’ll get access once approved.
      </p>

 <div className="p-4 sm:p-6 lg:p-8">
      {/* <DashboardHeader
        title={`The ${familyName} Family Feed`}
        description="A private space for our family to connect and share."
      /> */}

      <div className="max-w-2xl mx-auto space-y-6 mt-8">
        {posts.map((post) => (
          <PostCard   key={post.id} post={post} />
        ))}
      </div>
    </div>
      {/* Optionally show read-only feed */}
      {/* <FamilyFeedPage familyId={familyId} readonly /> */}
    </div>
  );
}







