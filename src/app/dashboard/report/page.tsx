"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// import { Admin } from "@/lib/firebase"; // adjust to your Firebase config
import { useAuth } from "@/hooks/useAuth";
export default function ReportPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
const {user} = useAuth()









  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  

  //   try {
  //     await addDoc(collection(Admin, "reports"), {
  //   message,
  //      email:user?.email,
  //   userId: user?.uid ?? null,
  //   createdAt: serverTimestamp(),
  // });

    

  //     setSubmitted(true);
  //   } catch (err) {
  //     console.error("Failed to submit support message", err);
  //   } finally {
     
  //   }
  // };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Report a Problem</h1>
      <p className="text-muted-foreground">
        Let us know about bugs, issues, or anything not working properly.
      </p>

      {submitted ? (
        <div className="text-orange-400 font-semibold">Thanks for reporting! We'll look into it.</div>
      ) : (
        <form onSubmit={() => ""} className="space-y-4">
          <Textarea
            placeholder="Describe the issue here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
            required
          />
          <Button type="submit">Submit Report</Button>
        </form>
      )}
    </div>
  );
}
