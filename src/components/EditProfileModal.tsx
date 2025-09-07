"use client";

import { useState, useEffect } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
export default function EditProfileModal({ userData, open, onClose }: any) {
  const [fullName, setFullName] = useState(userData.fullName || "");
  const [age, setAge] = useState(userData.age || "");
  const [bio, setBio] = useState(userData.bio || "");
  const [city, setCity] = useState(userData.location?.city || "");
  const [country, setCountry] = useState(userData.location?.country || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
const {user} = useAuth()
  // Generate preview when a file is selected
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);

    // cleanup memory when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);




const updateDb = async (dataurl: string) => {
  try {
    if (!user?.uid || !userData?.familyId) {
      throw new Error("Missing user or family information");
    }

    // Update user profile
    const userRef = doc(db, "users", user?.uid);
    await updateDoc(userRef, { avatarUrl: dataurl });

    // Update all posts by this user in their family
    const postsRef = collection(db, "families", userData.familyId, "posts");
    const q = query(postsRef, where("uid", "==", user?.uid));
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map((postDoc) => {
      const postRef = doc(
        db,
        "families",
        userData.familyId,
        "posts",
        postDoc.id
      );
      return updateDoc(postRef, {
        "author.avatarUrl": dataurl,
      });
    });

    await Promise.all(updates);

    toast({
      title: "Avatar Updated",
      description: "Your profile picture has been updated.",
    });
  } catch (error) {
    console.error("Avatar update failed:", error);
    toast({
      title: "Upload Failed",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }
};

  const handleUploadAvatar = async () => {
    if (!avatarFile) return userData.avatarUrl;

    const formData = new FormData();
    formData.append("file", avatarFile);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    // updateDb(data.se)
    return data.secure_url;
  };



 const handleSave = async () => {
  setLoading(true);
  try {
    const avatarUrl = await handleUploadAvatar();

    // Update user profile
    await updateDoc(doc(db, "users", userData.uid), {
      fullName,
      age,
      bio,
      avatarUrl,
      location: { city, country },
    });

    // Update all posts authored by this user
    const postsRef = collection(db, "families", userData.familyId, "posts");
    const q = query(postsRef, where("uid", "==", user?.uid));
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map((postDoc) => {
      const postRef = doc(
        db,
        "families",
        userData.familyId,
        "posts",
        postDoc.id
      );
      return updateDoc(postRef, {
        "author.name": fullName,
        "author.avatarUrl": avatarUrl, // also update avatar if needed
      });
    });

    await Promise.all(updates);

    onClose(); // ✅ close modal AFTER all updates are done
  } catch (err) {
    console.error("Error updating profile:", err);
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="About me" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />

          {/* Avatar Upload + Preview */}
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
            {(previewUrl || userData.avatarUrl) && (
              <img
                src={previewUrl || userData.avatarUrl}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border"
              />
            )}
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
