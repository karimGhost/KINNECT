"use client";
import { useEffect, useState , useRef} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Lock, Bell, Shield, Palette, UserCircle, LogOut, Loader2, ShieldCheck, HelpCircle, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { deleteUser, signOut } from "firebase/auth";
import { doc, getDoc,setDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPayPal, setShowPayPal] = useState(false);
const [selectedBadge, setSelectedBadge] = useState<"gold" | "diamond">("gold");





const { userData, setUserData} = useAuth();



   const [ user] = useAuthState(auth);
  const {loading} = useAuth();
  
    useEffect(() => {
  if(!user && !loading){
    router.push("/")
  }

        console.log("loading", loading)

},[user, loading]);

 const [avatarUrl, setAvatarUrl] = useState(userData?.avatarUrl);
const [uploading, setUploading] = useState(false);

const [ UploadingProfile,  setUploadingProfile] = useState(false);
const [password, setPassword] = useState("");
const [repeatPassword, setRepeatPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [isReauthenticating, setIsReauthenticating] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [privacySettings, setPrivacySettings] = useState<Record<PrivacySettingKey, boolean>>({
  privateAccount: false,
  activityStatus: true,
});

type NotificationType = "newFollower" | "postLike" | "postComment" | "replies" | "directMessage";

const [notifications, setNotifications] = useState<Record<NotificationType, boolean>>({
  newFollower: true,
  postLike: true,
  postComment: true,
  directMessage: true,
  replies:true,
});




type ThemeMode = "light" | "dark";

const [theme, setTheme] = useState<ThemeMode>("light");



type PrivacySettingKey = "privateAccount" | "activityStatus";



const fileInputRef = useRef<HTMLInputElement>(null);



const handleReauthenticate = async () => {
  if (!user || !user.email) return;

  try {
    setIsReauthenticating(true);
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, password); // retry here
toast({ title: "Password updated successfully ✅" });

    toast({ title: "Re-authenticated! Try again now." });
    setError(""); // clear the re-auth error
  } catch (err) {
    console.error("Re-authentication failed:", err);
    setError("Re-authentication failed. Check your current password.");
  } finally {
    setIsReauthenticating(false);
  }
};

const handleReactivateAccount = async () => {
  const userRef = doc(db, "users", user?.uid as string);
  await updateDoc(userRef, {
    deactivation: false,
  });

  alert("Account reactivated!");
  // Optionally reload user data or redirect
};


useEffect(() => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const storedTheme = localStorage.getItem("darkMode");

  // If no stored theme, match system preference
  const initialTheme = storedTheme || (prefersDark ? "dark" : "light");

  document.documentElement.classList.toggle("dark", initialTheme === "dark");
  localStorage.setItem("darkMode", initialTheme);
}, []);


useEffect(() => {
  if (!user?.uid) return;

  const docRef = doc(db, "users", user.uid);

  const fetchSettings = async () => {
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();

      // 🔒 Force device preference to take priority
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (prefersDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
        localStorage.setItem("darkMode", "dark");
        return; // stop here — device dark wins
      }

      // ⬇️ Otherwise, fall back to saved user setting
      const savedTheme = data.theme;
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
        localStorage.setItem("darkMode", savedTheme === "dark" ? "dark" : "light");
      }

      // ✅ Notifications
      if (data.notificationSettings) {
        setNotifications(data.notificationSettings);
      }

      // ✅ Privacy
      if (data.privacySettings) {
        setPrivacySettings(data.privacySettings);
      }
    } catch (err) {
      console.error("Failed to load user settings:", err);
    }
  };

  fetchSettings();
}, [user]);





  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, section: string) => {
    e.preventDefault();
    toast({
      title: `${section} Settings Updated`,
      description: `Your ${section.toLowerCase()} settings have been saved.`,
    });
  };
const userCache = new Map<string, any>(); // or use your CachedUser type

