"use client";

import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I change my password?",
      answer: (
        <>
          Go to <Link href="/settings" className="text-primary underline">Settings</Link> &gt; Account Settings and enter your new password.
        </>
      ),
    },
  {
  question: "How can I delete my account?",
  answer: (
    <>
      You can delete your account in the{" "}
      <Link href="/settings" className="text-primary underline">
        Settings
      </Link>{" "}
      page under the <strong>Account Settings</strong> section.
    </>
  ),
},
    {
      question: "Why am I not receiving notifications?",
      answer: (
        <>
          Check your notification settings under <Link href="/settings" className="text-primary underline">Settings</Link> &gt; Notification Settings.
        </>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">FAQs</h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border p-4 rounded-lg">
            <h2 className="font-semibold">{faq.question}</h2>
            <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
