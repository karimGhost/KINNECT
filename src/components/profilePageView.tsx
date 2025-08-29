import { Avatar,AvatarImage,AvatarFallback } from "./ui/avatar";
import { User, MapPin, Mail, Phone, Edit, MessageCircle, Heart } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUserById } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
const PostCard = ({ post }: { post: any }) => {
  if (!post) return null;

  return (
    <Card>
      <CardHeader className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.avatarUrl} alt={post.fullName} />
          <AvatarFallback>{post.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p>{post?.content}</p>
        {post?.imageUrl && (
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
export default function ProfilePageView({ userData, family, posts, isSelf }: any) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-10">

   

 {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20 rounded-t-lg"><i> {userData.familyName} family</i></div>
        <div className="absolute top-24 left-8">
          <Avatar className="w-40 h-40 border-8 border-background shadow-lg">
            <AvatarImage src={userData.avatarUrl} alt={userData.fullName} />
            <AvatarFallback className="text-5xl">
              {userData.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        {/* Edit button */}
        {isSelf &&
         <Button
            size="icon"
            className="absolute top-52 right-8"
            variant="secondary"
            onClick={() => setOpenEdit(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
}
      </div>

      {/* Profile Card */}
      <Card className="mt-20 pt-24 rounded-t-none">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            {userData.fullName}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {family ? `Member of the ${userData.familyName} Family` : "Not in a family yet"}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
          {/* About Me */}
          <div>
            <h3 className="font-semibold font-headline text-xl mb-2">About Me</h3>
            <p className="text-muted-foreground leading-relaxed">
              {userData.bio || "No bio yet."}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-center gap-3">
              <User size={18} className="text-primary" />
              <span>{userData.gender}, {userData.age} years old</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-primary" />
              <span>{userData.location?.city}, {userData.location?.country}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-primary" />
              <span>{userData.email}</span>
            </div>
            {userData.contact?.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-primary" />
                <span>{userData.contact.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

{family && family.members && family.members.length > 0 && (
  <Card>
    <CardHeader className="flex justify-between items-center">
      <div>
        <CardTitle className="font-headline">Family Members</CardTitle>
        <CardDescription>Meet other members of the {userData.familyName} family</CardDescription>
      </div>
      <Button variant="secondary" onClick={() => setOpenMembers(true)}>
        View Members
      </Button>
    </CardHeader>
  </Card>
)}



<Dialog open={openMembers} onOpenChange={setOpenMembers}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>{userData.familyName} Family Members</DialogTitle>
    </DialogHeader>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-4">
    {family?.membersData?.map((member: any) => (
  <div key={member.uid} className="flex flex-col items-center">
    <Avatar>
      <AvatarImage src={member.avatarUrl} alt={member.fullName} />
      <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
    </Avatar>
    <p>{member.fullName}</p>
    <p className="text-xs">{member.location?.city}</p>
  </div>
))}
     
    </div>
  </DialogContent>
</Dialog>
      {/* Family Posts */}
      {family && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              {family.familyName} Family Feed
            </CardTitle>
            <CardDescription>
              Updates shared by you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {posts.length > 0 ? (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            ) : (
              <p className="text-center text-muted-foreground">No posts yet.</p>
            )}
          </CardContent>
        </Card>
      )}


        {isSelf && (
          <EditProfileModal
            userData={userData}
            open={openEdit}
            onClose={() => setOpenEdit(false)}
          />
        )}
      </div>
    </div>
  );
}
