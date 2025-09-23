"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const getFriendlyError = (code: string) => {
    switch (code) {
      case "auth/invalid-phone-number":
        return "Invalid phone number format.";
      case "auth/missing-phone-number":
        return "Please enter a phone number.";
      case "auth/too-many-requests":
        return "Too many login attempts. Try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  // Step 1: send OTP
  const handleSendOtp = async () => {
    try {
      setLoading(true);


      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
(window as any).recaptchaVerifier
      );
      setConfirmResult(confirmation);

      toast({
        title: "OTP Sent",
        description: "Check your phone for the code.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to send OTP",
        description: getFriendlyError(err.code),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    if (!confirmResult) return;
    try {
      setLoading(true);
      const result = await confirmResult.confirm(otp);

      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        // user hasn’t signed up yet
        router.push("/signup/extra");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast({
        title: "Invalid OTP",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">♡ Kinnect</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Log in with your phone
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Phone size={18} /> {loading ? "Sending..." : "Send OTP"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify OTP"}
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
