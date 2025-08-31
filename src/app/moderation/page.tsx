import ModerationClient from "./moderation-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link";
import { GrabIcon, Home } from "lucide-react";

export default function ModerationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-4 border-b bg-background px-4 md:px-6">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/Chat"><GrabIcon className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Intelligent Moderator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1">
          <h1 className="font-semibold text-xl md:text-2xl">Moderation Dashboard</h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 lg:p-10 bg-muted/30">
        <ModerationClient />
      </main>
    </div>
  );
}
