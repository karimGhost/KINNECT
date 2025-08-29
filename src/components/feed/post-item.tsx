"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from "lucide-react";
import { doc, collection, deleteDoc, setDoc, query, onSnapshot, getDoc, orderBy,where, increment, updateDoc,  getDocs, serverTimestamp, Timestamp, addDoc} from "firebase/firestore";
import PostMediaSlider from "./PostMediaSlider";
import { db} from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation"; // or next/router if using older Next.js
import {  Facebook, Twitter,  CopyCheck } from "lucide-react"
import useClipboard from "react-use-clipboard";
import { useToast } from "@/hooks/use-toast";
import ShareDropdown from "../shareDropdown";
import 'swiper/css'; // basic styles
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent,  DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  uid: string;
  text: string;
  timestamp: number;
  author: {
    name: string;
    avatarUrl: string;
  };
}

interface Reply {
  id: string;
  uid: string;
  text: string;
  timestamp: number;
  name: string;
  avatarUrl: string;
}

interface LikeUser {
  uid: string;
  name: string;
  timestamp: number;
  avatarUrl?: string;
}

interface Report{
  type: "post",
  itemId: "postId123",
  reason: "Hate speech or symbols",
  reportedBy: "uid123",
  createdAt: Timestamp
}

interface RepliesListProps {
  postId: string;
  commentId: string;
}

function RepliesList({ postId, commentId }: RepliesListProps) {
 const { user, userData } = useAuth();



  const [replies, setReplies] = useState<Reply[]>([]);
  useEffect(() => {
    const repliesRef = collection(db, "families", userData.familyId, "posts", postId, "comments", commentId, "replies");

    const q = query(repliesRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reply));
      setReplies(items);
    });
    return () => unsub();
  }, [postId, commentId]);

  if (!replies.length) return null;

  return (
    <div className="pl-10 space-y-1">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-2 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={reply.avatarUrl} />
            <AvatarFallback>{reply.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-xs">{reply.name}</p>
            <p className="text-xs">{reply.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface PostItemProps {
  post: any;
    selectedPosts?: any | null; 


}

export function PostItem({ post, selectedPosts }: PostItemProps) {
  const router = useRouter();
const [showConfirmDialog, setShowConfirmDialog] = useState(false);

const [showConfirmDialogAdmin, setShowConfirmDialogAdmin] = useState(false);

const [selectedPost, setSelectedPost] = useState<any | null>(null);

const {toast} = useToast();
  const [textToCopy, setTextToCopy] = useState('');
  const [pastedText, setPastedText] = useState('');

useEffect(()=>{
console.log("postpost", post)
},[post])

 const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://blabzio.vercel.app";
const shareUrl = `${baseUrl}/dashboard/${post.id}`;
const shareText = encodeURIComponent(`🔥 Check out this post on 🧡 Blabzio!\n`);

const socialLinks = {
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
  twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
  whatsapp: `https://wa.me/?text=${shareText}${encodeURIComponent(shareUrl)}`,
  telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
};
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [likedUsers, setLikedUsers] = useState<LikeUser[]>([]);

  const { user, userData } = useAuth();

  useEffect(() => {
    if (!post?.id || !userData?.familyId) return;

    const likesRef = collection(db, "families", userData?.familyId,"posts", post.id, "likes");
    const unsub = onSnapshot(likesRef, (snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data() as LikeUser);
      setLikedUsers(users);
      setIsLiked(users.some((u) => u.uid === user.uid));
    });

    return () => unsub();
  }, [post?.id, user?.uid]);

  useEffect(() => {
    if (!post?.id || !userData?.familyId) return;

    const commentsRef = collection(db, "families", userData?.familyId, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(items);
    });

    return () => unsub();
  }, [post?.id]);



  const handleLike = async () => {
    if (!user || !post?.id || !userData?.familyId) return;

    const postRef = doc(db, "families", userData.familyId, "posts",post.id);
    const likeRef = doc(db, "families", userData.familyId, "posts",post.id, "likes", user.uid);

    try {
      const snap = await getDoc(likeRef);

      if (snap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          uid: user.uid,
          name: userData.fullName  || post.author.name,
          timestamp: Date.now(),
        });
        await updateDoc(postRef, { likesCount: increment(1) });

   const postId = post.id;
const fromUser = user?.uid;
const toUser = post.author.uid;

const notificationsRef = collection(db, "families", userData.familyId, "notifications");

// 1. Check if a similar notification already exists
const existingQuery = query(
  notificationsRef,
  where("type", "==", "like"),
  where("fromUser", "==", fromUser),
  where("toUser", "==", toUser),
    where("content", "==", "post"),
  where("postId", "==", postId),

);

const existingSnapshot = await getDocs(existingQuery);

// 2. Only add if not already exists swiper
if (existingSnapshot.empty) {
  await addDoc(notificationsRef, {
    type: "like",
     content:"post",
    fromUser,
    toUser,
    postId,
    fullName: userData.fullName,
    avatarUrl: userData.avatarUrl,
    timestamp: Date.now(),
    familyId: userData.familyId,
    read: false,
  });
}



  const otherUserSnap = await getDoc(doc(db, "users", post.author.uid));

                  const recipientFCMToken = otherUserSnap?.data()?.fcmToken;
                  const postLike = otherUserSnap?.data()?.notificationSettings?.postLike;

if (recipientFCMToken && postLike) {
  try {

    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: recipientFCMToken,
        title: ` ${userData?.fullName   || "Someone"} liked on your post ❤️`,
        body:   "Tap to see it!",
       clickAction: `https://Kinnect.vercel.app/dashboard/${postId}`,

      }),
    });
    console.log("📩 Notification sent to:", recipientFCMToken);
  } catch (err) {
    console.error("🔥 Failed to send notification:", err);
  }
}
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };



