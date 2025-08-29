"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase"; // Ensure db is exported from lib/firebase
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { ImageIcon, Video, VideoIcon , MapPin, Smile, X, Loader2  } from "lucide-react";

export function CreatePostForm({setShowPost} : any) {

  const router = useRouter();
  const { toast } = useToast();
const {user, userData} = useAuth();

  const [content, setContent] = useState("");
    const [contentTitle, setContentTitle] = useState("");

  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
const [mediaType, setMediaType] =  useState();

const [mediaFiles, setMediaFiles] = useState<File[]>([]);
const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
const [mediaTypes, setMediaTypes] = useState<string[]>([])

const [loading, setLoading] = useState(false)
const [feeling, setFeeling] = useState("");
const [locationQuery, setLocationQuery] = useState("");
const [searchResults, setSearchResults] = useState<string[]>([]);

const [showLocationInput, setShowLocationInput] = useState(false)

const [location, setLocation] = useState(""); // Selected location
const feelingsList = ["😊 Happy", "😢 Sad", "😡 Angry", "💪 Motivated"];
const [showFeelings, setShowFeelings] = useState(false)
const handleSelectFeeling = (f: string) => {
  setFeeling(f);
  setShowFeelings(false);
};


const MAX_FILES = 5;
const MAX_VIDEO_SIZE_MB = 20;

const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  let selectedFiles = Array.from(files)
    .slice(0, MAX_FILES) // Limit to 5
    .filter((file) => {
      // Only allow images or videos
      const isImage = file.type.startsWith("image");
      const isVideo = file.type.startsWith("video");

      if (!isImage && !isVideo) return false;

      // Reject videos larger than 20MB
      if (isVideo && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        console.warn(`Video too large: ${file.name}`);
        return false;
      }

      return true;
    });

  if (selectedFiles.length === 0) {
    alert("Only images and videos under 20MB are allowed.");
    return;
  }

  setMediaFiles(selectedFiles);

  const readFiles = selectedFiles.map(
    (file) =>
      new Promise<{ preview: string; type: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            preview: reader.result as string,
            type: file.type.startsWith("image")
              ? "image"
              : file.type.startsWith("video")
              ? "video"
              : "other", // won't happen due to filter but safe fallback
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
  );

  try {
    const results = await Promise.all(readFiles);
    setMediaPreviews(results.map((r) => r.preview));
    setMediaTypes(results.map((r) => r.type));
  } catch (error) {
    console.error("Error reading files:", error);
  }
};


const removeMedia = (indexToRemove: number) => {
  setMediaFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  setMediaPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  setMediaTypes((prev) => prev.filter((_, i) => i !== indexToRemove));

  // Do NOT reset the file input unless all are removed
  const fileInput = document.getElementById('media-upload') as HTMLInputElement;
  if (fileInput && mediaPreviews.length <= 1) {
    fileInput.value = '';
  }
};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
   setIsPosting(true);
if (!user) return toast({title:"Please login first"});

  console.log("Auth currentUser:", user?.uid);

  if (!user?.uid) {
    console.warn("User not authenticated.");
    return;
  }
  if (!content.trim() && !mediaFile && !contentTitle.trim()) return;


let mediaUrls: string[] = [];


 
  try {
    // 1. Upload media to Cloudinary (if provided)
   if (mediaFiles.length > 0) {
  for (const file of mediaFiles) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "postsFamily");
    formData.append("folder", "postsmedia");


    const uploadRes = await fetch(
      "https://api.cloudinary.com/v1_1/dzhoslb52/auto/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadData = await uploadRes.json();
    if (uploadData.secure_url) {
      mediaUrls.push(uploadData.secure_url);
    }
  }
}
              const keywords = [
  ...contentTitle?.trim().toLowerCase().split(" ") || [],
  ...content?.trim().toLowerCase().split(" ") || [],
];
    // 2. Save post to Firestore  ,

   const newPost = {
   family:{ 
   familyId: userData.familyId,
   familyName: userData.familyName,
   inFamily:userData.inFamily,
   },
    title: contentTitle.trim() || null,
  content: content.trim() || null,
createdAt: serverTimestamp(),
  mediaUrl: mediaUrls || null,
  mediaType: "image" ,
  feeling: feeling || null,
  keywords:keywords || null,
  location:location || null,
  uid: user?.uid,   // Make sure this exists and matches the authenticated user!
  author: {
    uid: user?.uid,
    name: userData.fullName,
    username: userData.fullName,
    avatarUrl: userData.avatarUrl,
   approved: userData.approved,
  },
  comments: {},
  likes: [],
  commentsCount: 0,
  likesCount: 0, // ✅ Add this for easier counting

};
console.log("User UID:", user?.uid);
console.log("dataB", newPost);

await addDoc(collection(db, "families", userData.familyId, "posts"), newPost);

    toast({
      title: "Post Created!",
      description: "Your post has been successfully shared.",
    });

    router.push("/dashboard");
  } catch (error) {
    console.error("Post creation failed:", error);
    toast({
      title: "Error",
      description: "Something went wrong while creating your post.",
      variant: "destructive",
    });
  } finally {

    setIsPosting(false);
                  setShowPost(false)

  }
};


  useEffect(() => {
console.log("location", Location)
    }, [Location])

