"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EditProfileModal({ userData, open, onClose }: any) {
  const [fullName, setFullName] = useState(userData.fullName || "");
  const [age, setAge] = useState(userData.age || "");
  const [bio, setBio] = useState(userData.bio || "");
  const [city, setCity] = useState(userData.location?.city || "");
  const [country, setCountry] = useState(userData.location?.country || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    return data.secure_url;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const avatarUrl = await handleUploadAvatar();

      await updateDoc(doc(db, "users", userData.uid), {
        fullName,
        age,
        bio,
        avatarUrl,
        location: { city, country },
      });

      onClose(); // close modal after save
    } catch (err) {
      console.error(err);
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