const handleShareToFeed = async (post: any) => {
  if (!user || !userData?.familyId) return;

  try {
    
    // Step 1: Check if the user already shared this post reply
    const sharedQuery = query(
      collection(db, "families", userData.familyId, "posts"),
      where("originalPostId", "==", post.id),
      where("author.uid", "==", user.uid)
    );

    const sharedSnap = await getDocs(sharedQuery);

    if (!sharedSnap.empty) {
     
      toast({
        title: " already shared .",
        description: "You've already shared this post..",
      variant:"destructive"
      });
      return;
    }



    // Step 2: Share the post dark send in
    await addDoc(collection(db, "families", userData.familyId, "posts"), {
      author: {
        name: userData.fullName,
        avatarUrl: userData.avatarUrl,
        uid: user.uid,
      },
      content: `Shared a post by @${post.author.name}: ${post.content}`,
      mediaUrl: post.mediaUrl || "",
      createdAt: Date.now(),
      mediaType: post.mediaType || "",
       fullName: userData.fullName ,
    avatarUrl: userData.avatarUrl,
      originalPostId: post.id,
      timestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0,
    });
const postId = post.id;

const CommentTexts = post.content;

       await addDoc(collection(db, "families", userData.familyId, "notifications"), {
    type: "shared",
    fromUser: user.uid,
    toUser: post.author.uid,
    postId,
    commentId: post.id,
     fullName: userData.fullName ,
    avatarUrl: userData.avatarUrl,
    CommentTexts,
    timestamp:  Date.now(),
    read: false,
  });



toast({
        title: "Shared",
        description: "Post Shared to your feed!.",
      
      });  } catch (err) {
    console.error("Error sharing:", err);
  }
};

  
  const handleCommentSubmit = async () => {

    if (!user || !commentText.trim() || !userData?.familyId) return;
const   commentId = crypto.randomUUID();

    try {
      await addDoc(collection(db, "families", userData.familyId, "posts", post.id, "comments"), {
        uid: user.uid,
        text: commentText.trim(),
        timestamp: Date.now(),
       commentId : commentId,
        author: {
          name: userData.fullName || "Anonymous",
          avatarUrl: userData?.avatarUrl || "",
        },
      });
      setCommentText("");


      const notificationsRef = collection(db, "families", userData.familyId, "notifications");
   const postId = post.id;
const fromUser = user?.uid;
const toUser = post.author.uid;

const CommentTexts = commentText.trim();

// 1. Check if a similar notification already exists report
const existingQuery = query(
  notificationsRef,
  where("type", "==", "comment"),
  where("fromUser", "==", fromUser),
  where("content", "==", "post"),
  where("toUser", "==", toUser),
  where("postId", "==", postId),
    where("commentId", "==", commentId),

);

const existingSnapshot = await getDocs(existingQuery);

// 2. Only add if not already exists
if (existingSnapshot.empty) {
       await addDoc(notificationsRef, {
    type: "comment",
    fromUser: user.uid,
    content:"post",
    toUser: post.author.uid,
    postId,
    commentId: commentId,
     fullName: userData.fullName ,
    avatarUrl: userData.avatarUrl,
    CommentTexts,
    timestamp:  Date.now(),
    read: false,
  });

}

  const otherUserSnap = await getDoc(doc(db, "users", post.author.uid));

                  const recipientFCMToken = otherUserSnap?.data()?.fcmToken;
const postComment = otherUserSnap?.data()?.notificationSettings?.postComment;
if (recipientFCMToken && postComment) {
  try {
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: recipientFCMToken,
        title: ` ${userData?.fullName   || "Someone"} commented on your post 🗨️`,
        body:   commentText.length > 9 ? commentText.slice(0, 9) + "..." : commentText || "You have a new comment !",
       clickAction: `https://kinnect.vercel.app/dashboard${postId}`,

      }),
    });
    console.log("📩 Notification sent to:", recipientFCMToken);
  } catch (err) {
    console.error("🔥 Failed to send notification:", err);
  }
}


    } catch (err) {
      console.error("Failed to send comment:", err);
    }
  };

  const handleReplySubmit = async (commentId: string, commentuid: string, reply: string) => {
   const   commentIds = crypto.randomUUID();

    if (!user || !reply?.trim() || !userData?.familyId) return;

    const newReply = {
      uid: user.uid,
      text: reply.trim(),
      timestamp: Date.now(),
      replyId: commentIds,
      name: userData.fullName || "",
      avatarUrl: userData.avatarUrl || "",
    };


    await addDoc(collection(db, "families", userData.familyId, "posts", post.id, "comments", commentId, "replies"), newReply);

const replyTexts =  reply.trim();

   const notificationsRef = collection(db, "families", userData.familyId, "notifications");
   const postId = post.id;
const fromUser = user?.uid;
const toUser = post.author.uid;


const existingQuery = query(
  notificationsRef,
  where("type", "==", "reply"),
  where("fromUser", "==", fromUser),
    where("content", "==", "post"),
  where("toUser", "==", toUser),
  where("postId", "==", postId),

);

const existingSnapshot = await getDocs(existingQuery);

if (existingSnapshot.empty) {

         await addDoc(notificationsRef, {
    type: "reply",
    fromUser: user.uid,
        content:"post",
    toUser: commentuid,
    postId,
    fullName: userData.fullName ,
    avatarUrl: userData.avatarUrl,
    commentId: commentId,
    replyId: commentIds,
    replyTexts,
    timestamp:  Date.now(),
    read: false,
  });
}
    setReplyMap((prev) => ({ ...prev, [commentId]: "" }));



  const otherUserSnap = await getDoc(doc(db, "users", commentuid));

                  const recipientFCMToken = otherUserSnap?.data()?.fcmToken;
   const replies = otherUserSnap?.data()?.notificationSettings?.replies;


if (recipientFCMToken && replies) {
  try {
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: recipientFCMToken,
        title: ` ${userData?.fullName   || "Someone"} replied  on your comment ↩️`,
        body:   replyTexts.length > 9 ? replyTexts.slice(0, 9) + "..." : replyTexts || "You have a new reply on your comment !",
       clickAction: `https://kinnect.vercel.app/dashboard/${postId}`,

      }),
    });
