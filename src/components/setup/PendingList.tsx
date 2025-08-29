"use client";

import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useAuth } from "@/hooks/useAuth";

export default function PendingList() {
  const { userData } = useAuth();
  const { requests } = useFamilyMembers(userData?.familyId);
  const pendingMembers = requests.filter((m) => !m?.approved);

  console.log("pendingMembers", pendingMembers)
  return (
    <>
    {pendingMembers.length > 0   &&
     <span
      className="
        absolute -top-2 -right-9 
         bg-accent text-white 
        text-[10px] font-bold 
        rounded-full px-1.5 py-0.2
        flex items-center justify-center
        shadow-sm
      "
    >
            {pendingMembers.length > 1 ? "1+" : pendingMembers.length === 0 ? "" : pendingMembers.length }  new 


    </span> }
    </>
  );
}
