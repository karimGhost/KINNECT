
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import Header from "./Header";

export const metadata: Metadata = {
  title: "Privacy Policy | KINNECT",
  description: "Read our Privacy Policy to understand how we handle your data on KINNECT.",
};

export default function PrivacyPage() {
  return (
      <>
        <Header/>
        
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: June 22, 2025</p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Account Data:</strong> Name, email, username, and profile details.</li>
          <li><strong>Usage Data:</strong> Interactions, views, likes, and other engagement data.</li>
          <li><strong>Device Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
          <li><strong>Content:</strong> Posts, videos, comments, messages, and any content uploaded to KINNECT.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide and maintain the platform.</li>
          <li>To personalize content and user experience.</li>
          <li>To improve services through analytics and feedback.</li>
          <li>To detect, prevent, and respond to fraud, abuse, and security risks.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Sharing and Disclosure</h2>
        <p>We do not sell your personal data. We may share information with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Service providers helping us run KINNECT.</li>
          <li>Legal authorities when required by law.</li>
          <li>Other users, to the extent required for content interactions.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Your Rights and Choices</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access, update, or delete your account information.</li>
          <li>Control notifications and email preferences.</li>
          <li>Request data export or deletion by emailing <Link href="mailto:support@KINNECT.com" className="text-blue-500">support@KINNECT.com</Link>.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Data Retention</h2>
        <p>We retain your data for as long as your account is active or as needed to provide services and comply with legal obligations.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Cookies</h2>
        <p>We use cookies to improve functionality and gather analytics. Read more in our <Link href="/policy" className="text-blue-500">Cookie Policy</Link>.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Updates to This Policy</h2>
        <p>We may update this policy from time to time. Changes will be posted on this page with a revised date.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. Contact</h2>
        <p>Questions or concerns? Reach out to us at <Link href="mailto:support@KINNECT.com" className="text-blue-500">support@KINNECT.com</Link>.</p>
      </section>
    </div>
    </>
  );
}