setReplyMap((prev) => ({ ...prev, [commentId]: "" }));
    console.log("📩 Notification sent to:", recipientFCMToken);
  } catch (err) {
    console.error("🔥 Failed to send notification:", err);
  }
}
  };


 const [isCopied, setCopied] = useClipboard(shareUrl, {
    successDuration: 2000,
  });

  const handleSendMessage = (post: any) => {
  router.push(`/messages/new?postId=${post.id}`);
localStorage.setItem("dashboard", `/dashboard/${post.id}`)
localStorage.getItem("dashboard")
};

// const handleMuteUser = async (username: string) => {
//   if (!user) return;
//   try {
//     await setDoc(doc(db, "users", user.uid, "muted", username), { mutedAt: Date.now() });
//     alert(`${username} has been muted.`);
//   } catch (err) {
//     console.error("Mute failed:", err);
//   }
// };

// const handleBlockUser = async (username: string) => {
//   if (!user) return;
//   try {
//     await setDoc(doc(db, "users", user.uid, "blocked", username), { blockedAt: Date.now() });
//     alert(`${username} has been blocked.`);
//   } catch (err) {
//     console.error("Block failed:", err);
//   }
// };

// const handleReportPost = async (id: string) => {
//   if (!user) return;
//   try {
//     await addDoc(collection(db, "reports"), {
//       postId: post.id,
//       reporterId: user.uid,
//       reportedAt: Date.now(),
//       reason: "Inappropriate content", // Or ask user for reason share
//     });
//     alert("Post reported. Thanks for your feedback.");
//   } catch (err) {
//     console.error("Report failed:", err);
//   }
// };
const [showReportModal, setShowReportModal] = useState<string | null>(null);



