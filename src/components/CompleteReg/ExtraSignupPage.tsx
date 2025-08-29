"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function ExtraSignupPage() {
  const [fullName, setFullName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [city, setCity] = useState("");

  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("No signed in user!");

    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        fullName,
     avatarUrl:user?.photoURL,

        originalName,
        familyName,
        age: Number(age),
         location:{
        country: country || "unspesified",
        city: city || "unspecified"
        },
        familyCountry:"",
        ethnicity,
        approved: false,
        createdAt: new Date(),
         inFamily: "",
        familyId:"",
      });

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSave}
        className="bg-card p-6 rounded-xl shadow-md space-y-4 w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-center">Complete Your Profile</h1>

        <Input  placeholder="FullName/Original Name/Birth Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        {/* <Input placeholder="Family Name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required /> */}
        <Input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        <Input placeholder="Living Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                <Input placeholder="Living City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input placeholder="Ethnicity" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} />
        <Button type="submit" className="w-full">Save & Continue</Button>
      </form>
    </div>
  );
}