function clearUserCache(uid?: string) {
  if (typeof window === "undefined") return; // skip in SSR

  if (uid) {
    localStorage.removeItem(`user-${uid}`);
    userCache.delete(uid);
  } else {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("user-")) {
        localStorage.removeItem(key);
      }
    });
    userCache.clear();
  }
}

  const handleLogout = async () => {
    try {

      await signOut(auth);
      router.push("/"); // or home, wherever you want
      clearUserCache()
localStorage.clear()
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

   


const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();

    if (data.secure_url) {
      setAvatarUrl(data.secure_url);

      if (user?.uid) {
        // Update user profile
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { avatarUrl: data.secure_url });

        // Update all posts by this user in their family
        const postsRef = collection(db, "families", userData.familyId, "posts");
        const q = query(postsRef, where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map((postDoc) => {
          const postRef = doc(db, "families", userData.familyId, "posts", postDoc.id);
          return updateDoc(postRef, {
            "author.avatarUrl": data.secure_url,
          });
        });

        await Promise.all(updates);
      }

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    } else {
      throw new Error("No secure URL returned");
    }
  } catch (error) {
    console.error("Upload failed", error);
    toast({
      title: "Upload Failed",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  } finally {
    setUploading(false);
  }
};


  const triggerFileSelect = () => {
      if (!fileInputRef.current) {
    console.warn("File input ref is not attached");
    return;
  }
    fileInputRef.current?.click();
  };


const reauthenticate = async (email: string, currentPassword: string) => {
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user?.uid, credential);
};
const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>, section: string) => {
  e.preventDefault();
  setError("");

  if (password !== repeatPassword) {
    return setError("Passwords do not match.");
  }

  const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  if (!isStrong) {
    return setError(
      "Password must be at least 8 characters and include uppercase, lowercase, and a number."
    );
  }

  try {
    setIsSaving(true);
    if (!user?.uid) throw new Error("Not authenticated");

await updatePassword(user, password);

    toast({ title: "Password updated successfully ✅" });
    setPassword("");
    setRepeatPassword("");
  } catch (err: any) {
    console.error("Error:", err);

    if (err.code === "auth/requires-recent-login") {
      setError("Please re-authenticate to change password.");
      // Optionally open a modal to re-login
    } else {
      setError("Password update failed.");
    }
  } finally {
    setIsSaving(false);
  }
};



const toggleTheme = async () => {
  const newTheme: ThemeMode = theme === "light" ? "dark" : "light";
  localStorage.setItem("darkMode", newTheme); // 🔁 save as "dark" or "light"
  document.documentElement.classList.toggle("dark", newTheme === "dark");

  setTheme(newTheme);

  toast({ title: `Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode` });

  if (user?.uid) {
    const docRef = doc(db, "users", user.uid);
    try {
      await updateDoc(docRef, { theme: newTheme });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  }
};


const handleThemeChange = async (val: ThemeMode) => {
  document.documentElement.classList.toggle("dark", val === "dark");
  setTheme(val);

  if (user?.uid) {
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, { theme: val });
  }
};
const handleSaveNotifications = async () => {
  if (!user?.uid) return toast({ title: "Please log in first" });

  const docRef = doc(db, "users", user.uid);

  try {
    await updateDoc(docRef, {
      notificationSettings: notifications,
    });

    toast({ title: "Notification settings saved!" });
  } catch (err) {
    console.error("Error saving notification settings:", err);
    toast({ title: "Failed to save", variant: "destructive" });
  }
};

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>, section: string) => {
  e.preventDefault();


  const name = (document.getElementById("name") as HTMLInputElement).value.trim();
  const username = (document.getElementById("username") as HTMLInputElement).value.trim();
  const bio = (document.getElementById("bio") as HTMLTextAreaElement).value.trim();

  if (!name || !username) {
    toast({ title: "Name and username are required." });
    return;
  }
    setUploadingProfile(true);


  try {


     const usersRef = collection(db, "users");
    const qp = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(qp);

    const usernameTaken = querySnapshot.docs.some(
      (docSnap) => docSnap.id !== user?.uid // exclude current user's own doc
    );

    if (usernameTaken) {
      toast({
        title: "Username taken",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

const userRef = doc(db, "users", user?.uid as string);
     const keywords =username.toLowerCase().split(" ");
 
    const current=  Number(userData?.UploadedTimes) ;

const UploadedTimes = !isNaN(current) ? (current + 1).toString() : "1" ;

    await updateDoc(userRef, {
      fullName: name,
      keywords:keywords,
      username,
      bio,
      UploadedTimes: UploadedTimes,
      updatedAt: Date.now(),
    });



        const postsRef = collection(db, "families", userData.familyId, "posts");

    
    
    const q = query(postsRef, where("uid", "==", user?.uid));
    
    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map((postDoc) => {
      return updateDoc(doc(db, "posts", postDoc.id), {
          "author.username":  username,

      });
    
    });
    
    await Promise.all(updates);
    
    
    
    
    
      
   



    const docSnap = await getDoc(userRef);
setUserData(docSnap.data());

    toast({
      title: `${section} section Updated`,
      description: `Your ${section.toLowerCase()} Profile updated successfully!.`,
    });

  } catch (err) {
    console.error("Failed to update profile:", err);
    toast({
      title: "Error",
      description: "Something went wrong while updating your profile.",
      variant: "destructive",
    });

  }
        setUploadingProfile(false);

};






const handlePremiumCheckout = async () => {
  const res = await fetch("/api/paypal", { method: "POST" });
  const data = await res.json();
  window.location.href = data.url; // redirect to PayPal


  
};


const handleDeactivateAccount = async () => {
  const userRef = doc(db, "users", user?.uid as string);
  await updateDoc(userRef, {
    deactivation: true,
  });

  alert("Account deactivated (simulate)");


  handleLogout();
};




const handlePayPalPayment = async () => {
  try {
    // Step 1: Launch PayPal payment UI (usually via PayPal SDK or REST)
    const paymentId = await initiatePayPalCheckout(); // Your custom or SDK function

    if (!paymentId) throw new Error("No payment ID returned");

    // Step 2: Call your backend to verify and update user
    const res = await fetch("/api/paypal/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paypalPaymentId: paymentId,
        userId: user?.uid, // Make sure you have the user's Firestore UID
      }),
    });

    const data = await res.json();

    if (res.ok) {

        toast({
      title: `"Premium activated! 🥇"`,
     
    });

    
      // Optional: Refresh user data or UI dark
    } else {
   
         toast({
      title: `${data.error} || "Payment verification failed"`,
     
    });
    }
  } catch (err) {
    console.error(err);
       toast({
      title: `Something went wrong during payment`,
     
    });
  

  }
};


