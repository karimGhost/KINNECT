import { deleteDoc, doc } from "firebase/firestore";
import { dbd } from "@/lib/firebase";

export const deleteVideo = async ({
  videoId,
  cloudinaryUrl,
  userId,
  ownerId,
}: {
  videoId: string;
  cloudinaryUrl: string;
  userId: string;
  ownerId: string;
}) => {
  if (userId !== ownerId) throw new Error("Permission denied");

  // Extract public ID from Cloudinary URL
  const parts = cloudinaryUrl.split("/");
  const publicIdWithExt = parts[parts.length - 1];
  const publicId = publicIdWithExt.split(".")[0];

  // Delete from Cloudinary
  await fetch("/api/delete-cloudinary", {
    method: "POST",
    body: JSON.stringify({ publicId }),
  });

  // Delete from Firestore
  await deleteDoc(doc(dbd, "videos", videoId));
};
