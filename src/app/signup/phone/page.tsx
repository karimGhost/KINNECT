"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function PhoneSignupPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Map Firebase auth error codes to friendly messages
  const getFriendlySignupError = (code: string) => {
    switch (code) {
      case "auth/invalid-phone-number":
        return "Invalid phone number format.";
      case "auth/missing-phone-number":
        return "Please enter a phone number.";
      case "auth/too-many-requests":
        return "Too many requests. Try again later.";
      case "auth/quota-exceeded":
        return "SMS quota exceeded. Try again later.";
      default:
        return "Something went wrong. Try again.";
    }
  };

  // Step 1: send OTP
 
const handleSendOtp = async () => {
  try {
    let appVerifier;

    if (process.env.NODE_ENV !== "development") {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }
      appVerifier = (window as any).recaptchaVerifier;
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phone,
      appVerifier
    );

    setConfirmResult(confirmationResult);

    toast({
      title: "OTP Sent",
      description: "Please check your phone for the code.",
    });
  } catch (error: any) {
    toast({
      title: "Error sending OTP",
      description: getFriendlySignupError(error.code),
      variant: "destructive",
    });
  }
};


  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    try {
      const result = await confirmResult.confirm(otp);

      const userRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // create new user document for signup
        await setDoc(userRef, {
          uid: result.user.uid,
          phone: result.user.phoneNumber,
          createdAt: new Date(),
        });
        router.push("/signup/extra"); // collect extra info
      } else {
        router.push("/dashboard"); // already exists
      }
    } catch (err: any) {
      toast({
        title: "Invalid OTP",
        description: "Please check and try again.",
        variant: "destructive",
      });
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
            Sign up with your phone number
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
