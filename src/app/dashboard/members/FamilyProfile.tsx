"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth  } from "@/hooks/useAuth";
export default function FamilyProfile({familyId, approvedMembers } : any ) {
const {user} = useAuth();
  const [familyData, setFamilyData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
 const [familyName, setFamilyName] = useState<any>("");
  const [familyAvatar, setFamilyAvatar] = useState(familyData?.familyAvatar || "");
  const [uploading, setUploading] = useState(false);

  const [about, setAbout] = useState(familyData?.about || "");

    useEffect(() => {
    const fetchFamily = async () => {
      try {
        const ref = doc(db, "families", familyId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setFamilyData(data);
         setFamilyName(data.familyName)
          console.log("famd", data)
        }
      } catch (error) {
        console.error("Error fetching family:", error);
      }
    };

    if (familyId) fetchFamily();
  }, [familyId]);




   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    setFamilyAvatar(data.secure_url); // ✅ Cloudinary hosted image
    setUploading(false);
  };

  const handleSave = async () => {
    if (!familyData?.familyId) return;

    const ref = doc(db, "families", familyData.familyId);
    await updateDoc(ref, {
      familyName,
      about,
      familyAvatar,
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setFamilyName(familyData?.familyName || "");
    setAbout(familyData?.about || "");
    setFamilyAvatar(familyData?.familyAvatar || "");
    setIsEditing(false);
  };

  return (
   <Card className="p-6 space-y-6 shadow-lg rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={familyAvatar} />
            <AvatarFallback>
              {familyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded cursor-pointer">
              {uploading ? "..." : "Change"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="flex-1">
          {isEditing ? (
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            <h2 className="text-xl font-bold">The {familyName} Family</h2>
          )}
          <p className="text-sm text-muted-foreground">
            {approvedMembers?.length || 0} members
          </p>
        </div>

        {/* Edit button */}
        {!isEditing &&  familyData?.rootAdminId === user?.uid &&(
            
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button> 
            
         
        )}
      </div>

      {/* About */}
      <div>
        <label className="text-sm font-medium">About</label>
        {isEditing ? (
          <Textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Write something about your family..."
            className="mt-1"
          />
        ) : (
          <p className="text-muted-foreground mt-1">{about || "No description"}</p>
        )}
      </div>

      {/* Info section */}
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Country</p>
          <p className="text-muted-foreground">{familyData?.country}</p>
        </div>
        <div>
          <p className="font-medium">Continent</p>
          <p className="text-muted-foreground">{familyData?.continent}</p>
        </div>
        <div>
          <p className="font-medium">Region</p>
          <p className="text-muted-foreground">{familyData?.region}</p>
        </div>
        <div>
          <p className="font-medium">City</p>
          <p className="text-muted-foreground">{familyData?.city}</p>
        </div>
        <div>
          <p className="font-medium">Ethnicity</p>
          <p className="text-muted-foreground">{familyData?.ethnicity}</p>
        </div>
        <div>
          <p className="font-medium">Family ID</p>
          <p className="text-muted-foreground">{familyData?.familyId}</p>
        </div>
        {/* <div>
          <p className="font-medium">Root Admin</p>
          <p className="text-muted-foreground">{familyData?.rootAdminId}</p>
        </div> */}
        <div>
          <p className="font-medium">Created</p>
          <p className="text-muted-foreground">
            {familyData?.createdAt?.toDate
              ? familyData.createdAt.toDate().toLocaleDateString()
              : familyData?.createdAt}
          </p>
        </div>
      </CardContent>

      {/* Save / Cancel buttons only in edit mode */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      )}
    </Card>
  );
}