const submitReport = async (postId: string, reason: string) => {
  
};


const createdAt = post?.createdAt;
const timeAgo = createdAt
  ? formatDistanceToNow(
      createdAt instanceof Timestamp 
        ? createdAt.toDate() 
        : new Date(createdAt),
      { addSuffix: true }
    )
  : "";



const [previewUrl, setPreviewUrl] = useState<any | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewUrl(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


const ConfirmDelete = async (post: any) => {
  if (!post?.id) {
    console.error("Post ID is missing");
    return;
  }

  try {
    await deleteDoc(doc(db, "families", userData.familyId, "posts", post.id));
    console.log("Post deleted successfully");
  } catch (error) {
    console.error("Error deleting post:", error);
  }
};



const deleteComment = (id: Boolean) =>{

}


const handleDeleteComment = async (postId: string, commentDocId: string) => {
  try {
    await deleteDoc(doc(db, "families", userData.familyId, "posts", postId, "comments", commentDocId));
    console.log("Comment deleted.");
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
};
 
const ConfirmDeleteAdmin = async (post: any) => {
  if (!post?.id) {
    console.error("Post ID is missing");
    return;
  }

  try {
    await deleteDoc(doc(db, "families", userData.familyId, "posts", post.id));
    console.log("Post deleted successfully");
   

    const postId = post.id;

const CommentTexts = post.content;

       await addDoc(collection(db, "families", userData.familyId, "notifications"), {
    type: "PolicyViolation",
    fromUser: "Blabzio",
    toUser: post.author.uid,
    postId,
    commentId: post.id,
     fullName: "Admin@Blabzio" ,
    avatarUrl: userData.avatarUrl,
    CommentTexts,
    timestamp:  Date.now(),
    read: false,
  });



  const otherUserSnap = await getDoc(doc(db, "users", post.author.uid));

                  const recipientFCMToken = otherUserSnap?.data()?.fcmToken;
                  // const postLike = otherUserSnap?.data()?.notificationSettings?.postLike;

if (recipientFCMToken ) {
  try {

    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: recipientFCMToken,
        title: "Admin@Blabzio - Your post has been removed due to blabzio Policy Violation! ⚠️",
        body:   "View",
       clickAction: `https://kinnect.vercel.app/feed/${postId}`,

      }),
    });
    console.log("📩 Notification sent to:", recipientFCMToken);
  } catch (err) {
    console.error("🔥 Failed to send notification:", err);
  }
}

  } catch (error) {
    console.error("Error deleting post:", error);
  }
};

