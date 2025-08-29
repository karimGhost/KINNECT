"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, getDoc, doc, where, startAfter, limit } from "firebase/firestore";
import {  db} from "@/lib/firebase"; // your Firestore instance
import { PostItem } from "@/components/feed/post-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video as VideoIcon, Smile } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CreatePostForm } from "@/components/forms/create-post-form";
import { useFilteredPosts } from "./useFilteredPosts";
import PostSkeleton from "./PostSkeleton";

export default function FeedPage() {
  const router = useRouter();
const {user,userData} = useAuth();



const { posts, loading, hasMore, loadPosts } = useFilteredPosts(user);
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      if (!loading && hasMore) loadPosts();
    }
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [hasMore, loading, loadPosts]);

const [showPost, setShowPost] =useState(false);

if(showPost){
            
  return(<CreatePostForm setShowPost={setShowPost} />)

}


  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <Card className="shadow-md">
        <CardHeader style={{padding:"0px", margin:"0px", marginBottom:"10px"}}>
          {/* <CardTitle className="font-headline text-lg">Create Post</CardTitle>    router.push("/create-post"); Read More  dark*/}
        </CardHeader>
        <CardContent className="space-y-3 p-1 "  onClick={() => {
              setShowPost(true)
              }}>
               
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
 src={
      userData?.avatarUrl
        ? userData.avatarUrl.replace(
            "/upload/",
            "/upload/w_80,h_80,c_fill,f_auto,q_auto/"
          )
        : "/default-avatar.png"
    }                alt={userData?.fullName}
                data-ai-hint="profile avatar"
              />
              <AvatarFallback>{userData?.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <Input
            placeholder={`What's on your mind, ${userData?.fullName} ?`}
              className="flex-1 rounded-full bg-muted border-transparent focus-visible:ring-primary focus-visible:ring-2"
              onClick={() => {
              setShowPost(true)
              }}
              readOnly
            />
          </div>
          <div className="flex justify-around pt-2 border-t">
            <Button variant="ghost" className="text-muted-foreground" asChild>
              <Link href="/create-post" className="text-smLogo">
                <ImageIcon className="h-5 w-5 mr-2 text-green-500 text-smLogo " /> Photo/Video
    </Link>
  </Button>
            <Button variant="ghost" className="text-muted-foreground" asChild>
                <Link href="/videos/record" className="text-smLogo">

                <VideoIcon className="h-5 w-5 mr-2 text-blue-500" />  Video
    </Link>
  </Button>
            <Button variant="ghost" className="text-muted-foreground" asChild>
              <Link href="/create-post" className="text-smLogo">
                <Smile className="h-5 w-5 mr-2 text-yellow-500" /> Feeling/Activity
    </Link>
  </Button>
          </div>
        </CardContent>
      </Card>

      {/* {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
      )} */}
       { posts.map((post) => (<PostItem  key={post.id} post={post } />)) }
 {loading && <p>Loading…</p>}
     {posts.length === 0 && <PostSkeleton/>}
     
    </div>
  );
}
