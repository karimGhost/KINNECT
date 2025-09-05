
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Privacy - Kinnect",
  description: "Terms of Service, Privacy Policy, and Community Guidelines for Kinnect platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Kinnect Terms of Service & Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last Updated: June 22, 2025</p>

      <section>
        <h2 className="text-xl font-semibold">1. Introduction</h2>
        <p>
          Welcome to <strong>Kinnect</strong>. By accessing or using our platform, you agree to be bound by these
          Terms of Service and our Privacy Policy. If you do not agree, please do not use Kinnect.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use Kinnect. By using the platform, you represent and warrant that you
          meet this requirement.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. User Accounts</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You agree to provide accurate and current information.</li>
          <li>You may not impersonate another person or use someone else’s account.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. User Content</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>You retain ownership of content you post.</li>
          <li>
            By posting, you grant Kinnect a non-exclusive, royalty-free license to use, distribute, and display your
            content.
          </li>
          <li>Content must not be illegal, abusive, or infringe on the rights of others.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Community Guidelines</h2>
        <p>Users must not:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Post or promote hate speech, violence, or nudity.</li>
          <li>Harass or threaten other users.</li>
          <li>Use Kinnect for any unlawful activity.</li>
        </ul>
        <p>Kinnect reserves the right to remove content or suspend accounts for violations.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Privacy Policy</h2>
        <p>We collect:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Information you provide (e.g. profile, posts, messages).</li>
          <li>Device and log data (e.g. IP address, browser type).</li>
          <li>Usage data (e.g. likes, views, interactions).</li>
        </ul>
        <p>We use this data to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide and improve services.</li>
          <li>Personalize user experience.</li>
          <li>Ensure platform safety and security.</li>
        </ul>
        <p className="font-semibold">We do <u>not</u> sell your personal data to third parties.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Cookies and Tracking</h2>
        <p>
          We use cookies to enhance user experience, remember preferences, and track usage analytics. You can manage
          cookies through your browser settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Termination</h2>
        <p>
          Kinnect may suspend or terminate your access for violations of these Terms. You may delete your account at
          any time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Modifications</h2>
        <p>
          We may update these Terms and will notify users of significant changes. Continued use of Kinnect means you
          accept the changes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Contact</h2>
        <p>
          If you have questions or concerns, contact us at <a href="mailto:support@Kinnect.com" className="text-blue-500 underline">support@Kinnect.com</a>.
        </p>
      </section>

      <p className="text-center text-muted-foreground mt-8">Thank you for using Kinnect!</p>
    </div>
  );
}
