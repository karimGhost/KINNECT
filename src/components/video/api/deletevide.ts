import type { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "damiyzwta",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { publicId } = JSON.parse(req.body);

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    res.status(500).json({ error: "Failed to delete from Cloudinary" });
  }
}