const handleDeleteAccount = async () => {
  if (!confirm("Are you sure? This will permanently delete your account.")) return;

  try {


    // 🔥 1. Delete Posts + Cloudinary
    const postQuery = query(collection(db, "families", userData.familyId, "posts"), where("author.uid", "==", user?.uid ));
    const postSnap = await getDocs(postQuery);

    await Promise.all(
      postSnap.docs.map(async (d) => {
        const postData = d.data();
        // If mediaUrl contains Cloudinary, delete from Cloudinary first
        if (postData.mediaUrl && postData.mediaUrl.includes("res.cloudinary.com")) {
          await fetch("/api/delete-cloudinary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUrl: postData.mediaUrl }),
          });
        }

        // Delete post from Firestore
        await deleteDoc(doc(db, "families", userData.familyId, d.id));
      })
    );

    // 🗑 2. Delete Comments
    const commentQuery = query(collection(db, "families", userData.familyId, "comments"), where("uid", "==", user?.uid ));
    const commentSnap = await getDocs(commentQuery);
    await Promise.all(commentSnap.docs.map((d) => deleteDoc(doc(db, "families", userData.familyId, "comments", d.id))));

    // ❤️ 3. Delete Likes
    const likeQuery = query(collection(db, "families", userData.familyId, "likes"), where("userId", "==", user?.uid));
    const likeSnap = await getDocs(likeQuery);
    await Promise.all(likeSnap.docs.map((d) => deleteDoc(doc(db, "families", userData.familyId, "likes", d.id))));

    // 👤 4. Delete User Profile
    await deleteDoc(doc(db, "users", user?.uid as string));

    // 🔐 5. Delete Auth Account
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }

    // ✅ 6. Cleanup (session, cookies, etc.)
    const res = await fetch("/api/delete-user", { method: "POST" });
    if (res.ok) {
      handleLogout();
    } else {
      alert("Error deleting account");
    }

    alert("Your account and data were deleted.");
  } catch (err) {
    console.error("Account deletion error:", err);
    alert("Failed to delete account.");
  }
};


const notificationItems: {
  id: NotificationType;
  label: string;
  description: string;
}[] = [
  { id: "newFollower", label: "New Followers", description: "When someone starts following you." },
  { id: "postLike", label: "Post Likes", description: "When someone likes your post." },
  { id: "postComment", label: "Post Comments", description: "When someone comments on your post." },
  { id: "replies", label: "replies", description: "When someone replies on your comment." },

  { id: "directMessage", label: "Direct Messages", description: "When you receive a new direct message." },
];







const lastUpdated = userData?.updatedAt;
const now = Date.now();
const oneMonth = 30 * 24 * 60 * 60 * 1000; // in ms
const current = Number(userData?.UploadedTimes);

const changedTwice = current >= 2;
const updatedRecently = lastUpdated && now - lastUpdated < oneMonth;


