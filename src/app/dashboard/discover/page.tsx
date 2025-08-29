import { LostFamilyFinderForm } from "@/components/LostFamilyFinderForm";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DiscoverPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        title="Discover Connections"
        description="Find potential relatives and explore new branches of your family tree."
      />

      <div className="max-w-2xl mt-8">
        <LostFamilyFinderForm />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-headline font-semibold">
          Connect with Other Families
        </h2>
        <p className="text-muted-foreground mt-1">
          This feature is coming soon.
        </p>
      </div>
    </div>
  );
}
