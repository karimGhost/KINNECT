"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FamilyProfileModal from "./FamilyProfileModal";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Wand2, Search, Database, LucideGhost, FileCodeIcon, FileArchive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  familyName: z
    .string()
    .min(2, { message: "Family name must be at least 2 characters." }),
  origin: z
    .string()
    .min(2, { message: "Origin must be at least 2 characters." }),
});

type FormData = z.infer<typeof formSchema>;

export function LostFamilyFinderForm() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
const [modalOpen, setModalOpen] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      familyName: "",
      origin: "",
    },
  });
//
const onSubmit: SubmitHandler<FormData> = async (data) => {
  setIsLoading(true);
  setError(null);
  setSuggestions([]);

  try {
    // Search families by country/origin and by similar name
    const q = query(
      collection(db, "families"),
      where("country", "==", data.origin.toLowerCase()) // strict country match
    );
    const snap = await getDocs(q);

    // Filter for similar family name locally
    const results = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((fam: any) =>
        fam.familyName.toLowerCase().includes(data.familyName.toLowerCase())
      );
console.log("fami", snap.docs )
    setSuggestions(results);
  } catch (e) {
    console.error(e);
    setError("An error occurred while fetching families. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  return (
      <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/20 rounded-lg flex items-center justify-center">
            <FileArchive className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="font-headline text-2xl">
              Lost Family Finder
            </CardTitle>
            <CardDescription>
              Enter a family name and origin to find similar ones.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Smith, Al-Fulan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country/Region of Origin</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ireland, Levant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Find Connections
            </Button>
          </CardFooter>
        </form>
      </Form>
      {error && (
        <div className="p-4 pt-0">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}


 {suggestions.length > 0 && (
  <div className="p-4 pt-0">
    <Alert>
      <AlertTitle className="font-headline">Similar Families Found</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-3">
          {suggestions.map((fam) => (
            <li
              key={fam.id}
              className="flex items-center justify-between border-b pb-2"
            >
              <div>
                <p className="font-semibold">{fam.familyName}</p>
                <p className="text-xs text-muted-foreground">
                  Origin: {fam.country}
                </p>
              </div>
           <Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedFamilyId(fam.id);
    setModalOpen(true);
  }}
>
  View
</Button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  </div>
)}
<FamilyProfileModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  familyId={selectedFamilyId}
/>
    </Card>
    </div>
    </div>
  );
}
