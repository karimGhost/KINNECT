"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const router = useRouter();
const {toast} = useToast();

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
  // Step 1: send OTP
  const handleSendOtp = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmResult(confirmation);
     
       toast({
      title: "OTP",
      description: "OTP sent!",
      variant:"default"
    });  
  
    } catch (err: any) {
    toast({
      title: " failed",
      description: getFriendlySignupError(err.code),
      variant: "destructive",
    });    }
    }
  };

  // Step 2: verify OTP
const handleVerifyOtp = async () => {
  try {
    const result = await confirmResult.confirm(otp);

    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      router.push("/signup/extra");
    } else {
      router.push("/dashboard");
    }
  } catch (err: any) {
    alert("Invalid OTP");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card p-6 rounded-xl shadow-md w-full max-w-md space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">♡ Kinnect</h1>
          <p className="text-muted-foreground text-sm">
            signup  with phone 
          </p>
        </div>

        {/* Phone / OTP form */}
        <div className="space-y-3">
          <Input
            placeholder="+254 700 123456"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {!confirmResult ? (
            <Button
              onClick={handleSendOtp}
              className="w-full flex items-center justify-center gap-2"
            >
              <Phone size={18} /> Send OTP
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button onClick={handleVerifyOtp} className="w-full">
                Verify OTP
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invisible Recaptcha container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
