"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserById, getFamilyById, getPostsByUser } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import ProfilePageView from "@/components/profilePageView";

export default function ProfilePage() {
  const { id } = useParams(); // profile/[id]
  const { userData: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [family, setFamily] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
    if (!id) return;
    const u = await getUserById(id as string);
    if (!u) {
      setProfileUser(null);
      setLoading(false);
      return;
    }
    setProfileUser(u);

    if (u?.familyId) {
      const fam = await getFamilyById(u.familyId);
      setFamily(fam);
    }

    const userPosts = await getPostsByUser(u.uid);
    setPosts(userPosts);

    setLoading(false);
  };

  fetchData();
}, [id]);


  if (loading) return <p className="p-6 text-center">Loading profile...</p>;
  if (!profileUser) return <p className="p-6 text-center">User not found.</p>;

  return (
 <ProfilePageView
      userData={profileUser}
      family={family}
      posts={posts}
      isSelf={profileUser.uid === currentUser?.uid}
    />  );
}
