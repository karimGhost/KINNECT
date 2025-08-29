import type { User, Family, Post } from "@/types";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { number } from "zod";

export const families: Family[] = [
  { id: "f1", name: "Al-Farsi", origin: "Oman", adminId: "u1" },
  { id: "f2", name: "Schmidt", origin: "Germany", adminId: "u4" },
];

export const users: User[] = [
  {
    uid: "",
    email: "",
    phoneNumber: "",
    fullName: "",
    avatarUrl: "",
    originalName: "",
    familyName: "",
    age: "",
    location: {
      country: "",
      city: ""
    },
    familyCountry: "",
    ethnicity: "",
    approved: "",
    createdAt: new Date(),
    inFamily: "",
    familyId: "",
    isAdmin: undefined,
    id: "",
    gender: "Male",
    bio: "",
    role: "admin",
    status: "approved"
  },

];

export const posts: Post[] = [
  {
    id: "p1",
    authorId: "u1",
    timestamp: "2024-05-20T10:00:00Z",
    content:
      "Found this old photo of great-grandfather Salim. Does anyone know the story behind it?",
    imageUrl: "https://picsum.photos/600/400?random=10",
    comments: [
      {
        id: "c1",
        authorId: "u2",
        content: "Wow! I have never seen this before. He looks so young.",
        timestamp: "2024-05-20T10:05:00Z",
      },
    ],
  },
  
];


export async function getUserById(uid: string) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return { uid: snap.id, ...snap.data() } as any;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}

// Get a family by familyId
export async function getFamilyById(familyId: string) {
  try {
    const ref = doc(db, "families", familyId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.error("Error fetching family:", err);
    return null;
  }
}

// Get posts authored by a specific user
export async function getPostsByUser(uid: string) {
  try {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
}

// Mock function to get family data
export const getFamilyMembers = (familyId: string) =>
  users.filter((u) => u.familyId === familyId);
export const getPostsByFamily = (familyId: string) => {
  const familyMembers = getFamilyMembers(familyId).map((u) => u.id);
  return posts
    .filter((p) => familyMembers.includes(p.authorId))
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};
