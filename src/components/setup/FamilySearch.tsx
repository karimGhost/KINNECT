"use client";
import { useEffect,useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  addDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSound from "use-sound";
import Select from "react-select";
import countries from "world-countries";
import { backgroundModel } from "genkit/plugin";
import { useRouter } from "next/navigation";
// import dynamic from "next/dynamic";
// import Globe from "react-globe.gl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

// Load Globe only on the client
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <p>Loading globe...</p>,
});


// import * as THREE from "three";

export default function FamilySearch({ onFamilyCreated }: { onFamilyCreated: () => void }) {
   const [mounted, setMounted] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [requestImages, setRequestImages] = useState<File[]>([])


  const [user] = useAuthState(auth);
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [Region,setRegion] = useState("");
  const [City,setCity] = useState("");
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const [ethnicity, setEthnicity] = useState("");
const [requestMessage,setRequestMessage] = useState("")
// inside your DashboardPage component:
const globeRef = useRef<any>(null);
const [playPing] = useSound("/sounds/ping.mp3", { volume: 0.25 }); // subtle ping sound

// const countryOptions = countries.map(c => ({
//   value: c.cca2, // ISO code
//   label: c.name.common,
//   continent: c.region,
// }));


useEffect(() => {
  setMounted(true);
}, []);
 
  const handleCheckFamily = async () => {
    setLoading(true);
    setChecked(false);

    try {
      const q = query(
        collection(db, "families"),
        where("familyName", "==", familyName)
      );
      const snap = await getDocs(q);
      setFamilies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
      setChecked(true);
    }
  };

     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setRequestImages([...requestImages, ...Array.from(e.target.files)])
    }
  }

  const removeImage = (index: number) => {
    setRequestImages(requestImages.filter((_, i) => i !== index))
  }


  
  const handleJoin = async (
  familyId: string
) => {
  setLoading(true);
if(!user) return;
  try {
    // 1. Upload images to Cloudinary and collect URLs
    let imageUrls: string[] = [];

    if (requestImages.length > 0) {
      const uploads = requestImages.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        return data.secure_url; // Cloudinary gives back the image URL
      });

      imageUrls = await Promise.all(uploads);
    }

    // 2. Save request to Firestore
    const fam = familyId;
    const reqRef = collection(db, "families", fam, "requests");
    await addDoc(reqRef, {
      userId: user?.uid,
      status: "pending",
      requestMessage,
      images: imageUrls, // ✅ store uploaded Cloudinary URLs here
      requestedAt: new Date(),
    });

   

    // 3. Update user doc
    await setDoc(
      doc(db, "users", user?.uid),
      {
        uid: user?.uid,
        country: country.toLowerCase(),
        continent: continent.toLowerCase(),
        familyId: fam,
        approved: false,
      },
      { merge: true }
    );




    onFamilyCreated();
  } catch (err) {
    console.error("Error sending join request:", err);
  } finally {
    setLoading(false);
  }
}



  const handleCreateOrJoin = async (familyId: any) => {
    if (!user) return;
    setLoading(true);


    if (families.length === 0) {
      // Create new family
      setFamilyName("");
      const famRef = doc(collection(db, "families"));
      await setDoc(famRef, {
        familyName,
        country:  country.toLowerCase(),
        continent: continent.toLocaleLowerCase(),
        Region,
        City,
        rootAdminId: user.uid,
        familyId: famRef.id,
        members: [user.uid],
        createdAt: new Date(),
       ethnicity: ethnicity,
       about: "",
      });

       
        
        
        

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          familyCountry:  country.toLowerCase(),
        continent: continent.toLocaleLowerCase(),   
         inFamily: "",
          familyId: famRef.id,
          isAdmin: true,
          AdminId: user.uid,
          approved: true,
        },
        { merge: true }
      );
    onFamilyCreated();

    } else {
      // Request to join


 handleJoin(familyId)

    // alert("Done! Either created family or sent join request.");
  };

}
  const continentOptions = [
  { value: "Africa", label: "Africa" },
  { value: "Asia", label: "Asia" },
  { value: "Europe", label: "Europe" },
  { value: "North America", label: "North America" },
  { value: "South America", label: "South America" },
  { value: "Australia", label: "Australia" }, // we’ll map this → Oceania
  { value: "Antarctica", label: "Antarctica" },
];


const continentCoords: Record<string, { lat: number; lng: number }> = {
  Africa: { lat: 0, lng: 20 },
  Asia: { lat: 30, lng: 100 },
  Europe: { lat: 54, lng: 15 },
  "NorthAmerica": { lat: 54, lng: -105 },
  "South America": { lat: -15, lng: -60 },
  Australia: { lat: -25, lng: 133 },
  Antarctica: { lat: -90, lng: 0 },
};

const continentMap: Record<string, string[]> = {
  Africa: ["Africa"],
  Asia: ["Asia"],
  Europe: ["Europe"],
  "North America": ["Americas"], // need subregion filter
  "South America": ["Americas"], // same
  Australia: ["Oceania"],
  Antarctica: ["Antarctic"],
};

