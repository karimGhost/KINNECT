"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import ChatLayout from '@/components/chat/chat-layout';
import FamilySearch from "@/components/setup/FamilySearch";
import FamilyFeedPage from "@/components/FamilyPages/FamilyFeedPage";
import FamilyPendingPage from "@/components/FamilyPages/FamilyPendingPage";
import ExtraSignupPage from "@/components/CompleteReg/ExtraSignupPage";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Animations/spiner";

export default function DashboardPage() {
  // const [user, authLoading] = useAuthState(auth); // 🔹 auth loading state
  const [dataLoading, setDataLoading] = useState(true);

const {user, userData, setUserData, loading} = useAuth()


  // Refresh Firestore user profile
  const refreshUserData = async () => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      setUserData(snap.exists() ? snap.data() : null);
    } else {
      setUserData(null);
    }
    setDataLoading(false);
  };

  // useEffect(() => {
  //   if (!user) {
  //     setUserData(null);
  //     setDataLoading(false);
  //     return;
  //   }
  //   setDataLoading(true);
  //   refreshUserData();
  // }, [user]);

  // 🔹 Guard until BOTH auth and firestore profile are ready
  if (loading || !userData) {
    return <Spinner />;
  }

  if (user && !userData) {
    return <ExtraSignupPage />;
  }

  if (!userData?.familyId) {
    return <FamilySearch onFamilyCreated={refreshUserData} />;
  }

  if (userData.familyId && !userData.approved) {
    return <FamilyPendingPage familyId={userData.familyId} />;
  }

  return  <FamilyFeedPage />
  
  

}
  // <FamilyFeedPage />;