"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Github, Chrome, ArrowBigLeftDash } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
const provider = new GoogleAuthProvider();
const {toast} = useToast();
  const getFriendlyError = (code: string) => {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "You closed the Google sign-in popup before finishing.";
    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Please enable popups.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different method.";
    default:
      return "Something went wrong. Please try again.";
  }
}
  // Email login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
       toast({
      title: "Login failed",
      description: getFriendlyError(err.code),
      variant: "destructive",
    });
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const email = result.user.email;
    if (!email) throw new Error("No email from Google");

    // 1. Check if Firebase has this email registered
//     const methods = await fetchSignInMethodsForEmail(auth, email);
//     if (methods.length === 0) {
//       await signOut(auth);
//  toast({
//         title: "Account not found",
//         description: "This Google account is not registered. Please sign up first.",
//         variant: "destructive",
//       });

//         }

    // 2. Check if Firestore profile exists
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("No account found. Please sign up first.");
    }

    // ✅ User exists, proceed
    console.log("Welcome back:", result.user.displayName);
      router.push("/dashboard");

  } catch (err: any) {
toast({
      title: "Google sign-in failed",
      description: getFriendlyError(err.code),
      variant: "destructive",
    });  }
};
  // Phone login (redirect to separate phone auth page)
  const handlePhoneLogin = () => {
    router.push("/login/phone");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card p-6 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">

          <ArrowBigLeftDash style={{cursor:"pointer"}} onClick={() => router.push("/")}></ArrowBigLeftDash>
                    <h1 className="text-2xl font-bold text-primary">♡ Kinnect</h1>

                   <p className="text-muted-foreground text-sm">Welcome back! Log in to continue</p>

        </div>

        {/* Email + password login */}
        <form onSubmit={handleLogin} className="space-y-4">
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
          <Button type="submit" className="w-full">
            Log In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs">or continue with</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Social logins */}
        <div className="flex gap-3">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Chrome className="w-4 h-4 mr-2" /> Google
            
          </Button>

          <Button
            onClick={handlePhoneLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 mr-2" /> Phone
            
          </Button>

          
        </div>

        {/* Signup link */}
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
