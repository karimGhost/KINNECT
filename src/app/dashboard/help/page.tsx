import { HelpCircle, Mail, Bug, Info } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <HelpCircle className="h-7 w-7 text-primary" />
       KINNECT Help Center
      </h1>
      <p className="text-muted-foreground">
        Need help? Here are some ways we can assist you.
      </p>

      <div className="space-y-4">
        <div className="border p-4 rounded-lg">
          <h2 className="font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            FAQs
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse frequently asked questions and common issues.
          </p>
          <Link href="/faq" className="text-sm text-primary hover:underline">
            View FAQs
          </Link>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="font-semibold flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Report a Problem
          </h2>
          <p className="text-sm text-muted-foreground">
            Found a bug or issue? Let us know and we’ll fix it.
          </p>
          <Link href="/report" className="text-sm text-primary hover:underline">
            Report an Issue
          </Link>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Support
          </h2>
          <p className="text-sm text-muted-foreground">
            Need personal help? Reach out to our support team.
          </p>
          <Link href="/contact" className="text-sm text-primary hover:underline">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