//  useEffect(() => {
//     setMounted(true);
//   }, []);


useEffect(() => {
  if (!globeRef.current) return;

  let target: { lat: number; lng: number; altitude?: number } | null = null;

  if (continent && continentCoords[continent]) {
    target = { ...continentCoords[continent], altitude: 2 };
  }

  if (country) {
    const match = countries.find(c => c.name.common === country);
    if (match && match.latlng) {
      target = { lat: match.latlng[0], lng: match.latlng[1], altitude: 2 };
    }
  }

  if (target) {
    globeRef.current.pointOfView(target, 2000);
  }
}, [continent, country]);

const countryOptions = countries.map((c) => ({
  value: c.cca2, // ISO code
  label: c.name.common,
  continent: c.region,
  subregion: c.subregion, // ✅ add this
}));

const filteredCountries = countryOptions.filter((c) => {
  if (!continent) return false;

  if (continent === "North America") {
    return c.continent === "Americas" && c.subregion?.includes("North");
  }
  if (continent === "South America") {
    return c.continent === "Americas" && c.subregion?.includes("South");
  }
  if (continent === "Australia") {
    return c.continent === "Oceania"; // world-countries uses "Oceania"
  }
  if (continent === "Antarctica") {
    return c.continent === "Antarctic";
  }
  return c.continent === continent;
});

// When family found:
useEffect(() => {
  if (checked && families.length > 0) {
    playPing();
  }
}, [checked, families, playPing]);


useEffect(()=>{
console.log("country", country)
},[country])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-card p-6 rounded-xl shadow-md space-y-4 w-full max-w-md">
<div className="text-center px-2">
  <h1 className="text-xl sm:text-2xl font-bold">
    Join or Create Your Family on Kinnect
  </h1>
  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
    Connect with your relatives, share memories, and grow together.
  </p>
</div>
      <Select
  options={continentOptions}
  value={continent ? { value: continent, label: continent } : null}
  onChange={(opt) => setContinent(opt?.value || "")}
  placeholder="Select Continent"
  className="text-black dark:text-white"
  classNamePrefix="react-select"
  styles={{
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      color:"white",
      borderColor: state.isFocused ? "#08090aff" : "#0e0f11ff", // focus:ring-blue-500, gray-300
      boxShadow: state.isFocused ? "0 0 0 1px #060f13ff" : "none",
      "&:hover": {
        borderColor: "#9ca3af", // gray-400
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#121418",
      color: "white",
      borderRadius: "0.5rem",
      overflow: "hidden",
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
color:"white",
      padding: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0d0e11ff" // blue-500
        : state.isFocused
        ? "#20232bff" // gray-200
        : "transparent",
      color: state.isSelected ? "white" : "white",
      "&:active": {
        backgroundColor: "#121418", // blue-600
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "inherit", // follows text-black / dark:text-white
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af", // gray-400
    }),
  }}
/>
       {/* Country Selector (filtered by continent) */}
         <Input
          placeholder="Family Name"
          value={!continent ? "Fill the above first !!" : familyName }
            disabled={!continent}

          onChange={(e) => setFamilyName(e.target.value)}
        />
<Select
  options={filteredCountries.map((c) => ({ value: c.label, label: c.label }))}
  value={country ? { value: country, label: country } : null}
  onChange={(opt) => setCountry(opt?.value || "")}
  placeholder="Select Country"
  isDisabled={!continent || !familyName}
  
  className="text-black dark:text-white"
  classNamePrefix="react-select"
  styles={{
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#08090aff" : "#0e0f11ff", // focus:ring-blue-500, gray-300
      boxShadow: state.isFocused ? "0 0 0 1px #060f13ff" : "none",
      "&:hover": {
        borderColor: "#9ca3af", // gray-400
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#121418",
      color: "white",
      borderRadius: "0.5rem",
      overflow: "hidden",
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
color:"white",
      padding: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0d0e11ff" // blue-500
        : state.isFocused
        ? "#20232bff" // gray-200
        : "transparent",
      color: state.isSelected ? "white" : "white",
      "&:active": {
        backgroundColor: "#121418", // blue-600
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "inherit", // follows text-black / dark:text-white
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af", // gray-400
    }),
  }}
/>

 <Input
  disabled={!continent || !familyName || !country}

          placeholder="City/State"
          value={City}
          onChange={(e) => setCity(e.target.value)}
        />

 <Input
   disabled={!continent || !familyName || !country || !City}

          placeholder="enter Region"
          value={Region}
          onChange={(e) => setRegion(e.target.value)}
        />

   <Input
      disabled={!continent || !familyName || !country || !City || !Region}

   placeholder="Ethnicity" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} />

      

        {/* Check button */}
        <Button
          onClick={handleCheckFamily}
          disabled={loading || !familyName || !country || !continent || !City || !ethnicity || !Region }
          className="w-full"
        >
          {loading ? "🌍 Searching Universe..." : "Check Family Existence"}
        </Button>

        {/* Animation placeholder */}
    
