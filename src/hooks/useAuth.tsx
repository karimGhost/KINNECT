"use client"
// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { getDatabase, ref, onDisconnect, set, serverTimestamp } from "firebase/database";
import { doc,onSnapshot, getDoc, collection, query, where, getDocs } from "firebase/firestore";
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
    const [loadings, setLoadings] = useState(true);

  const [userData, setUserData] = useState<any>(null);
const [theme, setTheme] = useState<any>(null)
 const [family, setFamily] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);


useEffect(() => {
  if (!user) return;

  const docRef = doc(db, "users", user.uid);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      setUserData({ uid: user.uid, ...docSnap.data() });
      console.log("User data:", docSnap.data());
    } else {
      
      setUserData(null);
          setLoading(false);
                    setLoadings(false);


    }

    setLoading(false);
                        setLoadings(false);

  });

  return () => unsubscribe();

}, [user]); 

useEffect(() => {
  if (!userData) return;

  const fetchData = async () => {
    try {
      
      if (!userData?.familyId) return;

      const famRef = doc(db, "families", userData.familyId);
      const famDoc = await getDoc(famRef);

      if (famDoc.exists()) {
        const famData = famDoc.data();

        // fetch member profiles
        const memberProfiles = await Promise.all(
          (famData.members || []).map(async (uid: string) => {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              return { uid: userSnap.id, ...userSnap.data() };
            }
            return null;
          })
        );

        // filter out nulls (in case a uid has no user doc)
        const cleanMembers = memberProfiles.filter(Boolean);

        // save family with member data
        setFamily({
          id: famDoc.id,
          ...famData,
          membersData: cleanMembers, // new field with user objects
        });
      }

      // load posts belonging to family
      const q = query(
        collection(db, "posts"),
        where("familyId", "==", userData.familyId)
      );
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
          setLoading(false);
                    setLoadings(false);

      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
                          setLoadings(false);

    }
  };

  fetchData();
}, [userData]);


// useEffect(() => {
//   if (!user?.uid) return;

//   const userStatusRef = ref(rtdb, `/onlineStatus/${user.uid}`);

//   set(userStatusRef, {
//     state: "online",
//     last_changed: serverTimestamp(),
//   });

//   onDisconnect(userStatusRef).set({
//     state: "offline",
//     last_changed: serverTimestamp(),
//   });
// }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
          setLoading(false);
                              setLoadings(false);


    });

    return () => unsubscribe();
  }, []);

  const userD =  userData;
  return { user, loading, userData ,userD, setUserData,loadings, family, posts};
}