function Trigger(){


if (changedTwice && updatedRecently) {


  toast({
    title: "Name change limit reached",
    description: "You can only change your name twice a month. Try again later.",
    variant: "destructive",
  });
  return;
}
}

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 sm:p-0">
      <h1 className="text-3xl font-bold font-headline mb-8">Settings</h1>

      {/* Profile Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-6 w-6 text-primary" /> Profile Settings</CardTitle>
          <CardDescription>Manage your public profile information.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleProfileUpdate(e, "profile credentials")}>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 relative">
          <div className="relative inline-block">
  <Avatar className="h-20 w-20">
    <AvatarImage src={userData?.avatarUrl} alt="User Avatar" data-ai-hint="profile avatar" />
    <AvatarFallback>
      {(userData?.fullName ?? "").substring(0, 2) || "??"}
    </AvatarFallback>
  </Avatar>

  {/* Verified Badge */}
  {userData?.isPremium && (
   <span className="absolute -top-1 -right-1 bg-white rounded-full p-[2px] shadow-md">
      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-orange-400 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-2.5 w-2.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 17.27L18.18 21l-1.63-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.45 4.73L5.82 21z" />
        </svg>
      </span>
    </span>
  )}
</div>

 
              {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
            
                
                 <input
        type="file"
        accept="image/*"
        onChange={(e) => handleAvatarChange(e)}
        ref={fileInputRef}
        className="hidden"
      />
                <Button variant="outline"  onClick={ triggerFileSelect } type="button">  Change Avatar</Button>

            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
      <Input onSelect={Trigger} disabled={changedTwice && updatedRecently}  id="name" defaultValue={userData?.fullName} />
              </div>
              <div className="space-y-2">
                <Label  htmlFor="username">Username</Label>
                   <Input onClick={Trigger} disabled={changedTwice && updatedRecently} id="username" defaultValue={userData?.username || userData?.fullName} />

              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
  <Textarea
      id="bio"
      defaultValue={userData?.bio || ""}
      className="min-h-[80px]"
    />            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 relative">
         
            <Button type="submit" disabled={UploadingProfile}>{UploadingProfile ? "Saving" : 'Save Profile'}  {UploadingProfile && <Loader2 className="h-8 w-8 text-white animate-spin" /> } </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Account Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-6 w-6 text-primary" /> Account Settings</CardTitle>
          <CardDescription>Manage your email, password, and account security.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleChangePassword(e, "Account")}>
          <CardContent className="space-y-6">
             <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" disabled defaultValue={userData?.email}/>
           <div className="space-y-2">
    <Label htmlFor="password">New Password</Label>
    <div className="relative">
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-2 text-gray-500"
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  </div>

  <div className="space-y-2">
    <Label htmlFor="repeat_password">Repeat Password</Label>
    <Input
      id="repeat_password"
      type={showPassword ? "text" : "password"}
      value={repeatPassword}
      onChange={(e) => setRepeatPassword(e.target.value)}
    />
  </div>


  {error === "Please re-authenticate to change password." && (
  <div className="space-y-2">
    <Label htmlFor="currentPassword">Enter your Prev Password</Label>
    <Input
      id="currentPassword"
      type="password"
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
    />
    <Button onClick={handleReauthenticate}>Re-authenticate</Button>
  </div>
)}

  {error && <p className="text-sm text-red-500">{error}</p>}

  <CardFooter className="px-0 pt-4">
    <Button type="submit" disabled={isSaving}>
      {isSaving ? "Saving..." : "Change Password"}
    </Button>
  </CardFooter>
      </CardContent>       
        </form>
      </Card>

      {/* Notification Settings */}
      {/* <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Notification Settings</CardTitle>
          <CardDescription>Choose what activities you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
       {notificationItems.map(item => (
  <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
    <div>
      <h4 className="font-medium">{item.label}</h4>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </div>

    <div style={{display:"flex", flexDirection:"column"}}>
    <Switch
      id={item.id}
      checked={notifications[item.id]}
      onCheckedChange={(value) =>
        setNotifications((prev) => ({ ...prev, [item.id]: value }))
      }
    />
       { notifications[item.id] ? <i style={{fontSize:"10px"}}> on  </i> : <i style={{fontSize:"10px"}}> off </i> }
    </div>
  </div>
))}

         
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button type="button" onClick={handleSaveNotifications}>
  Save Notifications
</Button>
          </CardFooter>
      </Card> */}



      
      {/* Privacy Settings */}
     {/* <Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-primary" /> Privacy Settings
    </CardTitle>
    <CardDescription>
      Control who can see your activity and information.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <h4 className="font-medium">Private Account</h4>
        <p className="text-sm text-muted-foreground">
          Only approved followers can see your posts.
        </p>
      </div>
      <div style={{display:"flex", flexDirection:"column"}}>
  <Switch
        id="privateAccount"
        checked={privacySettings.privateAccount}
        onCheckedChange={(val) =>
          setPrivacySettings((prev) => ({ ...prev, privateAccount: val }))
        }  
      /> 
      {privacySettings.privateAccount ?  <i style={{fontSize:"10px"}}>  on</i> :   <i style={{fontSize:"10px"}}> off</i>}

      </div>
    
    </div>

    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <h4 className="font-medium">Activity Status</h4>
        <p className="text-sm text-muted-foreground">
          Allow others to see when you're active.
        </p>
      </div>

      <div style={{display:"flex", flexDirection:"column"}}>

 <Switch
        id="activityStatus"
        checked={privacySettings.activityStatus}
        onCheckedChange={(val) =>
          setPrivacySettings((prev) => ({ ...prev, activityStatus: val }))
        }
      />

      {privacySettings.activityStatus ?  <i style={{fontSize:"10px"}}>on </i>:   <i style={{fontSize:"10px"}}> off </i> }
</div>
    
     
    </div>

  </CardContent>
  <CardFooter className="border-t px-6 py-4">
    <Button type="button" onClick={handleSavePrivacy}>
      Save Privacy Settings
    </Button>
  </CardFooter>
</Card> */}

      {/* Appearance Settings */}
   <Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Palette className="h-6 w-6 text-primary" /> Appearance
    </CardTitle>
    <CardDescription>Customize the look and feel of KINNECT.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <h4 className="font-medium">Theme</h4>
        <p className="text-sm text-muted-foreground">Choose between light or dark mode.</p>
      </div>
      <div style={{display:"flex", flexDirection:"column"}}>

      <Button variant="outline" onClick={toggleTheme}>
        Toggle {theme === "dark" ? "light" : "dark"} Theme
      </Button>
      </div>

    </div>
  </CardContent>
