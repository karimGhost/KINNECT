import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  doc,
  getDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import {  db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
export function useFilteredPosts(user: any, pageSize = 5) {
  const { userData } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const lastDocRef = useRef<any>(null);
  const fetchingRef = useRef(false);
  const unsubscribeRef = useRef<any>(null);

  const fetchPostsPage = useCallback(
    async (nextPage = false) => {
      if (!user?.uid || !userData?.familyId || fetchingRef.current || !hasMore) return;

      fetchingRef.current = true;
      setLoading(true);

      if (!nextPage) {
        lastDocRef.current = null;
        setHasMore(true);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }

      try {
        const postsRef = collection(db, "families", userData.familyId, "posts");

        let q = query(postsRef, orderBy("createdAt", "desc"), limit(pageSize));
        if (nextPage && lastDocRef.current) {
          q = query(postsRef, orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(pageSize));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setHasMore(false);
          return;
        }

        const rawPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

        if (rawPosts.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }

        setPosts((prev) => (nextPage ? [...prev, ...rawPosts] : rawPosts));

        // 🔹 Realtime listener (only first load)
        if (!nextPage && rawPosts.length > 0 && !unsubscribeRef.current) {
          const latestTimestamp = rawPosts[0].createdAt;
          const newPostsQ = query(
            postsRef,
            where("createdAt", ">", latestTimestamp),
            orderBy("createdAt", "desc")
          );

          unsubscribeRef.current = onSnapshot(newPostsQ, (snapNew) => {
            const newRaw = snapNew.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
            if (newRaw.length) {
              setPosts((prev) => [...newRaw, ...prev]);
            }
          });
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [user, userData?.familyId, pageSize, hasMore]
  );

  useEffect(() => {
    if (!user || !userData?.familyId) return;
    fetchPostsPage(false);
  }, [user, userData?.familyId, fetchPostsPage]);

  return { posts, loading, hasMore, loadPosts: () => fetchPostsPage(true) };
}