const [readMoreMap, setReadMoreMap] = useState<{ [postId: string]: number }>({});
const visibleChars = readMoreMap[post.id] || 500;
const shouldShowMore = post.content.length > visibleChars;



const handleReadMore = (postId: string, contentLength: number) => {
  setReadMoreMap((prev) => {
    const current = prev[postId] || 500;
    const next = Math.min(current + 800, contentLength); // Don't exceed total length send in write a reply
    return { ...prev, [postId]: next };
  });
};

// useEffect(() => {
// console.log("selectedPost", selectedPosts ? "true" : "false") like shares
// },[selectedPosts])


  return (
    <Card className={` overflow-hidden shadow-lg     ${post?.isprofile && 'w-full  object-cover'} `   } style={{ height: post.isprofile ?  selectedPosts ? "" : "250px" : "" }}
  >
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Link href={`/profile/${post.author.uid}`}>
          <Avatar className="h-11 w-11 border-2 border-primary">
            <AvatarImage   src={
      post.author.avatarUrl
        ? post.author.avatarUrl.replace(
            "/upload/",
            "/upload/w_80,h_80,c_fill,f_auto,q_auto/"
          )
        : "/default-avatar.png"
    }     alt={post.author.name} />

           
            <AvatarFallback>{post.author.name.substring(0, 3)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="grid gap-0.5">
    


<div className="flex flex-column " style={{flexDirection:"column"}}>
  <div>
    <span className="flex mr-2">
<Link href={`/profile/${post.author.uid}`} className="font-semibold hover:underline mr-1">
  {post.author.username || post.author.name}

   
</Link>





      
    </span>
   

  <span className="text-xs text-muted-foreground block  " style={{margin:"0"}}>
            @{post.author.name} · {timeAgo}
          </span>
  </div>
    


{(post?.feeling || post?.location) && (
<p className="text-xs sm:text-sm text-muted-foreground mt--1 p-0" style={{ margin: "auto",  padding: "0", width: "fit-content" }}>
  {post.feeling && (
    <>
      is feeling{" "}
      <span className="font-semibold text-orange-400">{  post.feeling}</span>
    </>
  )}
  {post.feeling && post.location && " At "}
  {post.location && (

    post.isprofile ? 
post.mediaUrl && post.mediaType === "image" ?
    <span className="font-semibold text-muted text-orange-300">📍</span>
:
    <span className="font-semibold text-muted text-orange-300">{ post.isprofile ?   post.location.length > 21 ? "" :  post.location : post.location} 📍</span>

    :
    <span className="font-semibold text-muted text-orange-300">{ post.location} 📍</span>
  )}
</p>
)}

 


</div>



 

        
        </div>
      <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
 

    <DropdownMenuItem onClick={() => window.open(`/feed/${post.id}`, '_blank')}>
  View Post
</DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleShareToFeed(post)}>
      Share to Feed

    </DropdownMenuItem>
 


{post?.author.uid === user?.uid && (
  <DropdownMenuItem
    onClick={() => {
      setSelectedPost(post);
      setShowConfirmDialog(true);
    }}
  >
    Delete
  </DropdownMenuItem>
)}

{
(!user || user.email !== "abdulkarimkassimsalim@gmail.com") ?
           ""
            :
            <DropdownMenuItem
    onClick={() => {
      setSelectedPost(post);
      setShowConfirmDialogAdmin(true);
    }}
 style={{background:"red"}} >
 RemovePost
   </DropdownMenuItem>
}

  {post?.author.uid !== user?.uid &&
<>
    <DropdownMenuItem onClick={() => handleSendMessage(post)}>
      Send in Message
    </DropdownMenuItem>

 
 {/* <DropdownMenuItem onClick={() => handleMuteUser(post.author.uid)}>
  Mute @{post.author.name}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleBlockUser(post.author.uid)}> notificationsRef
  Block @{post.author.name}
</DropdownMenuItem> */}

<DropdownMenuItem
  className="text-destructive"


  onSelect={(e) => {
        e.preventDefault();
 showReportModal === null && setShowReportModal(post?.id)
  }}
>
  Report Post
</DropdownMenuItem>




   
  <Dialog open={ showReportModal === post?.id} onOpenChange={(isOpen) =>  setShowReportModal(isOpen ? post?.id : null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Report Post</DialogTitle>
        <DialogDescription>Select a reason for reporting this post.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {[
          "Nudity or sexual activity",
          "Hate speech or symbols",
          "Violence or dangerous behavior",
          "Spam or misleading",
          "Harassment or bullying",
          "Other"
        ].map((reason) => (
          <Button
            key={reason}
            variant="outline"
            className="w-full justify-start"
            onClick={() => {  submitReport(post?.id, reason), setShowReportModal(null);}}
          >
            {reason}
          </Button>
        ))}
      </div>
    </DialogContent>
  </Dialog>

    </>

  
}
  </DropdownMenuContent>
</DropdownMenu>


      </CardHeader>
      <CardContent className="p-4 pt-0">

             { post.content.length > 500 && Array.isArray(post.mediaUrl) && post.mediaUrl.length > 0 && post.mediaType === "image" && (
  <PostMediaSlider  postisprofile={post?.isprofile} post={post} setPreviewUrl={setPreviewUrl} />



)}
{
 post.isprofile ? 

(post.mediaUrl && post.mediaType === "image" ?

   <p className="whitespace-pre-wrap text-sm">{""}</p>

        :
         <p className="whitespace-pre-wrap text-sm">{   post.isprofile &&  selectedPosts  ?    post.content :  post.content.length > 30 ? post.content.slice(0, 30 ) + "..." 
          
        :  post.content }</p>
         )
      
:

<p className="whitespace-pre-wrap text-sm">
  {post.content.slice(0, visibleChars)}
  {shouldShowMore && (
    <button
      onClick={() => handleReadMore(post.id, post.content.length)}
      
      className="text-orange-500 underline ml-1 "
      style={{ cursor: 'pointer', textDecoration:"none" }}
    >
      ...Read More
    </button>
  )}
</p>
    
}

 

        { post.content.length <= 500 && Array.isArray(post.mediaUrl) && post.mediaUrl.length > 0 && post.mediaType === "image" && (
          
          
  <PostMediaSlider post={post} setPreviewUrl={setPreviewUrl} />

)}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 p-4 pt-0">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>{likesCount} Likes</span>
          <span>{comments.length} Comments · {comments.length} Shares</span>
        </div>
        <Separator />

        
        <div className="grid w-full grid-cols-3 gap-1">
          <Button variant="ghost" onClick={handleLike} className={`flex items-center gap-1.5 ${isLiked ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-destructive' : ''}`} /> { post.isprofile ? "" : "Like"}
          </Button> 
          <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />  { post.isprofile ? "" : "Comment"}
          </Button>
           <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1.5 text-muted-foreground">
          <Share2 className="h-5 w-5" />  { post.isprofile ? "" : "Share"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => window.open(socialLinks.facebook, "_blank")}>
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(socialLinks.twitter, "_blank")}>
          <Twitter className="mr-2 h-4 w-4 text-sky-500" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(socialLinks.whatsapp, "_blank")}>
          <Send className="mr-2 h-4 w-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(socialLinks.telegram, "_blank")}>
          <Send className="mr-2 h-4 w-4 text-blue-400" />
          Telegram
        </DropdownMenuItem>
     <ShareDropdown  shareUrl={shareUrl}/>
      </DropdownMenuContent>
    </DropdownMenu>
        </div>

        {showComments && (
          <div className="w-full space-y-3">
            <Separator />

            {comments.length === 0 && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                No comments yet. Be the first to comment!
              </div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="space-y-1">
                <div className="flex gap-2 text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment?.author?.avatarUrl} />
                    <AvatarFallback>{comment?.author?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{comment?.author?.name}</p>
                    <p>{comment?.text}</p>
                  </div>

                  { user?.uid === comment?.uid &&

 <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              
{ user?.uid === comment?.uid &&
   <DropdownMenuItem onClick={() => handleDeleteComment(post?.id,comment.id)}>Delete</DropdownMenuItem>

}
             

</DropdownMenuContent>
</DropdownMenu>
    
}
     {/* { user?.uid !== comment?.uid &&

 <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button> copu
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              
{ user?.uid !== comment?.uid &&
   <DropdownMenuItem>report</DropdownMenuItem>

}
             

</DropdownMenuContent>
</DropdownMenu>
const postLike = otherUserSnap?.data()?.notificationSettings?.postLike;
    
} */}
    
                    </div>
               

                <RepliesList postId={post.id} commentId={comment.id} />

                <div className="pl-10">
               <div className="flex items-center gap-2 w-full">
  <input
    value={replyMap[comment.id] || ""}
    onChange={(e) =>
      setReplyMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
    }
    placeholder="Write a reply..."
    className="flex-1 px-3 py-2 text-sm border rounded-lg text-foreground bg-muted"
    enterKeyHint="send"
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleReplySubmit(comment.id, comment.uid, replyMap[comment.id]);
      }
    }}
  />

  <button
    onClick={() =>
      handleReplySubmit(comment.id, comment.uid, replyMap[comment.id])
    }
    disabled={!replyMap[comment.id]?.trim()}
    className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3 21l18-9L3 3l3 9zm0 0l7.5-3M6 12l7.5 3"
      />
    </svg>
  </button>
</div>
                </div>
              </div>
            ))}

            <div className="flex w-full items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData?.avatarUrl} alt="Current user" />
                <AvatarFallback>{userData?.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="h-10 min-h-[40px] flex-1 resize-none"
              />
              <Button size="icon" variant="ghost" disabled={!commentText.trim()} onClick={handleCommentSubmit}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>



   {previewUrl && (
  <div
    onClick={() => setPreviewUrl(null)}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
  >
    {previewUrl.endsWith(".mp4") || previewUrl.includes("video") ? (
      <video src={previewUrl} controls autoPlay className="max-h-full max-w-full rounded" />
    ) : (
      <img src={previewUrl} alt="preview" className="max-h-full max-w-full rounded" />
    )}
  </div>
)}


<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This will permanently delete your post.
      </DialogDescription>
    </DialogHeader>

    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          if (selectedPost) ConfirmDelete(selectedPost);
          setShowConfirmDialog(false);
        }}
      >
        Confirm Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>




<Dialog open={showConfirmDialogAdmin} onOpenChange={setShowConfirmDialogAdmin}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This will permanently delete the post.
      </DialogDescription>
    </DialogHeader>

    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={() => setShowConfirmDialogAdmin(false)}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          if (selectedPost) ConfirmDeleteAdmin(selectedPost);
          setShowConfirmDialogAdmin(false);
        }}
      >
        Confirm Remove
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </Card>
  );
}