</Card>


  
<Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <HelpCircle className="h-6 w-6 text-primary" /> Help & Support
    </CardTitle>
    <CardDescription>Find FAQs, contact support, or report a problem.</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/dashboard/help" className="text-sm text-primary hover:underline">Go to Help Center</Link>
  </CardContent>
</Card>


      <Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <ShieldCheck className="h-6 w-6 text-primary" /> Legal & Support
    </CardTitle>
    <CardDescription>Learn more about your rights and our policies.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="text-sm text-muted-foreground">Read our legal documents and policies:</p>
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
        <Link href="/dashboard/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
        <Link href="/dashboard/policy" className="text-sm text-primary hover:underline">Cookies Policy</Link>
        <Link href="/dashboard/help" className="text-sm text-primary hover:underline">Support</Link>
      </div>
    </div>
  </CardContent>
 
</Card>
{/* <PremiumMembershipCard userId={userData?.id} isPremium={userData?.isPremium} /> */}




 <Card className="shadow-lg border border-red-300">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <Trash2 className="h-6 w-6 text-red-500" /> Delete or Deactivate Account
      </CardTitle>
      <CardDescription className="text-muted-foreground">
        Permanently delete your account or temporarily deactivate it.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {!userData?.deactivation ?

      <div className="rounded-lg border p-4">
        <h4 className="font-semibold text-sm">Deactivate Account</h4>
        <p className="text-sm text-muted-foreground">
          You can temporarily deactivate your account. You’ll be logged out, and your profile will be hidden until reactivation.
        </p>
        <Button variant="outline" className="mt-2" onClick={handleDeactivateAccount}>
          Deactivate Account
        </Button>
      </div>


:
<>
 {userData?.deactivation && (
  <Card className="shadow-lg border">
    <CardHeader>
      <CardTitle className="text-primary">Reactivate Account</CardTitle>
      <CardDescription>
        Your account is currently deactivated. You can reactivate anytime.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={handleReactivateAccount}>Reactivate Account</Button>
    </CardContent>
  </Card>
)}

</>
     


}


      <div className="rounded-lg border border-destructive p-4">
        <h4 className="font-semibold text-sm text-red-600">Delete Account</h4>
        <p className="text-sm text-muted-foreground">
          This will permanently delete your profile, content, and data. This action cannot be undone.
        </p>
        <Button variant="destructive" className="mt-2" onClick={ handleDeleteAccount}>
          Delete Account
        </Button>
      </div>
    </CardContent>
  </Card>


  <Separator />
      
      <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
        <LogOut className="mr-2 h-5 w-5" /> Logout
      </Button>


    </div>
  );
}

 {/* <div className="flex items-center justify-between rounded-lg border p-4">
              {/* <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div> */}
              {/* <Switch id="2fa" /> */}
            {/* </div> */} 
        
          {/* <CardFooter className="border-t px-6 py-4"> darkmode
            <Button type="submit">Save Account Settings</Button>
          </CardFooter> */}