{loading && (
  <div className="w-full h-64 mt-4 flex items-center justify-center">
  
   {mounted && (<Globe
      ref={globeRef}
      width={400}
      height={400}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      arcsData={[
        {
          startLat: 0,
          startLng: 0,
          endLat: 40,
          endLng: -74,
          color: ["rgba(0,255,255,0.7)", "rgba(255,255,255,0.1)"],
        },
      ]}
      arcColor={"color"}
      arcDashLength={() => Math.random()}
      arcDashGap={() => Math.random()}
      arcDashAnimateTime={() => 4000}
    />)}
    <span className="absolute bottom-4 text-sm text-blue-400 animate-pulse">
 🌍 Scanning{" "}
  {continent ? (
    <>
      {continent} → <b className="text-orange-500">{country || "?"}</b>
    </>
  ) : (
    "Earth"
  )}
  ...    </span>
  </div>
)}

        {/* Results */}
{checked && !loading && (
  <>
    {families.length > 0 ? (
      <div className="space-y-2">
<p className="text-sm text-muted-foreground">
  {families.find((i) => i.continent !== continent) 
    ? `No family found with that exact name in ${country}. `
    : families.find((i) => i.country !== country) 
    ? `No family found with that exact name in ${country}. `
    : ""}

  We found {families.length } families with similar names
{families.length > 0 && (
  <>
    {" "}in{" "}
    {Object.entries(
      families.reduce((acc: Record<string, number>, fam) => {
        // normalize casing
        const continent = fam.continent
          ? fam.continent.charAt(0).toUpperCase() + fam.continent.slice(1).toLowerCase()
          : null;
        const country = fam.country
          ? fam.country.charAt(0).toUpperCase() + fam.country.slice(1).toLowerCase()
          : null;

        if (continent) acc[continent] = (acc[continent] || "") ;
        if (country) acc[country] = (acc[country] || 0) + 1;

        return acc;
      }, {})
    )
      .map(([region, count]) => `${region} (${count})`)
      .join(", ")}
  </>
)}
  Review the details and send a join request to the right one.
</p>
        <div className="space-y-3">
        
            <div className="space-y-3">
      {families.map((fam: any) => (
        <div
          key={fam.familyId}
          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
        >
          <div className="flex items-center gap-3">
            {/* DP / Logo placeholder */}
            <img
              src={fam.avatarUrl || "/family-placeholder.png"}
              alt={fam.familyName}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <p className="font-medium">{fam.familyName}</p>
              <p className="text-xs text-muted-foreground">
                {fam.country}, {fam.continent}
              </p>
            </div>
          </div>

         <Dialog>
  <DialogTrigger asChild>
    <Button
      variant="secondary"
      onClick={() => setSelectedFamily(fam)}
    >
      View Family
    </Button>
  </DialogTrigger>

  {selectedFamily?.familyId === fam.familyId && (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{fam.familyName}</DialogTitle>
        <DialogDescription>
          Details about this family.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 text-sm">
        <p>
          <b>Country:</b> {fam.country}
        </p>
        <p>
          <b>Continent:</b> {fam.continent}
        </p>
        <p>
          <b>Region:</b> {fam.Region || "N/A"}
        </p>
        <p>
          <b>City:</b> {fam.City || "N/A"}
        </p>
        <p>
          <b>Ethnicity:</b> {fam.ethnicity || "N/A"}
        </p>
        <p>
          <b>Created:</b>{" "}
          {fam.createdAt
            ? new Date(fam.createdAt.seconds * 1000).toDateString()
            : "N/A"}
        </p>
        <p>
          <b>Members:</b> {fam.members?.length || 0}
        </p>
      </div>

      <DialogFooter>
        {/* Nested Dialog for Request to Join */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">
              Request to Join
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request to Join {fam.familyName}</DialogTitle>
              <DialogDescription>
                Write a short message to send with your request.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Write your request message..."
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}

            />

 <div className="space-y-2">
    <Label
    htmlFor="request-images"
    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
  >
    📎 Attach Image
  </Label>
          <Input
          id="request-images"
            type="file"
            accept="image/*"

            multiple
            onChange={handleImageChange}
            className="block hidden  w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 hover:file:bg-primary/20"
          />

          {/* Preview uploaded images */}
          {requestImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {requestImages.map((file, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

            <DialogFooter>
 <DialogClose asChild>
        <Button type="button" variant="secondary">Cancel</Button>
      </DialogClose>              <Button onClick={() => handleCreateOrJoin(fam.familyId)}
 className="bg-primary text-white">
                Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </DialogFooter>
    </DialogContent>   )}
    </Dialog>
        </div>
      ))}
    </div>

        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        No family found with that name. You can create one.
      </p>
    )}

    {families.length === 0 && (
      <Button
        onClick={() => handleCreateOrJoin(user?.uid)}
        disabled={!continent || !country || !familyName}
        className="w-full mt-3"
      >
        Create Family
      </Button>
    )}
  </>
)}



      </div>
    </div>
  );
}