const fetchLocationSuggestions = async (query: string) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSearchResults(data.map((place: any) => place.display_name));
  } catch (err) {
    console.error("Location search error:", err);
  }
};


useEffect(() => {
  const timeout = setTimeout(() => {
    if (locationQuery.length > 2) {
      fetchLocationSuggestions(locationQuery);
    }
  }, 300);

  return () => clearTimeout(timeout);
}, [locationQuery]);


  return (
<>
      { userData 
  &&  (



    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
         <Button
                type="button"
                size="icon"
                className="   text-secondary group-hover:opacity-100 bg-primary transition-opacity"
 onClick={() => {
if(setShowPost){
  setShowPost(false)  
}else{
  router.back()
}
              
              }}              
              >
                <X className="h-4 w-4" />
              </Button>
        <CardTitle className="text-2xl font-headline text-center">Create New Post</CardTitle>
        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
  Hold <kbd>Ctrl</kbd> or <kbd>Cmd</kbd>and click to select multiple files.
</p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userData?.avatarUrl} alt={userData?.fullName} data-ai-hint="user avatar" />
              <AvatarFallback>{userData.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{userData.fullName}</p>
              <p className="text-sm text-muted-foreground">@{userData.fullName}</p>
            </div>

  <Textarea
            placeholder={`whats this Post About ? `}
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
            className="min-h-[20px] h-10 text-base resize-none focus-visible:ring-primary"
            required
          />


          </div>
          <Textarea
            placeholder={`What's on your mind, ${userData.fullName} ?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] text-base resize-none focus-visible:ring-primary"
            required
          />

            {mediaPreviews.length > 0 && (
  <div className="relative group grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
    {mediaPreviews.map((src, i) => (
      <div key={i} className="relative">
        {mediaTypes[i] === "image" ?
        <Image
          src={src}
          alt={`preview-${i}`}
          width={500}
          height={300}
          className="rounded-lg object-cover w-full max-h-[300px]"
        />

        :

   <video
          src={src}
      
          width={500}
          height={300}
          className="rounded-lg object-cover w-full max-h-[300px]"
        />
}

        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => removeMedia(i)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ))}
  </div>
)}






          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => document.getElementById('media-upload')?.click()}>
              <ImageIcon className="h-5 w-5 mr-1.5 text-green-500" /> Photo/Video
            </Button>
  
<input
  type="file"
  id="media-upload"
    accept="image/*,video/*"  

  multiple
  className="hidden"
  disabled={mediaFiles.length >= 5}
  onChange={handleMediaChange}
/>          

      
            {/* <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" /*,  accept="image/*,video/*"
/>
              <VideoIcon className="h-5 w-5 mr-1.5 text-blue-500" />  Video
            </Button> */}
          
             <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowLocationInput(true)}>

              <MapPin className="h-5 w-5 mr-1.5 text-red-500" /> Location
            </Button>


{showLocationInput && (
  <div className="mt-2 space-y-2">
    <Input
      placeholder="Search location..."
      value={locationQuery}
      onChange={(e) => setLocationQuery(e.target.value)}
    />
    <ul className="bg-white border rounded max-h-40 overflow-y-auto">
      {searchResults.map((loc, index) => (
        <li
          key={index}
          onClick={() => {
            setLocation(loc);
            setShowLocationInput(false);
            setLocationQuery("");
            setSearchResults([]);
          }}
          className="p-2 hover:bg-gray-100 cursor-pointer text-muted"
        >
          {loc}
        </li>
      ))}
    </ul>
  </div>
)}
{location && (
  <p className="text-sm text-gray-500 mt-1">
    📍 {location}
  </p>
)}          
            <Button onClick={() => setShowFeelings(true)} type="button" variant="ghost" size="sm" className="text-muted-foreground">
             <Smile className="h-5 w-5 mr-1.5 text-yellow-500" /> Feeling/Activity
</Button>

    {feeling && (
  <p className="text-sm text-gray-500 mt-1">
     {feeling}
  </p>
)}  

{showFeelings && (
  <div className="absolute z-50 bg-white border rounded p-2">
    {feelingsList.map((f) => (
      <button
        key={f}
        onClick={() => handleSelectFeeling(f)}
        className="block w-full text-muted text-left hover:bg-gray-100 p-1"
      >
        {f}
      </button>
    ))}
  </div>
)}

          </div>

        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
   <Button
  type="submit"
  className="w-full sm:w-auto flex items-center justify-center gap-2"
  disabled={(!content.trim() && mediaFiles.length === 0 && !contentTitle.trim()) || isPosting}
>
  {isPosting ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Posting...
    </>
  ) : (
    "Post"
  )}
</Button>
        </CardFooter>
      </form>
    </Card>
        )
       }</> 
  );
}
