"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Phone, Mail, UserPlus, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [step, setStep] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
    const [city, setCity] = useState("");

  
  const [ethnicity, setEthnicity] = useState("");
const {toast} = useToast();

  const router = useRouter();
const getFriendlySignupError = (code: string) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/password sign-up is not enabled. Please contact support.";
    case "auth/weak-password":
      return "Your password is too weak. Try a stronger one.";
    default:
      return "Something went wrong during sign up. Please try again.";
  }
};
  // ---------------- Email signup ----------------
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        fullName,
        familyName,
        familyCountry:"",
        avatarUrl:cred.user?.photoURL,
        inFamily: "",
        familyId:"",
        location:{
        country: country || "unspesified",
        city: city || "unspecified"
        },
        id: cred.user.uid,
        age: age || "0",
        ethnicity: ethnicity || "unknown",
        approved: false,
        createdAt: new Date(),
      });
      router.push("/dashboard");
    } catch (err: any) {

 toast({
      title: "signup failed",
      description: getFriendlySignupError(err.code),
      variant: "destructive",
    });    }
  };

  // ---------------- Google signup ----------------
  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        router.push("/signup/extra"); // force profile completion
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {

 toast({
      title: "signup failed",
      description: getFriendlySignupError(err.code),
      variant: "destructive",
    }); 
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card p-6 rounded-xl shadow-md space-y-6 w-full max-w-md">



      <div className="flex items-center gap-1 md:gap-1">

            <div className="p-1 rounded-lg bg-primary/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6">
            <defs>
              <linearGradient id="heartGradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#a800ff" />
              </linearGradient>
            </defs>
            <path
              d="M12 21s-6.2-4.6-9-8.5C1 9 3 4 7 4c2.3 0 3.6 1.3 5 3 
                 1.4-1.7 2.7-3 5-3 4 0 6 5 4 8.5-2.8 3.9-9 8.5-9 8.5z"
              fill="url(#heartGradient)"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
                    <h1 className="text-2xl font-bold text-primary">Kinnect</h1>
</div>
             

        <h1 className="text-xl font-bold text-center">Create Your Account</h1>

        {step === "choose" && (
          <div className="space-y-3">
            <Button
              className="w-full flex items-center justify-center gap-2 bg-background "
              onClick={() => setStep("email")}
            >
              <Mail size={18} /> Sign up with Email
            </Button>

            <Button
              className="w-full flex items-center justify-center gap-2 text-secondary-foreground bg-black text-white"
              onClick={handleGoogleSignup}
            >
             
                          <Chrome className="w-4 h-4 mr-2" /> Sign up with Google
              
            </Button>

            {/* <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => router.push("/signup/phone")}
            >
              <Phone size={18} /> Sign up with Phone
            </Button> */}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Log in
              </a>
            </p>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSignup} className="space-y-3">
            <Input
 placeholder="FullName/Original Name/Birth Name"
           value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

      
       

       
        {/* Age */}
        <Input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        {/* Living Country */}
        <Input
          placeholder="Living Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

{/* city*/}

   <Input
          placeholder="Living city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        {/* Ethnicity */}
        <Input
          placeholder="Ethnicity"
          value={ethnicity}
          onChange={(e) => setEthnicity(e.target.value)}
        />

        {/* Email + Password */}
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

            <Button type="submit" className="w-full">Sign Up</Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("choose")}
            >
              ← Back
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
