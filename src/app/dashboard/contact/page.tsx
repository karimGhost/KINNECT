"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Admin } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to Firestore
      await addDoc(collection(Admin, "supportMessages"), {
        message,
        email,
        userId: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      // 2. Send email to admin via API
      await fetch("/api/send-support-email", {
        method: "POST",
        body: JSON.stringify({ email, message }),
        headers: { "Content-Type": "application/json" },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit support message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold"> KINNECT Contact Support</h1>
      <p className="text-muted-foreground">
        Having issues or need to reach us? Fill out the form below.
      </p>

      {submitted ? (
        <div className="text-orange-400 font-semibold">
          Thanks for reaching out! We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Your message..."
            className="min-h-[120px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      )}
    </div>
  );
}
