
import React from "react";
import Header from "./Header";
export default function CookiePolicyPage() {
  return (

    <>
    <Header setTerms={}/>
    
  
    <div className="max-w-3xl mx-auto px-4 py-10">

      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>

      <p className="mb-4">
        This Cookie Policy explains how <strong>KINNECT</strong> uses cookies and similar
        technologies when you visit our website or use our services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. What Are Cookies?</h2>
      <p className="mb-4">
        Cookies are small data files stored on your device when you visit a website.
        They help us understand user behavior and improve your experience.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Types of Cookies We Use</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li><strong>Essential Cookies:</strong> Required for basic functionality and security.</li>
        <li><strong>Performance Cookies:</strong> Help us understand how users interact with the platform.</li>
        <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
        <li><strong>Analytics Cookies:</strong> Collect usage and diagnostic data.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Third-Party Cookies</h2>
      <p className="mb-4">
        We may allow third-party services like Google Analytics to place cookies on your device.
        These cookies are governed by the respective third parties' privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. How to Manage Cookies</h2>
      <p className="mb-4">
        Most web browsers allow you to manage cookies through settings. You can accept, refuse, or delete
        cookies at any time by adjusting your browser preferences.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Cookie Policy from time to time. Changes will be posted on this page
        with the updated date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Us</h2>
      <p className="mb-4">
        For any questions regarding this Cookie Policy, you can contact us at:
        <br />
        <strong>support@KINNECT.com</strong>
      </p>
    </div>
      </>
  );
}
